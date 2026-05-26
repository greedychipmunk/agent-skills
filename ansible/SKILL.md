---
name: ansible
description: Automate configuration management and application deployment with Ansible. Use when tasks mention ansible-playbook, inventory files, Ansible roles, ad-hoc commands, ansible-galaxy, or agentless SSH automation.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Ansible

## Intent Router

| Request | Reference | Load When |
| --- | --- | --- |
| Install tool, SSH setup, ansible.cfg | `resources/install-and-setup.md` | User needs to install Ansible or configure control node |
| Inventory files, group_vars, host_vars | `resources/inventory-and-variables.md` | User needs inventory structure or variable precedence |
| Playbook authoring, roles, modules | `resources/playbook-patterns.md` | User needs play structure, task patterns, or common modules |
| CLI commands, vault, galaxy | `resources/command-cookbook.md` | User needs ansible/ansible-playbook/ansible-vault/galaxy commands |

## Quick Start

```bash
# 1. Define your inventory
cat > inventory.ini <<'EOF'
[web]
web1.example.com
web2.example.com

[db]
db1.example.com
EOF

# 2. Test connectivity (ad-hoc ping)
ansible all -i inventory.ini -m ping

# 3. Run a playbook
ansible-playbook -i inventory.ini site.yml

# 4. Dry-run a playbook (check mode — no changes)
ansible-playbook -i inventory.ini site.yml --check --diff
```

## Core Concepts

| Concept | Description |
| --- | --- |
| **Control node** | Machine where Ansible runs (requires Python; no agent needed on targets) |
| **Managed node** | Target host reached via SSH (Linux) or WinRM (Windows) |
| **Inventory** | List of managed nodes (INI, YAML, or dynamic script) |
| **Playbook** | YAML file defining ordered plays and tasks |
| **Role** | Reusable directory structure (tasks, handlers, templates, vars) |
| **Module** | Idempotent unit of work (copy, service, package, user, command…) |
| **Collection** | Packaged set of roles, modules, and plugins from Ansible Galaxy |

## Safety Guardrails

- Always run with `--check --diff` first to preview changes without applying them.
- Use `--limit` to target a subset of hosts before running against all inventory.
- Avoid `command` and `shell` modules when an idempotent module exists.
- Running as root (`become: true`) requires explicit approval — confirm privilege escalation scope.
- Protect secrets with `ansible-vault encrypt` — never commit plaintext passwords.

```bash
# Install a role then dry-run the playbook to preview changes
ansible-galaxy role install geerlingguy.java
ansible-playbook -i inventory.ini site.yml --check --diff
```

## Workflow

1. Define or update inventory.
2. Test connectivity: `ansible all -m ping -i inventory.ini`
3. Write or update playbook.
4. Dry-run: `ansible-playbook site.yml -i inventory.ini --check --diff`
5. Run against a subset: `ansible-playbook site.yml -i inventory.ini --limit web1.example.com`
6. Run against all: `ansible-playbook site.yml -i inventory.ini`

## Related Skills

- **terraform** — provision infrastructure; Ansible configures after provisioning
- **pulumi** — IaC with code; Ansible handles post-provision configuration

## References

- `resources/install-and-setup.md`
- `resources/inventory-and-variables.md`
- `resources/playbook-patterns.md`
- `resources/command-cookbook.md`
- Official docs: <https://docs.ansible.com/ansible/latest/>
- Galaxy: <https://galaxy.ansible.com>
- Jeff Geerling's book/repo: <https://www.ansiblefordevops.com/>
- Red Hat learning: <https://www.redhat.com/en/topics/automation/learning-ansible>
