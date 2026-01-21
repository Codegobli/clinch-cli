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
    console.log("\n❌ GitSync stopped.");
    console.log(
      "Possible reason: You might need to run 'git pull' manually if GitHub has changes you don't have.",
    );
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = { runCommand, triggerGitSync };
