const fs = require("fs").promises;
const path = require("path");
const chalk = require("chalk");

// ============================================
// BROADCAST PARSING
// ============================================

/**
 * Parse Foundry broadcast file and extract contract deployments
 * Automatically finds and saves ABIs from out/ directory
 *
 * @param {String} fileBroadCastPath - Path to run-latest.json
 * @returns {Array} Array of contract objects ready for registry
 */
async function parseBroadCastInfo(fileBroadCastPath) {
  try {
    const { getNetworkName } = require("./getNetwork");
    const { hasSecurityLeak } = require("./securityCheck");
    const { findLatestAbi } = require("./clinchSync");

    const data = await fs.readFile(fileBroadCastPath, "utf8");
    const broadCastData = JSON.parse(data);

    const contracts = [];

    for (const tx of broadCastData.transactions) {
      if (tx.transactionType === "CREATE" && tx.contractName) {
        const contractName = tx.contractName;
        const fileName = `${contractName}-${tx.contractAddress.slice(0, 6)}.json`;

        // Find and save ABI from Foundry's out/ directory
        const abiData = await findLatestAbi(contractName);
        const parentPath = path.join(process.cwd(), ".clinch", "abis");

        if (abiData) {
          const savePath = path.join(parentPath, fileName);
          await fs.mkdir(parentPath, { recursive: true });
          await fs.writeFile(savePath, JSON.stringify(abiData, null, 2));
        }

        // Build contract object
        const contract = {
          name: tx.contractName,
          address: tx.contractAddress,
          network: getNetworkName(broadCastData.chain),
          abi: `abis/${fileName}`,
          verified: false,
          deployedAt: Math.floor(broadCastData.timestamp / 1000),
        };

        // Add transaction hash if available
        const receipt = broadCastData.receipts.find(
          (r) => r.transactionHash === tx.hash,
        );
        if (receipt) {
          contract.txHash = receipt.transactionHash;
        }

        // Security check before adding
        if (!hasSecurityLeak(contract)) {
          contracts.push(contract);
        } else {
          console.log(
            chalk.red.bold("\n⚠️  SECURITY: Skipped") +
              chalk.red(` "${contract.name}"`),
          );
          console.log(
            chalk.yellow(
              "   Reason: Detected potential private key in broadcast file",
            ),
          );
          console.log(
            chalk.gray(
              "   This is a safety feature to prevent accidental key exposure",
            ),
          );
          console.log(
            chalk.cyan(
              "\n Action: Check your deployment script for hardcoded private keys",
            ),
          );
          console.log(
            chalk.gray(
              "   Use environment variables instead: process.env.PRIVATE_KEY",
            ),
          );
        }
      }
    }

    return contracts;
  } catch (error) {
    console.log(chalk.red("\n❌ Failed to parse Foundry broadcast file"));
    console.log(chalk.gray(`   File: ${fileBroadCastPath}`));

    if (error.message.includes("JSON")) {
      console.log(chalk.yellow("\n📍 Problem: Invalid JSON format"));
      console.log("   The broadcast file may be corrupted or incomplete");
      console.log(chalk.cyan("\n Solutions:"));
      console.log(
        chalk.gray(
          "   1. Re-run your deployment: forge script script/Deploy.s.sol --broadcast",
        ),
      );
      console.log("   2. Check if deployment actually succeeded");
      console.log("   3. Verify the file exists and is not empty");
    } else if (error.code === "ENOENT") {
      console.log(chalk.yellow("\n📍 Problem: File not found"));
      console.log("   The broadcast file doesn't exist at this location");
      console.log(chalk.cyan("\n Solutions:"));
      console.log(
        chalk.gray(
          "   1. Deploy first: forge script script/Deploy.s.sol --broadcast",
        ),
      );
      console.log("   2. Check the path is correct");
      console.log("   3. Run: clinch sync (without path to auto-detect)");
    } else {
      console.log(chalk.yellow(`\n📍 Problem: ${error.message}`));
      console.log(chalk.cyan("\n💡 Try running your Foundry deployment again"));
    }
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  parseBroadCastInfo,
};
