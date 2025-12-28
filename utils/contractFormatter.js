/**
 * Formats contracts for CLI display
 */
function formatContractsForDisplay(contracts) {
  return contracts.map((contract) => {
    return {
      name: contract.name,
      shortAddress: contract.address.slice(0, 6) + '...' + contract.address.slice(-4),
      networkBadge: contract.network === 'mainnet' ? 'mainnet' : contract.network,
      verificationBadge: contract.verified ? '✅' : '❌',
    };
  });
}

/**
 * Extracts important metadata from contracts
 */
function extractContractMetadata(contracts) {
  return contracts.map((contract) => {
    return {
      contractName: contract.name,
      primaryNetwork: contract.network,
      isVerified: contract.verified,
      shortAddress: contract.address.slice(0, 6) + '...' + contract.address.slice(-4)
    };
  });
}

module.exports = { formatContractsForDisplay, extractContractMetadata };