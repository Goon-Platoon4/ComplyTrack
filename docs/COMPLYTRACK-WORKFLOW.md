# ComplyTrack — Application Workflow & Architecture

## 1. What ComplyTrack does

ComplyTrack helps a small organisation keep contractor compliance records in one place.

The main business question is:

> "Can this contractor work for us, and do we have valid evidence to prove it?"

The application therefore revolves around contractors, required documents, expiry dates, reminders and audit history.

## 2. High-level architecture

```text
┌───────────────────────────────┐
│           Browser             │
│       React + Vite            │
│                               │
│ Dashboard                     │
│ Contractors                   │
│ Contractor Details            │
│ Document Upload               │
│ Reports                       │
│ Settings                      │
└───────────────┬───────────────┘
                │ HTTPS / REST
                ▼
┌───────────────────────────────┐
│        Express API            │
│          Node.js              │
│                               │
│ Contractor routes              │
│ Document routes                │
│ Report routes                  │
│ Authentication                 │
│ Validation                     │
└───────────────┬───────────────┘
                │ SQL
                ▼
┌───────────────────────────────┐
│       PostgreSQL / Neon       │
│                               │
│ users                         │
│ contractors                   │
│ document_types                │
│ documents                     │
│ reminders                     │
│ audit_logs                    │
└───────────────────────────────┘
```

## 3. Main data relationships

```text
User
 │
 │ uploaded_by / actor
 ▼
Document ───────────────► Document Type
 │
 │ belongs to
 ▼
Contractor
 │
 ├────────► Documents
 ├────────► Reminders
 └────────► Audit history
```

One contractor can have many documents.

One document belongs to one document type.

One document can have reminder records.

Audit records describe important changes.

## 4. Contractor workflow

```text
Add contractor
      ↓
Enter business/contact information
      ↓
Define whether contractor works on site
      ↓
Determine required documents
      ↓
Upload documents
      ↓
Calculate document status
      ↓
Calculate contractor compliance status
      ↓
Display on dashboard
      ↓
Send reminders as expiry approaches
```

## 5. Document status

The starter project uses four simple statuses:

### Compliant

The required document exists and its expiry is more than 30 days away.

### Expiring soon

The document exists and expires today or within the next 30 days.

### Expired

The expiry date has passed.

### Missing

The required document has not been uploaded.

Keep this logic consistent in the backend. The frontend should display the status rather than invent a second version of the business rules.

## 6. Dashboard workflow

```text
PostgreSQL
    ↓
Report API
    ↓
Dashboard API client
    ↓
React state
    ↓
Summary cards / tables / charts
```

The dashboard should eventually stop depending on hard-coded demo data and use the API.

## 7. Contractor detail workflow

```text
Contractor list
      ↓
Select contractor
      ↓
GET /api/contractors/:id
      ↓
Load contractor details
      ↓
GET /api/documents?contractorId=:id
      ↓
Display compliance documents
```

## 8. Upload workflow

```text
User selects document
        ↓
Frontend validates file/form
        ↓
POST document metadata
        ↓
Backend validates contractor + document type
        ↓
File stored in secure object storage
        ↓
Database stores document metadata/storage key
        ↓
Compliance status recalculated
        ↓
Reminder schedule recalculated
        ↓
Audit log created
```

For the student/project version, the first implementation can keep file storage simple. Production should use secure object storage rather than storing large binary files directly in PostgreSQL.

## 9. API responsibility

### Frontend

Responsible for:
- User interface
- Navigation
- Form interaction
- Displaying validation messages
- Calling APIs
- Loading/error/empty states

### Backend

Responsible for:
- Business rules
- Validation
- Authentication/authorization
- Database access
- Compliance calculations
- API responses
- Audit logging

### Database

Responsible for:
- Persistent records
- Relationships
- Constraints
- Indexes
- Data integrity

## 10. Why the backend owns compliance status

Do not calculate the official compliance status independently in multiple frontend pages.

Bad:

```text
Dashboard → its own expiry logic
Contractor page → different expiry logic
Reports → another expiry logic
```

Better:

```text
                ┌─ Dashboard
Database → API ─┼─ Contractor details
                └─ Reports
                     ↑
              one business rule
```

This prevents the dashboard saying "Compliant" while the report says "Expiring soon".

## 11. Development workflow

```text
Issue
 ↓
Feature branch
 ↓
Frontend / Backend / Database / Tests
 ↓
Local testing
 ↓
Push
 ↓
Pull Request → Develop
 ↓
CI
 ├─ Lint
 ├─ Tests
 ├─ Dependency Security
 └─ Build
 ↓
Code review
 ↓
Merge into Develop
 ↓
Integration testing
 ↓
Final QA
 ↓
PR Develop → main
 ↓
Production
```

## 12. Recommended build order

### Phase 1 — Foundation

- Project structure
- Database schema
- API connection
- Frontend shell
- CI

### Phase 2 — Core contractor workflow

- Contractor API
- Contractor list
- Contractor details
- Search/filtering

### Phase 3 — Documents

- Document API
- Upload form
- Compliance status
- Required-document rules

### Phase 4 — Dashboard/reporting

- Dashboard API integration
- Reports
- Coverage summaries

### Phase 5 — Testing/security

- Frontend tests
- Backend tests
- CodeQL
- Dependency audit

### Phase 6 — Final QA

- End-to-end testing
- Responsive testing
- Documentation
- Production readiness review

## 13. What should NOT be built yet

Keep the first version manageable.

Do not start with:

- Complex microservices
- Kubernetes
- Event-driven architecture
- Advanced AI features
- Complex multi-tenant billing
- Complicated background queues
- Enterprise SSO

The goal is a clean full-stack application with good engineering practices, not an unnecessarily complicated platform.
