# Import Dependency Map

## 📦 File Dependencies

This document shows which files import from which files to help you verify all imports are correct.

---

## **index.js** (Entry Point)

```javascript
const {
  addContract,
  deleteContract,
  updateContract,
  captureAbi,
  findContracts,
} = require("./utils/fileWriter");
const { readContracts } = require("./utils/fileReader");
const { syncFromFoundry } = require("./utils/clinchSync");
const { triggerGitSync } = require("./utils/gitSync"); // ⚠️ RENAMED from gitUtils.js
```

**Imports from:**

- ✅ fileWriter.js
- ✅ fileReader.js
- ✅ clinchSync.js
- ✅ gitSync.js (renamed from gitUtils.js)

---

## **utils/fileWriter.js**

```javascript
const { readContracts } = require("./fileReader");
```

**Imports from:**

- ✅ fileReader.js

**No other imports needed** - All operations are self-contained

---

## **utils/fileReader.js**

```javascript
// No imports from other utils files
```

**Imports from:**

- ❌ None (standalone)

---

## **utils/clinchSync.js**

```javascript
const { parseBroadCastInfo } = require("./foundryParser");
const { addContract } = require("./fileWriter");
```

**Imports from:**

- ✅ foundryParser.js
- ✅ fileWriter.js

---

## **utils/foundryParser.js**

```javascript
const { getNetworkName } = require("./getNetwork");
const { hasSecurityLeak } = require("./securityCheck");
const { findLatestAbi } = require("./clinchSync");
```

**Imports from:**

- ✅ getNetwork.js
- ✅ securityCheck.js
- ✅ clinchSync.js

---

## **utils/gitSync.js** (renamed from gitUtils.js)

```javascript
// No imports from other utils files
```

**Imports from:**

- ❌ None (uses only Node.js built-ins)

---

## **utils/getNetwork.js**

```javascript
// No imports from other utils files
```

**Imports from:**

- ❌ None (standalone helper)

**Exports:**

- `getNetworkName(chainId)` - Map chain ID to network name

---

## **utils/securityCheck.js**

```javascript
// No imports from other utils files
```

**Imports from:**

- ❌ None (standalone helper)

**Exports:**

- `hasSecurityLeak(contract)` - Check contract for private key leaks
- `isDangerousLeak(value)` - Check if value looks like private key

---

## **utils/validators.js**

```javascript
// No imports from other utils files
```

**Imports from:**

- ❌ None (standalone helper)

**Exports:**

- `isValidAddress(address)` - Validate Ethereum address format
- `isValidNetwork(network)` - Validate network name
- `isValidContractName(name)` - Validate contract name

---

## 🔄 Dependency Graph

```
index.js
├── fileWriter.js
│   └── fileReader.js
├── fileReader.js
├── clinchSync.js
│   ├── foundryParser.js
│   │   ├── getNetwork.js
│   │   ├── securityCheck.js
│   │   └── clinchSync.js (circular - safe)
│   └── fileWriter.js
└── gitSync.js

Standalone helpers (no dependencies):
├── getNetwork.js
├── securityCheck.js
└── validators.js
```

---

## ⚠️ CRITICAL: File Rename

**OLD NAME:** `utils/gitUtils.js`  
**NEW NAME:** `utils/gitSync.js`

Make sure to:

1. ✅ Rename the file in your project
2. ✅ Update import in `index.js` (already done in artifact)

---

## ✅ Verification Checklist

Run these checks in your project:

```bash
# 1. Check if gitUtils.js still exists (should NOT exist)
ls utils/gitUtils.js
# Should return: No such file

# 2. Check if gitSync.js exists (should exist)
ls utils/gitSync.js
# Should return: utils/gitSync.js

# 3. Search for old import references
grep -r "gitUtils" .
# Should return: nothing (or only in git history)

# 4. Verify all files exist
ls utils/*.js
# Should show:
# - clinchSync.js
# - fileReader.js
# - fileWriter.js
# - foundryParser.js
# - getNetwork.js
# - gitSync.js
# - securityCheck.js
# - validators.js
```

---

## 📝 Import Pattern Guidelines

When adding new functions:

### **1. Keep helpers standalone**

Files like `getNetwork.js`, `securityCheck.js`, `validators.js` should NOT import from other utils.

### **2. Avoid circular dependencies**

The only circular dependency is `clinchSync.js` ↔ `foundryParser.js`, which is safe because:

- `clinchSync` exports `findLatestAbi()`
- `foundryParser` imports and uses it
- No circular calls at runtime

### **3. Import from specific files**

```javascript
// ✅ Good - specific import
const { addContract } = require("./fileWriter");

// ❌ Bad - importing everything
const fileWriter = require("./fileWriter");
```

### **4. Keep index.js minimal**

Only import what commands directly use. Don't re-export utils.

---

## 🔍 Quick Lookup

**Need to import:**

| Function               | Import from             |
| ---------------------- | ----------------------- |
| `addContract()`        | `./utils/fileWriter`    |
| `readContracts()`      | `./utils/fileReader`    |
| `syncFromFoundry()`    | `./utils/clinchSync`    |
| `parseBroadCastInfo()` | `./utils/foundryParser` |
| `triggerGitSync()`     | `./utils/gitSync`       |
| `getNetworkName()`     | `./utils/getNetwork`    |
| `hasSecurityLeak()`    | `./utils/securityCheck` |
| `isValidAddress()`     | `./utils/validators`    |

---

## 🚨 Common Import Errors

### **Error 1: Cannot find module 'gitUtils'**

```
Error: Cannot find module './utils/gitUtils'
```

**Fix:** Rename file from `gitUtils.js` to `gitSync.js`

### **Error 2: Circular dependency warning**

```
Warning: Possible circular dependency detected
```

**Fix:** Only concern if you see runtime errors. The `clinchSync` ↔ `foundryParser` circular dependency is intentional and safe.

### **Error 3: Function is undefined**

```
TypeError: addContract is not a function
```

**Fix:** Check your import statement matches the export:

```javascript
// In fileWriter.js
module.exports = { addContract, ... };

// In other file
const { addContract } = require("./fileWriter"); // ✅
const addContract = require("./fileWriter"); // ❌ Wrong
```
