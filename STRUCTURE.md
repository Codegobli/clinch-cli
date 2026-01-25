# Clinch Structure

## Files Overview

### index.js

- All CLI commands (add, list, delete, sync, etc.)
- Entry point when user types `clinch`

### utils/fileWriter.js

- saveContracts() - Write to contracts.json
- addContract() - Add new contract
- updateContract() - Modify existing
- deleteContract() - Remove contract + ABI
- captureAbi() - Copy ABI to .clinch/abis/
- findContracts() - Search and display

### utils/fileReader.js

- readContracts() - Load contracts.json

### utils/clinchSync.js

- syncFromFoundry() - Main sync logic
- findLatestBroadcast() - Auto-find broadcast file
- findLatestAbi() - Auto-find ABI from out/

### utils/foundryParser.js

- parseBroadCastInfo() - Extract contracts from broadcast JSON

### utils/gitSync.js

- triggerGitSync() - Auto commit and push
- runCommand() - Execute shell commands

## Data Flow

User types: clinch sync
→ index.js sync command
→ findLatestBroadcast() finds the file
→ syncFromFoundry() orchestrates
→ parseBroadCastInfo() extracts contracts
→ addContract() saves each one
→ triggerGitSync() pushes to GitHub
