# Official source guidance

This skill is an implementation pattern, not a named standard, certification
or claim of compliance. Use these sources to recheck evolving host/tool details:

- [Agent Skills specification](https://agentskills.io/specification),
  [best practices](https://agentskills.io/skill-creation/best-practices), and
  [script interfaces](https://agentskills.io/skill-creation/using-scripts): concise
  discoverable instructions, progressive disclosure, plan/validate/execute,
  self-contained helpers and honest structured outcomes.
- [AGENTS.md](https://agents.md/): ordinary Markdown for project context,
  commands, conventions, tests and security; scoped nested files. Not access
  control and not authority to override the agent's governing instructions.
- [NIST SSDF](https://csrc.nist.gov/projects/ssdf) and
  [SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final): adapt security to the
  existing lifecycle. Map preparation to project/policy contracts, protection
  to permissions/CI, secure production to gates/tests, and response to SECURITY.md.
  Select practices proportionally; do not call a template SSDF certification.
- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use):
  least privilege, verified full-SHA pinning, no privileged untrusted checkout,
  secret handling and clean hosted execution.
- [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners):
  owner routing requires real authorized owners and host review configuration.
- [Official checkout action](https://github.com/actions/checkout): template uses
  verified v6.1.0 SHA `d23441a48e516b6c34aea4fa41551a30e30af803`, no persisted
  credentials, full history. Reverify runtime/runner compatibility and release
  updates before adoption. Pinning alone does not prove an action is safe.
- [OWASP Agentic Applications Top 10](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/):
  least agency, prompt/context poisoning, tool and delegated privilege risks.
  Enforce limits outside the agent, not through informal conventions alone.

Recheck native tool and CI-provider documentation for each actual project.
The bundled runner executes reviewed commands; it neither scans source nor
enforces a sandbox, approver identity, secret redaction, native versions or
repository protection settings. Those are explicit adoption acceptance items.
