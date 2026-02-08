import type { Command } from 'commander';
import { cloudAction, cloudOutput, cloudConfirm, type CloudActionOptions } from '../helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as cloudFmt from '../formatter.js';

export function registerPrimaryIpCommands(parent: Command): void {
  const pip = parent.command('primary-ip').description('Primary IP management');

  pip.command('list').alias('ls').description('List all primary IPs')
    .option('-l, --label-selector <selector>', 'Label selector')
    .action(cloudAction(async (client, options: CloudActionOptions & { labelSelector?: string }) => {
      const ips = await client.listPrimaryIps({ label_selector: options.labelSelector });
      cloudOutput(ips, cloudFmt.formatPrimaryIpList, options);
    }));

  pip.command('describe <id>').description('Show primary IP details')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      const ip = await client.getPrimaryIp(parseInt(id));
      cloudOutput(ip, cloudFmt.formatPrimaryIpDetails, options);
    }));

  pip.command('create').description('Create a primary IP')
    .requiredOption('--type <type>', 'IP type (ipv4, ipv6)')
    .requiredOption('--name <name>', 'Name')
    .option('--datacenter <dc>', 'Datacenter')
    .option('--assignee-id <id>', 'Server to assign to')
    .option('--auto-delete', 'Auto-delete with server')
    .action(cloudAction(async (client, options: CloudActionOptions & { type: string; name: string; datacenter?: string; assigneeId?: string; autoDelete?: boolean }) => {
      const { primary_ip: ip } = await client.createPrimaryIp({ type: options.type as 'ipv4' | 'ipv6', name: options.name, assignee_type: 'server', datacenter: options.datacenter, assignee_id: options.assigneeId ? parseInt(options.assigneeId) : undefined, auto_delete: options.autoDelete });
      console.log(fmt.success(`Primary IP created (ID: ${ip.id}, IP: ${ip.ip})`));
    }));

  pip.command('delete <id>').description('Delete a primary IP')
    .option('-y, --yes', 'Skip confirmation')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      if (!await cloudConfirm(`Delete primary IP ${id}?`, options)) return;
      await client.deletePrimaryIp(parseInt(id));
      console.log(fmt.success(`Primary IP ${id} deleted.`));
    }));

  pip.command('update <id>').description('Update primary IP')
    .option('--name <name>', 'New name')
    .option('--auto-delete <bool>', 'Auto-delete with server (true/false)')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { name?: string; autoDelete?: string }) => {
      await client.updatePrimaryIp(parseInt(id), { name: options.name, auto_delete: options.autoDelete ? options.autoDelete === 'true' : undefined });
      console.log(fmt.success(`Primary IP ${id} updated.`));
    }));

  pip.command('assign <id> <server>').description('Assign primary IP to server')
    .action(cloudAction(async (client, id: string, server: string) => {
      await client.assignPrimaryIp(parseInt(id), parseInt(server));
      console.log(fmt.success(`Primary IP ${id} assigned to server ${server}.`));
    }));

  pip.command('unassign <id>').description('Unassign primary IP')
    .action(cloudAction(async (client, id: string) => {
      await client.unassignPrimaryIp(parseInt(id));
      console.log(fmt.success(`Primary IP ${id} unassigned.`));
    }));

  pip.command('enable-protection <id>').description('Enable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changePrimaryIpProtection(parseInt(id), true);
      console.log(fmt.success(`Protection enabled for primary IP ${id}.`));
    }));

  pip.command('disable-protection <id>').description('Disable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changePrimaryIpProtection(parseInt(id), false);
      console.log(fmt.success(`Protection disabled for primary IP ${id}.`));
    }));

  pip.command('set-rdns <id>').description('Set reverse DNS')
    .requiredOption('--ip <ip>', 'IP address')
    .requiredOption('--dns-ptr <ptr>', 'DNS pointer (empty to reset)')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { ip: string; dnsPtr: string }) => {
      await client.changePrimaryIpDnsPtr(parseInt(id), options.ip, options.dnsPtr || null);
      console.log(fmt.success('rDNS updated.'));
    }));

  pip.command('add-label <id> <label>').description('Add a label (key=value)')
    .action(cloudAction(async (client, id: string, label: string) => {
      const ip = await client.getPrimaryIp(parseInt(id));
      const [key, value] = label.split('=');
      await client.updatePrimaryIp(parseInt(id), { labels: { ...ip.labels, [key]: value || '' } });
      console.log(fmt.success(`Label '${key}' added.`));
    }));

  pip.command('remove-label <id> <key>').description('Remove a label')
    .action(cloudAction(async (client, id: string, key: string) => {
      const ip = await client.getPrimaryIp(parseInt(id));
      const labels = Object.fromEntries(Object.entries(ip.labels).filter(([k]) => k !== key));
      await client.updatePrimaryIp(parseInt(id), { labels });
      console.log(fmt.success(`Label '${key}' removed.`));
    }));
}
