import type { Command } from 'commander';
import { cloudAction, cloudOutput, cloudConfirm, type CloudActionOptions } from '../helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as cloudFmt from '../formatter.js';

export function registerFloatingIpCommands(parent: Command): void {
  const fip = parent.command('floating-ip').description('Floating IP management');

  fip.command('list').alias('ls').description('List all floating IPs')
    .option('-l, --label-selector <selector>', 'Label selector')
    .action(cloudAction(async (client, options: CloudActionOptions & { labelSelector?: string }) => {
      const ips = await client.listFloatingIps({ label_selector: options.labelSelector });
      cloudOutput(ips, cloudFmt.formatFloatingIpList, options);
    }));

  fip.command('describe <id>').description('Show floating IP details')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      const ip = await client.getFloatingIp(parseInt(id));
      cloudOutput(ip, cloudFmt.formatFloatingIpDetails, options);
    }));

  fip.command('create').description('Create a floating IP')
    .requiredOption('--type <type>', 'IP type (ipv4, ipv6)')
    .option('--name <name>', 'Name')
    .option('--description <desc>', 'Description')
    .option('--home-location <loc>', 'Home location')
    .option('--server <id>', 'Server to assign to')
    .action(cloudAction(async (client, options: CloudActionOptions & { type: string; name?: string; description?: string; homeLocation?: string; server?: string }) => {
      const { floating_ip: ip } = await client.createFloatingIp({ type: options.type as 'ipv4' | 'ipv6', name: options.name, description: options.description, home_location: options.homeLocation, server: options.server ? parseInt(options.server) : undefined });
      console.log(fmt.success(`Floating IP created (ID: ${ip.id}, IP: ${ip.ip})`));
    }));

  fip.command('delete <id>').description('Delete a floating IP')
    .option('-y, --yes', 'Skip confirmation')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      if (!await cloudConfirm(`Delete floating IP ${id}?`, options)) return;
      await client.deleteFloatingIp(parseInt(id));
      console.log(fmt.success(`Floating IP ${id} deleted.`));
    }));

  fip.command('update <id>').description('Update floating IP')
    .option('--name <name>', 'New name')
    .option('--description <desc>', 'New description')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { name?: string; description?: string }) => {
      await client.updateFloatingIp(parseInt(id), { name: options.name, description: options.description });
      console.log(fmt.success(`Floating IP ${id} updated.`));
    }));

  fip.command('assign <id> <server>').description('Assign floating IP to server')
    .action(cloudAction(async (client, id: string, server: string) => {
      await client.assignFloatingIp(parseInt(id), parseInt(server));
      console.log(fmt.success(`Floating IP ${id} assigned to server ${server}.`));
    }));

  fip.command('unassign <id>').description('Unassign floating IP')
    .action(cloudAction(async (client, id: string) => {
      await client.unassignFloatingIp(parseInt(id));
      console.log(fmt.success(`Floating IP ${id} unassigned.`));
    }));

  fip.command('enable-protection <id>').description('Enable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changeFloatingIpProtection(parseInt(id), true);
      console.log(fmt.success(`Protection enabled for floating IP ${id}.`));
    }));

  fip.command('disable-protection <id>').description('Disable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changeFloatingIpProtection(parseInt(id), false);
      console.log(fmt.success(`Protection disabled for floating IP ${id}.`));
    }));

  fip.command('set-rdns <id>').description('Set reverse DNS')
    .requiredOption('--ip <ip>', 'IP address')
    .requiredOption('--dns-ptr <ptr>', 'DNS pointer (empty to reset)')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { ip: string; dnsPtr: string }) => {
      await client.changeFloatingIpDnsPtr(parseInt(id), options.ip, options.dnsPtr || null);
      console.log(fmt.success('rDNS updated.'));
    }));

  fip.command('add-label <id> <label>').description('Add a label (key=value)')
    .action(cloudAction(async (client, id: string, label: string) => {
      const ip = await client.getFloatingIp(parseInt(id));
      const [key, value] = label.split('=');
      await client.updateFloatingIp(parseInt(id), { labels: { ...ip.labels, [key]: value || '' } });
      console.log(fmt.success(`Label '${key}' added.`));
    }));

  fip.command('remove-label <id> <key>').description('Remove a label')
    .action(cloudAction(async (client, id: string, key: string) => {
      const ip = await client.getFloatingIp(parseInt(id));
      const labels = Object.fromEntries(Object.entries(ip.labels).filter(([k]) => k !== key));
      await client.updateFloatingIp(parseInt(id), { labels });
      console.log(fmt.success(`Label '${key}' removed.`));
    }));
}
