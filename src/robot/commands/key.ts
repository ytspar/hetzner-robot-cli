import type { Command } from 'commander';
import { input } from '@inquirer/prompts';
import { readFileSync } from 'node:fs';
import { asyncAction, output, confirmAction, type ActionOptions } from '../../shared/helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as robotFmt from '../formatter.js';

export function registerKeyCommands(parent: Command): void {
  const key = parent.command('key').alias('keys').description('SSH key management');

  key
    .command('list')
    .alias('ls')
    .description('List all SSH keys')
    .action(
      asyncAction(async (client, options: ActionOptions) => {
        const keys = await client.listSshKeys();
        output(keys, robotFmt.formatSshKeyList, options);
      })
    );

  key
    .command('get <fingerprint>')
    .alias('show')
    .description('Get SSH key details')
    .action(
      asyncAction(async (client, fingerprint: string, options: ActionOptions) => {
        const { key: keyData } = await client.getSshKey(fingerprint);
        output(keyData, robotFmt.formatSshKeyDetails, options);
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
}
