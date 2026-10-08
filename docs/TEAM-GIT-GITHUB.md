# ComplyTrack — Team Git & GitHub Workflow

## 1. Branch model

ComplyTrack uses the same two-level protected branch model as SparkSales:

```text
feature/*  ──PR──>  Develop  ──final PR──>  main
                         │                    │
                         │                    └─ Production
                         └─ Integration / testing
```

### main

`main` is the production branch.

Rules:
- Nobody works directly on `main`.
- Pull requests are required.
- CI must pass.
- Team approval is required.
- Only completed, tested work reaches `main`.

### Develop

`Develop` is the shared integration branch.

Rules:
- Nobody works directly on `Develop`.
- All feature work comes through pull requests.
- CI must pass before merging.
- The team reviews the feature before it enters the shared codebase.

> The current repository already has a branch named `Develop` with a capital D. Keep that name for now so the team does not accidentally create both `Develop` and `develop`. If you later want exact lowercase naming like SparkSales, rename the branch once and update branch protection/workflows together.

## 2. Feature branch naming

Every issue gets its own branch.

Use:

```text
feature/<short-description>
```

Examples:

```text
feature/frontend-dashboard
feature/frontend-contractors
feature/backend-contractors-api
feature/database-schema
feature/testing-backend
feature/ci-pipeline
```

For bug fixes:

```text
fix/<short-description>
```

For documentation:

```text
docs/<short-description>
```

## 3. Issue → branch → PR

Every piece of work follows this flow:

```text
GitHub Issue
     ↓
Assign teammate
     ↓
Create feature branch from Develop
     ↓
Work locally
     ↓
Commit
     ↓
Push branch
     ↓
Open PR → Develop
     ↓
CI runs
     ↓
Team review
     ↓
Approved + checks green
     ↓
Merge
```

## 4. Starting an issue

Always start from the latest Develop branch:

```bash
git checkout Develop
git pull origin Develop
git checkout -b feature/frontend-dashboard
```

## 5. Commit style

Use short, descriptive conventional-style commits:

```text
feat: add contractor dashboard
feat: add contractor search
fix: correct expiry status calculation
test: add contractor API tests
chore: configure eslint
ci: add GitHub Actions pipeline
docs: add team Git workflow
```

Avoid:

```text
stuff
updates
final
changes
asdf
```

## 6. Push

```bash
git add .
git commit -m "feat: add contractor dashboard"
git push -u origin feature/frontend-dashboard
```

## 7. Pull request rules

Target:

```text
feature branch → Develop
```

Every PR should contain:

- What was changed
- Why it was changed
- Issue number
- How it was tested
- Screenshots when UI changed
- Any known limitations

Recommended PR title:

```text
feat: add contractor dashboard
```

PR body example:

```md
## What changed
- Added compliance summary cards
- Added needs-attention table
- Added document coverage section

## Testing
- npm test
- npm run lint
- npm run build

## Related issue
Closes #12
```

## 8. Review rule

The author should not be the only person deciding that their PR is finished.

Reviewer checks:

- Does it solve the issue?
- Is the code understandable?
- Does it fit the existing architecture?
- Are there obvious bugs?
- Are tests included where needed?
- Does CI pass?
- Does the UI still work?

## 9. Keeping feature branches updated

If Develop has moved forward:

```bash
git checkout Develop
git pull origin Develop
git checkout feature/frontend-dashboard
git merge Develop
```

Resolve conflicts locally, test again, then push.

## 10. Completing a feature

After the PR is merged:

```bash
git checkout Develop
git pull origin Develop
git branch -d feature/frontend-dashboard
```

Delete the remote branch through GitHub or:

```bash
git push origin --delete feature/frontend-dashboard
```

## 11. Production release

When the whole team agrees that Develop is production-ready:

```text
Develop
   ↓
Final QA
   ↓
PR: Develop → main
   ↓
CI + review
   ↓
Merge
   ↓
Production
```

Do not merge individual feature branches directly into `main`.

## 12. Golden rule

> Issues describe the work. Branches isolate the work. Pull requests review the work. Develop integrates the work. Main releases the work.
