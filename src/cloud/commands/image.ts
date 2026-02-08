import type { Command } from 'commander';
import { cloudAction, cloudOutput, cloudConfirm, type CloudActionOptions } from '../helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as cloudFmt from '../formatter.js';

export function registerImageCommands(parent: Command): void {
  const image = parent.command('image').description('Image management');

  image.command('list').alias('ls').description('List all images')
    .option('-l, --label-selector <selector>', 'Label selector')
    .option('-s, --sort <field>', 'Sort by field')
    .option('--type <type>', 'Filter by type (system, snapshot, backup, app)')
    .option('--architecture <arch>', 'Filter by architecture (x86, arm)')
    .option('--status <status>', 'Filter by status')
    .action(cloudAction(async (client, options: CloudActionOptions & { labelSelector?: string; sort?: string; type?: string; architecture?: string; status?: string }) => {
      const images = await client.listImages({ label_selector: options.labelSelector, sort: options.sort, type: options.type, architecture: options.architecture, status: options.status });
      cloudOutput(images, cloudFmt.formatImageList, options);
    }));

  image.command('describe <id>').description('Show image details')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      const img = await client.getImage(parseInt(id));
      cloudOutput(img, cloudFmt.formatImageDetails, options);
    }));

  image.command('update <id>').description('Update image')
    .option('--description <desc>', 'New description')
    .option('--type <type>', 'New type (snapshot)')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { description?: string; type?: string }) => {
      await client.updateImage(parseInt(id), { description: options.description, type: options.type });
      console.log(fmt.success(`Image ${id} updated.`));
    }));

  image.command('delete <id>').description('Delete an image')
    .option('-y, --yes', 'Skip confirmation')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      if (!await cloudConfirm(`Delete image ${id}?`, options)) return;
      await client.deleteImage(parseInt(id));
      console.log(fmt.success(`Image ${id} deleted.`));
    }));

  image.command('enable-protection <id>').description('Enable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changeImageProtection(parseInt(id), true);
      console.log(fmt.success(`Protection enabled for image ${id}.`));
    }));

  image.command('disable-protection <id>').description('Disable delete protection')
    .action(cloudAction(async (client, id: string) => {
      await client.changeImageProtection(parseInt(id), false);
      console.log(fmt.success(`Protection disabled for image ${id}.`));
    }));

  image.command('add-label <id> <label>').description('Add a label (key=value)')
    .action(cloudAction(async (client, id: string, label: string) => {
      const img = await client.getImage(parseInt(id));
      const [key, value] = label.split('=');
      await client.updateImage(parseInt(id), { labels: { ...img.labels, [key]: value || '' } });
      console.log(fmt.success(`Label '${key}' added.`));
    }));

  image.command('remove-label <id> <key>').description('Remove a label')
    .action(cloudAction(async (client, id: string, key: string) => {
      const img = await client.getImage(parseInt(id));
      const labels = Object.fromEntries(Object.entries(img.labels).filter(([k]) => k !== key));
      await client.updateImage(parseInt(id), { labels });
      console.log(fmt.success(`Label '${key}' removed.`));
    }));
}
