import type { Command } from 'commander';
import { asyncAction, output, type ActionOptions } from '../../shared/helpers.js';
import * as robotFmt from '../formatter.js';

export function registerTrafficCommands(parent: Command): void {
  const traffic = parent.command('traffic').description('Traffic analytics');

  traffic
    .command('query')
    .description('Query traffic data')
    .option('-i, --ip <ips...>', 'IP addresses to query')
    .option('-s, --subnet <subnets...>', 'Subnets to query')
    .option('--from <date>', 'Start date (YYYY-MM-DD)')
    .option('--to <date>', 'End date (YYYY-MM-DD)')
    .option('-t, --type <type>', 'Query type (day, month, year)', 'month')
    .action(
      asyncAction(async (client, options: ActionOptions & { ip?: string[]; subnet?: string[]; from?: string; to?: string; type?: 'day' | 'month' | 'year' }) => {
        const now = new Date();
        const from = options.from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const to = options.to || now.toISOString().split('T')[0];

        const { traffic: trafficData } = await client.getTraffic(
          options.ip || [],
          options.subnet || [],
          from,
          to,
          options.type as 'day' | 'month' | 'year'
        );

        output(trafficData, robotFmt.formatTraffic, options);
      })
    );
}
