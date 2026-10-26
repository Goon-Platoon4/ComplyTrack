# ComplyTrack first-release incident response

This is the initial manual response process. It deliberately does not claim automated on-call coverage or fixed response-time guarantees.

## Severity levels

- **Critical:** confirmed or suspected cross-organization data exposure, authentication/authorization bypass, unauthorized private-document access, or evidence that a malicious file was published. Contain access immediately, disable affected credentials/sessions or storage paths, preserve logs, investigate scope, and notify the project owner/security lead.
- **High:** API or database outage affecting core workflows, suspected account compromise, or prolonged malware-scanner unavailability that blocks uploads. Confirm health checks, inspect request IDs and provider status, preserve evidence, and apply a safe workaround without bypassing security controls.
- **Medium:** repeated report/export failures, broken noncritical workflow, or repeated operational errors with a working secure alternative. Record the impact, investigate logs and dependencies, and track a fix.
- **Low:** isolated recoverable UI or operational issue with no evidence of data exposure or security control failure. Record and resolve through normal development workflow.

## Manual response checklist

1. Record when the issue was noticed, who noticed it, affected organization(s), severity, request IDs, and user-visible impact.
2. For security incidents, prioritize containment over restoring convenience. Revoke sessions/credentials, disable affected endpoints or storage access, and prevent further access while scope is assessed.
3. Preserve relevant API logs, audit events, scanner outcomes, and provider status. Do not copy passwords, bearer tokens, MFA/recovery codes, document contents, or service secrets into incident notes.
4. Check `/api/health/live` and `/api/health/ready`; inspect server logs using the response `requestId`; verify Neon, Supabase Storage, email provider, and scanner status as relevant.
5. Never bypass authorization, expose private storage, or publish a document when the scanner is unavailable or its result is uncertain. Compliance status must not be represented as verified when required data cannot be calculated.
6. Restore only after the cause is understood and the security boundary is verified. For database/storage recovery, verify consistency between document metadata and file objects.
7. Record the timeline, cause, data/access impact, corrective action, and follow-up tests as a new audit/incident record. Do not edit or delete previous audit events.

## Current limitations

- The first release uses a manual response process; no paging/on-call automation is configured.
- Exact response deadlines, escalation contacts, and regulatory notification decisions must be defined by the organization.
- API request logs and audit events are separate. Access to production logs should be restricted and retention configured by the deployment owner.
