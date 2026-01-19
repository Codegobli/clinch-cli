#!/usr/bin/env node
const { Command } = require("commander");
const path = require("path");
const {
  addContract,
  deleteContract,
  updateContract,
  captureAbi,
  findContracts,
} = require("./utils/fileWriter");
const { readContracts } = require("./utils/fileReader");
const { syncFromFoundry } = require("./utils/clinchSync");

const program = new Command();

program
  .name("clinch")
  .description("CLI tool for managing smart contract deployments")
  .version("1.0.0");

// ============================================
// ADD COMMAND
// ============================================
program
  .command("add <name> <address> <network>")
  .description("Add a new contract to the registry")
  .option("-a, --abi <path>", "Path to ABI file")
  .option("-v, --verified", "Mark contract as verified", false)
  .action(async (name, address, network, options) => {
    try {
      const contract = {
        name,
        address,
        network,
        verified: options.verified,
      };

      // Capture ABI if provided
      if (options.abi) {
        const abiPath = await captureAbi(options.abi, name, address);
        if (abiPath) {
          contract.abi = abiPath;
          console.log(`ABI captured successfully`);
        } else {
          console.log("Warning: Failed to capture ABI, continuing anyway...");
        }
      }

      await addContract(contract);
    } catch (error) {
      console.error("Error adding contract:", error.message);
      process.exit(1);
    }
  });

