# ComplyTrack — GitHub Kanban Backlog

The following issues are the recommended first backlog. Each issue should normally have one feature branch and one PR into `Develop`.

## Backlog columns

Use the GitHub Project columns already created:

```text
Backlog → Ready → In progress → In review → Done
```

### Backlog
Work agreed on but not ready to start.

### Ready
Small enough and clear enough for a teammate to pick up.

### In progress
Someone is actively working on the issue.

### In review
A PR exists and is waiting for review/CI.

### Done
PR merged and verified in Develop.

## Recommended issues

| # | Issue | Area | Suggested branch |
|---|---|---|---|
| 1 | Project foundation — frontend/backend structure | Setup | `feature/project-foundation` |
| 2 | Frontend — application shell and navigation | Frontend | `feature/frontend-navigation` |
| 3 | Frontend — compliance dashboard | Frontend | `feature/frontend-dashboard` |
| 4 | Frontend — contractor list, search and filters | Frontend | `feature/frontend-contractors` |
| 5 | Frontend — contractor details and compliance records | Frontend | `feature/frontend-contractor-details` |
| 6 | Frontend — document upload form | Frontend | `feature/frontend-document-upload` |
| 7 | Frontend — compliance reports | Frontend | `feature/frontend-reports` |
| 8 | Database — PostgreSQL schema and seed data | Database | `feature/database-schema` |
| 9 | Backend — PostgreSQL connection and database layer | Backend | `feature/backend-database-connection` |
| 10 | Backend — contractor API | Backend | `feature/backend-contractors-api` |
| 11 | Backend — document API and compliance status | Backend | `feature/backend-documents-api` |
| 12 | Backend — compliance reports API | Backend | `feature/backend-reports-api` |
| 13 | Integration — connect frontend to backend APIs | Integration | `feature/frontend-backend-integration` |
| 14 | Testing — frontend unit and component tests | Testing | `feature/testing-frontend` |
| 15 | Testing — backend API tests | Testing | `feature/testing-backend` |
| 16 | DevOps — GitHub Actions CI pipeline | DevOps | `feature/ci-pipeline` |
| 17 | DevOps — CodeQL security workflow | Security | `feature/codeql-security` |
| 18 | Final QA — integration, responsive polish and release readiness | QA | `feature/final-qa` |

## Labels

Recommended labels:

```text
frontend
backend
database
testing
integration
devops
security
qa
setup
priority-high
priority-medium
```

## Keep issues small

A teammate should ideally be able to complete one issue in a focused work session or a small number of sessions.

If an issue starts becoming huge, split it.

For example:

```text
BAD:
Build the whole backend

GOOD:
Build contractor API
Build document API
Build report API
```

## Suggested first sprint

Do not start all 18 issues simultaneously.

Start with:

1. Project foundation
2. Database schema
3. Application shell/navigation
4. PostgreSQL connection
5. CI pipeline

Then move into:

6. Contractor API
7. Contractor list
8. Contractor details
9. Document API
10. Document upload

This gives the team a working vertical slice instead of three disconnected layers.
