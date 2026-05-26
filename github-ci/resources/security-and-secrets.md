# Security and Secrets

Learn to securely manage secrets, configure permissions, handle pull requests safely, and protect against supply chain attacks.

---

## Secrets Context

Access repository secrets in workflows using `${{ secrets.SECRET_NAME }}`:

```yaml
- run: npm publish
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Creating Repository Secrets

In repository settings under "Secrets and variables":

1. Click "New repository secret"
2. Enter name (e.g., `NPM_TOKEN`) and value
3. Use in workflows as `${{ secrets.NPM_TOKEN }}`

Secrets are:

- **Encrypted** at rest
- **Masked** in logs (replaced with `***`)
- **Scoped** to the repository
- **Available** to all workflows in the repository

### Organization Secrets

Create secrets at the organization level for use across multiple repositories:

In organization settings under "Secrets and variables", accessible as `${{ secrets.ORG_SECRET }}` if the workflow's repository is explicitly allowed.

### Displaying Secrets Safely

Secrets are automatically masked in logs. However, avoid echoing secrets directly:

```yaml
# Bad: Could accidentally expose secret in logs
- run: echo "Token is ${{ secrets.NPM_TOKEN }}"

# Good: Use the secret as an environment variable
- run: npm publish
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## GITHUB_TOKEN Permissions

Every workflow automatically receives a `GITHUB_TOKEN` with default permissions. This token allows the workflow to interact with GitHub APIs.

### Default Permissions

By default, `GITHUB_TOKEN` has broad permissions:

```yaml
contents: read
packages: write
```

### Restricting Permissions

Use `permissions:` to follow the principle of least privilege:

```yaml
permissions:
  contents: read  # Only read repository contents
```

Available permissions:

- `contents`: Read/write repository code and metadata
- `pull-requests`: Read/write pull requests
- `issues`: Read/write issues
- `deployments`: Read/write deployments
- `packages`: Read/write packages
- `pages`: Deploy to GitHub Pages
- `statuses`: Write commit status checks
- `checks`: Write check runs

### Org-Wide Permission Policies

Enforce minimum permissions at the organization level. Workflows that request elevated permissions require approval.

---

## Pull Request Security

GitHub Actions treats pull requests differently from pushes to protect against supply chain attacks.

### pull_request vs. pull_request_target

**pull_request:** Workflow runs in the context of the pull request's HEAD commit

```yaml
on: pull_request
```

- Checks out the PR's branch (untrusted code)
- `GITHUB_TOKEN` has reduced permissions (no write access)
- **Safer for running tests on external contributions**
- Cannot write to repository or publish artifacts

**pull_request_target:** Workflow runs in the target branch context

```yaml
on: pull_request_target
```

- Checks out the base branch (trusted code)
- `GITHUB_TOKEN` has full permissions
- **Can publish to registries or write to the repository**
- **Dangerous:** Allows untrusted PR code to access secrets
- Use **only** if absolutely necessary and with extreme caution

### Secure Pattern for Pull Requests

Use `pull_request` for most workflows:

```yaml
on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

If you need to write results (e.g., publish test reports), use a two-job approach:

```yaml
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    outputs:
      test-status: ${{ job.status }}
    steps:
      - uses: actions/checkout@v4
      - run: npm test > test-results.txt

  comment:
    needs: test
    if: always()
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: 'Tests: ${{ needs.test.outputs.test-status }}'
            })
```

The first job (test) runs with untrusted code but limited permissions. The second job (comment) runs trusted code with write permissions.

---

## Secrets in Pull Requests

**Secrets are NOT available in pull_request workflows from forks.**

```yaml
on: pull_request

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: npm publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}  # Empty for fork PRs!
```

For pull requests from external repositories, the `secrets` context is empty.

### Alternative: Environments with Deployment Protection

For deployments requiring secrets, use **environments**:

```yaml
jobs:
  deploy:
    environment: production
    runs-on: ubuntu-latest
    steps:
      - run: npm publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Environments can require approval or have specific deployment conditions. Secrets in protected environments are only available after approval.

