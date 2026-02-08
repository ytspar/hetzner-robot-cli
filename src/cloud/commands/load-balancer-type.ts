import type { Command } from 'commander';
import { cloudAction, cloudOutput, type CloudActionOptions } from '../helpers.js';
import * as cloudFmt from '../formatter.js';

export function registerLoadBalancerTypeCommands(parent: Command): void {
  const lbType = parent.command('load-balancer-type').description('Load balancer type information');

  lbType
    .command('list')
    .alias('ls')
    .description('List all load balancer types')
    .action(
      cloudAction(async (client, options: CloudActionOptions) => {
        const types = await client.listLoadBalancerTypes();
        cloudOutput(types, cloudFmt.formatLoadBalancerTypeList, options);
      })
    );

  lbType
    .command('describe <id>')
    .description('Show load balancer type details')
    .action(
      cloudAction(async (client, id: string, options: CloudActionOptions) => {
        const type = await client.getLoadBalancerType(parseInt(id));
        cloudOutput(type, cloudFmt.formatLoadBalancerTypeDetails, options);
      })
    );
}
