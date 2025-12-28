/**
 * Count contracts by network
 */
function countContractsByNetwork(contracts) {
  return contracts.reduce((counts, contract) => {
    const network = contract.network;
    if (!counts[network]) {
      counts[network] = 0;
    }
    counts[network] = counts[network] + 1;
    return counts;
  }, {});
}

/**
 * Group contracts by network
 */
function groupContractsByNetwork(contracts) {
  return contracts.reduce((groups, contract) => {
    const network = contract.network;
    if (!groups[network]) {
      groups[network] = [];
    }
    groups[network].push(contract);
    return groups;
  }, {});
}

/**
 * Get deployment statistics
 */
function getDeploymentStats(contracts) {
  return contracts.reduce((stats, contract) => {
    stats.total++;
    if (!contract.verified) {
      stats.unverified++;
    } else {
      stats.verified++;
    }
    return stats;
  }, { total: 0, verified: 0, unverified: 0 });
}

module.exports = { 
  countContractsByNetwork, 
  groupContractsByNetwork, 
  getDeploymentStats
};