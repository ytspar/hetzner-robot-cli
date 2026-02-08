// ============================================================================
// Hetzner Auction API Client (public, no auth required)
// Endpoint: https://www.hetzner.com/_resources/app/data/app/live_data_sb_EUR.json
// ============================================================================

import type {
  AuctionServer,
  AuctionFilterOptions,
  AuctionResponse,
} from '../types.js';

const AUCTION_BASE_URL = 'https://www.hetzner.com/_resources/app/data/app';

export async function fetchAuctionServers(currency: 'EUR' | 'USD' = 'EUR'): Promise<AuctionResponse> {
  const url = `${AUCTION_BASE_URL}/live_data_sb_${currency}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch auction data: HTTP ${response.status}`);
  }
  return response.json() as Promise<AuctionResponse>;
}

export function filterAuctionServers(
  servers: AuctionServer[],
  filters: AuctionFilterOptions
): AuctionServer[] {
  return servers.filter(s => {
    if (filters.minPrice !== undefined && s.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && s.price > filters.maxPrice) return false;
    if (filters.minRam !== undefined && s.ram_size < filters.minRam) return false;
    if (filters.maxRam !== undefined && s.ram_size > filters.maxRam) return false;
    if (filters.cpu && !s.cpu.toLowerCase().includes(filters.cpu.toLowerCase())) return false;
    if (filters.datacenter && !s.datacenter.toLowerCase().includes(filters.datacenter.toLowerCase())) return false;
    if (filters.minDiskSize !== undefined) {
      const total = [...s.serverDiskData.nvme, ...s.serverDiskData.sata, ...s.serverDiskData.hdd]
        .reduce((sum, d) => sum + d, 0);
      if (total < filters.minDiskSize) return false;
    }
    if (filters.minDiskCount !== undefined && s.hdd_count < filters.minDiskCount) return false;
    if (filters.diskType) {
      if (s.serverDiskData[filters.diskType].length === 0) return false;
    }
    if (filters.ecc !== undefined && s.is_ecc !== filters.ecc) return false;
    if (filters.gpu !== undefined) {
      const hasGpu = s.specials.includes('GPU');
      if (filters.gpu !== hasGpu) return false;
    }
    if (filters.inic !== undefined) {
      const hasInic = s.specials.includes('iNIC');
      if (filters.inic !== hasInic) return false;
    }
    if (filters.fixedPrice !== undefined && s.fixed_price !== filters.fixedPrice) return false;
    if (filters.maxSetupPrice !== undefined && s.setup_price > filters.maxSetupPrice) return false;
    if (filters.minCpuCount !== undefined && s.cpu_count < filters.minCpuCount) return false;
    if (filters.text) {
      const searchText = filters.text.toLowerCase();
      const haystack = s.description.join(' ').toLowerCase();
      if (!haystack.includes(searchText)) return false;
    }
    return true;
  });
}

export function sortAuctionServers(
  servers: AuctionServer[],
  field: string,
  desc: boolean
): AuctionServer[] {
  const sorted = [...servers].sort((a, b) => {
    switch (field) {
      case 'price': return a.price - b.price;
      case 'ram': return a.ram_size - b.ram_size;
      case 'disk': {
        const diskA = [...a.serverDiskData.nvme, ...a.serverDiskData.sata, ...a.serverDiskData.hdd].reduce((sum, d) => sum + d, 0);
        const diskB = [...b.serverDiskData.nvme, ...b.serverDiskData.sata, ...b.serverDiskData.hdd].reduce((sum, d) => sum + d, 0);
        return diskA - diskB;
      }
      case 'cpu': return a.cpu.localeCompare(b.cpu);
      case 'datacenter': return a.datacenter.localeCompare(b.datacenter);
      default: return a.price - b.price;
    }
  });
  return desc ? sorted.reverse() : sorted;
}
