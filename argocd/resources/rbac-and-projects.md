# RBAC and Projects — Argo CD

## AppProject CRD

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: team-a
  namespace: argocd
spec:
  description: "Team A project — staging and production"
  sourceRepos:
    - https://github.com/org/team-a-*
  destinations:
    - namespace: team-a-staging
      server: https://kubernetes.default.svc
    - namespace: team-a-production
      server: https://kubernetes.default.svc
  clusterResourceWhitelist:
    - group: ""
      kind: Namespace
  namespaceResourceBlacklist:
    - group: ""
      kind: ResourceQuota
  roles:
    - name: developer
      description: "Can sync apps in team-a project"
      policies:
        - p, proj:team-a:developer, applications, sync, team-a/*, allow
        - p, proj:team-a:developer, applications, get, team-a/*, allow
      groups:
        - team-a-devs
```

## RBAC Policy Syntax

```text
p, <subject>, <resource>, <action>, <object>, <effect>
```

Examples:

```text
# Allow role to sync applications in a project
p, role:dev, applications, sync, my-project/*, allow

# Allow role to read all applications
p, role:readonly, applications, get, */*, allow

# Deny a specific action
p, role:ci-bot, applications, delete, */*, deny

# Assign user to role
g, alice@example.com, role:dev

# Assign group to role
g, org:team-a, role:dev
```

## Built-in Roles

| Role | Permissions |
| ------ | ------------ |
| `role:admin` | Full access to all resources |
| `role:readonly` | Read-only access to all resources |

## RBAC Configuration in argocd-rbac-cm

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.default: role:readonly
  policy.csv: |
    p, role:dev, applications, sync, */*, allow
    p, role:dev, applications, get, */*, allow
    g, org:developers, role:dev
  scopes: "[groups, email]"
```

## SSO Integration Overview

### OIDC (OpenID Connect)

```yaml
# In argocd-cm ConfigMap
data:
  url: https://argocd.example.com
  oidc.config: |
    name: Okta
    issuer: https://dev-123.okta.com
    clientID: <client-id>
    clientSecret: $oidc.okta.clientSecret
    requestedScopes: ["openid", "profile", "email", "groups"]
    requestedIDTokenClaims:
      groups:
        essential: true
```

### GitHub OAuth

```yaml
data:
  dex.config: |
    connectors:
      - type: github
        id: github
        name: GitHub
        config:
          clientID: <github-app-client-id>
          clientSecret: $dex.github.clientSecret
          orgs:
            - name: my-org
```

## Repository Credential Templates

```bash
# Add credentials for all repos under a URL prefix
argocd repocreds add https://github.com/org/ \
  --username git \
  --password <personal-access-token>

# List credential templates
argocd repocreds list
```

## Project CLI Commands

```bash
argocd proj create team-a --description "Team A project"
argocd proj get team-a
argocd proj list
argocd proj add-source team-a https://github.com/org/repo
argocd proj add-destination team-a https://kubernetes.default.svc team-a-production
argocd proj allow-cluster-resource team-a "" Namespace
```

## Multi-Tenancy Patterns

- **Namespace-scoped Argo CD**: one Argo CD per team namespace — full isolation
- **Cluster-scoped with AppProjects**: shared Argo CD with project boundaries — simpler ops
- Recommend AppProject `sourceRepos` and `destinations` as minimum tenancy guardrail
- Use `policy.default: role:readonly` so users must be explicitly granted write access
