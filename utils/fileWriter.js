const fs = require("fs").promises;
const path = require("path");

// ============================================
// CONSTANTS
// ============================================
const CLINCH_DIR = path.join(process.cwd(), ".clinch");
const CONTRACTS_FILE = path.join(CLINCH_DIR, "contracts.json");
const TEMP_FILE = `${CONTRACTS_FILE}.tmp`;

// ============================================
// CORE OPERATIONS
// ============================================

/**
 * Save contracts array to .clinch/contracts.json
 * Uses temp file for atomic writes
 */
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

/**
 * Add a new contract to the registry
 * Handles name/address conflicts and creates aliases
 */
async function addContract(newContract) {
  try {
    const { readContracts } = require("./fileReader");
    let existingContracts = await readContracts();

    if (!existingContracts || !Array.isArray(existingContracts)) {
      existingContracts = [];
    }

    // Clean and normalize input
    const cleanAddress = newContract.address.toLowerCase().trim();
    const cleanName = newContract.name.trim();
    const cleanNetwork = newContract.network.toLowerCase().trim();

    // Check for duplicate names globally
    const nameConflict = existingContracts.find(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase(),
    );

    if (nameConflict) {
      console.log(`\n[Error] The name "${cleanName}" is already taken.`);
      console.log(
        `Info: It currently points to ${nameConflict.address} on ${nameConflict.network}.`,
      );

      const suggestedName = `${cleanName}_${cleanNetwork}`.toUpperCase();
      console.log(`\nSuggestion: Try using a network-specific name:`);
      console.log(
        `  clinch add ${suggestedName} ${cleanAddress} ${cleanNetwork}`,
      );
      return;
    }

    // Check for duplicate addresses on same network (allow aliases)
    const addressConflict = existingContracts.find(
      (c) =>
        c.address.toLowerCase() === cleanAddress &&
        c.network.toLowerCase() === cleanNetwork,
    );

    if (addressConflict) {
      console.log(`\n[Alias Detected]`);
      console.log(
        `  - Address ${cleanAddress} is already registered as "${addressConflict.name}" on ${cleanNetwork}.`,
      );
      console.log(
        `  - Registering "${cleanName}" as a secondary alias for this contract.`,
      );
      console.log(
        `\nNote: You can now use either '${addressConflict.name}' or '${cleanName}' for calls.`,
      );
    }

    // Create final contract object
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
    console.log("\n❌ Failed to add contract");
    console.log(`   Reason: ${error.message}`);
    console.log(`\n Possible fixes:`);
    console.log(`   1. Check if .clinch/ folder exists (run: clinch init)`);
    console.log(`   2. Verify you have write permissions in this directory`);
    console.log(`   3. Check if contracts.json is not corrupted`);
    console.log(`\n Need help? Run: clinch list (to see current contracts)`);
  }
}

/**
 * Update an existing contract's properties
 */
async function updateContract(contractName, updates) {
  try {
    const { readContracts } = require("./fileReader");
    const existingContracts = await readContracts();
    const cleanName = contractName.trim().toLowerCase();

    const index = existingContracts.findIndex(
      (c) => c.name.toLowerCase() === cleanName,
    );

    if (index === -1) {
      console.log(`Contract "${contractName}" not found`);
      return;
    }

    existingContracts[index] = { ...existingContracts[index], ...updates };
    await saveContracts(existingContracts);

    console.log(
      `Success: Contract "${existingContracts[index].name}" updated.`,
    );
  } catch (error) {
    console.log("Error updating contract:", error.message);
    throw error;
  }
}

/**
 * Delete a contract and its ABI file
 */
