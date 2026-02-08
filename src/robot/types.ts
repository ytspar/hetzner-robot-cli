// ============================================================================
// Hetzner Robot API Types
// Based on: https://robot.hetzner.com/doc/webservice/en.html
// ============================================================================

// Server Types
export interface Server {
  server_ip: string;
  server_ipv6_net: string;
  server_number: number;
  server_name: string;
  product: string;
  dc: string;
  traffic: string;
  status: 'ready' | 'installing' | 'maintenance';
  cancelled: boolean;
  paid_until: string;
  ip: string[];
  subnet: ServerSubnet[];
}

export interface ServerSubnet {
  ip: string;
  mask: string;
}

export interface ServerDetails extends Server {
  reset: boolean;
  rescue: boolean;
  vnc: boolean;
  windows: boolean;
  plesk: boolean;
  cpanel: boolean;
  wol: boolean;
  hot_swap: boolean;
}

// Cancellation Types
export interface Cancellation {
  server_ip: string;
  server_ipv6_net: string;
  server_number: number;
  server_name: string;
  earliest_cancellation_date: string;
  cancelled: boolean;
  cancellation_date: string | null;
  cancellation_reason: string[] | null;
}

// Reset Types
export type ResetType = 'sw' | 'hw' | 'man' | 'power' | 'power_long';

export interface Reset {
  server_ip: string;
  server_ipv6_net: string;
  server_number: number;
  type: ResetType[];
  operating_status: string;
}

// Boot Types
export interface BootConfig {
  rescue: RescueConfig | null;
  linux: LinuxConfig | null;
  vnc: VncConfig | null;
  windows: WindowsConfig | null;
  plesk: PleskConfig | null;
  cpanel: CpanelConfig | null;
}

interface BaseBootConfig {
  server_ip: string;
  server_ipv6_net: string;
  server_number: number;
  active: boolean;
  password: string | null;
}

export interface RescueConfig extends BaseBootConfig {
  os: string[];
  arch: number[];
  authorized_key: string[];
  host_key: string[];
}

export interface LinuxConfig extends BaseBootConfig {
  dist: string[];
  arch: number[];
  lang: string[];
  authorized_key: string[];
  host_key: string[];
}

export interface VncConfig extends BaseBootConfig {
  dist: string[];
  arch: number[];
  lang: string[];
}

export interface WindowsConfig extends BaseBootConfig {
  dist: string[];
  lang: string[];
}

export interface PleskConfig extends BaseBootConfig {
  dist: string[];
  arch: number[];
  lang: string[];
  hostname: string | null;
}

export interface CpanelConfig extends BaseBootConfig {
  dist: string[];
  arch: number[];
  lang: string[];
  hostname: string | null;
}

// IP Types
export interface IP {
  ip: string;
  server_ip: string;
  server_number: number;
  locked: boolean;
  separate_mac: string | null;
  traffic_warnings: boolean;
  traffic_hourly: number;
  traffic_daily: number;
  traffic_monthly: number;
}

export interface Mac {
  ip: string;
  mac: string;
}

// Subnet Types
export interface Subnet {
  ip: string;
  mask: string;
  gateway: string;
  server_ip: string;
  server_number: number;
  failover: boolean;
  locked: boolean;
  traffic_warnings: boolean;
  traffic_hourly: number;
  traffic_daily: number;
  traffic_monthly: number;
}

// Failover Types
export interface Failover {
  ip: string;
  netmask: string;
  server_ip: string;
  server_number: number;
  active_server_ip: string;
}

// Reverse DNS Types
export interface Rdns {
  ip: string;
  ptr: string;
}

// SSH Key Types
export interface SshKey {
  name: string;
  fingerprint: string;
  type: string;
  size: number;
  data: string;
}

// Firewall Types
export interface Firewall {
  server_ip: string;
  server_number: number;
  status: 'active' | 'disabled' | 'in process';
  filter_ipv6: boolean;
  whitelist_hos: boolean;
  port: 'main' | 'kvm';
  rules: {
    input: FirewallRule[];
    output?: FirewallRule[];
  };
}

export interface FirewallRule {
  ip_version: string;
  name: string;
  dst_ip: string | null;
  dst_port: string | null;
  src_ip: string | null;
  src_port: string | null;
  protocol: string | null;
  tcp_flags: string | null;
  action: 'accept' | 'discard';
}

