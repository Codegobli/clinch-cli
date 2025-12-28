/**
 * Check if there are any verified contracts
 */
function hasVerifiedContracts(contracts) {
  return contracts.some(contract => contract.verified);
}

/**
 * Check if all contracts are valid (have name and address)
 */
function allContractsValid(contracts) {
  return contracts.every((contract) => contract.name && contract.address);
}

/**
 * Check if there are any contracts on a specific network
 */
function hasContractsOnNetwork(contracts, network) {
  return contracts.some(contract => contract.network === network);
}

/**
 * Check if all contracts are verified
 */
function allContractsVerified(contracts) {
  return contracts.every(contract => contract.verified);
}

module.exports = { 
  hasVerifiedContracts, 
  allContractsValid, 
  hasContractsOnNetwork,
  allContractsVerified 
};