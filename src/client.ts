// Re-export from new location for backward compatibility
export { HetznerRobotClient } from './robot/client.js';

// Auction client (public API, no auth)
export { fetchAuctionServers, filterAuctionServers, sortAuctionServers } from './auction/client.js';