// ============================================
// LIST COMMAND
// ============================================
program
  .command("list")
  .description("List all registered contracts")
  .option("-n, --network <network>", "Filter by network")
  .option("-v, --verified", "Show only verified contracts")
  .action(async (options) => {
    try {
      const contracts = await readContracts();

      if (contracts.length === 0) {
        console.log("No contracts found. Add some with: clinch add");
        return;
      }

      let filtered = contracts;

      // Apply filters
      if (options.network) {
        filtered = filtered.filter((c) => c.network === options.network);
      }

      if (options.verified) {
        filtered = filtered.filter((c) => c.verified === true);
      }

      if (filtered.length === 0) {
        console.log("No contracts match your filters.");
        return;
      }

      console.log(`\nFound ${filtered.length} contract(s):\n`);

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
      filtered.forEach((contract, index) => {
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
      console.log(`\nTotal: ${filtered.length} contract(s)\n`);
    } catch (error) {
      console.error("Error listing contracts:", error.message);
      process.exit(1);
    }
  });

// ============================================
// FIND/SEARCH COMMAND
// ============================================
program
  .command("find [query]")
  .description("Search contracts by name or address")
  .option("-n, --network <network>", "Filter by network")
  .option("-v, --verified", "Show only verified contracts")
  .action(async (query, options) => {
    try {
      await findContracts(query, options);
    } catch (error) {
      console.error("Error searching contracts:", error.message);
      process.exit(1);
    }
  });

// ============================================
// SHOW/GET COMMAND
// ============================================
program
  .command("show <name>")
  .description("Show detailed information about a contract")
  .action(async (name) => {
    try {
      const contracts = await readContracts();
      const contract = contracts.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );

      if (!contract) {
        console.log(`Contract "${name}" not found`);
        process.exit(1);
      }

      console.log("\nContract Details:\n");
      console.log(`Name:       ${contract.name}`);
      console.log(`Address:    ${contract.address}`);
      console.log(`Network:    ${contract.network}`);
      console.log(`Verified:   ${contract.verified ? "Yes" : "No"}`);

      if (contract.abi) {
        console.log(`ABI:        ${contract.abi}`);
      }

      if (contract.txHash) {
        console.log(`Tx Hash:    ${contract.txHash}`);
      }

      if (contract.deployedAt) {
        const date = new Date(contract.deployedAt * 1000);
        console.log(`Deployed:   ${date.toLocaleString()}`);
      }

      console.log("");
    } catch (error) {
      console.error("Error showing contract:", error.message);
      process.exit(1);
    }
  });

// ============================================
// UPDATE COMMAND
// ============================================
program
  .command("update <name>")
  .description("Update an existing contract")
  .option("-n, --name <newName>", "Update contract name")
  .option("-a, --address <address>", "Update contract address")
  .option("--network <network>", "Update network")
  .option("--abi <path>", "Update ABI file")
  .option("-v, --verified", "Mark as verified")
  .option("--unverify", "Mark as not verified")
  .action(async (name, options) => {
    try {
      const updates = {};

      if (options.name) updates.name = options.name;
      if (options.address) updates.address = options.address.toLowerCase();
      if (options.network) updates.network = options.network.toLowerCase();

      if (options.verified) updates.verified = true;
      if (options.unverify) updates.verified = false;

      if (options.abi) {
        const abiPath = await captureAbi(
          options.abi,
          name,
          options.address || ""
        );
        if (abiPath) {
          updates.abi = abiPath;
          console.log(`ABI updated successfully`);
        }
      }

      if (Object.keys(updates).length === 0) {
        console.log("No updates specified. Use --help to see options.");
        return;
      }

      await updateContract(name, updates);
    } catch (error) {
      console.error("Error updating contract:", error.message);
      process.exit(1);
    }
  });

// ============================================
// DELETE/REMOVE COMMAND
// ============================================
program
  .command("delete <name>")
  .alias("remove")
  .description("Delete a contract from the registry")
  .option("-f, --force", "Skip confirmation prompt")
  .action(async (name, options) => {
    try {
      if (!options.force) {
        const readline = require("readline").createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        readline.question(
          `Are you sure you want to delete "${name}"? (y/N) `,
          async (answer) => {
            readline.close();

            if (answer.toLowerCase() !== "y") {
              console.log("Deletion cancelled");
              return;
            }

            await deleteContract(name);
          }
        );
      } else {
        await deleteContract(name);
      }
    } catch (error) {
      console.error("Error deleting contract:", error.message);
      process.exit(1);
    }
  });

// ============================================
// SYNC COMMAND (Foundry Integration)
// ============================================
program
  .command("sync")
  .description("Sync contracts from Foundry broadcast file")
  .option("-b, --broadcast <path>", "Manual path to foundry broadcast JSON")
  .action(async (options) => {
    try {
      let targetPath = options.broadcast;

      // If no path was typed, try to find it automatically
      if (!targetPath) {
        const { findLatestBroadcast } = require("./utils/clinchSync");
        targetPath = await findLatestBroadcast();
      }

      if (!targetPath) {
        console.log("❌ Could not find a broadcast file automatically.");
        console.log(
          "Please specify one: clinch sync -b ./path/to/run-latest.json"
        );
        return;
      }

      console.log(`📡 Syncing from: ${targetPath}`);
      await syncFromFoundry(path.resolve(process.cwd(), targetPath));
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

// ============================================
// INIT COMMAND
// ============================================
program
  .command("init")
  .description("Initialize Clinch in the current directory")
  .action(async () => {
    try {
      const fs = require("fs").promises;
      const dataDir = path.join(process.cwd(), "../data");
      const abiDir = path.join(dataDir, "abis");
      const contractsFile = path.join(dataDir, "contracts.json");

      // Create directories
      await fs.mkdir(abiDir, { recursive: true });

      // Create empty contracts file if it doesn't exist
      try {
        await fs.access(contractsFile);
        console.log("Clinch is already initialized");
      } catch {
        await fs.writeFile(contractsFile, "[]", "utf8");
        console.log("Clinch initialized successfully!");
        console.log(`Data directory: ${dataDir}`);
      }
    } catch (error) {
      console.error("Error initializing Clinch:", error.message);
      process.exit(1);
    }
  });

// ============================================
// NETWORKS COMMAND
// ============================================
program
  .command("networks")
  .description("List all networks with registered contracts")
  .action(async () => {
    try {
      const contracts = await readContracts();

      if (contracts.length === 0) {
        console.log("No contracts found");
        return;
      }

      const networkStats = {};

      contracts.forEach((contract) => {
        if (!networkStats[contract.network]) {
          networkStats[contract.network] = {
            total: 0,
            verified: 0,
          };
        }
        networkStats[contract.network].total++;
        if (contract.verified) {
          networkStats[contract.network].verified++;
        }
      });

      console.log("\nNetworks:\n");

      Object.entries(networkStats).forEach(([network, stats]) => {
        console.log(`${network}:`);
        console.log(`  Total: ${stats.total}`);
        console.log(`  Verified: ${stats.verified}`);
        console.log("");
      });
    } catch (error) {
      console.error("Error listing networks:", error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
