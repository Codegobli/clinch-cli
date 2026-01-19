const fs = require("fs");
const path = require("path");
const { parseBroadCastInfo } = require("./foundryParser");
const { addContract } = require("./fileWriter");
const { triggerGitSync } = require("./gitUtils");

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

  if (syncCount > 0) {
    await triggerGitSync(newContracts);
  }

  console.log(`\n Sync complete! Added ${syncCount} contracts.`);
}

async function findLatestBroadcast() {
  const broadcastDir = path.join(process.cwd(), "broadcast");

  // 1. Check if the broadcast folder even exists
  if (!fs.existsSync(broadcastDir)) return null;

  // 2. Get all script folders (e.g., Deploy.s.sol)
  const scripts = fs.readdirSync(broadcastDir);
  if (scripts.length === 0) return null;

  const firstScript = scripts[0];
  const scriptPath = path.join(broadcastDir, firstScript);

  const chains = fs.readdirSync(scriptPath);
  if (chains.length === 0) return null;

  const firstChain = chains[0];
  const finalPath = path.join(scriptPath, firstChain, "run-latest.json");

  return fs.existsSync(finalPath) ? finalPath : null;
}

async function findLatestAbi(contractName) {
  const expectedAbiPath = path.join(
    "out",
    `${contractName}.sol`,
    `${contractName}.json`
  );

  if (fs.existsSync(expectedAbiPath)) {
    const fileData = JSON.parse(fs.readFileSync(expectedAbiPath, "utf8"));

    return fileData.abi;
  }

  console.warn(
    `⚠️ Could not find artifact for ${contractName} at ${expectedAbiPath}`
  );
  return null;
}

module.exports = { syncFromFoundry, findLatestBroadcast, findLatestAbi };
