# Security policy

## Reporting a vulnerability

Use the project's confirmed private reporting channel. Do not disclose exploit
details, credentials or sensitive data in public issues. If no private channel
is documented, ask the maintainer privately before sharing sensitive details.
No reporting address, response SLA or supported-version promise is implied by
this template; confirm and document those with the owner before public release.

## Development requirements

Keep secrets out of source, logs, prompts, fixtures and artifacts. Use dummy
values in environment examples, test doubles for external services, locked
dependencies and least-privilege credentials. Read .factory/policy.md before
running code or changing auth, sensitive-data handling, CI or security gates.

Use the secret, dependency and static-analysis gates in .factory/config.json.
Review exclusions/allowlists as security-sensitive changes. Secret scans must
cover uncommitted working-tree content and relevant committed history/PR range;
dependency audits must include actual resolved dependencies. A scanner error or
network outage is not a clean result. Test authorization, input validation,
injection boundaries, log redaction and relevant misuse cases.

## Response

Privately triage, reproduce with synthetic data, contain, patch and add a
regression test/rule. Have the authorized owner rotate/revoke leaked credentials
and inspect usage. Coordinate disclosure, affected versions and remediation
with maintainers. Record sanitized lessons; do not preserve active secrets.
