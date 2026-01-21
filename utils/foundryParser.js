const fs = require("fs").promises;
const path = require("path");

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
          console.warn(`Skipping ${contract.name} due to security concerns.`);
        }
      }
    }

    return contracts;
  } catch (error) {
    console.error("Error parsing broadcast:", error.message);
    return [];
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  parseBroadCastInfo,
};
