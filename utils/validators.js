// ============================================
// INPUT VALIDATORS
// Validate user input for contracts
// ============================================

/**
 * Check if valid Ethereum address
 *
 * Valid addresses:
 * - Start with 0x
 * - Followed by exactly 40 hexadecimal characters
 * - Total length: 42 characters
 *
 * @param {String} address - Address to validate
 * @returns {Boolean} True if valid Ethereum address
 *
 * @example
 * isValidAddress("0x5fbdb2315678afecb367f032d93f642f64180aa3") // true
 * isValidAddress("0x123") // false (too short)
 * isValidAddress("5fbdb2315678afecb367f032d93f642f64180aa3") // false (missing 0x)
 * isValidAddress(null) // false
 */
function isValidAddress(address) {
  if (!address) return false;

  const cleanAddress = address.trim();

  // Must start with 0x and be exactly 42 hex characters total
  // 0x + 40 hex chars = 42 total
  return /^0x[a-fA-F0-9]{40}$/.test(cleanAddress);
}

/**
 * Check if valid network name
 *
 * Validates against known networks that Clinch supports.
 * Network names are case-insensitive.
 *
 * @param {String} network - Network name to validate
 * @returns {Boolean} True if valid network
 *
 * @example
 * isValidNetwork("mainnet") // true
 * isValidNetwork("SEPOLIA") // true (case-insensitive)
 * isValidNetwork("unknown-network") // false
 */
function isValidNetwork(network) {
  const validNetworks = [
    "mainnet",
    "sepolia",
    "goerli",
    "arbitrum",
    "optimism",
    "base",
    "polygon",
    "anvil",
  ];

  return validNetworks.includes(network.toLowerCase());
}

/**
 * Check if valid contract name
 *
 * Contract names should:
 * - Not be empty
 * - Not contain special characters that cause issues
 * - Be reasonable length
 *
 * @param {String} name - Contract name to validate
 * @returns {Boolean} True if valid name
 *
 * @example
 * isValidContractName("MyToken") // true
 * isValidContractName("Token_V2") // true
 * isValidContractName("") // false (empty)
 * isValidContractName("a".repeat(100)) // false (too long)
 */
function isValidContractName(name) {
  if (!name || typeof name !== "string") return false;

  const trimmed = name.trim();

  // Check length (1-50 characters)
  if (trimmed.length === 0 || trimmed.length > 50) return false;

  // Allow alphanumeric, underscore, and hyphen
  // Must start with letter
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(trimmed);
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  isValidAddress,
  isValidNetwork,
  isValidContractName,
};