---

## Third-Party Action Pinning

Always pin third-party actions to specific versions to prevent malicious updates:

### Pinning Strategies

**Exact version tag:**

```yaml
- uses: actions/checkout@v4.0.0  # Most secure; no auto-updates
```

**Major version tag:**

```yaml
- uses: actions/checkout@v4  # Auto-patches; e.g., v4.1.0 → v4.2.0
```

**Branch name (NOT recommended):**

```yaml
- uses: actions/checkout@main  # Latest commit; could be malicious!
```

**Commit hash:**

```yaml
- uses: actions/checkout@abc123def  # Most secure for unpinned actions
```

### Recommended Pattern

Pin to major version for auto-patches, but pin critical actions to exact version:

```yaml
- uses: actions/checkout@v4          # Auto-patch minor/patch versions
- uses: npm/npm-action@v1.0.2        # Exact version for custom actions
- uses: aquaproj/aqua-installer@v2.2.0  # Exact version
```

### Verify Action Provenance

Use GitHub's action verification features to ensure actions are from trusted sources. Check the publisher's reputation and review the action code:

```bash
# Check the action repository
https://github.com/actions/checkout/releases/tag/v4.0.0
```

---

## Secret Scanning

GitHub automatically scans repositories for leaked secrets.

### Enable Secret Scanning

In repository settings under "Security & analysis":

1. Enable "Secret scanning"
2. Enable "Push protection" to block commits containing secrets

When a secret is detected:

- A security alert is created
- The commit is blocked (with push protection enabled)
- Repository administrators are notified

### Respond to Detected Secrets

If a secret is exposed:

1. **Revoke the secret immediately** (rotate API keys, tokens, etc.)
2. **Resolve the alert** in the security tab
3. **Fix the commit** by removing the secret and force-pushing
4. **Audit access logs** to check for misuse

### Prevent Secret Leaks

- **Use secrets context** instead of hardcoding tokens
- **Add `.env` to `.gitignore`**
- **Use pre-commit hooks** to scan for secrets before committing
- **Review `.env` files** carefully in PRs

Example pre-commit hook using `detect-secrets`:

```bash
pip install detect-secrets
detect-secrets scan --baseline .secrets.baseline
```

---

## Workflow Permissions and Approval

### Require Approval for Deployments

Use **environments** to require manual approval:

```yaml
jobs:
  deploy:
    environment:
      name: production
      url: https://example.com
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh
```

In environment settings, configure:

- Required reviewers
- Deployment branches (restrict to main)
- Timeout for approval

### Environment Secrets

Secrets defined at the environment level are only available in deployments to that environment:

```yaml
jobs:
  deploy:
    environment: production
    steps:
      - run: npm run deploy
        env:
          PROD_API_KEY: ${{ secrets.PROD_API_KEY }}  # Only in production env
```

---

## IP Whitelisting

For self-hosted runners, restrict workflow access using IP whitelisting:

1. Configure firewall rules to allow only GitHub's IP ranges
2. Use GitHub's published IP ranges: <https://api.github.com/meta> (check `actions` array)

For GitHub-hosted runners, IP ranges vary dynamically. Use network segmentation and secrets to limit exposure.

---

## Audit Logs

GitHub maintains audit logs of workflow executions:

- View logs in organization settings under "Audit log"
- Track workflow runs, secret access, and permission changes
- Export logs for compliance and investigation

---

## Security Checklist

Before deploying workflows to production:

- [ ] Use `permissions:` to restrict `GITHUB_TOKEN` scope
- [ ] Pin third-party actions to exact versions
- [ ] Use `pull_request` (not `pull_request_target`) for external contributions
- [ ] Rotate secrets regularly
- [ ] Enable secret scanning and push protection
- [ ] Require approval for environment deployments
- [ ] Audit workflow logs for unusual activity
- [ ] Document which secrets are needed and why
- [ ] Test workflows with limited permissions locally
- [ ] Review third-party action code before using

---
