import type { Command } from 'commander';
import { cloudAction, cloudOutput, cloudConfirm, parseLabels, type CloudActionOptions } from '../helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as cloudFmt from '../formatter.js';

export function registerCloudServerCommands(parent: Command): void {
  const server = parent.command('server').description('Cloud server management');

  server
    .command('list')
    .alias('ls')
    .description('List all servers')
    .option('-l, --label-selector <selector>', 'Label selector')
    .option('-n, --name <name>', 'Filter by name')
    .option('-s, --sort <field>', 'Sort by field')
    .option('--status <status>', 'Filter by status')
    .action(
      cloudAction(async (client, options: CloudActionOptions & { labelSelector?: string; name?: string; sort?: string; status?: string }) => {
        const servers = await client.listServers({ label_selector: options.labelSelector, name: options.name, sort: options.sort, status: options.status });
        cloudOutput(servers, cloudFmt.formatCloudServerList, options);
      })
    );

  server
    .command('describe <id>')
    .description('Show server details')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions) => {
        const srv = await client.getServer(parseInt(id));
        cloudOutput(srv, cloudFmt.formatCloudServerDetails, options);
      })
    );

  server
    .command('create')
    .description('Create a new server')
    .requiredOption('--name <name>', 'Server name')
    .requiredOption('--type <type>', 'Server type')
    .requiredOption('--image <image>', 'Image to use')
    .option('--location <location>', 'Location')
    .option('--datacenter <dc>', 'Datacenter')
    .option('--ssh-key <keys...>', 'SSH key IDs or names')
    .option('--user-data <data>', 'Cloud-init user data')
    .option('--labels <labels>', 'Labels as key=value pairs (comma-separated)')
    .option('--firewall <ids...>', 'Firewall IDs to apply')
    .option('--placement-group <id>', 'Placement group ID')
    .option('--start-after-create', 'Start server after creation', true)
    .option('--no-start-after-create', 'Do not start server after creation')
    .action(
      cloudAction(async (client, options: CloudActionOptions & { name: string; type: string; image: string; location?: string; datacenter?: string; sshKey?: string[]; userData?: string; labels?: string; firewall?: string[]; placementGroup?: string; startAfterCreate?: boolean }) => {
        const result = await client.createServer({
          name: options.name,
          server_type: options.type,
          image: options.image,
          location: options.location,
          datacenter: options.datacenter,
          ssh_keys: options.sshKey,
          user_data: options.userData,
          labels: options.labels ? parseLabels(options.labels) : undefined,
          firewalls: options.firewall?.map(id => ({ firewall: parseInt(id) })),
          placement_group: options.placementGroup ? parseInt(options.placementGroup) : undefined,
          start_after_create: options.startAfterCreate,
        });
        console.log(fmt.success(`Server '${result.server.name}' created (ID: ${result.server.id})`));
        if (result.root_password) {
          console.log(`Root password: ${fmt.colorize(result.root_password, 'yellow')}`);
        }
        console.log(fmt.info(`IPv4: ${result.server.public_net.ipv4?.ip || 'pending'}`));
      })
    );

  server
    .command('delete <id>')
    .description('Delete a server')
    .option('-y, --yes', 'Skip confirmation')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions) => {
        if (!await cloudConfirm(`Delete server ${id}?`, options)) return;
        await client.deleteServer(parseInt(id));
        console.log(fmt.success(`Server ${id} deleted.`));
      })
    );

  server
    .command('update <id>')
    .description('Update server')
    .option('--name <name>', 'New name')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions & { name?: string }) => {
        const { server: srv } = await client.updateServer(parseInt(id), { name: options.name });
        console.log(fmt.success(`Server '${srv.name}' updated.`));
      })
    );

  server
    .command('poweron <id>')
    .description('Power on a server')
    .action(
      cloudAction(async (client, id: string) => {
        await client.powerOnServer(parseInt(id));
        console.log(fmt.success(`Server ${id} powered on.`));
      })
    );

  server
    .command('poweroff <id>')
    .description('Power off a server (hard)')
    .action(
      cloudAction(async (client, id: string) => {
        await client.powerOffServer(parseInt(id));
        console.log(fmt.success(`Server ${id} powered off.`));
      })
    );

  server
    .command('reboot <id>')
    .description('Soft reboot a server')
    .action(
      cloudAction(async (client, id: string) => {
        await client.rebootServer(parseInt(id));
        console.log(fmt.success(`Server ${id} rebooted.`));
      })
    );

  server
    .command('reset <id>')
    .description('Hard reset a server')
    .action(
      cloudAction(async (client, id: string) => {
        await client.resetServer(parseInt(id));
        console.log(fmt.success(`Server ${id} reset.`));
      })
    );

  server
    .command('shutdown <id>')
    .description('Gracefully shutdown a server (ACPI)')
    .action(
      cloudAction(async (client, id: string) => {
        await client.shutdownServer(parseInt(id));
        console.log(fmt.success(`Server ${id} shutdown initiated.`));
      })
    );

  server
    .command('rebuild <id>')
    .description('Rebuild a server with a new image')
    .requiredOption('--image <image>', 'Image to rebuild with')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions & { image: string }) => {
        const result = await client.rebuildServer(parseInt(id), options.image);
        console.log(fmt.success(`Server ${id} rebuilding.`));
        if (result.root_password) {
          console.log(`Root password: ${fmt.colorize(result.root_password, 'yellow')}`);
        }
      })
    );

  server
    .command('change-type <id>')
    .description('Change server type (resize)')
    .requiredOption('--type <type>', 'New server type')
    .option('--upgrade-disk', 'Upgrade disk size (irreversible)', false)
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions & { type: string; upgradeDisk?: boolean }) => {
        await client.changeServerType(parseInt(id), options.type, !!options.upgradeDisk);
        console.log(fmt.success(`Server ${id} type change initiated.`));
      })
    );

  server
    .command('enable-rescue <id>')
    .description('Enable rescue mode')
    .option('--type <type>', 'Rescue system type', 'linux64')
    .option('--ssh-key <keys...>', 'SSH key IDs')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions & { type: string; sshKey?: string[] }) => {
        const result = await client.enableServerRescue(parseInt(id), options.type, options.sshKey?.map(Number));
        console.log(fmt.success('Rescue mode enabled.'));
        console.log(`Root password: ${fmt.colorize(result.root_password, 'yellow')}`);
      })
    );

  server
    .command('disable-rescue <id>')
    .description('Disable rescue mode')
    .action(
      cloudAction(async (client, id: string) => {
        await client.disableServerRescue(parseInt(id));
        console.log(fmt.success('Rescue mode disabled.'));
      })
    );

  server
    .command('enable-backup <id>')
    .description('Enable automatic backups')
    .action(
      cloudAction(async (client, id: string) => {
        await client.enableServerBackup(parseInt(id));
        console.log(fmt.success(`Backups enabled for server ${id}.`));
      })
    );

  server
    .command('disable-backup <id>')
    .description('Disable automatic backups')
    .action(
      cloudAction(async (client, id: string) => {
        await client.disableServerBackup(parseInt(id));
        console.log(fmt.success(`Backups disabled for server ${id}.`));
      })
    );

  server
    .command('create-image <id>')
    .description('Create an image (snapshot) from server')
    .option('--description <desc>', 'Image description')
    .option('--type <type>', 'Image type (snapshot or backup)', 'snapshot')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions & { description?: string; type?: string }) => {
        const result = await client.createServerImage(parseInt(id), { description: options.description, type: options.type as 'snapshot' | 'backup' });
        console.log(fmt.success(`Image created (ID: ${result.image.id})`));
      })
    );

  server
    .command('attach-iso <id>')
    .description('Attach an ISO to a server')
    .requiredOption('--iso <iso>', 'ISO name or ID')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions & { iso: string }) => {
        await client.attachIsoToServer(parseInt(id), options.iso);
        console.log(fmt.success(`ISO attached to server ${id}.`));
      })
    );

  server
    .command('detach-iso <id>')
    .description('Detach ISO from a server')
    .action(
      cloudAction(async (client, id: string) => {
        await client.detachIsoFromServer(parseInt(id));
        console.log(fmt.success(`ISO detached from server ${id}.`));
      })
    );

  server
    .command('reset-password <id>')
    .description('Reset server root password')
    .action(
      cloudAction(async (client, id: string) => {
        const result = await client.resetServerPassword(parseInt(id));
        console.log(fmt.success('Root password reset.'));
        console.log(`New password: ${fmt.colorize(result.root_password, 'yellow')}`);
      })
    );

  server
    .command('set-rdns <id>')
    .description('Set reverse DNS for server')
    .requiredOption('--ip <ip>', 'IP address')
    .requiredOption('--dns-ptr <ptr>', 'DNS pointer')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions & { ip: string; dnsPtr: string }) => {
        await client.setServerRdns(parseInt(id), options.ip, options.dnsPtr);
        console.log(fmt.success(`rDNS set: ${options.ip} -> ${options.dnsPtr}`));
      })
    );

  server
    .command('enable-protection <id>')
    .description('Enable server protection')
    .option('--delete', 'Enable delete protection', true)
    .option('--rebuild', 'Enable rebuild protection', false)
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions & { delete?: boolean; rebuild?: boolean }) => {
        await client.enableServerProtection(parseInt(id), { delete: options.delete, rebuild: options.rebuild });
        console.log(fmt.success(`Protection enabled for server ${id}.`));
      })
    );

  server
    .command('disable-protection <id>')
    .description('Disable server protection')
    .action(
      cloudAction(async (client, id: string) => {
        await client.enableServerProtection(parseInt(id), { delete: false, rebuild: false });
        console.log(fmt.success(`Protection disabled for server ${id}.`));
      })
    );

  server
    .command('request-console <id>')
    .description('Request a WebSocket VNC console')
    .action(
      cloudAction(async (client, id: string) => {
        const result = await client.requestServerConsole(parseInt(id));
        console.log(fmt.success('Console ready.'));
        console.log(`WebSocket URL: ${result.wss_url}`);
        console.log(`Password: ${fmt.colorize(result.password, 'yellow')}`);
      })
    );

  server
    .command('attach-to-network <id>')
    .description('Attach server to a network')
    .requiredOption('--network <network>', 'Network ID')
    .option('--ip <ip>', 'IP address in network')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions & { network: string; ip?: string }) => {
        await client.attachServerToNetwork(parseInt(id), parseInt(options.network), options.ip);
        console.log(fmt.success(`Server ${id} attached to network ${options.network}.`));
      })
    );

  server
    .command('detach-from-network <id>')
    .description('Detach server from a network')
    .requiredOption('--network <network>', 'Network ID')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions & { network: string }) => {
        await client.detachServerFromNetwork(parseInt(id), parseInt(options.network));
        console.log(fmt.success(`Server ${id} detached from network ${options.network}.`));
      })
    );

  server
    .command('add-label <id> <label>')
    .description('Add a label (key=value)')
    .action(
      cloudAction(async (client, id: string, label: string) => {
        const srv = await client.getServer(parseInt(id));
        const [key, value] = label.split('=');
        const labels = { ...srv.labels, [key]: value || '' };
        await client.updateServer(parseInt(id), { labels });
        console.log(fmt.success(`Label '${key}' added to server ${id}.`));
      })
    );

  server
    .command('remove-label <id> <key>')
    .description('Remove a label by key')
    .action(
      cloudAction(async (client, id: string, key: string) => {
        const srv = await client.getServer(parseInt(id));
        const labels = Object.fromEntries(Object.entries(srv.labels).filter(([k]) => k !== key));
        await client.updateServer(parseInt(id), { labels });
        console.log(fmt.success(`Label '${key}' removed from server ${id}.`));
      })
    );
}
