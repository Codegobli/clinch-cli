const { addContract, updateContract, deleteContract } = require("./fileWriter");
const { readContracts } = require("./fileReader");

async function testFileWriter() {
  console.log(" Testing file writer...\n");

  try {
    // Test 1: Add new contract
    console.log(" Test 1: Adding WETH...");
    await addContract({
      name: "WETH",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      network: "mainnet",
      verified: true,
      deployedAt: Math.floor(Date.now() / 1000),
    });

    // Test 2: Read all contracts
    console.log("\n Test 2: Reading all contracts...");
    const contracts = await readContracts();
    console.table(contracts);

    // Test 3: Update WETH
    console.log("\n  Test 3: Updating WETH verification...");
    await updateContract("WETH", { verified: false });

    // Test 4: Read again to see update
    console.log("\n After update:");
    const updated = await readContracts();
    console.table(updated);

    // Test 5: Delete WETH
    console.log("\n🗑️  Test 4: Deleting WETH...");
    await deleteContract("WETH");

    // Test 6: Final read
    console.log("\n After delete:");
    const final = await readContracts();
    console.table(final);

    console.log("\n All tests passed!");
  } catch (error) {
    console.log("\n❌ Test failed:", error.message);
  }
}

testFileWriter();
