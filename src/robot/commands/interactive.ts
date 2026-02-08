import type { Command } from 'commander';
import { select, confirm, checkbox } from '@inquirer/prompts';
import { asyncAction } from '../../shared/helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as robotFmt from '../formatter.js';
import type { ResetType } from '../types.js';

export function registerInteractiveCommands(parent: Command): void {
  parent
    .command('interactive')
    .alias('i')
    .description('Interactive mode for common operations')
    .action(
      asyncAction(async (client) => {
        while (true) {
          const action = await select({
            message: 'What would you like to do?',
            choices: [
              { value: 'servers', name: 'List servers' },
              { value: 'reset', name: 'Reset a server' },
              { value: 'rescue', name: 'Activate rescue mode' },
              { value: 'failover', name: 'Switch failover IP' },
              { value: 'keys', name: 'Manage SSH keys' },
              { value: 'exit', name: 'Exit' },
            ],
            pageSize: 10,
          });

          if (action === 'exit') {
            console.log('Goodbye!');
            break;
          }

          if (action === 'servers') {
            const servers = await client.listServers();
            console.log('');
            console.log(robotFmt.formatServerList(servers));
            console.log('');
          }

          if (action === 'reset') {
            const servers = await client.listServers();
            if (servers.length === 0) {
              console.log(fmt.info('No servers found.'));
              continue;
            }

            const selected = await checkbox({
              message: 'Select servers to reset:',
              choices: servers.map(({ server }) => ({
                value: server.server_ip,
                name: `${server.server_number} - ${server.server_ip} (${server.server_name || 'unnamed'})`,
              })),
            });

            if (selected.length === 0) {
              console.log('No servers selected.');
              continue;
            }

            const resetType = (await select({
              message: 'Select reset type:',
              choices: [
                { value: 'sw', name: 'Software reset (ACPI)' },
                { value: 'hw', name: 'Hardware reset (forced)' },
                { value: 'power', name: 'Power cycle' },
              ],
            })) as ResetType;

            const confirmed = await confirm({
              message: `Reset ${selected.length} server(s) with ${resetType}?`,
              default: false,
            });

            if (confirmed) {
              for (const srv of selected) {
                try {
                  const { reset: rst } = await client.resetServer(srv, resetType);
                  console.log(robotFmt.formatResetResult(rst, resetType));
                } catch (error) {
                  console.log(fmt.error(`Failed to reset ${srv}: ${error instanceof Error ? error.message : 'Unknown'}`));
                }
              }
            }
          }

          if (action === 'rescue') {
            const servers = await client.listServers();
            if (servers.length === 0) {
              console.log(fmt.info('No servers found.'));
              continue;
            }

            const serverIp = await select({
              message: 'Select server:',
              choices: servers.map(({ server }) => ({
                value: server.server_ip,
                name: `${server.server_number} - ${server.server_ip} (${server.server_name || 'unnamed'})`,
              })),
            });

            const os = await select({
              message: 'Select rescue OS:',
              choices: [
                { value: 'linux', name: 'Linux (64-bit)' },
                { value: 'linuxold', name: 'Linux (32-bit)' },
                { value: 'vkvm', name: 'vKVM' },
              ],
            });

            const { rescue } = await client.activateRescue(serverIp, os, 64);
            console.log('');
            console.log(robotFmt.formatRescueActivation(rescue));
          }

          if (action === 'failover') {
            const failovers = await client.listFailovers();
            if (failovers.length === 0) {
              console.log(fmt.info('No failover IPs found.'));
              continue;
            }

            const failoverIp = await select({
              message: 'Select failover IP:',
              choices: failovers.map(({ failover }) => ({
                value: failover.ip,
                name: `${failover.ip} -> ${failover.active_server_ip}`,
              })),
            });

            const servers = await client.listServers();
            const targetIp = await select({
              message: 'Route to server:',
              choices: servers.map(({ server }) => ({
                value: server.server_ip,
                name: `${server.server_number} - ${server.server_ip}`,
              })),
            });

            const { failover: fo } = await client.switchFailover(failoverIp, targetIp);
            console.log('');
            console.log(robotFmt.formatFailoverSwitch(fo));
          }

          if (action === 'keys') {
            const keys = await client.listSshKeys();
            console.log('');
            console.log(robotFmt.formatSshKeyList(keys));
            console.log('');
          }

          console.log('');
        }
      })
    );
}
