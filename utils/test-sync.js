const { syncFromFoundry } = require("./clinchSync"); // Adjust path as needed
const fs = require("fs").promises;

async function runTest() {
  // 1. Create a "fake" Foundry broadcast file for testing
  // Inside your runTest script, change the mock object:
  const mockBroadcast = {
    transactions: [
      {
        transactionType: "CREATE",
        contractName: "TestToken",
        contractAddress: "0x9999999999999999999999999999999999999999",
        hash: "0xNEW_HASH",
        transaction: { from: "0xNewDeployer" },
      },
      {
        transactionType: "CREATE",
        contractName: "StableCoin", // NEW CONTRACT
        contractAddress: "0x5555555555555555555555555555555555555555",
        hash: "0xSTABLE_HASH",
        transaction: { from: "0xNewDeployer" },
      },
    ],
    receipts: [
      { transactionHash: "0xNEW_HASH" },
      { transactionHash: "0xSTABLE_HASH" }, // Match the new hash
    ],
    chain: 1,
    timestamp: Date.now(),
  };
  await fs.writeFile(
    "./mock-run-latest.json",
    JSON.stringify(mockBroadcast, null, 2)
  );
  console.log(" Mock broadcast created.");

  // 2. Run the sync!
  try {
    await syncFromFoundry("./mock-run-latest.json");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTest();
