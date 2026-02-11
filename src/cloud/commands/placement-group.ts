import type { Command } from 'commander';
import { cloudAction, cloudOutput, cloudConfirm, resolveIdOrName, type CloudActionOptions } from '../helpers.js';
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

  pg.command('describe <id-or-name>').description('Show placement group details')
    .action(cloudAction(async (client, idOrName: string, options: CloudActionOptions) => {
      const id = await resolveIdOrName(idOrName, 'placement group', (name) => client.listPlacementGroups({ name }));
      const group = await client.getPlacementGroup(id);
      cloudOutput(group, cloudFmt.formatPlacementGroupDetails, options);
    }));

  pg.command('create').description('Create a placement group')
    .requiredOption('--name <name>', 'Placement group name')
    .option('--type <type>', 'Placement group type', 'spread')
    .action(cloudAction(async (client, options: CloudActionOptions & { name: string; type?: string }) => {
      const { placement_group: group } = await client.createPlacementGroup({ name: options.name, type: (options.type || 'spread') as 'spread' });
      console.log(fmt.success(`Placement group '${group.name}' created (ID: ${group.id})`));
    }));

  pg.command('delete <id-or-name>').description('Delete a placement group')
    .option('-y, --yes', 'Skip confirmation')
    .action(cloudAction(async (client, idOrName: string, options: CloudActionOptions) => {
      const id = await resolveIdOrName(idOrName, 'placement group', (name) => client.listPlacementGroups({ name }));
      const group = await client.getPlacementGroup(id);
      if (!await cloudConfirm(`Delete placement group '${group.name}' (ID: ${id})?`, options)) return;
      await client.deletePlacementGroup(id);
      console.log(fmt.success(`Placement group '${group.name}' (ID: ${id}) deleted.`));
    }));

  pg.command('update <id-or-name>').description('Update placement group')
    .option('--name <name>', 'New name')
    .action(cloudAction(async (client, idOrName: string, options: CloudActionOptions & { name?: string }) => {
      const id = await resolveIdOrName(idOrName, 'placement group', (name) => client.listPlacementGroups({ name }));
      await client.updatePlacementGroup(id, { name: options.name });
      console.log(fmt.success(`Placement group ${id} updated.`));
    }));

  pg.command('add-label <id-or-name> <label>').description('Add a label (key=value)')
    .action(cloudAction(async (client, idOrName: string, label: string) => {
      const id = await resolveIdOrName(idOrName, 'placement group', (name) => client.listPlacementGroups({ name }));
      const group = await client.getPlacementGroup(id);
      const [key, value] = label.split('=');
      await client.updatePlacementGroup(id, { labels: { ...group.labels, [key]: value || '' } });
      console.log(fmt.success(`Label '${key}' added.`));
    }));

  pg.command('remove-label <id-or-name> <key>').description('Remove a label')
    .action(cloudAction(async (client, idOrName: string, key: string) => {
      const id = await resolveIdOrName(idOrName, 'placement group', (name) => client.listPlacementGroups({ name }));
      const group = await client.getPlacementGroup(id);
      const labels = Object.fromEntries(Object.entries(group.labels).filter(([k]) => k !== key));
      await client.updatePlacementGroup(id, { labels });
      console.log(fmt.success(`Label '${key}' removed.`));
    }));
}
