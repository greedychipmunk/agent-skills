# Ansible Inventory & Variables

## INI Inventory

```ini
# inventory.ini

[web]
web1.example.com
web2.example.com ansible_user=ubuntu

[db]
db1.example.com ansible_port=2222

[production:children]
web
db

[all:vars]
ansible_user=ansible
```

## YAML Inventory

```yaml
# inventory.yaml
all:
  vars:
    ansible_user: ansible
  children:
    web:
      hosts:
        web1.example.com:
        web2.example.com:
          ansible_user: ubuntu
    db:
      hosts:
        db1.example.com:
          ansible_port: 2222
    production:
      children:
        web:
        db:
```

## Common Host Variables

| Variable | Purpose |
| --- | --- |
| `ansible_host` | IP or hostname override |
| `ansible_user` | SSH username |
| `ansible_port` | SSH port (default 22) |
| `ansible_ssh_private_key_file` | Path to SSH key |
| `ansible_python_interpreter` | Python path on target |
| `ansible_become` | Enable privilege escalation |
| `ansible_become_user` | User to become (default root) |

## `group_vars` and `host_vars`

Organize variables in directory trees:

```text
inventory/
├── hosts.yaml
├── group_vars/
│   ├── all.yaml          # applies to all hosts
│   ├── web.yaml          # applies to [web] group
│   └── production/
│       ├── vars.yaml
│       └── vault.yaml    # encrypted secrets
└── host_vars/
    └── web1.example.com.yaml   # host-specific overrides
```

```yaml
# group_vars/web.yaml
nginx_port: 80
nginx_worker_processes: auto
```

```yaml
# host_vars/web1.example.com.yaml
nginx_port: 8080   # override for this host
```

## Dynamic Inventory

For cloud environments, use dynamic inventory scripts or plugins:

```bash
# AWS EC2 plugin (requires boto3)
pip install boto3
ansible-inventory -i aws_ec2.yaml --list

# GCP plugin
ansible-inventory -i gcp_compute.yaml --list
```

```yaml
# aws_ec2.yaml
plugin: amazon.aws.aws_ec2
regions:
  - us-east-1
filters:
  tag:Environment: production
keyed_groups:
  - key: tags.Role
    prefix: role
```

## Variable Precedence (low → high)

1. Role defaults (`roles/x/defaults/main.yml`)
2. Inventory `group_vars/all`
3. Inventory `group_vars/<group>`
4. Inventory `host_vars/<host>`
5. Playbook `vars:`
6. `vars_files:`
7. `set_fact` / registered variables
8. Extra vars (`-e` flag) — **highest priority**

For advanced dynamic inventory development and custom inventory plugins, see <https://docs.ansible.com/ansible/latest/plugins/inventory.html>.
