const fs = require("fs").promises;
const path = require("path");

async function readContracts() {
  try {
    const filePath = path.join(__dirname, "../data/contracts.json");
    const data = await fs.readFile(filePath, "utf8");
    const contracts = JSON.parse(data);
    return contracts;
  } catch (error) {
    console.log("Error reading contracts:", error.message);
    return [];
  }
}

// Test it
readContracts().then((contracts) => {
  console.log(" Contracts loaded:");
});

module.exports = {
  readContracts,
};
