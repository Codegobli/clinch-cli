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
 * @param {Object} newContract - Contract object to add
 */
async function addContract(newContract) {
  try {
    // Import readContracts from fileReader
    const { readContracts } = require("./fileReader");

    const existingContracts = await readContracts();

    // 1. Check for the Name Conflict
    const nameConflict = existingContracts.find(
      (c) =>
        c.name.toLowerCase() === newContract.name.toLowerCase() &&
        c.network === newContract.network
    );

    if (nameConflict) {
      console.log(
        `⚠️  Warning: "${newContract.name}" already exists on ${newContract.network}.`
      );

      // 2. Trigger the Prompt
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "How would you like to proceed?",
          choices: [
            { name: "Rename this new entry", value: "rename" },
            { name: "Cancel", value: "cancel" },
          ],
        },
      ]);

      if (action === "rename") {
        const { newName } = await inquirer.prompt([
          {
            type: "input",
            name: "newName",
            message: "Enter a unique name (e.g., USDC-Credra):",
            validate: (input) =>
              input.length > 0 ? true : "Name cannot be empty.",
          },
        ]);
        newContract.name = newName; // Update the object with the new name
      } else {
        console.log("❌ Add operation cancelled.");
        return;
      }
    }

    // 3. Final safety check: Is the ADDRESS also a duplicate?
    const addressDuplicate = existingContracts.find(
      (c) =>
        c.address.toLowerCase() === newContract.address.toLowerCase() &&
        c.network === newContract.network
    );

    if (addressDuplicate) {
      console.log(
        `❌ Error: This address is already registered as "${addressDuplicate.name}".`
      );
      return;
    }

    existingContracts.push(newContract);

    await saveContracts(existingContracts);

    console.log("Contract added successfully!");
  } catch (error) {
    console.log("Error adding contract:", error.message);
    throw error;
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
