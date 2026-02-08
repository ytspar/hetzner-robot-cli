#!/usr/bin/env node

import { Command, Option } from 'commander';
import { select, confirm, input, checkbox } from '@inquirer/prompts';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

import { HetznerRobotClient } from './client.js';
import {
  requireCredentials,
  promptLogin,
  clearConfig,
  getCredentials,
} from './config.js';
import * as fmt from './formatter.js';
import type { ResetType } from './types.js';

config();

let client: HetznerRobotClient | null = null;

interface ActionOptions {
  user?: string;
  password?: string;
  json?: boolean;
  yes?: boolean;
}

/**
 * Get or create API client with credentials.
 * Credential sources (in order): CLI flags, env vars, config file, interactive prompt.
 */
async function getClient(options: { user?: string; password?: string }): Promise<HetznerRobotClient> {
  if (client) return client;

  const { user } = options;
  let password = options.password;

  if (password === '-') {
    try {
      password = readFileSync(0, 'utf-8').trim();
    } catch {
      throw new Error('Failed to read password from stdin');
    }
  }

  if (user && password) {
    client = new HetznerRobotClient(user, password);
    return client;
  }

  const creds = await requireCredentials();
  client = new HetznerRobotClient(creds.user, creds.password);
  return client;
}

function asyncAction<T extends unknown[]>(
  fn: (client: HetznerRobotClient, ...args: T) => Promise<void>
): (...args: [...T, ActionOptions]) => Promise<void> {
  return async (...args) => {
    const options = args[args.length - 1] as ActionOptions;
    try {
      const apiClient = await getClient(options);
      await fn(apiClient, ...(args.slice(0, -1) as unknown as T));
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ExitPromptError') || error.name === 'ExitPromptError') {
          process.exit(0);
        }
        console.error(fmt.error(error.message));
      } else {
        console.error(fmt.error('An unknown error occurred'));
      }
      process.exit(1);
    }
  };
}

/**
 * Output data as JSON or formatted table based on options.
 */
function output<T>(data: T, formatter: (data: T) => string, options: ActionOptions): void {
  console.log(options.json ? fmt.formatJson(data) : formatter(data));
}

/**
 * Confirm destructive action unless --yes flag is set.
 * Returns true if confirmed, false if aborted.
 */
async function confirmAction(
  message: string,
  options: ActionOptions,
  defaultValue = false
): Promise<boolean> {
  if (options.yes) return true;
  const confirmed = await confirm({ message, default: defaultValue });
  if (!confirmed) {
    console.log('Aborted.');
    return false;
  }
  return true;
}

const program = new Command();

program
  .name('hetzner')
  .description('Feature-complete CLI for Hetzner Robot API (dedicated servers)')
  .version('1.0.0')
  .option('-u, --user <username>', 'Hetzner Robot web service username')
  .option('-p, --password <password>', 'Hetzner Robot web service password (use - to read from stdin)')
  .option('--json', 'Output raw JSON instead of formatted tables');

const auth = program.command('auth').description('Authentication management');

auth
  .command('login')
  .description('Interactively configure credentials')
  .action(async () => {
    try {
      await promptLogin();
      console.log('');
      console.log(fmt.success('Authentication configured successfully.'));
    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') {
        process.exit(0);
      }
      throw error;
    }
  });

auth
  .command('logout')
  .description('Clear saved credentials')
  .action(async () => {
    await clearConfig();
    console.log(fmt.success('Credentials cleared.'));
  });

auth
  .command('status')
  .description('Check authentication status')
  .action(async () => {
    const creds = await getCredentials();
    if (creds) {
      console.log(fmt.success(`Authenticated as: ${creds.user}`));
      const sourceLabels: Record<string, string> = {
        environment: 'environment variables',
        keychain: 'keychain',
        file: 'config file',
      };
      console.log(fmt.info('Stored in: ' + (sourceLabels[creds.source ?? ''] ?? 'unknown')));
    } else {
      console.log(fmt.warning('Not authenticated. Run: hetzner auth login'));
    }
  });

auth
  .command('test')
  .description('Test API credentials')
  .action(
    asyncAction(async (client) => {
      const servers = await client.listServers();
      console.log(fmt.success(`Authenticated successfully. Found ${servers.length} server(s).`));
    })
  );

const server = program.command('server').alias('servers').description('Server management');

server
  .command('list')
  .alias('ls')
  .description('List all servers')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const servers = await client.listServers();
      output(servers, fmt.formatServerList, options);
    })
  );

server
  .command('get <server>')
  .alias('show')
  .description('Get server details')
  .action(
    asyncAction(async (client, serverIdOrIp: string, options: ActionOptions) => {
      const { server: srv } = await client.getServer(serverIdOrIp);
      output(srv, fmt.formatServerDetails, options);
    })
  );

