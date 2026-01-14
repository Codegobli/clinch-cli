const path = require("path");
const { parseBroadCastInfo } = require("./foundryParser");
const { addContract } = require("./fileWriter");

async function syncFromFoundry(broadcastPath) {
  console.log("🔍Syncing from Foundry broadcast...");

  const newContracts = await parseBroadCastInfo(broadcastPath);

  if (newContracts.length === 0) {
    console.log("No new contracts found in this broadcast.");
    return;
  }

  let syncCount = 0;
  for (const contract of newContracts) {
    try {
      await addContract(contract);
      console.log(` Synced: ${contract.name} (${contract.network})`);
      syncCount++;
    } catch (err) {
      console.error(` Failed to sync ${contract.name}:`, err.message);
    }
  }

  console.log(`\n Sync complete! Added ${syncCount} contracts.`);
}

module.exports = { syncFromFoundry };
