const inquirer = require("inquirer");
const fs = require("fs").promises;
const path = require("path");

// Path to contracts file
const CONTRACTS_FILE = path.join(__dirname, "../data/contracts.json");

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

module.exports = { saveContracts, addContract, updateContract, deleteContract };
