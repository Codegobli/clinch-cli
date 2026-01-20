const { execSync } = require("child_process");

// ============================================
// RUN COMMAND - Execute terminal commands
// ============================================
function runCommand(command) {
  try {
    return execSync(command, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe", // Capture output
    }).trim();
  } catch (error) {
    return null;
  }
}

// ============================================
// GIT SYNC - Auto commit and push
// ============================================
async function triggerGitSync(syncedContracts, shouldPush = false) {
  // If nothing synced, exit early
  if (!syncedContracts || syncedContracts.length === 0) return;

  try {
    // ──────────────────────────────────────────────────────────
    // STEP 1: Check if this is a Git repository
    // ──────────────────────────────────────────────────────────
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: process.cwd(),
      stdio: "ignore", // Hide output
    });

    console.log("\nStaging registry changes...");

    // ──────────────────────────────────────────────────────────
    // STEP 2: Stage the .clinch folder
    // ──────────────────────────────────────────────────────────
    execSync("git add .clinch/", {
      cwd: process.cwd(),
      stdio: "inherit", // Show git output
    });

    // ──────────────────────────────────────────────────────────
    // STEP 3: Create commit message
    // ──────────────────────────────────────────────────────────
    const names = syncedContracts.map((c) => c.name).join(", ");
    const commitMsg = `chore(clinch): sync ${names}`;

    // ──────────────────────────────────────────────────────────
    // STEP 4: Commit changes locally
    // ──────────────────────────────────────────────────────────
    try {
      console.log(`Committing: ${commitMsg}`);
      execSync(`git commit -m "${commitMsg}"`, {
        cwd: process.cwd(),
        stdio: "inherit",
      });
    } catch (e) {
      console.log("ℹ️  No new changes to commit");
    }

    // ──────────────────────────────────────────────────────────
    // STEP 5: Push to GitHub (only if user wants it)
    // ──────────────────────────────────────────────────────────
    if (!shouldPush) {
      console.log("\n✅ Changes committed locally");
      console.log("💡 Tip: Use --git flag to also push to GitHub");
      console.log("   Example: clinch sync --git");
      return; // Stop here, don't push
    }

    // ──────────────────────────────────────────────────────────
    // STEP 6: Get current branch and push
    // ──────────────────────────────────────────────────────────
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
      stdio: "inherit",
    });

    console.log("\n✅ Sync complete and reflected on GitHub!");
  } catch (error) {
    console.log("\n❌ GitSync stopped.");
    console.log(
      "Possible reason: You might need to run 'git pull' manually if GitHub has changes you don't have.",
    );
  }
}

module.exports = { runCommand, triggerGitSync };
