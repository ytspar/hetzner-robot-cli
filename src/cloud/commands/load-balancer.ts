import type { Command } from 'commander';
import { cloudAction, cloudOutput, cloudConfirm, type CloudActionOptions } from '../helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as cloudFmt from '../formatter.js';

export function registerLoadBalancerCommands(parent: Command): void {
  const lb = parent.command('load-balancer').description('Load balancer management');

  lb.command('list').alias('ls').description('List all load balancers')
    .option('-l, --label-selector <selector>', 'Label selector')
    .option('-s, --sort <field>', 'Sort by field')
    .action(cloudAction(async (client, options: CloudActionOptions & { labelSelector?: string; sort?: string }) => {
      const lbs = await client.listLoadBalancers({ label_selector: options.labelSelector, sort: options.sort });
      cloudOutput(lbs, cloudFmt.formatLoadBalancerList, options);
    }));

  lb.command('describe <id>').description('Show load balancer details')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      const loadBalancer = await client.getLoadBalancer(parseInt(id));
      cloudOutput(loadBalancer, cloudFmt.formatLoadBalancerDetails, options);
    }));

  lb.command('create').description('Create a load balancer')
    .requiredOption('--name <name>', 'Load balancer name')
    .requiredOption('--type <type>', 'Load balancer type')
    .option('--location <loc>', 'Location')
    .option('--network-zone <zone>', 'Network zone')
    .option('--algorithm <algo>', 'Algorithm (round_robin, least_connections)', 'round_robin')
    .action(cloudAction(async (client, options: CloudActionOptions & { name: string; type: string; location?: string; networkZone?: string; algorithm?: string }) => {
      const { load_balancer: created } = await client.createLoadBalancer({
        name: options.name,
        load_balancer_type: options.type,
        location: options.location,
        network_zone: options.networkZone,
        algorithm: options.algorithm ? { type: options.algorithm } : undefined,
      });
      console.log(fmt.success(`Load balancer '${created.name}' created (ID: ${created.id})`));
    }));

  lb.command('delete <id>').description('Delete a load balancer')
    .option('-y, --yes', 'Skip confirmation')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      if (!await cloudConfirm(`Delete load balancer ${id}?`, options)) return;
      await client.deleteLoadBalancer(parseInt(id));
      console.log(fmt.success(`Load balancer ${id} deleted.`));
    }));

  lb.command('update <id>').description('Update load balancer')
    .option('--name <name>', 'New name')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { name?: string }) => {
      await client.updateLoadBalancer(parseInt(id), { name: options.name });
      console.log(fmt.success(`Load balancer ${id} updated.`));
    }));

  lb.command('add-target <id>').description('Add target to load balancer')
    .requiredOption('--type <type>', 'Target type (server, label_selector, ip)')
    .option('--server <server>', 'Server ID')
    .option('--label-selector <selector>', 'Label selector')
    .option('--ip <ip>', 'IP address')
    .option('--use-private-ip', 'Use private IP')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { type: string; server?: string; labelSelector?: string; ip?: string; usePrivateIp?: boolean }) => {
      const target: Record<string, unknown> = { type: options.type, use_private_ip: !!options.usePrivateIp };
      if (options.server) target.server = { id: parseInt(options.server) };
      if (options.labelSelector) target.label_selector = { selector: options.labelSelector };
      if (options.ip) target.ip = { ip: options.ip };
      await client.addTargetToLoadBalancer(parseInt(id), target);
      console.log(fmt.success(`Target added to load balancer ${id}.`));
    }));

  lb.command('remove-target <id>').description('Remove target from load balancer')
    .requiredOption('--type <type>', 'Target type (server, label_selector, ip)')
    .option('--server <server>', 'Server ID')
    .option('--label-selector <selector>', 'Label selector')
    .option('--ip <ip>', 'IP address')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { type: string; server?: string; labelSelector?: string; ip?: string }) => {
      const target: Record<string, unknown> = { type: options.type };
      if (options.server) target.server = { id: parseInt(options.server) };
      if (options.labelSelector) target.label_selector = { selector: options.labelSelector };
      if (options.ip) target.ip = { ip: options.ip };
      await client.removeTargetFromLoadBalancer(parseInt(id), target);
      console.log(fmt.success(`Target removed from load balancer ${id}.`));
    }));

  lb.command('add-service <id>').description('Add service to load balancer')
    .requiredOption('--protocol <protocol>', 'Protocol (tcp, http, https)')
    .requiredOption('--listen-port <port>', 'Listen port')
    .requiredOption('--destination-port <port>', 'Destination port')
    .option('--proxyprotocol', 'Enable proxy protocol')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { protocol: string; listenPort: string; destinationPort: string; proxyprotocol?: boolean }) => {
      await client.addServiceToLoadBalancer(parseInt(id), {
        protocol: options.protocol,
        listen_port: parseInt(options.listenPort),
        destination_port: parseInt(options.destinationPort),
        proxyprotocol: !!options.proxyprotocol,
        health_check: { protocol: options.protocol, port: parseInt(options.destinationPort), interval: 15, timeout: 10, retries: 3 },
      });
      console.log(fmt.success(`Service added to load balancer ${id}.`));
    }));

  lb.command('update-service <id>').description('Update a service on load balancer')
    .requiredOption('--listen-port <port>', 'Listen port of the service to update')
    .option('--protocol <protocol>', 'New protocol')
    .option('--destination-port <port>', 'New destination port')
    .option('--proxyprotocol <bool>', 'Enable/disable proxy protocol (true/false)')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { listenPort: string; protocol?: string; destinationPort?: string; proxyprotocol?: string }) => {
      const service: Record<string, unknown> = { listen_port: parseInt(options.listenPort) };
      if (options.protocol) service.protocol = options.protocol;
      if (options.destinationPort) service.destination_port = parseInt(options.destinationPort);
      if (options.proxyprotocol !== undefined) service.proxyprotocol = options.proxyprotocol === 'true';
      await client.updateServiceOnLoadBalancer(parseInt(id), service);
      console.log(fmt.success(`Service on load balancer ${id} updated.`));
    }));

  lb.command('delete-service <id>').description('Delete a service from load balancer')
    .requiredOption('--listen-port <port>', 'Listen port of the service to delete')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { listenPort: string }) => {
      await client.deleteServiceFromLoadBalancer(parseInt(id), parseInt(options.listenPort));
      console.log(fmt.success(`Service on port ${options.listenPort} deleted from load balancer ${id}.`));
    }));

  lb.command('change-algorithm <id>').description('Change load balancer algorithm')
    .requiredOption('--algorithm <type>', 'Algorithm type (round_robin, least_connections)')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { algorithm: string }) => {
      await client.changeLoadBalancerAlgorithm(parseInt(id), options.algorithm);
      console.log(fmt.success(`Algorithm changed for load balancer ${id}.`));
    }));

  lb.command('change-type <id>').description('Change load balancer type')
    .requiredOption('--type <type>', 'New load balancer type')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { type: string }) => {
      await client.changeLoadBalancerType(parseInt(id), options.type);
      console.log(fmt.success(`Type changed for load balancer ${id}.`));
    }));

  lb.command('attach-to-network <id>').description('Attach load balancer to network')
    .requiredOption('--network <network>', 'Network ID')
    .option('--ip <ip>', 'IP address in network')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { network: string; ip?: string }) => {
      await client.attachLoadBalancerToNetwork(parseInt(id), parseInt(options.network), options.ip);
      console.log(fmt.success(`Load balancer ${id} attached to network ${options.network}.`));
    }));

  lb.command('detach-from-network <id>').description('Detach load balancer from network')
    .requiredOption('--network <network>', 'Network ID')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { network: string }) => {
      await client.detachLoadBalancerFromNetwork(parseInt(id), parseInt(options.network));
      console.log(fmt.success(`Load balancer ${id} detached from network ${options.network}.`));
    }));

  lb.command('enable-public-interface <id>').description('Enable public interface')
    .action(cloudAction(async (client, id: string) => {
      await client.enableLoadBalancerPublicInterface(parseInt(id));
      console.log(fmt.success(`Public interface enabled for load balancer ${id}.`));
    }));

  lb.command('disable-public-interface <id>').description('Disable public interface')
    .action(cloudAction(async (client, id: string) => {
      await client.disableLoadBalancerPublicInterface(parseInt(id));
      console.log(fmt.success(`Public interface disabled for load balancer ${id}.`));
    }));

  lb.command('enable-protection <id>').description('Enable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changeLoadBalancerProtection(parseInt(id), true);
      console.log(fmt.success(`Protection enabled for load balancer ${id}.`));
    }));

  lb.command('disable-protection <id>').description('Disable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changeLoadBalancerProtection(parseInt(id), false);
      console.log(fmt.success(`Protection disabled for load balancer ${id}.`));
    }));

  lb.command('add-label <id> <label>').description('Add a label (key=value)')
    .action(cloudAction(async (client, id: string, label: string) => {
      const loadBalancer = await client.getLoadBalancer(parseInt(id));
      const [key, value] = label.split('=');
      await client.updateLoadBalancer(parseInt(id), { labels: { ...loadBalancer.labels, [key]: value || '' } });
      console.log(fmt.success(`Label '${key}' added.`));
    }));

  lb.command('remove-label <id> <key>').description('Remove a label')
    .action(cloudAction(async (client, id: string, key: string) => {
      const loadBalancer = await client.getLoadBalancer(parseInt(id));
      const labels = Object.fromEntries(Object.entries(loadBalancer.labels).filter(([k]) => k !== key));
      await client.updateLoadBalancer(parseInt(id), { labels });
      console.log(fmt.success(`Label '${key}' removed.`));
    }));
}
