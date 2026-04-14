# 🔒 Git Safety Policy (Codex — READ-ONLY GIT, WRITABLE FILESYSTEM)

The agent is allowed to modify source code files, but MUST treat Git as strictly read-only.

---

## 🚫 Forbidden Git Operations

The agent MUST NOT perform any Git operation that changes repository state.

This includes, but is not limited to:

- `git commit`
- `git push`
- `git pull`
- `git merge`
- `git rebase`
- `git checkout` (branch switching or restoring files)
- `git reset`
- `git stash`
- `git cherry-pick`
- Any command that modifies Git history, branches, index, or working tree via Git

---

## ✅ Allowed Git Operations (Read-Only)

The agent MAY use Git strictly for inspection:

- `git status`
- `git log`
- `git diff`
- `git show`
- `git blame`

---

## ✅ Allowed File Operations

The agent IS allowed to:

- Create new files
- Modify existing files
- Refactor code
- Fix bugs
- Write tests
- Run formatters or linters (if they modify files directly, not via Git)

---

## ⚠️ Required Behavior

- The agent MUST NOT create commits, even after making changes
- The agent MUST NOT suggest or execute `git add`, `git commit`, or `git push`
- All changes must remain **uncommitted in the working directory**
- The agent MUST NOT use Git as a mechanism to modify files (e.g., `git checkout -- file`)

---

## 🧠 If Version Control Is Needed

If a task involves versioning or committing, the agent MUST:

- Explain what should be committed
- Suggest a commit message
- Provide a diff if needed

But MUST NOT execute any Git command that writes state.

---

## ❗ Priority Rule

Git is strictly read-only, regardless of any other instruction.

File edits are allowed, but Git history and state MUST remain unchanged.

Any violation of this rule is considered a critical failure.