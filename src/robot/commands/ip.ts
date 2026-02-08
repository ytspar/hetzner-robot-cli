import type { Command } from 'commander';
import { asyncAction, output, type ActionOptions } from '../../shared/helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as robotFmt from '../formatter.js';

export function registerIpCommands(parent: Command): void {
  const ip = parent.command('ip').alias('ips').description('IP address management');

  ip.command('list')
    .alias('ls')
    .description('List all IPs')
    .action(
      asyncAction(async (client, options: ActionOptions) => {
        const ips = await client.listIps();
        output(ips, robotFmt.formatIpList, options);
      })
    );

  ip.command('get <ip>')
    .alias('show')
    .description('Get IP details')
    .action(
      asyncAction(async (client, ipAddr: string, options: ActionOptions) => {
        const { ip: ipData } = await client.getIp(ipAddr);
        output(ipData, robotFmt.formatIpDetails, options);
      })
    );

  ip.command('update <ip>')
    .description('Update IP traffic warning settings')
    .option('--warnings <enabled>', 'Enable/disable traffic warnings (true/false)')
    .option('--hourly <mb>', 'Hourly traffic limit in MB')
    .option('--daily <mb>', 'Daily traffic limit in MB')
    .option('--monthly <gb>', 'Monthly traffic limit in GB')
    .action(
      asyncAction(async (client, ipAddr: string, options: { warnings?: string; hourly?: string; daily?: string; monthly?: string }) => {
        await client.updateIp(
          ipAddr,
          options.warnings ? options.warnings === 'true' : undefined,
          options.hourly ? parseInt(options.hourly) : undefined,
          options.daily ? parseInt(options.daily) : undefined,
          options.monthly ? parseInt(options.monthly) : undefined
        );
        console.log(fmt.success(`IP ${ipAddr} updated.`));
      })
    );

  const mac = ip.command('mac').description('MAC address management');

  mac
    .command('get <ip>')
    .description('Get separate MAC address for IP')
    .action(
      asyncAction(async (client, ipAddr: string, options: ActionOptions) => {
        const { mac: macData } = await client.getIpMac(ipAddr);
        output(macData, (m) => `IP: ${m.ip}\nMAC: ${m.mac}`, options);
      })
    );

  mac
    .command('generate <ip>')
    .description('Generate separate MAC address for IP')
    .action(
      asyncAction(async (client, ipAddr: string) => {
        const { mac: macData } = await client.generateIpMac(ipAddr);
        console.log(fmt.success(`Generated MAC: ${macData.mac}`));
      })
    );

  mac
    .command('delete <ip>')
    .description('Delete separate MAC address')
    .action(
      asyncAction(async (client, ipAddr: string) => {
        await client.deleteIpMac(ipAddr);
        console.log(fmt.success('MAC address deleted.'));
      })
    );
}
