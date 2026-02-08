import type { Command } from 'commander';
import { asyncAction, output, confirmAction, type ActionOptions } from '../../shared/helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as robotFmt from '../formatter.js';

export function registerCancelCommands(parent: Command): void {
  const cancel = parent.command('cancel').description('Server cancellation');

  cancel
    .command('status <server>')
    .description('Get cancellation status')
    .action(
      asyncAction(async (client, serverIdOrIp: string, options: ActionOptions) => {
        const { cancellation } = await client.getCancellation(serverIdOrIp);
        output(cancellation, robotFmt.formatCancellation, options);
      })
    );

  cancel
    .command('request <server>')
    .description('Request server cancellation')
    .option('--date <date>', 'Cancellation date (YYYY-MM-DD)')
    .option('--reason <reasons...>', 'Cancellation reasons')
    .option('-y, --yes', 'Skip confirmation')
    .action(
      asyncAction(async (client, serverIdOrIp: string, options: ActionOptions & { date?: string; reason?: string[] }) => {
        if (!options.yes) {
          console.log(fmt.warning('This will cancel your server!'));
        }
        if (!await confirmAction('Are you sure you want to cancel this server?', options)) return;
        const { cancellation } = await client.cancelServer(serverIdOrIp, options.date, options.reason);
        console.log(fmt.success('Cancellation requested.'));
        console.log(robotFmt.formatCancellation(cancellation));
      })
    );

  cancel
    .command('revoke <server>')
    .description('Revoke server cancellation')
    .action(
      asyncAction(async (client, serverIdOrIp: string) => {
        await client.revokeCancellation(serverIdOrIp);
        console.log(fmt.success('Cancellation revoked.'));
      })
    );
}
