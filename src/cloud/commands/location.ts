import type { Command } from 'commander';
import { cloudAction, cloudOutput, resolveIdOrName, type CloudActionOptions } from '../helpers.js';
import * as cloudFmt from '../formatter.js';

export function registerLocationCommands(parent: Command): void {
  const location = parent.command('location').description('Location information');

  location
    .command('list')
    .alias('ls')
    .description('List all locations')
    .action(
      cloudAction(async (client, options: CloudActionOptions) => {
        const locations = await client.listLocations();
        cloudOutput(locations, cloudFmt.formatLocationList, options);
      })
    );

  location
    .command('describe <id-or-name>')
    .description('Show location details')
    .action(
      cloudAction(async (client, idOrName: string, options: CloudActionOptions) => {
        const id = await resolveIdOrName(idOrName, 'location', (name) => client.listLocations({ name }));
        const location = await client.getLocation(id);
        cloudOutput(location, cloudFmt.formatLocationDetails, options);
      })
    );
}
