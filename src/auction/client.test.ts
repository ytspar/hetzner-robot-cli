import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { filterAuctionServers, sortAuctionServers, fetchAuctionServers } from './client.js';
import type { AuctionServer } from '../types.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeServer(overrides: Partial<AuctionServer> = {}): AuctionServer {
  return {
    id: 1,
    key: 1,
    name: 'SB1',
    description: ['Intel Core i7-6700', '2x SSD 512 GB'],
    information: null,
    cpu: 'Intel Core i7-6700',
    cpu_count: 1,
    is_highio: false,
    is_ecc: false,
    traffic: 'unlimited',
    bandwidth: 1000,
    ram: ['DDR4 32GB'],
    ram_size: 32,
    price: 29.0,
    setup_price: 0,
    hourly_price: 0.0399,
    hdd_arr: ['SSD 512 GB', 'SSD 512 GB'],
    hdd_hr: ['2x SSD 512 GB'],
    hdd_size: 1024,
    hdd_count: 2,
    serverDiskData: {
      nvme: [],
      sata: [512, 512],
      hdd: [],
      general: [],
    },
    datacenter: 'FSN1-DC14',
    datacenter_hr: 'Falkenstein',
    specials: [],
    dist: ['Debian'],
    fixed_price: true,
    next_reduce: 0,
    next_reduce_hr: false,
    next_reduce_timestamp: 0,
    ip_price: { Monthly: 1.3, Hourly: 0.0019, Amount: 1 },
    ...overrides,
  };
}

describe('fetchAuctionServers', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch EUR auction data by default', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ server: [], serverCount: 0 }),
    });

    await fetchAuctionServers();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.hetzner.com/_resources/app/data/app/live_data_sb_EUR.json'
    );
  });

  it('should fetch USD auction data when specified', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ server: [], serverCount: 0 }),
    });

    await fetchAuctionServers('USD');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.hetzner.com/_resources/app/data/app/live_data_sb_USD.json'
    );
  });

  it('should throw on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    await expect(fetchAuctionServers()).rejects.toThrow('Failed to fetch auction data: HTTP 503');
  });
});

