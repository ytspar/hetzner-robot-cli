import type { Command } from 'commander';
import { cloudAction, cloudOutput, type CloudActionOptions } from '../helpers.js';
import * as cloudFmt from '../formatter.js';

export function registerServerTypeCommands(parent: Command): void {
  const serverType = parent.command('server-type').description('Server type information');

  serverType
    .command('list')
    .alias('ls')
    .description('List all server types')
    .action(
      cloudAction(async (client, options: CloudActionOptions) => {
        const types = await client.listServerTypes();
        cloudOutput(types, cloudFmt.formatServerTypeList, options);
      })
    );

  serverType
    .command('describe <id>')
    .description('Show server type details')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions) => {
        const type = await client.getServerType(parseInt(id));
        cloudOutput(type, cloudFmt.formatServerTypeDetails, options);
      })
    );
}
