const inquirer = require("inquirer");
const fs = require("fs").promises;
const path = require("path");

// Path to contracts file
const CONTRACTS_FILE = path.join(__dirname, "../data/contracts.json");
const TEMP_FILE = `${CONTRACTS_FILE}.tmp`;
const ABI_DIRECTORY = path.join(__dirname, "../data/abis");

/**
 * Save contracts array to file
 * @param {Array} contracts - Array of contract objects
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
 * @param {Object} newContract - { name, address, network, abi }
 */
async function addContract(newContract) {
  try {
    const { readContracts } = require("./fileReader");
    const existingContracts = await readContracts();

    // --- 0. PRE-PROCESS DATA ---
    const cleanAddress = newContract.address.toLowerCase().trim();
    const cleanName = newContract.name.trim();
    const cleanNetwork = newContract.network.toLowerCase().trim();

    // --- 1. GLOBAL NAME GUARD ---
    // Names must be unique across the entire registry to avoid command ambiguity
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

    // --- 2. ADDRESS GUARD (Network Specific) ---
    // Check if this address already exists on this specific network
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

    // --- 3. FINALIZATION ---
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

/**
 * Update an existing contract
 * @param {string} contractName - Name of contract to update
 * @param {Object} updates - Object with properties to update
 */
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

/**
 * Delete a contract
 * @param {string} contractName - Name of contract to delete
 */
/**
 * Delete a contract and its associated ABI file
 * @param {string} contractName - Name of contract to delete
 */
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

    // 1. Identify the ABI file before removing the record
    const contractToDelete = existingContracts[index];
    const abiRelativePath = contractToDelete.abi;

    // 2. Remove the record from the array
    existingContracts.splice(index, 1);

    // 3. Save the updated registry
    await saveContracts(existingContracts);

    // 4. Physical Cleanup: Delete the ABI file if it exists
    if (abiRelativePath) {
      // Resolve path relative to your data folder
      const fullPath = path.resolve(__dirname, "../data", abiRelativePath);

      try {
        await fs.unlink(fullPath);
        console.log(`ABI file "${abiRelativePath}" cleaned up.`);
      } catch (fileErr) {
        // If the file was already missing, we don't want to crash the whole process
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

/**
 * Copies a user's ABI file into the local Clinch vault.
 * @param {string} userPath - The path provided by the user (e.g., ./out/Contract.json)
 * @param {string} name - Contract name for the filename
 * @param {string} address - Contract address for unique identification
 * @returns {string|null} - The relative path to the saved ABI or null if it fails
 */

async function captureAbi(userPath, name, address) {
  try {
    const abiPath = path.resolve(process.cwd(), userPath);

    // 2. Define the destination vault directory
    const vaultDir = path.join(__dirname, "../data/abis");

    // 3. Create a unique filename to prevent collisions
    const fileName = `${name}-${address.slice(0, 6).toLowerCase()}.json`;
    const destinationPath = path.join(vaultDir, fileName);

    // 4. Ensure the vault directory exists (creates it if missing)
    await fs.mkdir(vaultDir, { recursive: true });

    // 5. Physically copy the file
    await fs.copyFile(abiPath, destinationPath);

    // 6. Return the relative path to be stored in contracts.json
    return `abis/${fileName}`;
  } catch (error) {
    console.log(`\x1b[31mError capturing ABI:\x1b[0m ${error.message}`);
    return null;
  }
}

/**
 * Search contracts by name or address
 * @param {string} query - Search term
 * @param {Object} options - Filter options
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

    // Filter by search query (name or address)
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
      console.log("❌ No contracts found matching your search.");
      console.log("\nTry:");
      console.log("  - Different search term");
      console.log("  - Remove filters");
      console.log("  - clinch list (to see all contracts)");
      return;
    }

    console.log(`\n✅ Found ${results.length} contract(s):\n`);

    // Format results
    results.forEach((contract, index) => {
      const verified = contract.verified ? "[Verified]" : "[Not Verified]";
      const shortAddr = contract.address.slice(0, 10) + "...";

      console.log(`${index + 1}. ${verified} ${contract.name}`);
      console.log(`   Address: ${shortAddr}`);
      console.log(`   Network: ${contract.network}`);
      console.log("");
    });

    console.log(`Total: ${results.length} contract(s)\n`);
  } catch (error) {
    console.error("Error searching contracts:", error.message);
  }
}

module.exports = {
  saveContracts,
  addContract,
  updateContract,
  deleteContract,
  captureAbi,
  findContracts,
};
