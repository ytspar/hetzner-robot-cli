import type { Command } from 'commander';
import { asyncAction, output, type ActionOptions } from '../../shared/helpers.js';
import * as robotFmt from '../formatter.js';

export function registerSubnetCommands(parent: Command): void {
  const subnet = parent.command('subnet').alias('subnets').description('Subnet management');

  subnet
    .command('list')
    .alias('ls')
    .description('List all subnets')
    .action(
      asyncAction(async (client, options: ActionOptions) => {
        const subnets = await client.listSubnets();
        output(subnets, robotFmt.formatSubnetList, options);
      })
    );

  subnet
    .command('get <subnet>')
    .alias('show')
    .description('Get subnet details')
    .action(
      asyncAction(async (client, netIp: string, options: ActionOptions) => {
        const { subnet: subnetData } = await client.getSubnet(netIp);
        output(subnetData, (s) => robotFmt.formatSubnetList([{ subnet: s }]), options);
      })
    );
}
