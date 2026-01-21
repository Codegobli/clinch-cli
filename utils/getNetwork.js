// ============================================
// NETWORK MAPPING
// Maps chain IDs to human-readable network names
// ============================================

/**
 * Convert chain ID to network name
 *
 * @param {Number} chainId - EVM chain ID from broadcast file
 * @returns {String} Human-readable network name
 *
 * @example
 * getNetworkName(1) // "mainnet"
 * getNetworkName(31337) // "anvil"
 * getNetworkName(999999) // "chain-999999"
 */
function getNetworkName(chainId) {
  const networks = {
    31337: "anvil", // Local Anvil testnet
    1: "mainnet", // Ethereum Mainnet
    42161: "arbitrum", // Arbitrum One
    11155111: "sepolia", // Sepolia Testnet
    10: "optimism", // Optimism Mainnet
    8453: "base", // Base Mainnet
    137: "polygon", // Polygon Mainnet
    5: "goerli", // Goerli Testnet (deprecated)
  };

  return networks[chainId] || `chain-${chainId || "unknown"}`;
}

// ============================================
// EXPORTS
// ============================================
module.exports = { getNetworkName };
