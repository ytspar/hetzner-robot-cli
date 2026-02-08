import { Command, Option } from 'commander';
import { fetchAuctionServers, filterAuctionServers, sortAuctionServers } from './client.js';
import { formatAuctionList, formatAuctionDetails } from './formatter.js';
import { formatJson, error } from '../shared/formatter.js';
import type { AuctionFilterOptions } from '../types.js';

interface AuctionListOptions {
  minPrice?: string;
  maxPrice?: string;
  minRam?: string;
  maxRam?: string;
  cpu?: string;
  datacenter?: string;
  minDiskSize?: string;
  minDiskCount?: string;
  diskType?: 'nvme' | 'sata' | 'hdd';
  ecc?: boolean;
  gpu?: boolean;
  inic?: boolean;
  fixedPrice?: boolean;
  auctionOnly?: boolean;
  maxSetupPrice?: string;
  minCpuCount?: string;
  search?: string;
  currency?: 'EUR' | 'USD';
  sort?: string;
  desc?: boolean;
  limit?: string;
  json?: boolean;
}

interface AuctionShowOptions {
  currency?: 'EUR' | 'USD';
  json?: boolean;
}

function parseNum(val: string | undefined): number | undefined {
  if (val === undefined) return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

export function registerAuctionCommands(parent: Command): void {
  const auction = parent.command('auction').description('Server auction monitoring (public, no auth required)');

  auction
    .command('list')
    .alias('ls')
    .description('List and filter auction servers')
    .option('--min-price <n>', 'Minimum monthly price in EUR')
    .option('--max-price <n>', 'Maximum monthly price in EUR')
    .option('--min-ram <gb>', 'Minimum RAM in GB')
    .option('--max-ram <gb>', 'Maximum RAM in GB')
    .option('--cpu <text>', 'CPU model substring (e.g. "Ryzen", "i7-6700")')
    .option('--datacenter <text>', 'Datacenter substring (e.g. "FSN", "HEL1-DC2")')
    .option('--min-disk-size <gb>', 'Minimum total disk capacity in GB')
    .option('--min-disk-count <n>', 'Minimum number of drives')
    .addOption(
      new Option('--disk-type <type>', 'Filter by disk type present')
        .choices(['nvme', 'sata', 'hdd'])
    )
    .option('--ecc', 'Only ECC RAM servers')
    .option('--gpu', 'Only GPU servers')
    .option('--inic', 'Only servers with Intel NIC')
    .option('--fixed-price', 'Only fixed-price servers')
    .option('--auction-only', 'Only auction (non-fixed) servers')
    .option('--max-setup-price <n>', 'Maximum setup price in EUR')
    .option('--min-cpu-count <n>', 'Minimum CPU count')
    .option('--search <text>', 'Free-text search across description')
    .addOption(
      new Option('--currency <currency>', 'Price currency')
        .choices(['EUR', 'USD'])
        .default('EUR')
    )
    .addOption(
      new Option('--sort <field>', 'Sort by field')
        .choices(['price', 'ram', 'disk', 'cpu', 'datacenter'])
        .default('price')
    )
    .option('--desc', 'Sort in descending order')
    .option('--limit <n>', 'Limit output rows')
    .action(async (options: AuctionListOptions) => {
      try {
        const { server: servers } = await fetchAuctionServers(options.currency as 'EUR' | 'USD');

        const filters: AuctionFilterOptions = {
          minPrice: parseNum(options.minPrice),
          maxPrice: parseNum(options.maxPrice),
          minRam: parseNum(options.minRam),
          maxRam: parseNum(options.maxRam),
          cpu: options.cpu,
          datacenter: options.datacenter,
          minDiskSize: parseNum(options.minDiskSize),
          minDiskCount: parseNum(options.minDiskCount),
          diskType: options.diskType,
          ecc: options.ecc ? true : undefined,
          gpu: options.gpu ? true : undefined,
          inic: options.inic ? true : undefined,
          fixedPrice: options.fixedPrice ? true : options.auctionOnly ? false : undefined,
          maxSetupPrice: parseNum(options.maxSetupPrice),
          minCpuCount: parseNum(options.minCpuCount),
          text: options.search,
        };

        let filtered = filterAuctionServers(servers, filters);
        filtered = sortAuctionServers(filtered, options.sort || 'price', !!options.desc);

        const limit = parseNum(options.limit);
        if (limit !== undefined && limit > 0) {
          filtered = filtered.slice(0, limit);
        }

        if (options.json) {
          console.log(formatJson(filtered));
        } else {
          console.log(formatAuctionList(filtered));
        }
      } catch (err) {
        console.error(error(err instanceof Error ? err.message : 'Failed to fetch auction data'));
        process.exit(1);
      }
    });

  auction
    .command('show <id>')
    .description('Show detailed info for an auction server')
    .addOption(
      new Option('--currency <currency>', 'Price currency')
        .choices(['EUR', 'USD'])
        .default('EUR')
    )
    .action(async (id: string, options: AuctionShowOptions) => {
      try {
        const serverId = parseInt(id);
        if (isNaN(serverId)) {
          console.error(error('Invalid server ID'));
          process.exit(1);
        }

        const { server: servers } = await fetchAuctionServers(options.currency as 'EUR' | 'USD');
        const server = servers.find(s => s.id === serverId);

        if (!server) {
          console.error(error(`Auction server ${id} not found`));
          process.exit(1);
        }

        if (options.json) {
          console.log(formatJson(server));
        } else {
          console.log(formatAuctionDetails(server));
        }
      } catch (err) {
        console.error(error(err instanceof Error ? err.message : 'Failed to fetch auction data'));
        process.exit(1);
      }
    });
}
