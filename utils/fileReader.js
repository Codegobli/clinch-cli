const fs = require("fs").promises;
const path = require("path");

// Use current working directory instead of CLI installation directory
const CLINCH_DIR = path.join(process.cwd(), ".clinch");
const CONTRACTS_FILE = path.join(CLINCH_DIR, "contracts.json");

async function readContracts() {
  try {
    const data = await fs.readFile(CONTRACTS_FILE, "utf8");
    const contracts = JSON.parse(data);
    return contracts;
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist yet - this is fine on first run
      // Don't show error, just return empty array
      return [];
    }
    console.log("Error reading contracts:", error.message);
    return [];
  }
}

module.exports = {
  readContracts,
};
