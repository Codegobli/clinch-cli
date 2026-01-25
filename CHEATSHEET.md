# Quick Reference

## Need to...

**Add a contract?**
→ `fileWriter.js` → `addContract()`

**Read contracts?**
→ `fileReader.js` → `readContracts()`

**Sync from Foundry?**
→ `clinchSync.js` → `syncFromFoundry()`

**Auto-find broadcast file?**
→ `clinchSync.js` → `findLatestBroadcast()`

**Parse Foundry JSON?**
→ `foundryParser.js` → `parseBroadCastInfo()`

**Git automation?**
→ `gitSync.js` → `triggerGitSync()`

## Common Flows

### User runs: clinch sync

1. index.js (sync command)
2. findLatestBroadcast() - finds file
3. syncFromFoundry() - main logic
4. parseBroadCastInfo() - extracts data
5. addContract() - saves each one
6. triggerGitSync() - pushes to git

### User runs: clinch add NAME ADDR NETWORK

1. index.js (add command)
2. captureAbi() - if --abi flag
3. addContract() - saves to registry
