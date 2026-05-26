[CmdletBinding()]
param(
    [switch]$Json,
    [switch]$IncludeExperimental
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-DockerCapture {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args
    )

    try {
        $output = & docker @Args 2>&1
        $exit = $LASTEXITCODE
    } catch {
        $output = $_.Exception.Message
        $exit = 1
    }

    [pscustomobject]@{
        Args     = ($Args -join ' ')
        ExitCode = $exit
        Output   = (($output | Out-String).Trim())
    }
}

function Get-ErrorCategory {
    param([string]$Message)

    if ([string]::IsNullOrWhiteSpace($Message)) { return 'none' }
    $m = $Message.ToLowerInvariant()

    if ($m -match 'appdata\\local\\docker\\log\\host' -and $m -match 'access is denied') { return 'sandbox_permission_boundary' }
    if ($m -match 'dockerdesktoplinuxengine' -and $m -match 'access is denied') { return 'daemon_pipe_permission_boundary' }
    if ($m -match 'permission denied while trying to connect to the docker api') { return 'daemon_socket_permission_boundary' }
    if ($m -match 'is docker desktop running') { return 'desktop_or_engine_not_running' }
    if ($m -match 'command not found' -or $m -match 'is not recognized') { return 'docker_cli_missing' }
    if ($m -match 'access is denied') { return 'host_permission_boundary' }

    return 'other'
}

function Parse-PluginNames {
    $help = Invoke-DockerCapture -Args @('--help')
    $plugins = @()

    foreach ($line in ($help.Output -split "`n")) {
        if ($line -match '^\s{2}([a-z0-9-]+)\*\s{2,}') {
            $plugins += $Matches[1]
        }
    }

    $plugins | Sort-Object -Unique
}

$dockerVersion = Invoke-DockerCapture -Args @('--version')
$versionJson = Invoke-DockerCapture -Args @('version', '--format', '{{json .}}')
$contextShow = Invoke-DockerCapture -Args @('context', 'show')
$contextList = Invoke-DockerCapture -Args @('context', 'ls', '--format', '{{json .}}')
$composeVersion = Invoke-DockerCapture -Args @('compose', 'version')
$buildxVersion = Invoke-DockerCapture -Args @('buildx', 'version')
$desktopVersion = Invoke-DockerCapture -Args @('desktop', 'version')
$scoutVersion = Invoke-DockerCapture -Args @('scout', 'version')
$daemonInfo = Invoke-DockerCapture -Args @('info')

$plugins = Parse-PluginNames
$contexts = @()
if ($contextList.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($contextList.Output)) {
    foreach ($line in ($contextList.Output -split "`n")) {
        $line = $line.Trim()
        if (-not $line) { continue }
        try { $contexts += ($line | ConvertFrom-Json) } catch { $contexts += [pscustomobject]@{ raw = $line } }
    }
}

$daemonCategory = if ($daemonInfo.ExitCode -eq 0) { 'reachable' } else { Get-ErrorCategory -Message $daemonInfo.Output }

$knownPluginChecks = @(
    @('agent', @('agent', '--help')),
    @('ai', @('ai', '--help')),
    @('buildx', @('buildx', 'version')),
    @('compose', @('compose', 'version')),
    @('debug', @('debug', '--help')),
    @('desktop', @('desktop', 'version')),
    @('extension', @('extension', '--help')),
    @('init', @('init', '--help')),
    @('mcp', @('mcp', 'version')),
    @('model', @('model', '--help')),
    @('offload', @('offload', 'version')),
    @('pass', @('pass', '--help')),
    @('sandbox', @('sandbox', '--help')),
    @('sbom', @('sbom', '--help')),
    @('scout', @('scout', 'version'))
)

$pluginHealth = @()
foreach ($entry in $knownPluginChecks) {
    $name = $entry[0]
    $args = $entry[1]
    $result = Invoke-DockerCapture -Args $args
    $pluginHealth += [pscustomobject]@{
        Name     = $name
        ExitCode = $result.ExitCode
        Healthy  = ($result.ExitCode -eq 0)
        Error    = if ($result.ExitCode -eq 0) { '' } else { $result.Output }
    }
}

$experimental = $null
if ($IncludeExperimental) {
    $experimental = [pscustomobject]@{
        SandboxVersion = (Invoke-DockerCapture -Args @('sandbox', 'version'))
        ScoutHelp      = (Invoke-DockerCapture -Args @('scout', '--help'))
        Notes          = 'Feature maturity varies by plugin and Desktop release; verify before workflow automation.'
    }
}

$result = [pscustomobject]@{
    timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
    host          = [pscustomobject]@{
        os           = $PSVersionTable.OS
        pwsh_version = $PSVersionTable.PSVersion.ToString()
        user         = $env:USERNAME
        working_dir  = (Get-Location).Path
    }
    docker        = [pscustomobject]@{
        cli_version_raw     = $dockerVersion.Output
        version_json_raw    = $versionJson.Output
        current_context     = $contextShow.Output
        compose_version_raw = $composeVersion.Output
        buildx_version_raw  = $buildxVersion.Output
        desktop_version_raw = $desktopVersion.Output
        scout_version_raw   = $scoutVersion.Output
        plugin_names        = $plugins
        plugin_health       = $pluginHealth
        contexts            = $contexts
    }
    daemon        = [pscustomobject]@{
        reachable      = ($daemonInfo.ExitCode -eq 0)
        category       = $daemonCategory
        info_raw       = $daemonInfo.Output
        recommendation = if ($daemonInfo.ExitCode -eq 0) {
            'Daemon reachable. Continue with normal diagnostics.'
        } else {
            'Treat daemon access separately from CLI availability. Verify Desktop status, active context, and permission boundaries.'
        }
    }
    contract      = [pscustomobject]@{
        script = 'probe-docker.ps1 [-Json] [-IncludeExperimental]'
        mode   = 'read-only diagnostics'
    }
    experimental  = $experimental
}

if ($Json) {
    $result | ConvertTo-Json -Depth 8
    exit 0
}

Write-Host '== Docker Probe =='
Write-Host "Timestamp (UTC): $($result.timestamp_utc)"
Write-Host "CLI: $($result.docker.cli_version_raw)"
Write-Host "Current Context: $($result.docker.current_context)"
Write-Host "Compose: $($result.docker.compose_version_raw)"
Write-Host "Buildx: $($result.docker.buildx_version_raw)"
Write-Host "Desktop Plugin: $($result.docker.desktop_version_raw)"
Write-Host "Scout Plugin: $($result.docker.scout_version_raw)"
Write-Host "Daemon Reachable: $($result.daemon.reachable)"
Write-Host "Daemon Category: $($result.daemon.category)"
if (-not $result.daemon.reachable -and $result.daemon.info_raw) {
    Write-Host "Daemon Error: $($result.daemon.info_raw)"
}

Write-Host "Detected Plugins: $([string]::Join(', ', $result.docker.plugin_names))"
Write-Host 'Unhealthy Plugin Checks:'
$bad = @($result.docker.plugin_health | Where-Object { -not $_.Healthy })
if ($bad.Count -eq 0) {
    Write-Host '  none'
} else {
    foreach ($item in $bad) {
        Write-Host "  $($item.Name): $($item.Error)"
    }
}

if ($IncludeExperimental) {
    Write-Host "Experimental Notes: $($result.experimental.Notes)"
}



