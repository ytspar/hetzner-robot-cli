import type { Command } from 'commander';
import { cloudAction, cloudOutput, cloudConfirm, type CloudActionOptions } from '../helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as cloudFmt from '../formatter.js';

export function registerPlacementGroupCommands(parent: Command): void {
  const pg = parent.command('placement-group').description('Placement group management');

  pg.command('list').alias('ls').description('List all placement groups')
    .option('-l, --label-selector <selector>', 'Label selector')
    .option('-s, --sort <field>', 'Sort by field')
    .action(cloudAction(async (client, options: CloudActionOptions & { labelSelector?: string; sort?: string }) => {
      const groups = await client.listPlacementGroups({ label_selector: options.labelSelector, sort: options.sort });
      cloudOutput(groups, cloudFmt.formatPlacementGroupList, options);
    }));

  pg.command('describe <id>').description('Show placement group details')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      const group = await client.getPlacementGroup(parseInt(id));
      cloudOutput(group, cloudFmt.formatPlacementGroupDetails, options);
    }));

  pg.command('create').description('Create a placement group')
    .requiredOption('--name <name>', 'Placement group name')
    .option('--type <type>', 'Placement group type', 'spread')
    .action(cloudAction(async (client, options: CloudActionOptions & { name: string; type?: string }) => {
      const { placement_group: group } = await client.createPlacementGroup({ name: options.name, type: (options.type || 'spread') as 'spread' });
      console.log(fmt.success(`Placement group '${group.name}' created (ID: ${group.id})`));
    }));

  pg.command('delete <id>').description('Delete a placement group')
    .option('-y, --yes', 'Skip confirmation')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      if (!await cloudConfirm(`Delete placement group ${id}?`, options)) return;
      await client.deletePlacementGroup(parseInt(id));
      console.log(fmt.success(`Placement group ${id} deleted.`));
    }));

  pg.command('update <id>').description('Update placement group')
    .option('--name <name>', 'New name')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { name?: string }) => {
      await client.updatePlacementGroup(parseInt(id), { name: options.name });
      console.log(fmt.success(`Placement group ${id} updated.`));
    }));

  pg.command('add-label <id> <label>').description('Add a label (key=value)')
    .action(cloudAction(async (client, id: string, label: string) => {
      const group = await client.getPlacementGroup(parseInt(id));
      const [key, value] = label.split('=');
      await client.updatePlacementGroup(parseInt(id), { labels: { ...group.labels, [key]: value || '' } });
      console.log(fmt.success(`Label '${key}' added.`));
    }));

  pg.command('remove-label <id> <key>').description('Remove a label')
    .action(cloudAction(async (client, id: string, key: string) => {
      const group = await client.getPlacementGroup(parseInt(id));
      const labels = Object.fromEntries(Object.entries(group.labels).filter(([k]) => k !== key));
      await client.updatePlacementGroup(parseInt(id), { labels });
      console.log(fmt.success(`Label '${key}' removed.`));
    }));
}
