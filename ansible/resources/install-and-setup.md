# Ansible Install & Setup

## Prerequisites

- **Control node:** Linux or macOS with Python 3.9+; Windows WSL2 or container
- **Managed nodes:** SSH access (Linux) or WinRM (Windows); Python 2.7+ or 3.5+ on target
- No agents or daemons needed on managed nodes

## Install Ansible

### pip (recommended — always gets latest)

```bash
pip install ansible
# Or for a user install:
pip install --user ansible

ansible --version
```

### Ubuntu/Debian (apt)

```bash
sudo apt update
sudo apt install software-properties-common
sudo add-apt-repository --yes --update ppa:ansible/ansible
sudo apt install ansible
```

### RHEL/Fedora (dnf)

```bash
sudo dnf install ansible
```

### macOS (Homebrew)

```bash
brew install ansible
```

## SSH Key Setup

Ansible uses SSH to connect to managed nodes. Set up key-based authentication:

```bash
# Generate SSH key (if needed)
ssh-keygen -t ed25519 -C "ansible-control"

# Copy public key to managed nodes
ssh-copy-id ansible@web1.example.com
ssh-copy-id ansible@db1.example.com

# Test SSH connectivity
ssh ansible@web1.example.com
```

## `ansible.cfg` Essentials

Create `ansible.cfg` in your project directory (takes precedence over `/etc/ansible/ansible.cfg`):

```ini
[defaults]
inventory       = inventory/
remote_user     = ansible
private_key_file = ~/.ssh/ansible_ed25519
host_key_checking = False        # disable for dynamic cloud environments
retry_files_enabled = False
stdout_callback = yaml            # cleaner output

[privilege_escalation]
become          = False           # default off; enable per task/play with become: true
become_method   = sudo
```

## Post-Install Verification

```bash
# Check version and Python interpreter
ansible --version

# Ping localhost
ansible localhost -m ping

# Ping all inventory hosts
ansible all -i inventory.ini -m ping
```

Expected ping output:

```json
web1.example.com | SUCCESS => {
    "ping": "pong"
}
```

## Troubleshooting

- **"Permission denied (publickey)"** — SSH key not on target; run `ssh-copy-id`.
- **"Python not found"** — install Python on target, or set `ansible_python_interpreter=/usr/bin/python3`.
- **"Host key verification failed"** — set `host_key_checking = False` in `ansible.cfg` or accept the host key manually.