server
  .command('rename <server> <name>')
  .description('Rename a server')
  .action(
    asyncAction(async (client, serverIdOrIp: string, name: string) => {
      await client.updateServerName(serverIdOrIp, name);
      console.log(fmt.success(`Server renamed to: ${name}`));
    })
  );

const reset = program.command('reset').description('Server reset operations');

reset
  .command('options [server]')
  .description('Show reset options for server(s)')
  .action(
    asyncAction(async (client, serverIdOrIp: string | undefined, options: ActionOptions) => {
      if (serverIdOrIp) {
        const { reset: rst } = await client.getResetOptions(serverIdOrIp);
        output(rst, fmt.formatResetOptions, options);
      } else {
        const resets = await client.listResetOptions();
        if (options.json) {
          console.log(fmt.formatJson(resets));
        } else {
          for (const { reset: rst } of resets) {
            console.log(fmt.formatResetOptions(rst));
            console.log('');
          }
        }
      }
    })
  );

reset
  .command('execute <servers...>')
  .alias('run')
  .description('Reset one or more servers')
  .addOption(
    new Option('-t, --type <type>', 'Reset type')
      .choices(['sw', 'hw', 'man', 'power', 'power_long'])
      .default('sw')
  )
  .option('-i, --interactive', 'Interactively select reset type')
  .option('-y, --yes', 'Skip confirmation')
  .action(
    asyncAction(async (client, servers: string[], options: { type: ResetType; interactive?: boolean; yes?: boolean }) => {
      let resetType = options.type;

      if (options.interactive) {
        resetType = (await select({
          message: 'Select reset type:',
          choices: [
            { value: 'sw', name: 'Software reset (ACPI) - Recommended' },
            { value: 'hw', name: 'Hardware reset (forced)' },
            { value: 'power', name: 'Power cycle' },
            { value: 'power_long', name: 'Long power cycle (10+ seconds)' },
            { value: 'man', name: 'Manual reset (technician)' },
          ],
        })) as ResetType;
      }

      if (!options.yes) {
        console.log('');
        console.log(fmt.warning(`About to reset ${servers.length} server(s) with type: ${resetType}`));
        console.log(`Servers: ${servers.join(', ')}`);
        console.log('');

        const confirmed = await confirm({
          message: 'Are you sure you want to proceed?',
          default: false,
        });

        if (!confirmed) {
          console.log('Aborted.');
          return;
        }
      }

      console.log('');
      for (const srv of servers) {
        try {
          const { reset: rst } = await client.resetServer(srv, resetType);
          console.log(fmt.formatResetResult(rst, resetType));
        } catch (error) {
          console.log(fmt.error(`Failed to reset ${srv}: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      }
    })
  );

const boot = program.command('boot').description('Boot configuration (rescue, linux, vnc, windows)');

boot
  .command('status <server>')
  .description('Show boot configuration status')
  .action(
    asyncAction(async (client, serverIdOrIp: string, options: ActionOptions) => {
      const { boot: bootConfig } = await client.getBootConfig(serverIdOrIp);
      output(bootConfig, (b) => fmt.formatBootConfig(b, parseInt(serverIdOrIp) || 0), options);
    })
  );

const rescue = boot.command('rescue').description('Rescue system management');

rescue
  .command('activate <server>')
  .description('Activate rescue system')
  .option('-o, --os <os>', 'Operating system (linux, linuxold, vkvm)', 'linux')
  .option('-a, --arch <arch>', 'Architecture (64 or 32)', '64')
  .option('-k, --keys <fingerprints...>', 'SSH key fingerprints')
  .action(
    asyncAction(async (client, serverIdOrIp: string, options: { os: string; arch: string; keys?: string[] }) => {
      const { rescue: rsc } = await client.activateRescue(
        serverIdOrIp,
        options.os,
        parseInt(options.arch),
        options.keys
      );
      console.log(fmt.formatRescueActivation(rsc));
    })
  );

rescue
  .command('deactivate <server>')
  .description('Deactivate rescue system')
  .action(
    asyncAction(async (client, serverIdOrIp: string) => {
      await client.deactivateRescue(serverIdOrIp);
      console.log(fmt.success('Rescue system deactivated.'));
    })
  );

rescue
  .command('last <server>')
  .description('Show last rescue activation details')
  .action(
    asyncAction(async (client, serverIdOrIp: string, options: ActionOptions) => {
      const { rescue: rsc } = await client.getLastRescue(serverIdOrIp);
      output(rsc, fmt.formatRescueActivation, options);
    })
  );

const linux = boot.command('linux').description('Linux installation management');

linux
  .command('activate <server>')
  .description('Activate Linux installation')
  .requiredOption('-d, --dist <dist>', 'Distribution (e.g., Debian-1210-bookworm-amd64-base)')
  .option('-a, --arch <arch>', 'Architecture (64 or 32)', '64')
  .option('-l, --lang <lang>', 'Language', 'en')
  .option('-k, --keys <fingerprints...>', 'SSH key fingerprints')
  .action(
    asyncAction(async (client, serverIdOrIp: string, options: { dist: string; arch: string; lang: string; keys?: string[] }) => {
      const { linux: lnx } = await client.activateLinux(
        serverIdOrIp,
        options.dist,
        parseInt(options.arch),
        options.lang,
        options.keys
      );
      console.log(fmt.formatLinuxActivation(lnx));
    })
  );

linux
  .command('deactivate <server>')
  .description('Deactivate Linux installation')
  .action(
    asyncAction(async (client, serverIdOrIp: string) => {
      await client.deactivateLinux(serverIdOrIp);
      console.log(fmt.success('Linux installation deactivated.'));
    })
  );

linux
  .command('options <server>')
  .description('Show available Linux distributions')
  .action(
    asyncAction(async (client, serverIdOrIp: string, options: ActionOptions) => {
      const { linux: lnx } = await client.getLinux(serverIdOrIp);
      output(lnx, (l) => {
        const lines = [fmt.heading('Available Linux Distributions'), ''];
        for (const dist of l.dist) {
          lines.push(`  ${dist}`);
        }
        lines.push('', fmt.info(`Languages: ${l.lang.join(', ')}`));
        lines.push(fmt.info(`Architectures: ${l.arch.join(', ')}-bit`));
        return lines.join('\n');
      }, options);
    })
  );

const ip = program.command('ip').alias('ips').description('IP address management');

ip.command('list')
  .alias('ls')
  .description('List all IPs')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const ips = await client.listIps();
      output(ips, fmt.formatIpList, options);
    })
  );

ip.command('get <ip>')
  .alias('show')
  .description('Get IP details')
  .action(
    asyncAction(async (client, ipAddr: string, options: ActionOptions) => {
      const { ip: ipData } = await client.getIp(ipAddr);
      output(ipData, fmt.formatIpDetails, options);
    })
  );

ip.command('update <ip>')
  .description('Update IP traffic warning settings')
  .option('--warnings <enabled>', 'Enable/disable traffic warnings (true/false)')
  .option('--hourly <mb>', 'Hourly traffic limit in MB')
  .option('--daily <mb>', 'Daily traffic limit in MB')
  .option('--monthly <gb>', 'Monthly traffic limit in GB')
  .action(
    asyncAction(async (client, ipAddr: string, options: { warnings?: string; hourly?: string; daily?: string; monthly?: string }) => {
      await client.updateIp(
        ipAddr,
        options.warnings ? options.warnings === 'true' : undefined,
        options.hourly ? parseInt(options.hourly) : undefined,
        options.daily ? parseInt(options.daily) : undefined,
        options.monthly ? parseInt(options.monthly) : undefined
      );
      console.log(fmt.success(`IP ${ipAddr} updated.`));
    })
  );

const mac = ip.command('mac').description('MAC address management');

mac
  .command('get <ip>')
  .description('Get separate MAC address for IP')
  .action(
    asyncAction(async (client, ipAddr: string, options: ActionOptions) => {
      const { mac: macData } = await client.getIpMac(ipAddr);
      output(macData, (m) => `IP: ${m.ip}\nMAC: ${m.mac}`, options);
    })
  );

mac
  .command('generate <ip>')
  .description('Generate separate MAC address for IP')
  .action(
    asyncAction(async (client, ipAddr: string) => {
      const { mac: macData } = await client.generateIpMac(ipAddr);
      console.log(fmt.success(`Generated MAC: ${macData.mac}`));
    })
  );

mac
  .command('delete <ip>')
  .description('Delete separate MAC address')
  .action(
    asyncAction(async (client, ipAddr: string) => {
      await client.deleteIpMac(ipAddr);
      console.log(fmt.success('MAC address deleted.'));
    })
  );

const subnet = program.command('subnet').alias('subnets').description('Subnet management');

subnet
  .command('list')
  .alias('ls')
  .description('List all subnets')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const subnets = await client.listSubnets();
      output(subnets, fmt.formatSubnetList, options);
    })
  );

subnet
  .command('get <subnet>')
  .alias('show')
  .description('Get subnet details')
  .action(
    asyncAction(async (client, netIp: string, options: ActionOptions) => {
      const { subnet: subnetData } = await client.getSubnet(netIp);
      output(subnetData, (s) => fmt.formatSubnetList([{ subnet: s }]), options);
    })
  );

const failover = program.command('failover').description('Failover IP management');

failover
  .command('list')
  .alias('ls')
  .description('List all failover IPs')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const failovers = await client.listFailovers();
      output(failovers, fmt.formatFailoverList, options);
    })
  );

failover
  .command('get <ip>')
  .alias('show')
  .description('Get failover IP details')
  .action(
    asyncAction(async (client, failoverIp: string, options: ActionOptions) => {
      const { failover: fo } = await client.getFailover(failoverIp);
      output(fo, (f) => fmt.formatFailoverList([{ failover: f }]), options);
    })
  );

failover
  .command('switch <failover-ip> <target-server-ip>')
  .description('Switch failover IP routing to another server')
  .option('-y, --yes', 'Skip confirmation')
  .action(
    asyncAction(async (client, failoverIp: string, targetServerIp: string, options: ActionOptions) => {
      if (!await confirmAction(`Route ${failoverIp} to ${targetServerIp}?`, options, true)) return;
      const { failover: fo } = await client.switchFailover(failoverIp, targetServerIp);
      console.log(fmt.formatFailoverSwitch(fo));
    })
  );

failover
  .command('delete <ip>')
  .description('Delete failover IP routing')
  .option('-y, --yes', 'Skip confirmation')
  .action(
    asyncAction(async (client, failoverIp: string, options: ActionOptions) => {
      if (!await confirmAction(`Delete routing for ${failoverIp}?`, options)) return;
      await client.deleteFailoverRouting(failoverIp);
      console.log(fmt.success('Failover routing deleted.'));
    })
  );

const rdns = program.command('rdns').description('Reverse DNS management');

rdns
  .command('list')
  .alias('ls')
  .description('List all reverse DNS entries')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const entries = await client.listRdns();
      output(entries, fmt.formatRdnsList, options);
    })
  );

rdns
  .command('get <ip>')
  .alias('show')
  .description('Get reverse DNS entry for IP')
  .action(
    asyncAction(async (client, ipAddr: string, options: ActionOptions) => {
      const { rdns: entry } = await client.getRdns(ipAddr);
      output(entry, (e) => `IP: ${e.ip}\nPTR: ${e.ptr}`, options);
    })
  );

rdns
  .command('set <ip> <ptr>')
  .description('Create or update reverse DNS entry')
  .action(
    asyncAction(async (client, ipAddr: string, ptr: string) => {
      try {
        await client.createRdns(ipAddr, ptr);
      } catch {
        await client.updateRdns(ipAddr, ptr);
      }
      console.log(fmt.success(`rDNS set: ${ipAddr} -> ${ptr}`));
    })
  );

rdns
  .command('delete <ip>')
  .description('Delete reverse DNS entry')
  .action(
    asyncAction(async (client, ipAddr: string) => {
      await client.deleteRdns(ipAddr);
      console.log(fmt.success('rDNS entry deleted.'));
    })
  );

const key = program.command('key').alias('keys').description('SSH key management');

key
  .command('list')
  .alias('ls')
  .description('List all SSH keys')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const keys = await client.listSshKeys();
      output(keys, fmt.formatSshKeyList, options);
    })
  );

key
  .command('get <fingerprint>')
  .alias('show')
  .description('Get SSH key details')
  .action(
    asyncAction(async (client, fingerprint: string, options: ActionOptions) => {
      const { key: keyData } = await client.getSshKey(fingerprint);
      output(keyData, fmt.formatSshKeyDetails, options);
    })
  );

key
  .command('add <name>')
  .description('Add a new SSH key')
  .option('-f, --file <path>', 'Path to public key file')
  .option('-d, --data <key>', 'Public key data')
  .action(
    asyncAction(async (client, name: string, options: { file?: string; data?: string }) => {
      let keyData: string;

      if (options.file) {
        keyData = readFileSync(options.file, 'utf-8').trim();
      } else if (options.data) {
        keyData = options.data;
      } else {
        keyData = await input({
          message: 'Paste public key:',
          validate: (v) => v.length > 0 || 'Key data is required',
        });
      }

      const { key: newKey } = await client.createSshKey(name, keyData);
      console.log(fmt.success(`SSH key added: ${newKey.fingerprint}`));
    })
  );

key
  .command('rename <fingerprint> <name>')
  .description('Rename an SSH key')
  .action(
    asyncAction(async (client, fingerprint: string, name: string) => {
      await client.updateSshKey(fingerprint, name);
      console.log(fmt.success(`SSH key renamed to: ${name}`));
    })
  );

key
  .command('delete <fingerprint>')
  .alias('rm')
  .description('Delete an SSH key')
  .option('-y, --yes', 'Skip confirmation')
  .action(
    asyncAction(async (client, fingerprint: string, options: ActionOptions) => {
      if (!await confirmAction(`Delete SSH key ${fingerprint}?`, options)) return;
      await client.deleteSshKey(fingerprint);
      console.log(fmt.success('SSH key deleted.'));
    })
  );

const firewall = program.command('firewall').description('Firewall management');

firewall
  .command('get <server>')
  .alias('show')
  .description('Get firewall configuration')
  .action(
    asyncAction(async (client, serverIdOrIp: string, options: ActionOptions) => {
      const { firewall: fw } = await client.getFirewall(serverIdOrIp);
      output(fw, fmt.formatFirewall, options);
    })
  );

firewall
  .command('enable <server>')
  .description('Enable firewall')
  .action(
    asyncAction(async (client, serverIdOrIp: string) => {
      await client.updateFirewall(serverIdOrIp, 'active');
      console.log(fmt.success('Firewall enabled.'));
    })
  );

firewall
  .command('disable <server>')
  .description('Disable firewall')
  .action(
    asyncAction(async (client, serverIdOrIp: string) => {
      await client.updateFirewall(serverIdOrIp, 'disabled');
      console.log(fmt.success('Firewall disabled.'));
    })
  );

firewall
  .command('delete <server>')
  .description('Delete all firewall rules')
  .option('-y, --yes', 'Skip confirmation')
  .action(
    asyncAction(async (client, serverIdOrIp: string, options: ActionOptions) => {
      if (!await confirmAction('Delete all firewall rules?', options)) return;
      await client.deleteFirewall(serverIdOrIp);
      console.log(fmt.success('Firewall rules deleted.'));
    })
  );

const fwTemplate = firewall.command('template').description('Firewall template management');

fwTemplate
  .command('list')
  .alias('ls')
  .description('List firewall templates')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const templates = await client.listFirewallTemplates();
      output(templates, fmt.formatFirewallTemplateList, options);
    })
  );

fwTemplate
  .command('get <id>')
  .alias('show')
  .description('Get firewall template details')
  .action(
    asyncAction(async (client, templateId: string, options: ActionOptions) => {
      const { firewall_template: tmpl } = await client.getFirewallTemplate(parseInt(templateId));
      output(tmpl, (t) => fmt.formatFirewallTemplateList([{ firewall_template: t }]), options);
    })
  );

fwTemplate
  .command('delete <id>')
  .alias('rm')
  .description('Delete firewall template')
  .option('-y, --yes', 'Skip confirmation')
  .action(
    asyncAction(async (client, templateId: string, options: ActionOptions) => {
      if (!await confirmAction(`Delete firewall template ${templateId}?`, options)) return;
      await client.deleteFirewallTemplate(parseInt(templateId));
      console.log(fmt.success('Firewall template deleted.'));
    })
  );

const vswitch = program.command('vswitch').description('vSwitch management');

vswitch
  .command('list')
  .alias('ls')
  .description('List all vSwitches')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const vswitches = await client.listVSwitches();
      output(vswitches, fmt.formatVSwitchList, options);
    })
  );

vswitch
  .command('get <id>')
  .alias('show')
  .description('Get vSwitch details')
  .action(
    asyncAction(async (client, vswitchId: string, options: ActionOptions) => {
      const { vswitch: vs } = await client.getVSwitch(parseInt(vswitchId));
      output(vs, fmt.formatVSwitchDetails, options);
    })
  );

vswitch
  .command('create <name> <vlan>')
  .description('Create a new vSwitch')
  .action(
    asyncAction(async (client, name: string, vlan: string) => {
      const { vswitch: vs } = await client.createVSwitch(name, parseInt(vlan));
      console.log(fmt.success(`vSwitch created: ID ${vs.id}`));
    })
  );

vswitch
  .command('update <id>')
  .description('Update vSwitch')
  .option('-n, --name <name>', 'New name')
  .option('-v, --vlan <vlan>', 'New VLAN ID')
  .action(
    asyncAction(async (client, vswitchId: string, options: { name?: string; vlan?: string }) => {
      await client.updateVSwitch(
        parseInt(vswitchId),
        options.name,
        options.vlan ? parseInt(options.vlan) : undefined
      );
      console.log(fmt.success('vSwitch updated.'));
    })
  );

vswitch
  .command('delete <id>')
  .alias('rm')
  .description('Delete vSwitch')
  .option('-y, --yes', 'Skip confirmation')
  .option('--date <date>', 'Cancellation date (YYYY-MM-DD)')
  .action(
    asyncAction(async (client, vswitchId: string, options: ActionOptions & { date?: string }) => {
      if (!await confirmAction(`Delete vSwitch ${vswitchId}?`, options)) return;
      await client.deleteVSwitch(parseInt(vswitchId), options.date);
      console.log(fmt.success('vSwitch deleted.'));
    })
  );

vswitch
  .command('add-server <vswitch-id> <server>')
  .description('Add server to vSwitch')
  .action(
    asyncAction(async (client, vswitchId: string, serverIdOrIp: string) => {
      await client.addServerToVSwitch(parseInt(vswitchId), serverIdOrIp);
      console.log(fmt.success('Server added to vSwitch.'));
    })
  );

vswitch
  .command('remove-server <vswitch-id> <server>')
  .description('Remove server from vSwitch')
  .action(
    asyncAction(async (client, vswitchId: string, serverIdOrIp: string) => {
      await client.removeServerFromVSwitch(parseInt(vswitchId), serverIdOrIp);
      console.log(fmt.success('Server removed from vSwitch.'));
    })
  );

const storagebox = program.command('storagebox').alias('storage').description('Storage Box management');

storagebox
  .command('list')
  .alias('ls')
  .description('List all storage boxes')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const boxes = await client.listStorageBoxes();
      output(boxes, fmt.formatStorageBoxList, options);
    })
  );

storagebox
  .command('get <id>')
  .alias('show')
  .description('Get storage box details')
  .action(
    asyncAction(async (client, boxId: string, options: ActionOptions) => {
      const { storagebox: box } = await client.getStorageBox(parseInt(boxId));
      output(box, fmt.formatStorageBoxDetails, options);
    })
  );

storagebox
  .command('update <id>')
  .description('Update storage box settings')
  .option('-n, --name <name>', 'Storage box name')
  .option('--webdav <enabled>', 'Enable/disable WebDAV')
  .option('--samba <enabled>', 'Enable/disable Samba/CIFS')
  .option('--ssh <enabled>', 'Enable/disable SSH/SFTP')
  .option('--external <enabled>', 'Enable/disable external reachability')
  .option('--zfs <enabled>', 'Enable/disable ZFS')
  .action(
    asyncAction(async (client, boxId: string, options: { name?: string; webdav?: string; samba?: string; ssh?: string; external?: string; zfs?: string }) => {
      await client.updateStorageBox(
        parseInt(boxId),
        options.name,
        options.webdav ? options.webdav === 'true' : undefined,
        options.samba ? options.samba === 'true' : undefined,
        options.ssh ? options.ssh === 'true' : undefined,
        options.external ? options.external === 'true' : undefined,
        options.zfs ? options.zfs === 'true' : undefined
      );
      console.log(fmt.success('Storage box updated.'));
    })
  );

storagebox
  .command('reset-password <id>')
  .description('Reset storage box password')
  .action(
    asyncAction(async (client, boxId: string) => {
      const { password } = await client.resetStorageBoxPassword(parseInt(boxId));
      console.log(fmt.success('Password reset.'));
      console.log(`New password: ${fmt.colorize(password, 'yellow')}`);
    })
  );

const snapshot = storagebox.command('snapshot').description('Storage box snapshot management');

snapshot
  .command('list <box-id>')
  .alias('ls')
  .description('List storage box snapshots')
  .action(
    asyncAction(async (client, boxId: string, options: ActionOptions) => {
      const snapshots = await client.listStorageBoxSnapshots(parseInt(boxId));
      output(snapshots, fmt.formatStorageBoxSnapshots, options);
    })
  );

snapshot
  .command('create <box-id>')
  .description('Create a new snapshot')
  .action(
    asyncAction(async (client, boxId: string) => {
      const { snapshot: snap } = await client.createStorageBoxSnapshot(parseInt(boxId));
      console.log(fmt.success(`Snapshot created: ${snap.name}`));
    })
  );

snapshot
  .command('delete <box-id> <name>')
  .alias('rm')
  .description('Delete a snapshot')
  .option('-y, --yes', 'Skip confirmation')
  .action(
    asyncAction(async (client, boxId: string, snapshotName: string, options: ActionOptions) => {
      if (!await confirmAction(`Delete snapshot ${snapshotName}?`, options)) return;
      await client.deleteStorageBoxSnapshot(parseInt(boxId), snapshotName);
      console.log(fmt.success('Snapshot deleted.'));
    })
  );

snapshot
  .command('revert <box-id> <name>')
  .description('Revert to a snapshot')
  .option('-y, --yes', 'Skip confirmation')
  .action(
    asyncAction(async (client, boxId: string, snapshotName: string, options: ActionOptions) => {
      if (!options.yes) {
        console.log(fmt.warning('This will revert your storage box to the snapshot state.'));
      }
      if (!await confirmAction(`Revert to snapshot ${snapshotName}?`, options)) return;
      await client.revertStorageBoxSnapshot(parseInt(boxId), snapshotName);
      console.log(fmt.success('Reverted to snapshot.'));
    })
  );

const subaccount = storagebox.command('subaccount').description('Storage box subaccount management');

subaccount
  .command('list <box-id>')
  .alias('ls')
  .description('List storage box subaccounts')
  .action(
    asyncAction(async (client, boxId: string, options: ActionOptions) => {
      const subaccounts = await client.listStorageBoxSubaccounts(parseInt(boxId));
      output(subaccounts, fmt.formatStorageBoxSubaccounts, options);
    })
  );

subaccount
  .command('create <box-id> <home-directory>')
  .description('Create a new subaccount')
  .option('--samba <enabled>', 'Enable Samba')
  .option('--ssh <enabled>', 'Enable SSH')
  .option('--webdav <enabled>', 'Enable WebDAV')
  .option('--external <enabled>', 'Enable external reachability')
  .option('--readonly <enabled>', 'Read-only access')
  .option('--comment <comment>', 'Comment')
  .action(
    asyncAction(async (client, boxId: string, homeDir: string, options: { samba?: string; ssh?: string; webdav?: string; external?: string; readonly?: string; comment?: string }) => {
      const { subaccount: sub } = await client.createStorageBoxSubaccount(
        parseInt(boxId),
        homeDir,
        options.samba ? options.samba === 'true' : undefined,
        options.ssh ? options.ssh === 'true' : undefined,
        options.external ? options.external === 'true' : undefined,
        options.webdav ? options.webdav === 'true' : undefined,
        options.readonly ? options.readonly === 'true' : undefined,
        options.comment
      );
      console.log(fmt.success(`Subaccount created: ${sub.username}`));
    })
  );

subaccount
  .command('delete <box-id> <username>')
  .alias('rm')
  .description('Delete a subaccount')
  .option('-y, --yes', 'Skip confirmation')
  .action(
    asyncAction(async (client, boxId: string, username: string, options: ActionOptions) => {
      if (!await confirmAction(`Delete subaccount ${username}?`, options)) return;
      await client.deleteStorageBoxSubaccount(parseInt(boxId), username);
      console.log(fmt.success('Subaccount deleted.'));
    })
  );

const traffic = program.command('traffic').description('Traffic analytics');

traffic
  .command('query')
  .description('Query traffic data')
  .option('-i, --ip <ips...>', 'IP addresses to query')
  .option('-s, --subnet <subnets...>', 'Subnets to query')
  .option('--from <date>', 'Start date (YYYY-MM-DD)')
  .option('--to <date>', 'End date (YYYY-MM-DD)')
  .option('-t, --type <type>', 'Query type (day, month, year)', 'month')
  .action(
    asyncAction(async (client, options: ActionOptions & { ip?: string[]; subnet?: string[]; from?: string; to?: string; type?: 'day' | 'month' | 'year' }) => {
      const now = new Date();
      const from = options.from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const to = options.to || now.toISOString().split('T')[0];

      const { traffic: trafficData } = await client.getTraffic(
        options.ip || [],
        options.subnet || [],
        from,
        to,
        options.type as 'day' | 'month' | 'year'
      );

      output(trafficData, fmt.formatTraffic, options);
    })
  );

const wol = program.command('wol').description('Wake on LAN');

wol
  .command('status <server>')
  .description('Check WoL status for server')
  .action(
    asyncAction(async (client, serverIdOrIp: string, options: ActionOptions) => {
      const { wol: wolData } = await client.getWol(serverIdOrIp);
      output(wolData, (w) => `Server: ${w.server_number} (${w.server_ip})\n${fmt.info('Wake on LAN is available for this server.')}`, options);
    })
  );

wol
  .command('send <server>')
  .description('Send Wake on LAN packet')
  .action(
    asyncAction(async (client, serverIdOrIp: string) => {
      const { wol: wolData } = await client.sendWol(serverIdOrIp);
      console.log(fmt.formatWolResult(wolData));
    })
  );

const cancel = program.command('cancel').description('Server cancellation');

cancel
  .command('status <server>')
  .description('Get cancellation status')
  .action(
    asyncAction(async (client, serverIdOrIp: string, options: ActionOptions) => {
      const { cancellation } = await client.getCancellation(serverIdOrIp);
      output(cancellation, fmt.formatCancellation, options);
    })
  );

cancel
  .command('request <server>')
  .description('Request server cancellation')
  .option('--date <date>', 'Cancellation date (YYYY-MM-DD)')
  .option('--reason <reasons...>', 'Cancellation reasons')
  .option('-y, --yes', 'Skip confirmation')
  .action(
    asyncAction(async (client, serverIdOrIp: string, options: ActionOptions & { date?: string; reason?: string[] }) => {
      if (!options.yes) {
        console.log(fmt.warning('This will cancel your server!'));
      }
      if (!await confirmAction('Are you sure you want to cancel this server?', options)) return;
      const { cancellation } = await client.cancelServer(serverIdOrIp, options.date, options.reason);
      console.log(fmt.success('Cancellation requested.'));
      console.log(fmt.formatCancellation(cancellation));
    })
  );

cancel
  .command('revoke <server>')
  .description('Revoke server cancellation')
  .action(
    asyncAction(async (client, serverIdOrIp: string) => {
      await client.revokeCancellation(serverIdOrIp);
      console.log(fmt.success('Cancellation revoked.'));
    })
  );

const order = program.command('order').description('Server ordering');

order
  .command('products')
  .description('List available server products')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const products = await client.listServerProducts();
      output(products, fmt.formatServerProductList, options);
    })
  );

order
  .command('market')
  .description('List server market (auction) products')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const products = await client.listServerMarketProducts();
      output(products, fmt.formatServerMarketProductList, options);
    })
  );

order
  .command('transactions')
  .description('List order transactions')
  .action(
    asyncAction(async (client, options: ActionOptions) => {
      const transactions = await client.listServerTransactions();
      output(transactions, fmt.formatTransactionList, options);
    })
  );

order
  .command('transaction <id>')
  .description('Get order transaction details')
  .action(
    asyncAction(async (client, transactionId: string, options: ActionOptions) => {
      const { transaction } = await client.getServerTransaction(transactionId);
      output(transaction, (t) => fmt.formatTransactionList([{ transaction: t }]), options);
    })
  );

program
  .command('interactive')
  .alias('i')
  .description('Interactive mode for common operations')
  .action(
    asyncAction(async (client) => {
      while (true) {
        const action = await select({
          message: 'What would you like to do?',
          choices: [
            { value: 'servers', name: 'List servers' },
            { value: 'reset', name: 'Reset a server' },
            { value: 'rescue', name: 'Activate rescue mode' },
            { value: 'failover', name: 'Switch failover IP' },
            { value: 'keys', name: 'Manage SSH keys' },
            { value: 'exit', name: 'Exit' },
          ],
          pageSize: 10,
        });

        if (action === 'exit') {
          console.log('Goodbye!');
          break;
        }

        if (action === 'servers') {
          const servers = await client.listServers();
          console.log('');
          console.log(fmt.formatServerList(servers));
          console.log('');
        }

        if (action === 'reset') {
          const servers = await client.listServers();
          if (servers.length === 0) {
            console.log(fmt.info('No servers found.'));
            continue;
          }

          const selected = await checkbox({
            message: 'Select servers to reset:',
            choices: servers.map(({ server }) => ({
              value: server.server_ip,
              name: `${server.server_number} - ${server.server_ip} (${server.server_name || 'unnamed'})`,
            })),
          });

          if (selected.length === 0) {
            console.log('No servers selected.');
            continue;
          }

          const resetType = (await select({
            message: 'Select reset type:',
            choices: [
              { value: 'sw', name: 'Software reset (ACPI)' },
              { value: 'hw', name: 'Hardware reset (forced)' },
              { value: 'power', name: 'Power cycle' },
            ],
          })) as ResetType;

          const confirmed = await confirm({
            message: `Reset ${selected.length} server(s) with ${resetType}?`,
            default: false,
          });

          if (confirmed) {
            for (const srv of selected) {
              try {
                const { reset: rst } = await client.resetServer(srv, resetType);
                console.log(fmt.formatResetResult(rst, resetType));
              } catch (error) {
                console.log(fmt.error(`Failed to reset ${srv}: ${error instanceof Error ? error.message : 'Unknown'}`));
              }
            }
          }
        }

        if (action === 'rescue') {
          const servers = await client.listServers();
          if (servers.length === 0) {
            console.log(fmt.info('No servers found.'));
            continue;
          }

          const serverIp = await select({
            message: 'Select server:',
            choices: servers.map(({ server }) => ({
              value: server.server_ip,
              name: `${server.server_number} - ${server.server_ip} (${server.server_name || 'unnamed'})`,
            })),
          });

          const os = await select({
            message: 'Select rescue OS:',
            choices: [
              { value: 'linux', name: 'Linux (64-bit)' },
              { value: 'linuxold', name: 'Linux (32-bit)' },
              { value: 'vkvm', name: 'vKVM' },
            ],
          });

          const { rescue } = await client.activateRescue(serverIp, os, 64);
          console.log('');
          console.log(fmt.formatRescueActivation(rescue));
        }

        if (action === 'failover') {
          const failovers = await client.listFailovers();
          if (failovers.length === 0) {
            console.log(fmt.info('No failover IPs found.'));
            continue;
          }

          const failoverIp = await select({
            message: 'Select failover IP:',
            choices: failovers.map(({ failover }) => ({
              value: failover.ip,
              name: `${failover.ip} -> ${failover.active_server_ip}`,
            })),
          });

          const servers = await client.listServers();
          const targetIp = await select({
            message: 'Route to server:',
            choices: servers.map(({ server }) => ({
              value: server.server_ip,
              name: `${server.server_number} - ${server.server_ip}`,
            })),
          });

          const { failover: fo } = await client.switchFailover(failoverIp, targetIp);
          console.log('');
          console.log(fmt.formatFailoverSwitch(fo));
        }

        if (action === 'keys') {
          const keys = await client.listSshKeys();
          console.log('');
          console.log(fmt.formatSshKeyList(keys));
          console.log('');
        }

        console.log('');
      }
    })
  );

program.parse();
