#!/usr/bin/env node
/**
 * Commit + push des artefacts RBFA depuis GitHub Actions.
 * Gère les re-runs (pull --rebase) pour éviter les non-fast-forward.
 * No-op hors CI.
 */
import { execSync } from "child_process";

const FILES = [
  "data/live-results.json",
  "data/live-results.from-rbfa.json",
  "data/rbfa-raw.json",
  "data/rbfa-team-map.json",
];

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf8", stdio: "pipe", ...opts });
}

function shInherit(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

if (!process.env.GITHUB_ACTIONS) {
  console.log("rbfa-git-push: skip (hors GitHub Actions)");
  process.exit(0);
}

const listed = FILES.join(" ");
shInherit(`git add -- ${listed}`);

const porcelain = sh(`git status --porcelain -- ${listed}`).trim();
if (!porcelain) {
  console.log("rbfa-git-push: rien à committer");
  process.exit(0);
}

sh('git config user.name "rbfa-cron"');
sh(
  'git config user.email "41898282+github-actions[bot]@users.noreply.github.com"'
);

shInherit(
  'git commit -m "chore(rbfa): actualisation scores et compositions"'
);

const branch = (
  process.env.GITHUB_REF_NAME ||
  sh("git rev-parse --abbrev-ref HEAD").trim() ||
  "main"
).trim();

try {
  shInherit(`git pull --rebase origin ${branch}`);
} catch {
  console.warn("rbfa-git-push: rebase conflict — abort + retry once");
  try {
    sh("git rebase --abort");
  } catch {
    /* ignore */
  }
  shInherit(`git fetch origin ${branch}`);
  shInherit(`git rebase origin/${branch}`);
}

shInherit(`git push origin HEAD:${branch}`);
console.log("rbfa-git-push: OK");
