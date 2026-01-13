function getNetworkName(chainId) {
  const networks = {
    31337: "anvil",
    1: "mainnet",
    42161: "arbitrum",
    11155111: "sepolia",
  };
  return networks[chainId] || `chain-${chainId || "unknown"}`;
}

module.exports = { getNetworkName };
