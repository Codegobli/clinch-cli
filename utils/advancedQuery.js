/**
 * Advanced query with method chaining
 */
function advancedQuery(contracts, options = {}) {
  let result = [...contracts];
  
  if (options.network) {
    result = result.filter(c => c.network === options.network);
  }
  
  if (options.verified !== undefined) {
    result = result.filter(c => c.verified === options.verified);
  }
  
  if (options.sortBy === 'name') {
    result.sort((a,b) => a.name.localeCompare(b.name));
  } else if (options.sortBy === 'date') {
    result.sort((a,b) => a.deployedAt - b.deployedAt);
  }
  
  return result;
}

module.exports = { advancedQuery };