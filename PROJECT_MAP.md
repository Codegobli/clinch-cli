# Clinch Project Structure

## 📁 File Organization

```
clinch-cli/
├── index.js                    # CLI entry point - all commands
├── package.json
├── utils/
│   ├── fileWriter.js          # Write operations (add, update, delete)
│   ├── fileReader.js          # Read operations
│   ├── clinchSync.js          # Foundry sync & auto-detection
│   ├── foundryParser.js       # Parse broadcast JSON
│   ├── gitSync.js             # Git automation
│   ├── getNetwork.js          # Chain ID → network name mapping
│   ├── securityCheck.js       # Private key leak detection
│   └── validators.js          # Input validation helpers
└── .clinch/                   # Created in user's Foundry project
    ├── contracts.json         # Contract registry
    └── abis/                  # Saved ABI files
        └── ContractName-0x123a.json
```

---

## 📄 File Responsibilities

### **index.js** - CLI Commands

Entry point when user types `clinch`. Defines all commands:

- `add` - Manually add contract
- `list` - Table view of contracts
- `view` - Card view (user-friendly)
- `find` - Search contracts
- `show` - Detailed single contract view
- `update` - Modify contract properties
- `delete` - Remove contract + ABI
- `sync` - Sync from Foundry broadcast
- `init` - Initialize .clinch/ directory
- `networks` - Show network statistics

### **fileWriter.js** - Write Operations

Handles all modifications to `.clinch/`:

- `saveContracts()` - Atomic writes to contracts.json
- `addContract()` - Add with duplicate checking
- `updateContract()` - Modify existing contract
- `deleteContract()` - Remove contract + ABI file
- `captureAbi()` - Copy ABI to vault
- `findContracts()` - Search & display in table format

### **fileReader.js** - Read Operations

- `readContracts()` - Load contracts.json (returns [] if not exists)

### **clinchSync.js** - Foundry Integration

- `syncFromFoundry()` - Main sync orchestrator
- `findLatestBroadcast()` - Auto-detect run-latest.json
- `findLatestAbi()` - Find ABI in out/ directory

### **foundryParser.js** - Broadcast Parsing

- `parseBroadCastInfo()` - Extract contracts from broadcast JSON

### **gitSync.js** - Git Automation

- `triggerGitSync()` - Auto-commit and optional push
- `runCommand()` - Execute shell commands

### **Helper Files**

- **getNetwork.js** - `getNetworkName()` maps chain IDs
- **securityCheck.js** - `hasSecurityLeak()` detects private keys
- **validators.js** - `isValidAddress()`, `isValidNetwork()`

---

## 🔄 Common Workflows

### User runs: `clinch sync`

```
1. index.js (sync command)
2. findLatestBroadcast() - Auto-find broadcast file
3. syncFromFoundry() - Orchestrate sync
4. parseBroadCastInfo() - Extract contracts from JSON
5. findLatestAbi() - Get ABI from out/
6. addContract() - Save each contract
7. triggerGitSync() - Commit (and push if --git flag)
```

### User runs: `clinch add MyToken 0x123... sepolia`

```
1. index.js (add command)
2. captureAbi() - If --abi flag provided
3. addContract() - Validate and save
4. saveContracts() - Write to contracts.json
```

### User runs: `clinch view`

```
1. index.js (view command)
2. readContracts() - Load from contracts.json
3. Display cards with explorer links and dates
```

---

## 💾 Data Storage

### **contracts.json Structure**

```json
[
  {
    "name": "SimpleToken",
    "address": "0x5fbdb2315678afecb367f032d93f642f64180aa3",
    "network": "anvil",
    "abi": "abis/SimpleToken-0x5fbd.json",
    "verified": false,
    "deployedAt": 1736348700,
    "txHash": "0xabc123..."
  }
]
```

### **ABI Files**

Stored in `.clinch/abis/` with format: `ContractName-0xShortAddr.json`

---

## 🎯 Quick Reference

| Need to...        | File             | Function               |
| ----------------- | ---------------- | ---------------------- |
| Add contract      | fileWriter.js    | `addContract()`        |
| Read contracts    | fileReader.js    | `readContracts()`      |
| Sync from Foundry | clinchSync.js    | `syncFromFoundry()`    |
| Parse broadcast   | foundryParser.js | `parseBroadCastInfo()` |
| Git automation    | gitSync.js       | `triggerGitSync()`     |
| Validate address  | validators.js    | `isValidAddress()`     |
| Map chain ID      | getNetwork.js    | `getNetworkName()`     |

---

## 🔧 Key Design Patterns

### **Atomic Writes**

`saveContracts()` writes to temp file first, then renames - prevents corruption

### **Duplicate Handling**

`addContract()` allows address aliases but prevents name conflicts

### **Security**

`hasSecurityLeak()` prevents accidental private key exposure

### **Auto-Detection**

`findLatestBroadcast()` and `findLatestAbi()` minimize manual input

### **Opt-in Git**

`--git` flag gives users control over when to push to GitHub
