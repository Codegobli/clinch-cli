const { execSync } = require("child_process");

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Execute a shell command and return output
 * Returns null on error instead of throwing
 */
function runCommand(command) {
  try {
    return execSync(command, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  } catch (error) {
    return null;
  }
}

// ============================================
// GIT AUTOMATION
// ============================================

/**
 * Auto-commit and optionally push synced contracts to Git
 *
 * @param {Array} syncedContracts - List of contracts that were synced
 * @param {Boolean} shouldPush - Whether to push to remote (default: false)
 */
async function triggerGitSync(syncedContracts, shouldPush = false) {
  if (!syncedContracts || syncedContracts.length === 0) return;

  try {
    // Check if this is a Git repository
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: process.cwd(),
      stdio: "ignore",
    });

    console.log("\nStaging registry changes...");

    // Stage the .clinch folder
    execSync("git add .clinch/", {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    // Create commit message
    const names = syncedContracts.map((c) => c.name).join(", ");
    const commitMsg = `chore(clinch): sync ${names}`;

    // Commit changes
    try {
      console.log(`Committing: ${commitMsg}`);
      execSync(`git commit -m "${commitMsg}"`, {
        cwd: process.cwd(),
        stdio: "pipe",
      });
    } catch (e) {
      console.log("ℹ️  No new changes to commit");
    }

    // Push to remote if requested
    if (!shouldPush) {
      console.log("\n✅ Changes committed locally");
      console.log("💡 Tip: Use --git flag to also push to GitHub");
      console.log("   Example: clinch sync --git");
      return;
    }

    // Get current branch and push
    const branch = runCommand("git branch --show-current");

    if (!branch) {
      console.log("\n⚠️  Could not detect current branch");
      console.log(
        "💡 You can manually push with: git push origin <branch-name>",
      );
      return;
    }

    console.log(`\nPushing to GitHub (${branch})...`);
    execSync(`git push origin ${branch}`, {
      cwd: process.cwd(),
      stdio: "inherit", // Show git output for push
    });

    console.log("\n✅ Sync complete and reflected on GitHub!");
  } catch (error) {
    console.log("\n❌ Git sync failed");

    // Detect specific error types
    if (error.message.includes("not a git repository")) {
      console.log("\n Problem: This folder is not a Git repository");
      console.log("   Solution: Run 'git init' to initialize Git");
    } else if (
      error.message.includes("rejected") ||
      error.message.includes("non-fast-forward")
    ) {
      console.log("\n Problem: GitHub has changes you don't have locally");
      console.log("   Solution: Run 'git pull' then try syncing again");
    } else if (error.message.includes("Could not resolve host")) {
      console.log("\n Problem: No internet connection");
      console.log("   Your changes are saved locally");
      console.log("   Push manually later: git push origin <branch-name>");
    } else if (
      error.message.includes("Permission denied") ||
      error.message.includes("authentication failed")
    ) {
      console.log("\n Problem: Git authentication failed");
      console.log("   Solution: Check your GitHub credentials or SSH keys");
    } else {
      console.log("\n Problem: Git operation failed");
      console.log(`   Details: ${error.message}`);
      console.log("\n Your changes are still saved locally");
      console.log("   You can push manually: git push origin <branch-name>");
    }
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = { runCommand, triggerGitSync };