describe('filterAuctionServers', () => {
  it('should return all servers with no filters', () => {
    const servers = [makeServer(), makeServer({ id: 2 })];
    const result = filterAuctionServers(servers, {});
    expect(result).toHaveLength(2);
  });

  it('should filter by minPrice', () => {
    const servers = [
      makeServer({ price: 20 }),
      makeServer({ id: 2, price: 50 }),
    ];
    const result = filterAuctionServers(servers, { minPrice: 30 });
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(50);
  });

  it('should filter by maxPrice', () => {
    const servers = [
      makeServer({ price: 20 }),
      makeServer({ id: 2, price: 50 }),
    ];
    const result = filterAuctionServers(servers, { maxPrice: 30 });
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(20);
  });

  it('should filter by minRam and maxRam', () => {
    const servers = [
      makeServer({ ram_size: 16 }),
      makeServer({ id: 2, ram_size: 64 }),
      makeServer({ id: 3, ram_size: 128 }),
    ];
    const result = filterAuctionServers(servers, { minRam: 32, maxRam: 96 });
    expect(result).toHaveLength(1);
    expect(result[0].ram_size).toBe(64);
  });

  it('should filter by cpu substring (case insensitive)', () => {
    const servers = [
      makeServer({ cpu: 'Intel Core i7-6700' }),
      makeServer({ id: 2, cpu: 'AMD Ryzen 5 3600' }),
    ];
    const result = filterAuctionServers(servers, { cpu: 'ryzen' });
    expect(result).toHaveLength(1);
    expect(result[0].cpu).toContain('Ryzen');
  });

  it('should filter by datacenter', () => {
    const servers = [
      makeServer({ datacenter: 'FSN1-DC14' }),
      makeServer({ id: 2, datacenter: 'HEL1-DC2' }),
    ];
    const result = filterAuctionServers(servers, { datacenter: 'HEL' });
    expect(result).toHaveLength(1);
    expect(result[0].datacenter).toBe('HEL1-DC2');
  });

  it('should filter by minDiskSize (total across types)', () => {
    const servers = [
      makeServer({
        serverDiskData: { nvme: [512, 512], sata: [], hdd: [], general: [] },
      }),
      makeServer({
        id: 2,
        serverDiskData: { nvme: [2000, 2000], sata: [], hdd: [], general: [] },
      }),
    ];
    const result = filterAuctionServers(servers, { minDiskSize: 2000 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('should filter by minDiskCount', () => {
    const servers = [
      makeServer({ hdd_count: 2 }),
      makeServer({ id: 2, hdd_count: 4 }),
    ];
    const result = filterAuctionServers(servers, { minDiskCount: 3 });
    expect(result).toHaveLength(1);
    expect(result[0].hdd_count).toBe(4);
  });

  it('should filter by diskType', () => {
    const servers = [
      makeServer({
        serverDiskData: { nvme: [512], sata: [], hdd: [], general: [] },
      }),
      makeServer({
        id: 2,
        serverDiskData: { nvme: [], sata: [1000], hdd: [], general: [] },
      }),
    ];
    const result = filterAuctionServers(servers, { diskType: 'nvme' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('should filter by ecc', () => {
    const servers = [
      makeServer({ is_ecc: false }),
      makeServer({ id: 2, is_ecc: true }),
    ];
    const result = filterAuctionServers(servers, { ecc: true });
    expect(result).toHaveLength(1);
    expect(result[0].is_ecc).toBe(true);
  });

  it('should filter by gpu', () => {
    const servers = [
      makeServer({ specials: [] }),
      makeServer({ id: 2, specials: ['GPU'] }),
    ];
    const result = filterAuctionServers(servers, { gpu: true });
    expect(result).toHaveLength(1);
    expect(result[0].specials).toContain('GPU');
  });

  it('should filter by inic', () => {
    const servers = [
      makeServer({ specials: [] }),
      makeServer({ id: 2, specials: ['iNIC'] }),
    ];
    const result = filterAuctionServers(servers, { inic: true });
    expect(result).toHaveLength(1);
    expect(result[0].specials).toContain('iNIC');
  });

  it('should filter by fixedPrice', () => {
    const servers = [
      makeServer({ fixed_price: true }),
      makeServer({ id: 2, fixed_price: false }),
    ];
    expect(filterAuctionServers(servers, { fixedPrice: true })).toHaveLength(1);
    expect(filterAuctionServers(servers, { fixedPrice: false })).toHaveLength(1);
  });

  it('should filter by maxSetupPrice', () => {
    const servers = [
      makeServer({ setup_price: 0 }),
      makeServer({ id: 2, setup_price: 50 }),
    ];
    const result = filterAuctionServers(servers, { maxSetupPrice: 10 });
    expect(result).toHaveLength(1);
    expect(result[0].setup_price).toBe(0);
  });

  it('should filter by minCpuCount', () => {
    const servers = [
      makeServer({ cpu_count: 1 }),
      makeServer({ id: 2, cpu_count: 2 }),
    ];
    const result = filterAuctionServers(servers, { minCpuCount: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].cpu_count).toBe(2);
  });

  it('should filter by text search', () => {
    const servers = [
      makeServer({ description: ['Intel Core i7-6700', '2x SSD'] }),
      makeServer({ id: 2, description: ['AMD Ryzen 5 3600', '4x NVMe'] }),
    ];
    const result = filterAuctionServers(servers, { text: 'nvme' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('should handle empty server array', () => {
    const result = filterAuctionServers([], { maxPrice: 50 });
    expect(result).toHaveLength(0);
  });

  it('should combine multiple filters', () => {
    const servers = [
      makeServer({ price: 20, ram_size: 32, is_ecc: true }),
      makeServer({ id: 2, price: 40, ram_size: 64, is_ecc: false }),
      makeServer({ id: 3, price: 40, ram_size: 64, is_ecc: true }),
    ];
    const result = filterAuctionServers(servers, {
      minPrice: 30,
      minRam: 48,
      ecc: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });
});

describe('sortAuctionServers', () => {
  const servers = [
    makeServer({ id: 1, price: 30, ram_size: 64, cpu: 'Intel i7' }),
    makeServer({ id: 2, price: 20, ram_size: 32, cpu: 'AMD Ryzen' }),
    makeServer({ id: 3, price: 50, ram_size: 128, cpu: 'Intel i9' }),
  ];

  it('should sort by price ascending', () => {
    const result = sortAuctionServers(servers, 'price', false);
    expect(result.map(s => s.price)).toEqual([20, 30, 50]);
  });

  it('should sort by price descending', () => {
    const result = sortAuctionServers(servers, 'price', true);
    expect(result.map(s => s.price)).toEqual([50, 30, 20]);
  });

  it('should sort by ram', () => {
    const result = sortAuctionServers(servers, 'ram', false);
    expect(result.map(s => s.ram_size)).toEqual([32, 64, 128]);
  });

  it('should sort by cpu alphabetically', () => {
    const result = sortAuctionServers(servers, 'cpu', false);
    expect(result.map(s => s.cpu)).toEqual(['AMD Ryzen', 'Intel i7', 'Intel i9']);
  });

  it('should sort by datacenter', () => {
    const sorted = sortAuctionServers([
      makeServer({ datacenter: 'NBG1' }),
      makeServer({ id: 2, datacenter: 'FSN1' }),
      makeServer({ id: 3, datacenter: 'HEL1' }),
    ], 'datacenter', false);
    expect(sorted.map(s => s.datacenter)).toEqual(['FSN1', 'HEL1', 'NBG1']);
  });

  it('should sort by disk', () => {
    const sorted = sortAuctionServers([
      makeServer({
        id: 1,
        serverDiskData: { nvme: [512], sata: [], hdd: [], general: [] },
      }),
      makeServer({
        id: 2,
        serverDiskData: { nvme: [2000, 2000], sata: [], hdd: [], general: [] },
      }),
      makeServer({
        id: 3,
        serverDiskData: { nvme: [], sata: [256], hdd: [], general: [] },
      }),
    ], 'disk', false);
    expect(sorted.map(s => s.id)).toEqual([3, 1, 2]);
  });

  it('should not mutate the original array', () => {
    const original = [...servers];
    sortAuctionServers(servers, 'price', false);
    expect(servers.map(s => s.id)).toEqual(original.map(s => s.id));
  });

  it('should default to price sort for unknown field', () => {
    const result = sortAuctionServers(servers, 'unknown', false);
    expect(result.map(s => s.price)).toEqual([20, 30, 50]);
  });
});
