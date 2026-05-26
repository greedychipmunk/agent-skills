# Ansible Command Cookbook

## Ad-Hoc Commands (`ansible`)

```bash
# Ping all hosts
ansible all -i inventory.ini -m ping

# Run a shell command on web group
ansible web -i inventory.ini -m ansible.builtin.shell -a "uptime"

# Install a package
ansible db -i inventory.ini -m ansible.builtin.package -a "name=postgresql state=present" --become

# Gather facts from a single host
ansible web1.example.com -i inventory.ini -m setup

# Gather specific facts
ansible all -i inventory.ini -m setup -a "filter=ansible_os_family"

# Copy a file
ansible all -i inventory.ini -m ansible.builtin.copy -a "src=./app.conf dest=/etc/app/app.conf mode=0644" --become
```

## Running Playbooks (`ansible-playbook`)

```bash
# Basic run
ansible-playbook -i inventory.ini site.yml

# Dry-run with diff (preview changes — always run first)
ansible-playbook -i inventory.ini site.yml --check --diff

# Limit to specific hosts or groups
ansible-playbook -i inventory.ini site.yml --limit web1.example.com
ansible-playbook -i inventory.ini site.yml --limit web

# Run only tagged tasks
ansible-playbook -i inventory.ini site.yml --tags "config,packages"
ansible-playbook -i inventory.ini site.yml --skip-tags "restart"

# Pass extra variables
ansible-playbook -i inventory.ini site.yml -e "env=prod app_port=8080"
ansible-playbook -i inventory.ini site.yml -e @vars/prod.yaml

# Verbose output (increase -v level for more detail)
ansible-playbook -i inventory.ini site.yml -v
ansible-playbook -i inventory.ini site.yml -vvv

# Step through tasks interactively
ansible-playbook -i inventory.ini site.yml --step

# Start at a specific task
ansible-playbook -i inventory.ini site.yml --start-at-task="Deploy config"

# List tasks without running
ansible-playbook -i inventory.ini site.yml --list-tasks

# List hosts that would be targeted
ansible-playbook -i inventory.ini site.yml --list-hosts
```

## Galaxy (`ansible-galaxy`)

```bash
# Install a role
ansible-galaxy role install geerlingguy.nginx

# Install a collection
ansible-galaxy collection install community.general
ansible-galaxy collection install amazon.aws

# Install from requirements file
ansible-galaxy install -r requirements.yml
ansible-galaxy collection install -r requirements.yml

# Init a new role scaffold
ansible-galaxy role init my_role

# List installed roles
ansible-galaxy role list
```

```yaml
# requirements.yml
roles:
  - name: geerlingguy.nginx
    version: 3.2.0
collections:
  - name: community.general
    version: ">=7.0.0"
  - name: amazon.aws
```

## Vault (`ansible-vault`)

```bash
# Encrypt a new file
ansible-vault encrypt secrets.yaml

# Decrypt a file
ansible-vault decrypt secrets.yaml

# View encrypted file without decrypting to disk
ansible-vault view secrets.yaml

# Edit encrypted file in-place
ansible-vault edit secrets.yaml

# Encrypt a single string (embed in playbook)
ansible-vault encrypt_string 'my-secret-password' --name 'db_password'

# Rekey (change vault password)
ansible-vault rekey secrets.yaml

# Run playbook with vault password
ansible-playbook site.yml --ask-vault-pass
ansible-playbook site.yml --vault-password-file ~/.vault_pass
```

## Inventory Commands (`ansible-inventory`)

```bash
# List all hosts as JSON
ansible-inventory -i inventory.ini --list

# Show inventory graph
ansible-inventory -i inventory.ini --graph

# Show variables for a specific host
ansible-inventory -i inventory.ini --host web1.example.com
```

## Best Practices

- Always use `--check --diff` before applying playbooks to production.
- Use `--limit` to test against one host before running all inventory.
- Store vault-encrypted files in version control; never commit plaintext secrets.
- Pin collection and role versions in `requirements.yml` for reproducibility.
- Use fully qualified collection names (FQCN) like `ansible.builtin.copy` to avoid ambiguity.

For advanced Ansible usage (AWX/Tower API, callback plugins, custom modules, event-driven Ansible), see <https://docs.ansible.com/ansible/latest/>.