async function deleteContract(contractName) {
  try {
    const { readContracts } = require("./fileReader");
    const existingContracts = await readContracts();

    const index = existingContracts.findIndex(
      (c) => c.name.toLowerCase() === contractName.toLowerCase(),
    );

    if (index === -1) {
      console.log(`Contract "${contractName}" not found`);
      return;
    }

    const contractToDelete = existingContracts[index];
    const abiRelativePath = contractToDelete.abi;

    // Remove from registry
    existingContracts.splice(index, 1);
    await saveContracts(existingContracts);

    // Delete associated ABI file
    if (abiRelativePath) {
      const fullPath = path.join(CLINCH_DIR, abiRelativePath);

      try {
        await fs.unlink(fullPath);
        console.log(`ABI file "${abiRelativePath}" cleaned up.`);
      } catch (fileErr) {
        console.log(
          `Note: Could not delete ABI file (it may have been moved or already deleted).`,
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
// ABI MANAGEMENT
// ============================================

/**
 * Copy user's ABI file into .clinch/abis/ vault
 * Returns relative path for storage in contracts.json
 */
async function captureAbi(userPath, name, address) {
  try {
    const abiPath = path.resolve(process.cwd(), userPath);
    const vaultDir = path.join(CLINCH_DIR, "abis");
    const fileName = `${name}-${address.slice(0, 6).toLowerCase()}.json`;
    const destinationPath = path.join(vaultDir, fileName);

    await fs.mkdir(vaultDir, { recursive: true });
    await fs.copyFile(abiPath, destinationPath);

    return `abis/${fileName}`;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`\n⚠️  ABI file not found`);
      console.log(`   Looking for: ${userPath}`);
      console.log(`\n Solutions:`);
      console.log(`   1. Compile first: forge build`);
      console.log(`   2. Check the path is correct`);
      console.log(`   3. Contract name should match the file name`);
    } else if (error.code === "EACCES") {
      console.log(`\n⚠️  Permission denied`);
      console.log(`   Cannot access: ${userPath}`);
      console.log(`\n Check file permissions`);
    } else {
      console.log(`\n⚠️  Failed to capture ABI`);
      console.log(`   Reason: ${error.message}`);
      console.log(`   Path: ${userPath}`);
    }
    console.log(`\n   Contract will be added without ABI`);
    console.log(`   You can add it later: clinch update <name> --abi <path>`);
  }
}

// ============================================
// SEARCH & DISPLAY
// ============================================

/**
 * Search and display contracts with filters
 * Shows results in table format
 */
async function findContracts(query, options = {}) {
  try {
    const { readContracts } = require("./fileReader");
    const contracts = await readContracts();

    if (contracts.length === 0) {
      console.log("No contracts found. Add some with: clinch add");
      return;
    }

    let results = contracts;

    // Apply search query filter
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

    // Apply network filter
    if (options.network) {
      results = results.filter((c) => c.network === options.network);
    }

    // Apply verified filter
    if (options.verified !== undefined) {
      results = results.filter((c) => c.verified === options.verified);
    }

    // Handle no results
    if (results.length === 0) {
      console.log("No contracts found matching your search.");
      console.log("\nTry:");
      console.log("  - Different search term");
      console.log("  - Remove filters");
      console.log("  - clinch list (to see all contracts)");
      return;
    }

    // Display table
    console.log(`\nFound ${results.length} contract(s):\n`);

    console.log(
      "┌─────┬──────────────────────┬──────────────────────────────────────────────┬──────────────┬────────────┬─────────────────────────┐",
    );
    console.log(
      "│ No. │ Name                 │ Address                                      │ Network      │ Verified   │ ABI                     │",
    );
    console.log(
      "├─────┼──────────────────────┼──────────────────────────────────────────────┼──────────────┼────────────┼─────────────────────────┤",
    );

    results.forEach((contract, index) => {
      const num = String(index + 1).padEnd(3);
      const name = contract.name.padEnd(20).slice(0, 20);
      const addr = contract.address.padEnd(44);
      const network = contract.network.padEnd(12).slice(0, 12);
      const verified = contract.verified ? "Yes".padEnd(10) : "No".padEnd(10);
      const abi = (contract.abi || "N/A").padEnd(23).slice(0, 23);

      console.log(
        `│ ${num} │ ${name} │ ${addr} │ ${network} │ ${verified} │ ${abi} │`,
      );
    });

    console.log(
      "└─────┴──────────────────────┴──────────────────────────────────────────────┴──────────────┴────────────┴─────────────────────────┘",
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
