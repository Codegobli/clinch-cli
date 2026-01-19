const fs = require("fs").promises;
const path = require("path");

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
        const abiData = await findLatestAbi(contractName);
        const parentPath = path.join(process.cwd(), ".clinch", "abis");
        await fs.mkdir(parentPath, { recursive: true });

        if (abiData) {
          const savePath = path.join(
            process.cwd(),
            ".clinch",
            "abis",
            fileName
          );

          await fs.mkdir(parentPath, { recursive: true });
          await fs.writeFile(savePath, JSON.stringify(abiData, null, 2));
        }
        const contract = {
          name: tx.contractName,
          address: tx.contractAddress,
          network: getNetworkName(broadCastData.chain),
          abi: `.clinch/abis/${fileName}`,
          verified: false,
          deployedAt: Math.floor(broadCastData.timestamp / 1000),
        };

        const receipt = broadCastData.receipts.find(
          (r) => r.transactionHash === tx.hash
        );
        if (receipt) {
          contract.txHash = receipt.transactionHash;
        }

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

module.exports = {
  parseBroadCastInfo,
};
