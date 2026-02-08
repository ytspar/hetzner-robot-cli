import type { Command } from 'commander';
import { cloudAction, cloudOutput, cloudConfirm, type CloudActionOptions } from '../helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as cloudFmt from '../formatter.js';

export function registerVolumeCommands(parent: Command): void {
  const volume = parent.command('volume').description('Volume management');

  volume.command('list').alias('ls').description('List all volumes')
    .option('-l, --label-selector <selector>', 'Label selector')
    .option('-s, --sort <field>', 'Sort by field')
    .option('--status <status>', 'Filter by status')
    .action(cloudAction(async (client, options: CloudActionOptions & { labelSelector?: string; sort?: string; status?: string }) => {
      const volumes = await client.listVolumes({ label_selector: options.labelSelector, sort: options.sort, status: options.status });
      cloudOutput(volumes, cloudFmt.formatVolumeList, options);
    }));

  volume.command('describe <id>').description('Show volume details')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      const vol = await client.getVolume(parseInt(id));
      cloudOutput(vol, cloudFmt.formatVolumeDetails, options);
    }));

  volume.command('create').description('Create a volume')
    .requiredOption('--name <name>', 'Volume name')
    .requiredOption('--size <size>', 'Size in GB')
    .option('--location <loc>', 'Location')
    .option('--server <id>', 'Server to attach to')
    .option('--format <format>', 'Filesystem format (ext4, xfs)')
    .option('--automount', 'Auto-mount on server')
    .action(cloudAction(async (client, options: CloudActionOptions & { name: string; size: string; location?: string; server?: string; format?: string; automount?: boolean }) => {
      const { volume: vol } = await client.createVolume({
        name: options.name,
        size: parseInt(options.size),
        location: options.location,
        server: options.server ? parseInt(options.server) : undefined,
        format: options.format,
        automount: options.automount,
      });
      console.log(fmt.success(`Volume '${vol.name}' created (ID: ${vol.id}, ${vol.size} GB)`));
    }));

  volume.command('delete <id>').description('Delete a volume')
    .option('-y, --yes', 'Skip confirmation')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      if (!await cloudConfirm(`Delete volume ${id}?`, options)) return;
      await client.deleteVolume(parseInt(id));
      console.log(fmt.success(`Volume ${id} deleted.`));
    }));

  volume.command('update <id>').description('Update volume')
    .option('--name <name>', 'New name')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { name?: string }) => {
      await client.updateVolume(parseInt(id), { name: options.name });
      console.log(fmt.success(`Volume ${id} updated.`));
    }));

  volume.command('attach <id> <server>').description('Attach volume to server')
    .option('--automount', 'Auto-mount on server')
    .action(cloudAction(async (client, id: string, server: string, options: CloudActionOptions & { automount?: boolean }) => {
      await client.attachVolume(parseInt(id), parseInt(server), options.automount);
      console.log(fmt.success(`Volume ${id} attached to server ${server}.`));
    }));

  volume.command('detach <id>').description('Detach volume from server')
    .action(cloudAction(async (client, id: string) => {
      await client.detachVolume(parseInt(id));
      console.log(fmt.success(`Volume ${id} detached.`));
    }));

  volume.command('resize <id>').description('Resize a volume')
    .requiredOption('--size <size>', 'New size in GB')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { size: string }) => {
      await client.resizeVolume(parseInt(id), parseInt(options.size));
      console.log(fmt.success(`Volume ${id} resized to ${options.size} GB.`));
    }));

  volume.command('enable-protection <id>').description('Enable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changeVolumeProtection(parseInt(id), true);
      console.log(fmt.success(`Protection enabled for volume ${id}.`));
    }));

  volume.command('disable-protection <id>').description('Disable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changeVolumeProtection(parseInt(id), false);
      console.log(fmt.success(`Protection disabled for volume ${id}.`));
    }));

  volume.command('add-label <id> <label>').description('Add a label (key=value)')
    .action(cloudAction(async (client, id: string, label: string) => {
      const vol = await client.getVolume(parseInt(id));
      const [key, value] = label.split('=');
      await client.updateVolume(parseInt(id), { labels: { ...vol.labels, [key]: value || '' } });
      console.log(fmt.success(`Label '${key}' added.`));
    }));

  volume.command('remove-label <id> <key>').description('Remove a label')
    .action(cloudAction(async (client, id: string, key: string) => {
      const vol = await client.getVolume(parseInt(id));
      const labels = Object.fromEntries(Object.entries(vol.labels).filter(([k]) => k !== key));
      await client.updateVolume(parseInt(id), { labels });
      console.log(fmt.success(`Label '${key}' removed.`));
    }));
}
