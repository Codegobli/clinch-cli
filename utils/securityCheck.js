// ============================================
// SECURITY CHECKS
// Prevents accidental exposure of private keys
// ============================================

/**
 * Check if a value looks like a private key (64 hex chars)
 *
 * Private keys are 64 hexadecimal characters.
 * Note: Transaction hashes are also 64 chars, so this checks context.
 *
 * @param {String} value - Value to check
 * @returns {Boolean} True if looks like a private key
 *
 * @example
 * isDangerousLeak("0x1234...64chars") // true
 * isDangerousLeak("0x1234...40chars") // false (address)
 * isDangerousLeak("hello") // false
 */
function isDangerousLeak(value) {
  if (typeof value !== "string") return false;

  // Remove 0x prefix if present
  const cleanVal = value.startsWith("0x") ? value.slice(2) : value;

  // Private keys are exactly 64 hex characters
  const hex64Regex = /^[a-fA-F0-9]{64}$/;
  return hex64Regex.test(cleanVal);
}

/**
 * Check if contract object contains potential private key leaks
 *
 * Scans contract object for fields that might accidentally contain
 * a private key instead of expected values.
 *
 * @param {Object} contract - Contract object to check
 * @returns {Boolean} True if security leak detected
 *
 * @example
 * hasSecurityLeak({ deployer: "0x1234...40chars" }) // false (valid address)
 * hasSecurityLeak({ deployer: "0x1234...64chars" }) // true (possible private key!)
 */
function hasSecurityLeak(contract) {
  // Check deployer field (should be 40 chars for address, not 64 for private key)
  if (isDangerousLeak(contract.deployer)) {
    return true;
  }

  // Add more checks here if needed in the future
  // e.g., check other fields that shouldn't be 64 hex chars

  return false;
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  hasSecurityLeak,
  isDangerousLeak,
};
