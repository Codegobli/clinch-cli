/**
 * Filter contracts by network
 */
function filterByNetwork(contracts, network) {
  return contracts.filter((contract) => contract.network === network);
}

/**
 * Filter verified contracts
 */
function filterVerified(contracts) {
  return contracts.filter((contract) => contract.verified);
}

/**
 * Advanced contract search with multiple criteria
 */
function advancedContractSearch(contracts, criteria) {
  return contracts.filter((contract) => {
    if (criteria.network && contract.network !== criteria.network) {
      return false;
    }
    if (criteria.verified !== undefined && contract.verified !== criteria.verified) {
      return false;
    }
    return true;
  });
}

module.exports = { filterByNetwork, filterVerified, advancedContractSearch };