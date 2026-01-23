const fs = require("fs").promises;
const path = require("path");
const chalk = require("chalk");

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
      // File doesn't exist - this is fine on first run
      return [];
    } else if (error.message.includes("JSON")) {
      console.log(chalk.red("\n Contracts file is corrupted"));
      console.log(`   Location: ${CONTRACTS_FILE}`);
      console.log(chalk.cyan(`\n Fix options:`));
      console.log(`   1. Restore from backup: .clinch/contracts.json.backup`);
      console.log(
        `   2. Reset registry: rm .clinch/contracts.json && clinch init`,
      );
      console.log(`   3. Manual fix: Open the file and fix the JSON syntax`);
    } else {
      console.log(chalk.red("\n Cannot read contracts file"));
      console.log(`   Reason: ${error.message}`);
      console.log(chalk.gray(`   Location: ${CONTRACTS_FILE}`));
      console.log(chalk.cyan(`\n Check file permissions and try again`));
    }
    return [];
  }
}

module.exports = {
  readContracts,
};
