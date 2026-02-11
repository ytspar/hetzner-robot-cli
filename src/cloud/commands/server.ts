import type { Command } from 'commander';
import { cloudAction, cloudOutput, cloudConfirm, parseLabels, resolveIdOrName, type CloudActionOptions } from '../helpers.js';
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
    .command('describe <id-or-name>')
    .description('Show server details')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        const srv = await client.getServer(id);
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
    .command('delete <id-or-name>')
    .description('Delete a server')
    .option('-y, --yes', 'Skip confirmation')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        const srv = await client.getServer(id);
        if (!await cloudConfirm(`Delete server '${srv.name}' (ID: ${id})?`, options)) return;
        await client.deleteServer(id);
        console.log(fmt.success(`Server '${srv.name}' (ID: ${id}) deleted.`));
      })
    );

  server
    .command('update <id-or-name>')
    .description('Update server')
    .option('--name <name>', 'New name')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions & { name?: string }) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        const { server: srv } = await client.updateServer(id, { name: options.name });
        console.log(fmt.success(`Server '${srv.name}' updated.`));
      })
    );

  server
    .command('poweron <id-or-name>')
    .description('Power on a server')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.powerOnServer(id);
        console.log(fmt.success(`Server ${id} powered on.`));
      })
    );

  server
    .command('poweroff <id-or-name>')
    .description('Power off a server (hard)')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.powerOffServer(id);
        console.log(fmt.success(`Server ${id} powered off.`));
      })
    );

  server
    .command('reboot <id-or-name>')
    .description('Soft reboot a server')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.rebootServer(id);
        console.log(fmt.success(`Server ${id} rebooted.`));
      })
    );

  server
    .command('reset <id-or-name>')
    .description('Hard reset a server')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.resetServer(id);
        console.log(fmt.success(`Server ${id} reset.`));
      })
    );

  server
    .command('shutdown <id-or-name>')
    .description('Gracefully shutdown a server (ACPI)')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.shutdownServer(id);
        console.log(fmt.success(`Server ${id} shutdown initiated.`));
      })
    );

  server
    .command('rebuild <id-or-name>')
    .description('Rebuild a server with a new image')
    .requiredOption('--image <image>', 'Image to rebuild with')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions & { image: string }) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        const result = await client.rebuildServer(id, options.image);
        console.log(fmt.success(`Server ${id} rebuilding.`));
        if (result.root_password) {
          console.log(`Root password: ${fmt.colorize(result.root_password, 'yellow')}`);
        }
      })
    );

  server
    .command('change-type <id-or-name>')
    .description('Change server type (resize)')
    .requiredOption('--type <type>', 'New server type')
    .option('--upgrade-disk', 'Upgrade disk size (irreversible)', false)
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions & { type: string; upgradeDisk?: boolean }) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.changeServerType(id, options.type, !!options.upgradeDisk);
        console.log(fmt.success(`Server ${id} type change initiated.`));
      })
    );

  server
    .command('enable-rescue <id-or-name>')
    .description('Enable rescue mode')
    .option('--type <type>', 'Rescue system type', 'linux64')
    .option('--ssh-key <keys...>', 'SSH key IDs')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions & { type: string; sshKey?: string[] }) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        const result = await client.enableServerRescue(id, options.type, options.sshKey?.map(Number));
        console.log(fmt.success('Rescue mode enabled.'));
        console.log(`Root password: ${fmt.colorize(result.root_password, 'yellow')}`);
      })
    );

  server
    .command('disable-rescue <id-or-name>')
    .description('Disable rescue mode')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.disableServerRescue(id);
        console.log(fmt.success('Rescue mode disabled.'));
      })
    );

  server
    .command('enable-backup <id-or-name>')
    .description('Enable automatic backups')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.enableServerBackup(id);
        console.log(fmt.success(`Backups enabled for server ${id}.`));
      })
    );

  server
    .command('disable-backup <id-or-name>')
    .description('Disable automatic backups')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.disableServerBackup(id);
        console.log(fmt.success(`Backups disabled for server ${id}.`));
      })
    );

  server
    .command('create-image <id-or-name>')
    .description('Create an image (snapshot) from server')
    .option('--description <desc>', 'Image description')
    .option('--type <type>', 'Image type (snapshot or backup)', 'snapshot')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions & { description?: string; type?: string }) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        const result = await client.createServerImage(id, { description: options.description, type: options.type as 'snapshot' | 'backup' });
        console.log(fmt.success(`Image created (ID: ${result.image.id})`));
      })
    );

  server
    .command('attach-iso <id-or-name>')
    .description('Attach an ISO to a server')
    .requiredOption('--iso <iso>', 'ISO name or ID')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions & { iso: string }) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.attachIsoToServer(id, options.iso);
        console.log(fmt.success(`ISO attached to server ${id}.`));
      })
    );

  server
    .command('detach-iso <id-or-name>')
    .description('Detach ISO from a server')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.detachIsoFromServer(id);
        console.log(fmt.success(`ISO detached from server ${id}.`));
      })
    );

  server
    .command('reset-password <id-or-name>')
    .description('Reset server root password')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        const result = await client.resetServerPassword(id);
        console.log(fmt.success('Root password reset.'));
        console.log(`New password: ${fmt.colorize(result.root_password, 'yellow')}`);
      })
    );

  server
    .command('set-rdns <id-or-name>')
    .description('Set reverse DNS for server')
    .requiredOption('--ip <ip>', 'IP address')
    .requiredOption('--dns-ptr <ptr>', 'DNS pointer')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions & { ip: string; dnsPtr: string }) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.setServerRdns(id, options.ip, options.dnsPtr);
        console.log(fmt.success(`rDNS set: ${options.ip} -> ${options.dnsPtr}`));
      })
    );

  server
    .command('enable-protection <id-or-name>')
    .description('Enable server protection')
    .option('--delete', 'Enable delete protection', true)
    .option('--rebuild', 'Enable rebuild protection', false)
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions & { delete?: boolean; rebuild?: boolean }) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.enableServerProtection(id, { delete: options.delete, rebuild: options.rebuild });
        console.log(fmt.success(`Protection enabled for server ${id}.`));
      })
    );

  server
    .command('disable-protection <id-or-name>')
    .description('Disable server protection')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.enableServerProtection(id, { delete: false, rebuild: false });
        console.log(fmt.success(`Protection disabled for server ${id}.`));
      })
    );

  server
    .command('request-console <id-or-name>')
    .description('Request a WebSocket VNC console')
    .action(
      cloudAction(async (client, idOrName: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        const result = await client.requestServerConsole(id);
        console.log(fmt.success('Console ready.'));
        console.log(`WebSocket URL: ${result.wss_url}`);
        console.log(`Password: ${fmt.colorize(result.password, 'yellow')}`);
      })
    );

  server
    .command('attach-to-network <id-or-name>')
    .description('Attach server to a network')
    .requiredOption('--network <network>', 'Network ID')
    .option('--ip <ip>', 'IP address in network')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions & { network: string; ip?: string }) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.attachServerToNetwork(id, parseInt(options.network), options.ip);
        console.log(fmt.success(`Server ${id} attached to network ${options.network}.`));
      })
    );

  server
    .command('detach-from-network <id-or-name>')
    .description('Detach server from a network')
    .requiredOption('--network <network>', 'Network ID')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions & { network: string }) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        await client.detachServerFromNetwork(id, parseInt(options.network));
        console.log(fmt.success(`Server ${id} detached from network ${options.network}.`));
      })
    );

  server
    .command('add-label <id-or-name> <label>')
    .description('Add a label (key=value)')
    .action(
      cloudAction(async (client, idOrName: string, label: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        const srv = await client.getServer(id);
        const [key, value] = label.split('=');
        const labels = { ...srv.labels, [key]: value || '' };
        await client.updateServer(id, { labels });
        console.log(fmt.success(`Label '${key}' added to server ${id}.`));
      })
    );

  server
    .command('remove-label <id-or-name> <key>')
    .description('Remove a label by key')
    .action(
      cloudAction(async (client, idOrName: string, key: string) => {
        const id = await resolveIdOrName(idOrName, 'server', (name) => client.listServers({ name }));
        const srv = await client.getServer(id);
        const labels = Object.fromEntries(Object.entries(srv.labels).filter(([k]) => k !== key));
        await client.updateServer(id, { labels });
        console.log(fmt.success(`Label '${key}' removed from server ${id}.`));
      })
    );
}
