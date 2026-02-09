import type { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { cloudAction, cloudOutput, cloudConfirm, type CloudActionOptions } from '../helpers.js';
import * as fmt from '../../shared/formatter.js';
import * as cloudFmt from '../formatter.js';

export function registerCertificateCommands(parent: Command): void {
  const cert = parent.command('certificate').description('Certificate management');

  cert.command('list').alias('ls').description('List all certificates')
    .option('-l, --label-selector <selector>', 'Label selector')
    .option('-s, --sort <field>', 'Sort by field')
    .option('--type <type>', 'Filter by type (uploaded, managed)')
    .action(cloudAction(async (client, options: CloudActionOptions & { labelSelector?: string; sort?: string; type?: string }) => {
      const certs = await client.listCertificates({ label_selector: options.labelSelector, sort: options.sort, type: options.type });
      cloudOutput(certs, cloudFmt.formatCertificateList, options);
    }));

  cert.command('describe <id>').description('Show certificate details')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      const certificate = await client.getCertificate(parseInt(id));
      cloudOutput(certificate, cloudFmt.formatCertificateDetails, options);
    }));

  cert.command('create').description('Create a certificate')
    .requiredOption('--name <name>', 'Certificate name')
    .option('--type <type>', 'Certificate type (uploaded, managed)', 'uploaded')
    .option('--cert-file <path>', 'Path to certificate PEM file (for uploaded)')
    .option('--key-file <path>', 'Path to private key PEM file (for uploaded)')
    .option('--domain <domains...>', 'Domain names (for managed)')
    .action(cloudAction(async (client, options: CloudActionOptions & { name: string; type?: string; certFile?: string; keyFile?: string; domain?: string[] }) => {
      const createOpts: { name: string; type?: 'uploaded' | 'managed'; certificate?: string; private_key?: string; domain_names?: string[] } = {
        name: options.name,
        type: options.type as 'uploaded' | 'managed',
      };
      if (options.type === 'managed') {
        if (!options.domain || options.domain.length === 0) {
          console.error(fmt.error('Managed certificates require --domain'));
          process.exit(1);
        }
        createOpts.domain_names = options.domain;
      } else {
        if (!options.certFile || !options.keyFile) {
          console.error(fmt.error('Uploaded certificates require --cert-file and --key-file'));
          process.exit(1);
        }
        createOpts.certificate = readFileSync(options.certFile, 'utf-8');
        createOpts.private_key = readFileSync(options.keyFile, 'utf-8');
      }
      const { certificate: created } = await client.createCertificate(createOpts);
      console.log(fmt.success(`Certificate '${created.name}' created (ID: ${created.id})`));
    }));

  cert.command('delete <id>').description('Delete a certificate')
    .option('-y, --yes', 'Skip confirmation')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions) => {
      if (!await cloudConfirm(`Delete certificate ${id}?`, options)) return;
      await client.deleteCertificate(parseInt(id));
      console.log(fmt.success(`Certificate ${id} deleted.`));
    }));

  cert.command('update <id>').description('Update certificate')
    .option('--name <name>', 'New name')
    .action(cloudAction(async (client, id: string, options: CloudActionOptions & { name?: string }) => {
      await client.updateCertificate(parseInt(id), { name: options.name });
      console.log(fmt.success(`Certificate ${id} updated.`));
    }));

  cert.command('add-label <id> <label>').description('Add a label (key=value)')
    .action(cloudAction(async (client, id: string, label: string) => {
      const certificate = await client.getCertificate(parseInt(id));
      const [key, value] = label.split('=');
      await client.updateCertificate(parseInt(id), { labels: { ...certificate.labels, [key]: value || '' } });
      console.log(fmt.success(`Label '${key}' added.`));
    }));

  cert.command('remove-label <id> <key>').description('Remove a label')
    .action(cloudAction(async (client, id: string, key: string) => {
      const certificate = await client.getCertificate(parseInt(id));
      const labels = Object.fromEntries(Object.entries(certificate.labels).filter(([k]) => k !== key));
      await client.updateCertificate(parseInt(id), { labels });
      console.log(fmt.success(`Label '${key}' removed.`));
    }));
}
