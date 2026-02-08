import type { Command } from 'commander';
import { cloudAction, cloudOutput, type CloudActionOptions } from '../helpers.js';
import * as cloudFmt from '../formatter.js';

export function registerDatacenterCommands(parent: Command): void {
  const datacenter = parent.command('datacenter').description('Datacenter information');

  datacenter
    .command('list')
    .alias('ls')
    .description('List all datacenters')
    .action(
      cloudAction(async (client, options: CloudActionOptions) => {
        const datacenters = await client.listDatacenters();
        cloudOutput(datacenters, cloudFmt.formatDatacenterList, options);
      })
    );

  datacenter
    .command('describe <id>')
    .description('Show datacenter details')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions) => {
        const datacenter = await client.getDatacenter(parseInt(id));
        cloudOutput(datacenter, cloudFmt.formatDatacenterDetails, options);
      })
    );
}
