// ============================================================================
// Hetzner Robot API - Main Library Export
// ============================================================================

// Client
export { HetznerRobotClient } from './client.js';

// Types
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
} from './types.js';

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
} from './config.js';

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
} from './formatter.js';
