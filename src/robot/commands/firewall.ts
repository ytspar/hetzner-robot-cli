import type { Command } from 'commander';
import { asyncAction, output, confirmAction, type ActionOptions } from '../../shared/helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as robotFmt from '../formatter.js';

export function registerFirewallCommands(parent: Command): void {
  const firewall = parent.command('firewall').description('Firewall management');

  firewall
    .command('get <server>')
    .alias('show')
    .description('Get firewall configuration')
    .action(
      asyncAction(async (client, serverIdOrIp: string, options: ActionOptions) => {
        const { firewall: fw } = await client.getFirewall(serverIdOrIp);
        output(fw, robotFmt.formatFirewall, options);
      })
    );

  firewall
    .command('enable <server>')
    .description('Enable firewall')
    .action(
      asyncAction(async (client, serverIdOrIp: string) => {
        await client.updateFirewall(serverIdOrIp, 'active');
        console.log(fmt.success('Firewall enabled.'));
      })
    );

  firewall
    .command('disable <server>')
    .description('Disable firewall')
    .action(
      asyncAction(async (client, serverIdOrIp: string) => {
        await client.updateFirewall(serverIdOrIp, 'disabled');
        console.log(fmt.success('Firewall disabled.'));
      })
    );

  firewall
    .command('delete <server>')
    .description('Delete all firewall rules')
    .option('-y, --yes', 'Skip confirmation')
    .action(
      asyncAction(async (client, serverIdOrIp: string, options: ActionOptions) => {
        if (!await confirmAction('Delete all firewall rules?', options)) return;
        await client.deleteFirewall(serverIdOrIp);
        console.log(fmt.success('Firewall rules deleted.'));
      })
    );

  const fwTemplate = firewall.command('template').description('Firewall template management');

  fwTemplate
    .command('list')
    .alias('ls')
    .description('List firewall templates')
    .action(
      asyncAction(async (client, options: ActionOptions) => {
        const templates = await client.listFirewallTemplates();
        output(templates, robotFmt.formatFirewallTemplateList, options);
      })
    );

  fwTemplate
    .command('get <id>')
    .alias('show')
    .description('Get firewall template details')
    .action(
      asyncAction(async (client, templateId: string, options: ActionOptions) => {
        const { firewall_template: tmpl } = await client.getFirewallTemplate(parseInt(templateId));
        output(tmpl, (t) => robotFmt.formatFirewallTemplateList([{ firewall_template: t }]), options);
      })
    );

  fwTemplate
    .command('delete <id>')
    .alias('rm')
    .description('Delete firewall template')
    .option('-y, --yes', 'Skip confirmation')
    .action(
      asyncAction(async (client, templateId: string, options: ActionOptions) => {
        if (!await confirmAction(`Delete firewall template ${templateId}?`, options)) return;
        await client.deleteFirewallTemplate(parseInt(templateId));
        console.log(fmt.success('Firewall template deleted.'));
      })
    );
}
