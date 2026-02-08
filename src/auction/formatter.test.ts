import { describe, it, expect } from 'vitest';
import { formatAuctionList, formatAuctionDetails } from './formatter.js';
import type { AuctionServer } from '../types.js';

function makeServer(overrides: Partial<AuctionServer> = {}): AuctionServer {
  return {
    id: 12345,
    key: 1,
    name: 'SB12345',
    description: ['Intel Core i7-6700', '2x SSD SATA 512 GB'],
    information: null,
    cpu: 'Intel Core i7-6700',
    cpu_count: 1,
    is_highio: false,
    is_ecc: true,
    traffic: 'unlimited',
    bandwidth: 1000,
    ram: ['DDR4 ECC 32GB'],
    ram_size: 32,
    price: 29.0,
    setup_price: 0,
    hourly_price: 0.0399,
    hdd_arr: ['SSD 512 GB', 'SSD 512 GB'],
    hdd_hr: ['2x SSD SATA 512 GB'],
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
    specials: ['iNIC'],
    dist: ['Debian'],
    fixed_price: true,
    next_reduce: 0,
    next_reduce_hr: false,
    next_reduce_timestamp: 0,
    ip_price: { Monthly: 1.3, Hourly: 0.0019, Amount: 1 },
    ...overrides,
  };
}

describe('formatAuctionList', () => {
  it('should show message for empty list', () => {
    const result = formatAuctionList([]);
    expect(result).toContain('No auction servers found');
  });

  it('should display server data in table', () => {
    const result = formatAuctionList([makeServer()]);

    expect(result).toContain('12345');
    expect(result).toContain('Intel Core i7-6700');
    expect(result).toContain('32 GB');
    expect(result).toContain('ECC');
    expect(result).toContain('FSN1-DC14');
    expect(result).toContain('29.00');
    expect(result).toContain('Free');
    expect(result).toContain('Fixed');
    expect(result).toContain('iNIC');
    expect(result).toContain('1 server(s) found');
  });

  it('should show setup price when non-zero', () => {
    const result = formatAuctionList([makeServer({ setup_price: 49.99 })]);
    expect(result).toContain('49.99');
  });

  it('should show Auction type for non-fixed price', () => {
    const result = formatAuctionList([makeServer({ fixed_price: false, next_reduce: 90 })]);
    expect(result).toContain('Auction');
    expect(result).toContain('1h 30m');
  });

  it('should show disk summary with NVMe', () => {
    const result = formatAuctionList([
      makeServer({
        serverDiskData: { nvme: [512, 512], sata: [], hdd: [], general: [] },
      }),
    ]);
    expect(result).toContain('2x 512 GB NVMe');
  });

  it('should show disk summary with HDD in TB', () => {
    const result = formatAuctionList([
      makeServer({
        serverDiskData: { nvme: [], sata: [], hdd: [4000, 4000], general: [] },
      }),
    ]);
    expect(result).toContain('2x 4 TB HDD');
  });

  it('should show multiple servers', () => {
    const result = formatAuctionList([
      makeServer(),
      makeServer({ id: 54321, cpu: 'AMD Ryzen 5 3600' }),
    ]);
    expect(result).toContain('12345');
    expect(result).toContain('54321');
    expect(result).toContain('2 server(s) found');
  });

  it('should handle servers with no specials', () => {
    const result = formatAuctionList([makeServer({ specials: [] })]);
    // Table should still render with '-' for specials
    expect(result).toContain('12345');
  });
});

describe('formatAuctionDetails', () => {
  it('should display all server properties', () => {
    const result = formatAuctionDetails(makeServer());

    expect(result).toContain('Auction Server 12345');
    expect(result).toContain('SB12345');
    expect(result).toContain('Intel Core i7-6700');
    expect(result).toContain('32 GB');
    expect(result).toContain('(ECC)');
    expect(result).toContain('DDR4 ECC 32GB');
    expect(result).toContain('2x SSD SATA 512 GB');
    expect(result).toContain('1024 GB');
    expect(result).toContain('Falkenstein');
    expect(result).toContain('FSN1-DC14');
    expect(result).toContain('unlimited');
    expect(result).toContain('1000 Mbit/s');
    expect(result).toContain('29.00');
    expect(result).toContain('0.0399');
    expect(result).toContain('Free');
    expect(result).toContain('Fixed');
    expect(result).toContain('iNIC');
    expect(result).toContain('Yes'); // ECC
  });

  it('should show disk breakdown', () => {
    const result = formatAuctionDetails(makeServer({
      serverDiskData: {
        nvme: [512, 512],
        sata: [1000],
        hdd: [4000],
        general: [],
      },
    }));

    expect(result).toContain('Disk Breakdown');
    expect(result).toContain('NVMe');
    expect(result).toContain('512 GB');
    expect(result).toContain('SATA');
    expect(result).toContain('1 TB');
    expect(result).toContain('HDD');
    expect(result).toContain('4 TB');
  });

  it('should show IP pricing', () => {
    const result = formatAuctionDetails(makeServer());

    expect(result).toContain('Additional IP Pricing');
    expect(result).toContain('1.30');
    expect(result).toContain('0.0019');
  });

  it('should show description', () => {
    const result = formatAuctionDetails(makeServer({
      description: ['Intel Core i7-6700', '2x SSD 512 GB'],
    }));

    expect(result).toContain('Description');
    expect(result).toContain('Intel Core i7-6700');
    expect(result).toContain('2x SSD 512 GB');
  });

  it('should show next reduce time for auction servers', () => {
    const result = formatAuctionDetails(makeServer({
      fixed_price: false,
      next_reduce: 45,
    }));

    expect(result).toContain('Auction');
    expect(result).toContain('45m');
  });

  it('should show setup price when non-zero', () => {
    const result = formatAuctionDetails(makeServer({ setup_price: 49.99 }));
    expect(result).toContain('49.99');
  });

  it('should handle server with no specials', () => {
    const result = formatAuctionDetails(makeServer({ specials: [] }));
    expect(result).toContain('None');
  });
});
