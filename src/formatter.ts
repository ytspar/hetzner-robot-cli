// Re-export shared formatter utilities
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
  createTable,
  formatJson,
} from './shared/formatter.js';

// Re-export robot-specific formatters for backward compatibility
export {
  formatServerList,
  formatServerDetails,
  formatResetOptions,
  formatResetResult,
  formatBootConfig,
  formatRescueActivation,
  formatLinuxActivation,
  formatIpList,
  formatIpDetails,
  formatSubnetList,
  formatFailoverList,
  formatFailoverSwitch,
  formatRdnsList,
  formatSshKeyList,
  formatSshKeyDetails,
  formatFirewall,
  formatFirewallTemplateList,
  formatVSwitchList,
  formatVSwitchDetails,
  formatStorageBoxList,
  formatStorageBoxDetails,
  formatStorageBoxSnapshots,
  formatStorageBoxSubaccounts,
  formatTraffic,
  formatWolResult,
  formatServerProductList,
  formatServerMarketProductList,
  formatTransactionList,
  formatCancellation,
} from './robot/formatter.js';

// Auction formatters
export {
  formatAuctionList,
  formatAuctionDetails,
} from './auction/formatter.js';
