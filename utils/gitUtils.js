const { execSync } = require("child_process");

function runCommand(command) {
  try {
    // stdio: 'inherit' lets the user see the git output (like the progress bar)
    return execSync(command, { encoding: "utf8", stdio: "pipe" }).trim();
  } catch (error) {
    return null;
  }
}

async function triggerGitSync(syncedContracts) {
  if (syncedContracts.length === 0) return;

  const isGit = runCommand("git rev-parse --is-inside-work-tree");
  if (!isGit) {
    console.log("Not a git repository. Skipping GitSync.");
    return;
  }

  console.log("Staging registry changes...");
  runCommand("git add .clinch");

  const names = syncedContracts.map((c) => c.name).join(", ");
  const commitMsg = `chore(clinch): sync ${names}`;

  console.log(`Committing: ${commitMsg}`);
  runCommand(`git commit -m "${commitMsg}"`);

  console.log("Pushing to remote...");
  runCommand("git push");
}
module.exports = { runCommand, triggerGitSync };
