const inquirer = require("inquirer");
const fs = require("fs").promises;
const path = require("path");

// Path to contracts file
const CONTRACTS_FILE = path.join(__dirname, "../data/contracts.json");
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
    await fs.writeFile(CONTRACTS_FILE, jsonString, "utf8");
    console.log(`Contracts saved to: ${CONTRACTS_FILE}`);
  } catch (error) {
    console.log("Error saving contracts:", error.message);
    throw error;
  }
}

/**
 * Add a new contract
 * @param {Object} newContract - { name, address, network, abi }
 */
async function addContract(newContract) {
  try {
    const { readContracts } = require("./fileReader");
    const existingContracts = await readContracts();

    // --- 0. PRE-PROCESS DATA ---
    // Clean inputs to ensure "ETH" and "eth" or "mainnet" match correctly
    const cleanAddress = newContract.address.toLowerCase().trim();
    const cleanName = newContract.name.trim();
    const cleanNetwork = newContract.network.toLowerCase().trim();

    // --- 1. GLOBAL NAME GUARD ---
    // Rule: One name, one address, period.
    const nameExistsAnywhere = existingContracts.find(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (nameExistsAnywhere) {
      console.log(`\n❌ Error: The name "${cleanName}" is already taken.`);
      console.log(
        `ℹ️  It currently points to ${nameExistsAnywhere.address} on ${nameExistsAnywhere.network}.`
      );

      // THE HELPFUL PART: Suggest a new name
      const suggestedName = `${cleanName}_${cleanNetwork}`.toUpperCase();

      console.log(
        `\n💡 To keep things clear, try using a network-specific name:`
      );
      console.log(
        `   clinch add ${suggestedName} ${cleanAddress} ${cleanNetwork}`
      );
      return;
    }

    // --- 2. ADDRESS GUARD (Network Specific) ---
    // Rule: You can't add the same address twice on the same chain.
    const addressConflict = existingContracts.find(
      (c) =>
        c.address.toLowerCase() === cleanAddress &&
        c.network.toLowerCase() === cleanNetwork
    );

    if (addressConflict) {
      console.log(
        `\n❌ Error: This address is already registered on ${cleanNetwork}.`
      );
      console.log(
        `👉 Use: clinch update "${addressConflict.name}" to modify it.`
      );
      return;
    }

    // --- 3. THE "HAPPY PATH" ---
    const finalContract = {
      ...newContract,
      name: cleanName,
      address: cleanAddress,
      network: cleanNetwork,
      deployedAt: Math.floor(Date.now() / 1000), // Helpful for sorting!
    };

    existingContracts.push(finalContract);
    await saveContracts(existingContracts);

    console.log(`\n✅ Successfully added "${cleanName}" to the registry.`);
  } catch (error) {
    console.error("Error adding contract:", error.message);
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

    const index = existingContracts.findIndex((c) => c.name === contractName);
    if (index === -1) {
      console.log(`Contract "${contractName}" not found`);
      return;
    }

    existingContracts[index] = { ...existingContracts[index], ...updates };
    await saveContracts(existingContracts);
    console.log(`Contract "${contractName}" updated successfully`);
  } catch (error) {
    console.log("Error updating contract:", error.message);
    throw error;
  }
}

/**
 * Delete a contract
 * @param {string} contractName - Name of contract to delete
 */
async function deleteContract(contractName) {
  try {
    const { readContracts } = require("./fileReader");
    const existingContracts = await readContracts();
    const index = existingContracts.findIndex((c) => c.name === contractName);
    if (index === -1) {
      console.log(`Contract "${contractName}" not found`);
      return;
    }

    existingContracts.splice(index, 1);

    await saveContracts(existingContracts);
    console.log(`🗑️ Contract "${contractName}" deleted successfully`);
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
    const fileName = `${name}-${address.toLowerCase()}.json`;
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

module.exports = {
  saveContracts,
  addContract,
  updateContract,
  deleteContract,
  captureAbi,
};
