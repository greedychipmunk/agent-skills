# helm — Chart Authoring

## Chart Scaffold

```bash
# Create a new chart
helm create mychart

# Resulting structure:
# mychart/
#   Chart.yaml          — chart metadata
#   values.yaml         — default values
#   charts/             — chart dependencies
#   templates/          — Kubernetes manifest templates
#   templates/NOTES.txt — post-install notes (printed to stdout)
#   templates/_helpers.tpl — named templates (partials)
```

## Chart.yaml Required Fields

```yaml
apiVersion: v2          # Helm 3 charts use v2
name: mychart           # chart name (must match directory name)
version: 0.1.0          # chart version (SemVer)
appVersion: "1.16.0"    # version of the application being packaged
```

Optional fields:

```yaml
description: A Helm chart for myapp
type: application       # or "library" for shared template charts
keywords:
  - myapp
home: https://myapp.example.com
sources:
  - https://github.com/myorg/myapp
maintainers:
  - name: My Name
    email: me@example.com
dependencies:
  - name: postgresql
    version: "13.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
```

## values.yaml

Default values are defined in `values.yaml` and can be overridden by users:

```yaml
replicaCount: 1

image:
  repository: nginx
  tag: "latest"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

Values hierarchy (highest to lowest priority):

1. `--set` flags
2. `-f custom-values.yaml` (last file wins)
3. `values.yaml` in chart

## Template Syntax

Templates use Go `text/template` with Helm's Sprig functions:

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mychart.fullname" . }}
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "mychart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "mychart.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.service.port }}
```

## Built-in Objects

| Object | Description |
| --- | --- |
| `.Release.Name` | Name of the release |
| `.Release.Namespace` | Namespace of the release |
| `.Release.IsInstall` | True on first install |
| `.Release.IsUpgrade` | True on upgrade |
| `.Values` | Values from values.yaml and overrides |
| `.Chart` | Contents of Chart.yaml |
| `.Capabilities.KubeVersion` | Kubernetes version |

## _helpers.tpl and Named Templates

```go
{{/*
Expand the name of the chart.
*/}}
{{- define "mychart.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "mychart.labels" -}}
helm.sh/chart: {{ include "mychart.chart" . }}
{{ include "mychart.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
```

Use named templates with `include`:

```yaml
labels:
  {{- include "mychart.labels" . | nindent 4 }}
```

## NOTES.txt

Displayed after `helm install` or `helm upgrade`:

```text
Thank you for installing {{ .Chart.Name }}.

Your release is named {{ .Release.Name }}.

To get the application URL:
  kubectl get svc --namespace {{ .Release.Namespace }} {{ include "mychart.fullname" . }}
```

## Lint and Package

```bash
# Lint chart for errors and best practices
helm lint ./mychart

# Lint with specific values
helm lint ./mychart -f custom-values.yaml

# Package chart into .tgz archive
helm package ./mychart

# Package with specific version
helm package ./mychart --version 1.2.3
```

## Dependencies

```bash
# Add dependency to Chart.yaml, then fetch
helm dependency update ./mychart

# List dependencies
helm dependency list ./mychart

# Build dependencies (use vendored charts in charts/)
helm dependency build ./mychart
```
