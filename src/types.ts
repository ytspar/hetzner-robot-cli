// Re-export from new location for backward compatibility
export type {
  Server,
  ServerSubnet,
  ServerDetails,
  Cancellation,
  ResetType,
  Reset,
  BootConfig,
  RescueConfig,
  LinuxConfig,
  VncConfig,
  WindowsConfig,
  PleskConfig,
  CpanelConfig,
  IP,
  Mac,
  Subnet,
  Failover,
  Rdns,
  SshKey,
  Firewall,
  FirewallRule,
  FirewallTemplate,
  VSwitch,
  VSwitchServer,
  VSwitchSubnet,
  VSwitchCloudNetwork,
  StorageBox,
  StorageBoxSnapshot,
  StorageBoxSnapshotPlan,
  StorageBoxSubaccount,
  Traffic,
  TrafficData,
  Wol,
  ServerProduct,
  ProductPrice,
  ServerMarketProduct,
  ServerTransaction,
  ServerTransactionProduct,
  ApiResponse,
  ApiError,
} from './robot/types.js';

// Auction Types (public API: https://www.hetzner.com/_resources/app/data/app/live_data_sb_EUR.json)

export interface AuctionDiskData {
  nvme: number[];
  sata: number[];
  hdd: number[];
  general: number[];
}

export interface AuctionIpPrice {
  Monthly: number;
  Hourly: number;
  Amount: number;
}

export interface AuctionServer {
  id: number;
  key: number;
  name: string;
  description: string[];
  information: string[] | null;
  cpu: string;
  cpu_count: number;
  is_highio: boolean;
  is_ecc: boolean;
  traffic: string;
  bandwidth: number;
  ram: string[];
  ram_size: number;
  price: number;
  setup_price: number;
  hourly_price: number;
  hdd_arr: string[];
  hdd_hr: string[];
  hdd_size: number;
  hdd_count: number;
  serverDiskData: AuctionDiskData;
  datacenter: string;
  datacenter_hr: string;
  specials: string[];
  dist: string[];
  fixed_price: boolean;
  next_reduce: number;
  next_reduce_hr: boolean;
  next_reduce_timestamp: number;
  ip_price: AuctionIpPrice;
  category?: string;
  cat_id?: number;
}

export interface AuctionFilterOptions {
  minPrice?: number;
  maxPrice?: number;
  maxHourlyPrice?: number;
  minRam?: number;
  maxRam?: number;
  cpu?: string;
  datacenter?: string;
  minDiskSize?: number;
  maxDiskSize?: number;
  minDiskCount?: number;
  maxDiskCount?: number;
  diskType?: 'nvme' | 'sata' | 'hdd';
  ecc?: boolean;
  gpu?: boolean;
  inic?: boolean;
  highio?: boolean;
  specials?: string;
  fixedPrice?: boolean;
  maxSetupPrice?: number;
  minCpuCount?: number;
  maxCpuCount?: number;
  minBandwidth?: number;
  text?: string;
}

export interface AuctionResponse {
  server: AuctionServer[];
  serverCount: number;
}
