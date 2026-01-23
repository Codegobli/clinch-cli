const fs = require("fs");
const path = require("path");
const { parseBroadCastInfo } = require("./foundryParser");
const { addContract } = require("./fileWriter");
const chalk = require("chalk");

// ============================================
// FOUNDRY SYNC
// ============================================

/**
 * Sync contracts from Foundry broadcast file
 * Parses broadcast JSON, adds contracts to registry
 *
 * @param {String} broadcastPath - Path to run-latest.json
 * @returns {Array} Successfully synced contracts
 */
async function syncFromFoundry(broadcastPath) {
  console.log(chalk.gray(" CLI is currently looking at:"), process.cwd());
  console.log(chalk.bold(" Syncing from Foundry broadcast..."));

  const newContracts = await parseBroadCastInfo(broadcastPath);

  if (newContracts.length === 0) {
    console.log(chalk.yellow("\n No contracts found in this broadcast file"));
    console.log(chalk.cyan("\n This could mean:"));
    console.log("   1. No CREATE transactions in this deployment");
    console.log("   2. Only contract calls (not deployments)");
    console.log("   3. Deployment may have failed");
    console.log(chalk.gray("\n Check your deployment output for errors"));
    return [];
  }

  const syncedContracts = [];
  let syncCount = 0;

  for (const contract of newContracts) {
    try {
      await addContract(contract);
      console.log(
        chalk.green(` ✓ Synced: ${contract.name} (${contract.network})`),
      );
      syncCount++;
      syncedContracts.push(contract);
    } catch (err) {
      console.log(
        chalk.red(` ✗ Failed to sync ${contract.name}:`),
        err.message,
      );
    }
  }

  console.log(
    chalk.green(`\n✅ Sync complete! Added ${syncCount} contract(s).`),
  );
  return syncedContracts;
}

// ============================================
// AUTO-DETECTION
// ============================================

/**
 * Find the latest Foundry broadcast file
 * Searches broadcast/ for run-latest.json files
 *
 * @returns {String|null} Path to run-latest.json or null
 */
async function findLatestBroadcast() {
  const broadcastDir = path.join(process.cwd(), "broadcast");

  // Check if broadcast folder exists
  if (!fs.existsSync(broadcastDir)) {
    console.log(
      chalk.yellow("\n⚠️  No 'broadcast' folder found in current directory"),
    );
    console.log(chalk.gray(` Currently looking in: ${process.cwd()}`));
    console.log(
      chalk.cyan(
        "\n Make sure you're in your Foundry project root, then try again.",
      ),
    );
    return null;
  }

  // Get all script folders (e.g., Deploy.s.sol)
  const scripts = fs.readdirSync(broadcastDir);
  if (scripts.length === 0) {
    console.log(chalk.yellow("\n⚠️  'broadcast' folder is empty"));
    console.log(
      chalk.cyan(" Deploy a contract first:"),
      chalk.gray("forge script script/Deploy.s.sol --broadcast"),
    );
    return null;
  }

  // Use first script folder found
  const firstScript = scripts[0];
  const scriptPath = path.join(broadcastDir, firstScript);

  // Get chain folders (e.g., 31337, 11155111)
  const chains = fs.readdirSync(scriptPath);
  if (chains.length === 0) {
    console.log(`\n⚠️  No chain deployments found in ${firstScript}`);
    return null;
  }

  // Use first chain folder found
  const firstChain = chains[0];
  const finalPath = path.join(scriptPath, firstChain, "run-latest.json");

  if (!fs.existsSync(finalPath)) {
    console.log(
      chalk.yellow(
        `\n⚠️  No run-latest.json found in ${scriptPath}/${firstChain}`,
      ),
    );
    return null;
  }

  return finalPath;
}

/**
 * Find ABI in Foundry's out/ directory
 * Looks for out/ContractName.sol/ContractName.json
 *
 * @param {String} contractName - Name of the contract
 * @returns {Object|null} ABI object or null
 */
async function findLatestAbi(contractName) {
  const expectedAbiPath = path.join(
    "out",
    `${contractName}.sol`,
    `${contractName}.json`,
  );

  if (fs.existsSync(expectedAbiPath)) {
    const fileData = JSON.parse(fs.readFileSync(expectedAbiPath, "utf8"));
    return fileData.abi;
  }

  console.log(chalk.yellow(`\n⚠️  ABI not found for ${contractName}`));
  console.log(chalk.gray(`   Expected location: ${expectedAbiPath}`));
  console.log(
    chalk.cyan("\n This is not critical - contract will sync without ABI"),
  );
  console.log(
    chalk.gray(
      `   To add ABI later: clinch update ${contractName} --abi <path>`,
    ),
  );
  console.log(chalk.gray("   Or compile: forge build"));
  return null;
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  syncFromFoundry,
  findLatestBroadcast,
  findLatestAbi,
};
