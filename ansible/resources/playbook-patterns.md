# Ansible Playbook Patterns

## Play Structure

```yaml
# site.yml
---
- name: Configure web servers
  hosts: web
  become: true        # run tasks as root via sudo
  gather_facts: true

  vars:
    app_port: 8080

  vars_files:
    - group_vars/web.yaml

  handlers:
    - name: Restart nginx
      ansible.builtin.service:
        name: nginx
        state: restarted

  tasks:
    - name: Install nginx
      ansible.builtin.package:
        name: nginx
        state: present
      notify: Restart nginx

    - name: Deploy config
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        mode: "0644"
      notify: Restart nginx
```

## Common Modules

| Module | Use |
| --- | --- |
| `ansible.builtin.package` | Install/remove OS packages (distro-agnostic) |
| `ansible.builtin.apt` | Debian/Ubuntu package management |
| `ansible.builtin.dnf` | RHEL/Fedora package management |
| `ansible.builtin.service` | Start/stop/enable services |
| `ansible.builtin.copy` | Copy files to managed nodes |
| `ansible.builtin.template` | Render Jinja2 templates and copy |
| `ansible.builtin.file` | Manage files, directories, symlinks |
| `ansible.builtin.user` | Create/modify OS users |
| `ansible.builtin.group` | Create/modify OS groups |
| `ansible.builtin.command` | Run commands (no shell expansion) |
| `ansible.builtin.shell` | Run shell commands (use sparingly) |
| `ansible.builtin.lineinfile` | Ensure a line exists in a file |
| `ansible.builtin.stat` | Check file existence and attributes |
| `ansible.builtin.uri` | HTTP requests |
| `ansible.builtin.git` | Clone or update git repositories |

## Conditionals (`when`)

```yaml
- name: Install epel-release on RHEL
  ansible.builtin.package:
    name: epel-release
    state: present
  when: ansible_os_family == "RedHat"

- name: Start service only if port is open
  ansible.builtin.service:
    name: myapp
    state: started
  when: app_port is defined and app_port | int > 0
```

## Loops

```yaml
- name: Create multiple users
  ansible.builtin.user:
    name: "{{ item }}"
    state: present
  loop:
    - alice
    - bob
    - charlie

- name: Install packages with versions
  ansible.builtin.package:
    name: "{{ item.name }}"
    state: "{{ item.state }}"
  loop:
    - { name: nginx, state: present }
    - { name: apache2, state: absent }
```

## Register & Debug

```yaml
- name: Check if service is running
  ansible.builtin.command: systemctl is-active nginx
  register: nginx_status
  ignore_errors: true

- name: Show result
  ansible.builtin.debug:
    msg: "nginx status: {{ nginx_status.stdout }}"

- name: Fail if not running
  ansible.builtin.fail:
    msg: "nginx is not running"
  when: nginx_status.rc != 0
```

## Tags

```yaml
- name: Install packages
  ansible.builtin.package:
    name: nginx
    state: present
  tags:
    - packages
    - nginx

- name: Deploy config
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  tags:
    - config
    - nginx
```

```bash
# Run only tagged tasks
ansible-playbook site.yml --tags "config"
ansible-playbook site.yml --skip-tags "packages"
```

## Roles

```text
roles/
└── nginx/
    ├── defaults/
    │   └── main.yml    # default variable values
    ├── tasks/
    │   └── main.yml    # task list
    ├── handlers/
    │   └── main.yml    # handlers
    ├── templates/
    │   └── nginx.conf.j2
    ├── files/
    │   └── index.html
    └── vars/
        └── main.yml    # role-internal variables
```

```yaml
# site.yml — using roles
- hosts: web
  become: true
  roles:
    - nginx
    - { role: app, app_port: 8080 }
```

For advanced playbook patterns (blocks/rescue/always, async tasks, strategy plugins, AWX/Tower integration), see <https://docs.ansible.com/ansible/latest/playbook_guide/>.
