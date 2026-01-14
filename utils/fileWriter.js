const fs = require("fs").promises;
const path = require("path");

const CONTRACTS_FILE = path.join(__dirname, "../data/contracts.json");
const TEMP_FILE = `${CONTRACTS_FILE}.tmp`;

// ============================================
// SAVE CONTRACTS
// ============================================
async function saveContracts(contracts) {
  try {
    const dir = path.dirname(CONTRACTS_FILE);
    await fs.mkdir(dir, { recursive: true });

    const jsonString = JSON.stringify(contracts, null, 2);
    await fs.writeFile(TEMP_FILE, jsonString, "utf8");
    await fs.rename(TEMP_FILE, CONTRACTS_FILE);

    console.log(`Contracts saved to: ${CONTRACTS_FILE}`);
  } catch (error) {
    console.log("Error saving contracts:", error.message);
    try {
      await fs.unlink(TEMP_FILE);
    } catch (e) {}
    throw error;
  }
}

// ============================================
// ADD CONTRACT
// ============================================
async function addContract(newContract) {
  try {
    const { readContracts } = require("./fileReader");
    let existingContracts = await readContracts();

    if (!existingContracts || !Array.isArray(existingContracts)) {
      existingContracts = [];
    }

    // Pre-process data
    const cleanAddress = newContract.address.toLowerCase().trim();
    const cleanName = newContract.name.trim();
    const cleanNetwork = newContract.network.toLowerCase().trim();

    // Check for duplicate names
    const nameExistsAnywhere = existingContracts.find(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (nameExistsAnywhere) {
      console.log(`\n[Error] The name "${cleanName}" is already taken.`);
      console.log(
        `Info: It currently points to ${nameExistsAnywhere.address} on ${nameExistsAnywhere.network}.`
      );

      const suggestedName = `${cleanName}_${cleanNetwork}`.toUpperCase();
      console.log(`\nSuggestion: Try using a network-specific name:`);
      console.log(
        `  clinch add ${suggestedName} ${cleanAddress} ${cleanNetwork}`
      );
      return;
    }

    // Check for duplicate addresses on same network
    const addressConflict = existingContracts.find(
      (c) =>
        c.address.toLowerCase() === cleanAddress &&
        c.network.toLowerCase() === cleanNetwork
    );

    if (addressConflict) {
      console.log(`\n[Alias Detected]`);
      console.log(
        `  - Address ${cleanAddress} is already registered as "${addressConflict.name}" on ${cleanNetwork}.`
      );
      console.log(
        `  - Registering "${cleanName}" as a secondary alias for this contract.`
      );
      console.log(
        `\nNote: You can now use either '${addressConflict.name}' or '${cleanName}' for calls.`
      );
    }

    // Create and save contract
    const finalContract = {
      ...newContract,
      name: cleanName,
      address: cleanAddress,
      network: cleanNetwork,
      deployedAt: Math.floor(Date.now() / 1000),
    };

    existingContracts.push(finalContract);
    await saveContracts(existingContracts);

    console.log(`\n[Success] Added "${cleanName}" to the registry.`);
  } catch (error) {
    console.error("\n[Fatal Error] Could not add contract:", error.message);
  }
}

// ============================================
// UPDATE CONTRACT
// ============================================
async function updateContract(contractName, updates) {
  try {
    const { readContracts } = require("./fileReader");
    const existingContracts = await readContracts();
    const cleanName = contractName.trim().toLowerCase();

    const index = existingContracts.findIndex(
      (c) => c.name.toLowerCase() === cleanName
    );

    if (index === -1) {
      console.log(`Contract "${contractName}" not found`);
      return;
    }

    existingContracts[index] = { ...existingContracts[index], ...updates };
    await saveContracts(existingContracts);

    console.log(
      `Success: Contract "${existingContracts[index].name}" updated.`
    );
  } catch (error) {
    console.log("Error updating contract:", error.message);
    throw error;
  }
}

// ============================================
// DELETE CONTRACT
// ============================================
async function deleteContract(contractName) {
  try {
    const { readContracts } = require("./fileReader");
    const existingContracts = await readContracts();

    const index = existingContracts.findIndex(
      (c) => c.name.toLowerCase() === contractName.toLowerCase()
    );

    if (index === -1) {
      console.log(`Contract "${contractName}" not found`);
      return;
    }

    // Get ABI file path before deletion
    const contractToDelete = existingContracts[index];
    const abiRelativePath = contractToDelete.abi;

    // Remove from registry
    existingContracts.splice(index, 1);
    await saveContracts(existingContracts);

    // Delete ABI file if exists
    if (abiRelativePath) {
      const fullPath = path.resolve(__dirname, "../data", abiRelativePath);

      try {
        await fs.unlink(fullPath);
        console.log(`ABI file "${abiRelativePath}" cleaned up.`);
      } catch (fileErr) {
        console.log(
          `Note: Could not delete ABI file (it may have been moved or already deleted).`
        );
      }
    }

    console.log(`Contract "${contractName}" deleted successfully`);
  } catch (error) {
    console.log("Error deleting contract:", error.message);
    throw error;
  }
}

// ============================================
// CAPTURE ABI
// ============================================
async function captureAbi(userPath, name, address) {
  try {
    const abiPath = path.resolve(process.cwd(), userPath);
    const vaultDir = path.join(__dirname, "../data/abis");
    const fileName = `${name}-${address.slice(0, 6).toLowerCase()}.json`;
    const destinationPath = path.join(vaultDir, fileName);

    await fs.mkdir(vaultDir, { recursive: true });
    await fs.copyFile(abiPath, destinationPath);

    return `abis/${fileName}`;
  } catch (error) {
    console.log(`Error capturing ABI: ${error.message}`);
    return null;
  }
}

// ============================================
// FIND CONTRACTS
// ============================================
async function findContracts(query, options = {}) {
  try {
    const { readContracts } = require("./fileReader");
    const contracts = await readContracts();

    if (contracts.length === 0) {
      console.log("No contracts found. Add some with: clinch add");
      return;
    }

    let results = contracts;

    // Filter by query (name or address)
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter((contract) => {
        const nameMatch = contract.name.toLowerCase().includes(lowerQuery);
        const addressMatch = contract.address
          .toLowerCase()
          .includes(lowerQuery);
        return nameMatch || addressMatch;
      });
    }

    // Filter by network
    if (options.network) {
      results = results.filter((c) => c.network === options.network);
    }

    // Filter by verified status
    if (options.verified !== undefined) {
      results = results.filter((c) => c.verified === options.verified);
    }

    // Display results
    if (results.length === 0) {
      console.log("No contracts found matching your search.");
      console.log("\nTry:");
      console.log("  - Different search term");
      console.log("  - Remove filters");
      console.log("  - clinch list (to see all contracts)");
      return;
    }

    console.log(`\nFound ${results.length} contract(s):\n`);

    // Table header
    console.log(
      "┌─────┬──────────────────────┬──────────────────────────────────────────────┬──────────────┬────────────┬─────────────────────────┐"
    );
    console.log(
      "│ No. │ Name                 │ Address                                      │ Network      │ Verified   │ ABI                     │"
    );
    console.log(
      "├─────┼──────────────────────┼──────────────────────────────────────────────┼──────────────┼────────────┼─────────────────────────┤"
    );

    // Table rows
    results.forEach((contract, index) => {
      const num = String(index + 1).padEnd(3);
      const name = contract.name.padEnd(20).slice(0, 20);
      const addr = contract.address.padEnd(44);
      const network = contract.network.padEnd(12).slice(0, 12);
      const verified = contract.verified ? "Yes".padEnd(10) : "No".padEnd(10);
      const abi = (contract.abi || "N/A").padEnd(23).slice(0, 23);

      console.log(
        `│ ${num} │ ${name} │ ${addr} │ ${network} │ ${verified} │ ${abi} │`
      );
    });

    console.log(
      "└─────┴──────────────────────┴──────────────────────────────────────────────┴──────────────┴────────────┴─────────────────────────┘"
    );
    console.log(`\nTotal: ${results.length} contract(s)\n`);
  } catch (error) {
    console.error("Error searching contracts:", error.message);
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  saveContracts,
  addContract,
  updateContract,
  deleteContract,
  captureAbi,
  findContracts,
};
