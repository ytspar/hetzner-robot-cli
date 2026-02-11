import type { Command } from 'commander';
import { cloudAction, cloudOutput, resolveIdOrName, type CloudActionOptions } from '../helpers.js';
import * as cloudFmt from '../formatter.js';

export function registerIsoCommands(parent: Command): void {
  const iso = parent.command('iso').description('ISO image management');

  iso
    .command('list')
    .alias('ls')
    .description('List all ISOs')
    .option('-n, --name <name>', 'Filter by name')
    .option('-a, --architecture <arch>', 'Filter by architecture')
    .action(
      cloudAction(async (client, options: CloudActionOptions & { name?: string; architecture?: string }) => {
        const isos = await client.listIsos({ name: options.name, architecture: options.architecture });
        cloudOutput(isos, cloudFmt.formatIsoList, options);
      })
    );

  iso
    .command('describe <id-or-name>')
    .description('Show ISO details')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions) => {
        const id = await resolveIdOrName(idOrName, 'ISO', (name) => client.listIsos({ name }));
        const iso = await client.getIso(id);
        cloudOutput(iso, cloudFmt.formatIsoDetails, options);
      })
    );
}
