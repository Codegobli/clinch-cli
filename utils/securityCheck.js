/**
 * System Design Concept: Data Sanitization
 * Job: Identify if a string looks like a Private Key but isn't a known safe hash.
 */
function isDangerousLeak(value) {
  // A standard private key is 64 hex chars.
  // Note: Tx Hashes are also 64 chars, so we check for context!
  const hex64Regex = /^[a-fA-F0-9]{64}$/;

  if (typeof value !== "string") return false;

  // Clean the string (remove 0x if present)
  const cleanVal = value.startsWith("0x") ? value.slice(2) : value;

  return hex64Regex.test(cleanVal);
}

function hasSecurityLeak(contract) {
  // Check the 'deployer' or any other field that shouldn't be a 64-char hex key
  // We allow txHash to be 64 chars, but NOT the 'deployer' address (which should be 40).
  if (isDangerousLeak(contract.deployer)) return true;

  return false;
}

module.exports = { hasSecurityLeak };
