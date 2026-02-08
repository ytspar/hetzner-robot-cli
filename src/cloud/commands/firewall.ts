import type { Command } from 'commander';
import { cloudAction, cloudOutput, cloudConfirm, type CloudActionOptions } from '../helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as cloudFmt from '../formatter.js';

export function registerCloudFirewallCommands(parent: Command): void {
  const firewall = parent.command('firewall').description('Cloud firewall management');

  firewall.command('list').alias('ls').description('List all firewalls')
    .option('-l, --label-selector <selector>', 'Label selector')
    .action(cloudAction(async (client, options: CloudActionOptions & { labelSelector?: string }) => {
      const firewalls = await client.listFirewalls({ label_selector: options.labelSelector });
      cloudOutput(firewalls, cloudFmt.formatCloudFirewallList, options);
    }));

  firewall.command('describe <id>').description('Show firewall details')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      const fw = await client.getFirewall(parseInt(id));
      cloudOutput(fw, cloudFmt.formatCloudFirewallDetails, options);
    }));

  firewall.command('create').description('Create a firewall')
    .requiredOption('--name <name>', 'Firewall name')
    .action(cloudAction(async (client, options: CloudActionOptions & { name: string }) => {
      const { firewall: fw } = await client.createFirewall({ name: options.name });
      console.log(fmt.success(`Firewall '${fw.name}' created (ID: ${fw.id})`));
    }));

  firewall.command('delete <id>').description('Delete a firewall')
    .option('-y, --yes', 'Skip confirmation')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      if (!await cloudConfirm(`Delete firewall ${id}?`, options)) return;
      await client.deleteFirewall(parseInt(id));
      console.log(fmt.success(`Firewall ${id} deleted.`));
    }));

  firewall.command('update <id>').description('Update firewall')
    .option('--name <name>', 'New name')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { name?: string }) => {
      await client.updateFirewall(parseInt(id), { name: options.name });
      console.log(fmt.success(`Firewall ${id} updated.`));
    }));

  firewall.command('apply-to-resource <id>').description('Apply firewall to resource')
    .requiredOption('--type <type>', 'Resource type (server, label_selector)')
    .option('--server <server>', 'Server ID')
    .option('--label-selector <selector>', 'Label selector')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { type: string; server?: string; labelSelector?: string }) => {
      const applyTo = [{
        type: options.type as 'server' | 'label_selector',
        ...(options.server ? { server: { id: parseInt(options.server) } } : {}),
        ...(options.labelSelector ? { label_selector: { selector: options.labelSelector } } : {}),
      }];
      await client.applyFirewall(parseInt(id), applyTo);
      console.log(fmt.success(`Firewall ${id} applied.`));
    }));

  firewall.command('remove-from-resource <id>').description('Remove firewall from resource')
    .requiredOption('--type <type>', 'Resource type (server, label_selector)')
    .option('--server <server>', 'Server ID')
    .option('--label-selector <selector>', 'Label selector')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { type: string; server?: string; labelSelector?: string }) => {
      const removeFrom = [{
        type: options.type as 'server' | 'label_selector',
        ...(options.server ? { server: { id: parseInt(options.server) } } : {}),
        ...(options.labelSelector ? { label_selector: { selector: options.labelSelector } } : {}),
      }];
      await client.removeFirewallFromResources(parseInt(id), removeFrom);
      console.log(fmt.success(`Firewall ${id} removed from resource.`));
    }));

  firewall.command('add-label <id> <label>').description('Add a label (key=value)')
    .action(cloudAction(async (client, id: string, label: string) => {
      const fw = await client.getFirewall(parseInt(id));
      const [key, value] = label.split('=');
      await client.updateFirewall(parseInt(id), { labels: { ...fw.labels, [key]: value || '' } });
      console.log(fmt.success(`Label '${key}' added.`));
    }));

  firewall.command('remove-label <id> <key>').description('Remove a label')
    .action(cloudAction(async (client, id: string, key: string) => {
      const fw = await client.getFirewall(parseInt(id));
      const labels = Object.fromEntries(Object.entries(fw.labels).filter(([k]) => k !== key));
      await client.updateFirewall(parseInt(id), { labels });
      console.log(fmt.success(`Label '${key}' removed.`));
    }));
}
