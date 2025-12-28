/**
 * Sort contracts by name alphabetically
 */
function sortContractsByName(contracts) {
  const sorted = [...contracts]; 
  sorted.sort((a,b) => {
    if(a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  return sorted;
}

/**
 * Sort contracts by deployment date
 */
function sortByDeploymentDate(contracts, order = 'asc') {
  const sorted = [...contracts];
  sorted.sort((a, b) => {
    if (order === 'asc') {
      return a.deployedAt - b.deployedAt;
    }
    if (order === 'desc') {
      return b.deployedAt - a.deployedAt;
    }
    return 0;
  });
  return sorted;
}

module.exports = { sortContractsByName, sortByDeploymentDate };