/**
 * Get contract by name
 */
function getContractByName(contracts, name) {
  return contracts.find((contract) => contract.name === name);
}

/**
 * Get contract by address
 */
function getContractByAddress(contracts, address) {
  return contracts.find((contract) => contract.address === address);
}

/**
 * Find index of contract by name
 */
function getContractIndexByName(contracts, name) {
  return contracts.findIndex((contract) => contract.name === name);
}

module.exports = { getContractByName, getContractByAddress, getContractIndexByName };