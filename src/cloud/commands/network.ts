import type { Command } from 'commander';
import { cloudAction, cloudOutput, cloudConfirm, type CloudActionOptions } from '../helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as cloudFmt from '../formatter.js';

export function registerNetworkCommands(parent: Command): void {
  const network = parent.command('network').description('Network management');

  network.command('list').alias('ls').description('List all networks')
    .option('-l, --label-selector <selector>', 'Label selector')
    .action(cloudAction(async (client, options: CloudActionOptions & { labelSelector?: string }) => {
      const networks = await client.listNetworks({ label_selector: options.labelSelector });
      cloudOutput(networks, cloudFmt.formatNetworkList, options);
    }));

  network.command('describe <id>').description('Show network details')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      const net = await client.getNetwork(parseInt(id));
      cloudOutput(net, cloudFmt.formatNetworkDetails, options);
    }));

  network.command('create').description('Create a network')
    .requiredOption('--name <name>', 'Network name')
    .requiredOption('--ip-range <range>', 'IP range (CIDR)')
    .action(cloudAction(async (client, options: CloudActionOptions & { name: string; ipRange: string }) => {
      const { network: net } = await client.createNetwork({ name: options.name, ip_range: options.ipRange });
      console.log(fmt.success(`Network '${net.name}' created (ID: ${net.id})`));
    }));

  network.command('delete <id>').description('Delete a network')
    .option('-y, --yes', 'Skip confirmation')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      if (!await cloudConfirm(`Delete network ${id}?`, options)) return;
      await client.deleteNetwork(parseInt(id));
      console.log(fmt.success(`Network ${id} deleted.`));
    }));

  network.command('update <id>').description('Update a network')
    .option('--name <name>', 'New name')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { name?: string }) => {
      await client.updateNetwork(parseInt(id), { name: options.name });
      console.log(fmt.success(`Network ${id} updated.`));
    }));

  network.command('add-subnet <id>').description('Add subnet to network')
    .requiredOption('--ip-range <range>', 'Subnet IP range')
    .requiredOption('--type <type>', 'Subnet type (cloud, server, vswitch)')
    .requiredOption('--network-zone <zone>', 'Network zone')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { ipRange: string; type: string; networkZone: string }) => {
      await client.addSubnetToNetwork(parseInt(id), { ip_range: options.ipRange, type: options.type as 'cloud' | 'server' | 'vswitch', network_zone: options.networkZone });
      console.log(fmt.success('Subnet added.'));
    }));

  network.command('delete-subnet <id>').description('Delete subnet from network')
    .requiredOption('--ip-range <range>', 'Subnet IP range to delete')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { ipRange: string }) => {
      await client.deleteSubnetFromNetwork(parseInt(id), options.ipRange);
      console.log(fmt.success('Subnet deleted.'));
    }));

  network.command('add-route <id>').description('Add route to network')
    .requiredOption('--destination <cidr>', 'Destination CIDR')
    .requiredOption('--gateway <ip>', 'Gateway IP')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { destination: string; gateway: string }) => {
      await client.addRouteToNetwork(parseInt(id), { destination: options.destination, gateway: options.gateway });
      console.log(fmt.success('Route added.'));
    }));

  network.command('delete-route <id>').description('Delete route from network')
    .requiredOption('--destination <cidr>', 'Destination CIDR')
    .requiredOption('--gateway <ip>', 'Gateway IP')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { destination: string; gateway: string }) => {
      await client.deleteRouteFromNetwork(parseInt(id), { destination: options.destination, gateway: options.gateway });
      console.log(fmt.success('Route deleted.'));
    }));

  network.command('change-ip-range <id>').description('Change network IP range')
    .requiredOption('--ip-range <range>', 'New IP range')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { ipRange: string }) => {
      await client.changeNetworkIpRange(parseInt(id), options.ipRange);
      console.log(fmt.success('IP range changed.'));
    }));

  network.command('enable-protection <id>').description('Enable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changeNetworkProtection(parseInt(id), true);
      console.log(fmt.success(`Protection enabled for network ${id}.`));
    }));

  network.command('disable-protection <id>').description('Disable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changeNetworkProtection(parseInt(id), false);
      console.log(fmt.success(`Protection disabled for network ${id}.`));
    }));

  network.command('add-label <id> <label>').description('Add a label (key=value)')
    .action(cloudAction(async (client, id: string, label: string) => {
      const net = await client.getNetwork(parseInt(id));
      const [key, value] = label.split('=');
      await client.updateNetwork(parseInt(id), { labels: { ...net.labels, [key]: value || '' } });
      console.log(fmt.success(`Label '${key}' added.`));
    }));

  network.command('remove-label <id> <key>').description('Remove a label')
    .action(cloudAction(async (client, id: string, key: string) => {
      const net = await client.getNetwork(parseInt(id));
      const labels = Object.fromEntries(Object.entries(net.labels).filter(([k]) => k !== key));
      await client.updateNetwork(parseInt(id), { labels });
      console.log(fmt.success(`Label '${key}' removed.`));
    }));
}
