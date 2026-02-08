// ============================================================================
// Hetzner CLI - Main Library Export
// ============================================================================

// Robot Client
export { HetznerRobotClient } from './robot/client.js';

// Auction Client
export { fetchAuctionServers, filterAuctionServers, sortAuctionServers } from './auction/client.js';

// Auction Types
export type {
  AuctionServer,
  AuctionDiskData,
  AuctionIpPrice,
  AuctionFilterOptions,
  AuctionResponse,
} from './types.js';

// Robot Types
export type {
  // Server
  Server,
  ServerSubnet,
  ServerDetails,

  // Cancellation
  Cancellation,

  // Reset
  ResetType,
  Reset,

  // Boot
  BootConfig,
  RescueConfig,
  LinuxConfig,
  VncConfig,
  WindowsConfig,
  PleskConfig,
  CpanelConfig,

  // IP
  IP,
  Mac,

  // Subnet
  Subnet,

  // Failover
  Failover,

  // Reverse DNS
  Rdns,

  // SSH Keys
  SshKey,

  // Firewall
  Firewall,
  FirewallRule,
  FirewallTemplate,

  // vSwitch
  VSwitch,
  VSwitchServer,
  VSwitchSubnet,
  VSwitchCloudNetwork,

  // Storage Box
  StorageBox,
  StorageBoxSnapshot,
  StorageBoxSnapshotPlan,
  StorageBoxSubaccount,

  // Traffic
  Traffic,
  TrafficData,

  // Wake on LAN
  Wol,

  // Ordering
  ServerProduct,
  ProductPrice,
  ServerMarketProduct,
  ServerTransaction,
  ServerTransactionProduct,

  // API
  ApiResponse,
  ApiError,
} from './robot/types.js';

// Configuration utilities (for CLI integration)
export {
  loadConfig,
  saveConfig,
  clearConfig,
  getCredentials,
  hasCredentials,
  promptLogin,
  requireCredentials,
  type Config,
} from './shared/config.js';

// Formatter utilities (for custom output)
export {
  colors,
  colorize,
  success,
  error,
  warning,
  info,
  heading,
  formatStatus,
  formatBytes,
  formatDate,
  formatDateTime,
  formatJson,
} from './shared/formatter.js';