export interface FirewallTemplate {
  id: number;
  name: string;
  filter_ipv6: boolean;
  whitelist_hos: boolean;
  is_default: boolean;
  rules: {
    input: FirewallRule[];
    output?: FirewallRule[];
  };
}

// vSwitch Types
export interface VSwitch {
  id: number;
  name: string;
  vlan: number;
  cancelled: boolean;
  server: VSwitchServer[];
  subnet: VSwitchSubnet[];
  cloud_network: VSwitchCloudNetwork[];
}

export interface VSwitchServer {
  server_ip: string;
  server_ipv6_net: string;
  server_number: number;
  status: 'ready' | 'in process' | 'failed';
}

export interface VSwitchSubnet {
  ip: string;
  mask: number;
  gateway: string;
}

export interface VSwitchCloudNetwork {
  id: number;
  ip: string;
  mask: number;
  gateway: string;
}

// Storage Box Types
export interface StorageBox {
  id: number;
  login: string;
  name: string;
  product: string;
  cancelled: boolean;
  locked: boolean;
  location: string;
  linked_server: number | null;
  paid_until: string;
  disk_quota: number;
  disk_usage: number;
  disk_usage_data: number;
  disk_usage_snapshots: number;
  webdav: boolean;
  samba: boolean;
  ssh: boolean;
  external_reachability: boolean;
  zfs: boolean;
  server: string;
  host_system: string;
}

export interface StorageBoxSnapshot {
  name: string;
  timestamp: string;
  size: number;
  size_formatted: string;
}

export interface StorageBoxSnapshotPlan {
  status: 'enabled' | 'disabled';
  minute: number;
  hour: number;
  day_of_week: number;
  day_of_month: number;
  max_snapshots: number;
}

export interface StorageBoxSubaccount {
  username: string;
  accountid: string;
  server: string;
  homedirectory: string;
  samba: boolean;
  ssh: boolean;
  external_reachability: boolean;
  webdav: boolean;
  readonly: boolean;
  createtime: string;
  comment: string;
}

// Traffic Types
export interface Traffic {
  ip: string;
  type: 'day' | 'month' | 'year';
  from: string;
  to: string;
  data: TrafficData[];
}

export interface TrafficData {
  in: number;
  out: number;
  sum: number;
  date?: string;
}

// Wake on LAN Types
export interface Wol {
  server_ip: string;
  server_ipv6_net: string;
  server_number: number;
}

// Order Types
export interface ServerProduct {
  id: string;
  name: string;
  description: string[];
  traffic: string;
  dist: string[];
  arch: number[];
  lang: string[];
  location: string[];
  prices: ProductPrice[];
  orderable_addons: string[];
}

export interface ProductPrice {
  location: string;
  price: {
    net: string;
    gross: string;
  };
  price_setup: {
    net: string;
    gross: string;
  };
  price_vat: {
    net: string;
    gross: string;
  };
  price_setup_vat: {
    net: string;
    gross: string;
  };
}

export interface ServerMarketProduct {
  id: number;
  name: string;
  description: string[];
  traffic: string;
  dist: string[];
  arch: number[];
  lang: string[];
  cpu: string;
  cpu_benchmark: number;
  memory_size: number;
  hdd_size: number;
  hdd_text: string;
  hdd_count: number;
  datacenter: string;
  network_speed: string;
  price: string;
  price_setup: string;
  fixed_price: boolean;
  next_reduce: number;
  next_reduce_date: string;
  orderable_addons: string[];
}

export interface ServerTransaction {
  id: string;
  date: string;
  status: 'ready' | 'in process' | 'cancelled';
  server_number: number | null;
  server_ip: string | null;
  authorized_key: string[];
  host_key: string[];
  comment: string;
  product: ServerTransactionProduct;
}

export interface ServerTransactionProduct {
  id: string;
  name: string;
  description: string[];
  traffic: string;
  dist: string;
  arch: number;
  lang: string;
  location: string;
}

// API Response Wrappers
export type ApiResponse<T> = Record<string, T>;

export interface ApiError {
  error: {
    status: number;
    code: string;
    message: string;
  };
}
