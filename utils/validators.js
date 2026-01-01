/**
 * Check if valid Ethereum address
 */
function isValidAddress(address) {
  if (!address) return false;

  const cleanAddress = address.trim();
  // Must start with 0x and be 42 hex characters
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if valid network
 */
function isValidNetwork(network) {
  const validNetworks = [
    "mainnet",
    "sepolia",
    "goerli",
    "arbitrum",
    "optimism",
    "base",
  ];
  return validNetworks.includes(network.toLowerCase());
}

module.exports = {
  isValidAddress,
  isValidNetwork,
};
