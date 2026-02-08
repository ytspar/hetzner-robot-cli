import type { Command } from 'commander';
import { asyncAction, output, type ActionOptions } from '../../shared/helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as robotFmt from '../formatter.js';

export function registerRdnsCommands(parent: Command): void {
  const rdns = parent.command('rdns').description('Reverse DNS management');

  rdns
    .command('list')
    .alias('ls')
    .description('List all reverse DNS entries')
    .action(
      asyncAction(async (client, options: ActionOptions) => {
        const entries = await client.listRdns();
        output(entries, robotFmt.formatRdnsList, options);
      })
    );

  rdns
    .command('get <ip>')
    .alias('show')
    .description('Get reverse DNS entry for IP')
    .action(
      asyncAction(async (client, ipAddr: string, options: ActionOptions) => {
        const { rdns: entry } = await client.getRdns(ipAddr);
        output(entry, (e) => `IP: ${e.ip}\nPTR: ${e.ptr}`, options);
      })
    );

  rdns
    .command('set <ip> <ptr>')
    .description('Create or update reverse DNS entry')
    .action(
      asyncAction(async (client, ipAddr: string, ptr: string) => {
        try {
          await client.createRdns(ipAddr, ptr);
        } catch {
          await client.updateRdns(ipAddr, ptr);
        }
        console.log(fmt.success(`rDNS set: ${ipAddr} -> ${ptr}`));
      })
    );

  rdns
    .command('delete <ip>')
    .description('Delete reverse DNS entry')
    .action(
      asyncAction(async (client, ipAddr: string) => {
        await client.deleteRdns(ipAddr);
        console.log(fmt.success('rDNS entry deleted.'));
      })
    );
}
