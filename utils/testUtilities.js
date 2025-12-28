const { readContracts } = require('./fileReader');
const { formatContractsForDisplay } = require('./contractFormatter');
const { filterByNetwork, filterVerified } = require('./contractFilter');
const { getContractByName } = require('./contractLookup');
const { hasVerifiedContracts } = require('./contractValidator');
const { countContractsByNetwork, getDeploymentStats } = require('./contractStats');
const { sortContractsByName } = require('./contractSorter');
const { advancedQuery } = require('./advancedQuery');

async function testAllUtilities() {
  console.log(' Testing all utility functions...\n');
  
  // Read contracts
  const contracts = await readContracts();
  
  // Test formatter
  console.log(' Formatted contracts:');
  console.table(formatContractsForDisplay(contracts));
  
  // Test filter
  console.log('\n Mainnet contracts:');
  console.table(filterByNetwork(contracts, 'mainnet'));
  
  // Test lookup
  console.log('\n Find USDC:');
  console.log(getContractByName(contracts, 'USDC'));
  
  // Test validator
  console.log('\n✅ Has verified contracts?', hasVerifiedContracts(contracts));
  
  // Test stats
  console.log('\n Contracts by network:');
  console.log(countContractsByNetwork(contracts));
  
  console.log('\n Deployment stats:');
  console.log(getDeploymentStats(contracts));
  
  // Test sorter
  console.log('\n Sorted by name:');
  console.table(sortContractsByName(contracts));
  
  // Test advanced query
  console.log('\n Advanced query (mainnet + verified):');
  console.table(advancedQuery(contracts, { 
    network: 'mainnet', 
    verified: true 
  }));
  
  console.log('\n All utilities working!');
}

testAllUtilities();