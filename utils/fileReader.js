const fs = require("fs").promises;
const path = require("path");

async function readContracts() {
  try {
    const CLINCH_DIR = path.join(process.cwd(), ".clinch");
    const filePath = path.join(CLINCH_DIR, "contracts.json");
    const data = await fs.readFile(filePath, "utf8");
    const contracts = JSON.parse(data);
    return contracts;
  } catch (error) {
    console.log("Error reading contracts:", error.message);
    return [];
  }
}

module.exports = {
  readContracts,
};
