import type { Command } from 'commander';
import { asyncAction, output, confirmAction, type ActionOptions } from '../../shared/helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as robotFmt from '../formatter.js';

export function registerVSwitchCommands(parent: Command): void {
  const vswitch = parent.command('vswitch').description('vSwitch management');

  vswitch
    .command('list')
    .alias('ls')
    .description('List all vSwitches')
    .action(
      asyncAction(async (client, options: ActionOptions) => {
        const vswitches = await client.listVSwitches();
        output(vswitches, robotFmt.formatVSwitchList, options);
      })
    );

  vswitch
    .command('get <id>')
    .alias('show')
    .description('Get vSwitch details')
    .action(
      asyncAction(async (client, vswitchId: string, options: ActionOptions) => {
        const { vswitch: vs } = await client.getVSwitch(parseInt(vswitchId));
        output(vs, robotFmt.formatVSwitchDetails, options);
      })
    );

  vswitch
    .command('create <name> <vlan>')
    .description('Create a new vSwitch')
    .action(
      asyncAction(async (client, name: string, vlan: string) => {
        const { vswitch: vs } = await client.createVSwitch(name, parseInt(vlan));
        console.log(fmt.success(`vSwitch created: ID ${vs.id}`));
      })
    );

  vswitch
    .command('update <id>')
    .description('Update vSwitch')
    .option('-n, --name <name>', 'New name')
    .option('-v, --vlan <vlan>', 'New VLAN ID')
    .action(
      asyncAction(async (client, vswitchId: string, options: { name?: string; vlan?: string }) => {
        await client.updateVSwitch(
          parseInt(vswitchId),
          options.name,
          options.vlan ? parseInt(options.vlan) : undefined
        );
        console.log(fmt.success('vSwitch updated.'));
      })
    );

  vswitch
    .command('delete <id>')
    .alias('rm')
    .description('Delete vSwitch')
    .option('-y, --yes', 'Skip confirmation')
    .option('--date <date>', 'Cancellation date (YYYY-MM-DD)')
    .action(
      asyncAction(async (client, vswitchId: string, options: ActionOptions & { date?: string }) => {
        if (!await confirmAction(`Delete vSwitch ${vswitchId}?`, options)) return;
        await client.deleteVSwitch(parseInt(vswitchId), options.date);
        console.log(fmt.success('vSwitch deleted.'));
      })
    );

  vswitch
    .command('add-server <vswitch-id> <server>')
    .description('Add server to vSwitch')
    .action(
      asyncAction(async (client, vswitchId: string, serverIdOrIp: string) => {
        await client.addServerToVSwitch(parseInt(vswitchId), serverIdOrIp);
        console.log(fmt.success('Server added to vSwitch.'));
      })
    );

  vswitch
    .command('remove-server <vswitch-id> <server>')
    .description('Remove server from vSwitch')
    .action(
      asyncAction(async (client, vswitchId: string, serverIdOrIp: string) => {
        await client.removeServerFromVSwitch(parseInt(vswitchId), serverIdOrIp);
        console.log(fmt.success('Server removed from vSwitch.'));
      })
    );
}
