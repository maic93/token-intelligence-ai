# Security Policy

## Supported Versions

We currently support the latest commit on the `main` branch with security updates.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately by emailing the project maintainers. **Do not** create a public GitHub issue.

We will acknowledge receipt within 48 hours and work on a fix before public disclosure.

## What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected versions or components
- Any suggested fix (optional)

## Response Timeline

- **48 hours:** Initial acknowledgment
- **7 days:** Assessment and mitigation plan
- **30 days:** Fix deployed (depending on severity)

## Security Practices

- All environment variables with secrets (DATABASE_URL, RPC URLs) are loaded from `.env`, never hardcoded
- Helmet security headers are applied to all API responses
- Rate limiting protects `/api/*` routes
- Request IDs are propagated in logs for audit trails
- Dependencies are audited regularly via `pnpm audit`
- TypeScript strict mode prevents common type-based vulnerabilities
