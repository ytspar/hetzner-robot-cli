import type { Command } from 'commander';
import { readFileSync } from 'fs';
import { cloudAction, cloudOutput, cloudConfirm, type CloudActionOptions } from '../helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as cloudFmt from '../formatter.js';

export function registerCloudSshKeyCommands(parent: Command): void {
  const sshKey = parent.command('ssh-key').description('SSH key management');

  sshKey.command('list').alias('ls').description('List all SSH keys')
    .option('-l, --label-selector <selector>', 'Label selector')
    .option('-s, --sort <field>', 'Sort by field')
    .action(cloudAction(async (client, options: CloudActionOptions & { labelSelector?: string; sort?: string }) => {
      const keys = await client.listSshKeys({ label_selector: options.labelSelector, sort: options.sort });
      cloudOutput(keys, cloudFmt.formatCloudSshKeyList, options);
    }));

  sshKey.command('describe <id>').description('Show SSH key details')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      const key = await client.getSshKey(parseInt(id));
      cloudOutput(key, cloudFmt.formatCloudSshKeyDetails, options);
    }));

  sshKey.command('create').description('Create an SSH key')
    .requiredOption('--name <name>', 'Key name')
    .option('--public-key <key>', 'Public key string')
    .option('--public-key-from-file <path>', 'Read public key from file')
    .action(cloudAction(async (client, options: CloudActionOptions & { name: string; publicKey?: string; publicKeyFromFile?: string }) => {
      let pubKey = options.publicKey;
      if (options.publicKeyFromFile) {
        pubKey = readFileSync(options.publicKeyFromFile, 'utf-8').trim();
      }
      if (!pubKey) {
        console.error(fmt.error('Provide --public-key or --public-key-from-file'));
        process.exit(1);
      }
      const { ssh_key: key } = await client.createSshKey({ name: options.name, public_key: pubKey });
      console.log(fmt.success(`SSH key '${key.name}' created (ID: ${key.id})`));
    }));

  sshKey.command('delete <id>').description('Delete an SSH key')
    .option('-y, --yes', 'Skip confirmation')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      if (!await cloudConfirm(`Delete SSH key ${id}?`, options)) return;
      await client.deleteSshKey(parseInt(id));
      console.log(fmt.success(`SSH key ${id} deleted.`));
    }));

  sshKey.command('update <id>').description('Update SSH key')
    .option('--name <name>', 'New name')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { name?: string }) => {
      await client.updateSshKey(parseInt(id), { name: options.name });
      console.log(fmt.success(`SSH key ${id} updated.`));
    }));

  sshKey.command('add-label <id> <label>').description('Add a label (key=value)')
    .action(cloudAction(async (client, id: string, label: string) => {
      const key = await client.getSshKey(parseInt(id));
      const [k, v] = label.split('=');
      await client.updateSshKey(parseInt(id), { labels: { ...key.labels, [k]: v || '' } });
      console.log(fmt.success(`Label '${k}' added.`));
    }));

  sshKey.command('remove-label <id> <key>').description('Remove a label')
    .action(cloudAction(async (client, id: string, key: string) => {
      const sshKeyData = await client.getSshKey(parseInt(id));
      const labels = Object.fromEntries(Object.entries(sshKeyData.labels).filter(([k]) => k !== key));
      await client.updateSshKey(parseInt(id), { labels });
      console.log(fmt.success(`Label '${key}' removed.`));
    }));
}
