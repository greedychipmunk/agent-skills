[CmdletBinding()]
param(
    [switch]$Quick,
    [switch]$IncludeOffload,
    [switch]$IncludeScout
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

function Classify-Error {
    param([string]$Message)

    if ([string]::IsNullOrWhiteSpace($Message)) { return 'none' }
    $m = $Message.ToLowerInvariant()

    if ($m -match 'appdata\\local\\docker\\log\\host' -and $m -match 'access is denied') { return 'sandbox_permission_boundary' }
    if ($m -match 'dockerdesktoplinuxengine' -and $m -match 'access is denied') { return 'daemon_pipe_permission_boundary' }
    if ($m -match 'permission denied while trying to connect to the docker api') { return 'daemon_socket_permission_boundary' }
    if ($m -match 'is docker desktop running') { return 'desktop_or_engine_not_running' }
    if ($m -match 'is not recognized' -or $m -match 'command not found') { return 'docker_cli_missing' }
    if ($m -match 'access is denied') { return 'host_permission_boundary' }

    return 'other'
}

function Add-Check {
    param(
        [System.Collections.Generic.List[object]]$Checks,
        [string]$Name,
        [object]$Result,
        [string]$SuccessHint,
        [string]$FailureHint
    )

    $ok = ($Result.ExitCode -eq 0)
    $Checks.Add([pscustomobject]@{
        Name           = $Name
        Status         = if ($ok) { 'PASS' } else { 'WARN' }
        Category       = if ($ok) { 'healthy' } else { (Classify-Error -Message $Result.Output) }
        Command        = $Result.Args
        Details        = $Result.Output
        Recommendation = if ($ok) { $SuccessHint } else { $FailureHint }
    }) | Out-Null
}

$checks = New-Object System.Collections.Generic.List[object]

$dockerVersion = Invoke-DockerCapture -Args @('--version')
Add-Check -Checks $checks -Name 'Docker CLI' -Result $dockerVersion `
    -SuccessHint 'CLI is available.' `
    -FailureHint 'Install or repair Docker Desktop/CLI before deeper diagnostics.'

if (-not $Quick) {
    $contextList = Invoke-DockerCapture -Args @('context', 'ls')
    Add-Check -Checks $checks -Name 'Context Listing' -Result $contextList `
        -SuccessHint 'Contexts are discoverable.' `
        -FailureHint 'Inspect Docker config and context metadata files.'

    $currentContext = Invoke-DockerCapture -Args @('context', 'show')
    Add-Check -Checks $checks -Name 'Current Context' -Result $currentContext `
        -SuccessHint 'Current context is readable.' `
        -FailureHint 'Set context explicitly with docker context use <name>.'
}

$daemon = Invoke-DockerCapture -Args @('info')
Add-Check -Checks $checks -Name 'Daemon Reachability' -Result $daemon `
    -SuccessHint 'Daemon is reachable.' `
    -FailureHint 'Differentiate permission boundary vs engine-not-running before changing config.'

$composeVersion = Invoke-DockerCapture -Args @('compose', 'version')
Add-Check -Checks $checks -Name 'Compose Plugin' -Result $composeVersion `
    -SuccessHint 'Compose plugin is available.' `
    -FailureHint 'Reinstall or enable Compose plugin in Docker Desktop.'

$buildxVersion = Invoke-DockerCapture -Args @('buildx', 'version')
Add-Check -Checks $checks -Name 'Buildx Plugin' -Result $buildxVersion `
    -SuccessHint 'Buildx plugin is available.' `
    -FailureHint 'Repair Buildx plugin or Docker Desktop installation.'

$desktopStatus = Invoke-DockerCapture -Args @('desktop', 'status')
Add-Check -Checks $checks -Name 'Desktop Status' -Result $desktopStatus `
    -SuccessHint 'Desktop command path is healthy.' `
    -FailureHint 'Start/restart Docker Desktop and re-check daemon pipe access.'

if ($IncludeScout) {
    $scoutVersion = Invoke-DockerCapture -Args @('scout', 'version')
    Add-Check -Checks $checks -Name 'Scout Plugin' -Result $scoutVersion `
        -SuccessHint 'Scout plugin is available.' `
        -FailureHint 'Enable or reinstall Scout plugin before vulnerability scans.'
}

if ($IncludeOffload) {
    $offloadVersion = Invoke-DockerCapture -Args @('offload', 'version')
    Add-Check -Checks $checks -Name 'Offload Plugin' -Result $offloadVersion `
        -SuccessHint 'Offload plugin is available.' `
        -FailureHint 'Install/update Offload plugin or Docker Desktop components.'

    $offloadStatus = Invoke-DockerCapture -Args @('offload', 'status')
    Add-Check -Checks $checks -Name 'Offload Status' -Result $offloadStatus `
        -SuccessHint 'Offload status can be queried.' `
        -FailureHint 'Check authentication, org entitlement, and network connectivity for Offload.'
}

$permissionFindings = @($checks | Where-Object {
    $_.Category -in @(
        'sandbox_permission_boundary',
        'daemon_pipe_permission_boundary',
        'daemon_socket_permission_boundary'
    )
})

$configFindings = @($checks | Where-Object { $_.Category -in @('desktop_or_engine_not_running', 'other') })

Write-Host '== Docker Doctor =='
Write-Host 'Contract: doctor-docker.ps1 [-Quick] [-IncludeOffload] [-IncludeScout]'
Write-Host ''

foreach ($c in $checks) {
    Write-Host ("[{0}] {1}" -f $c.Status, $c.Name)
    Write-Host ("  Command: {0}" -f $c.Command)
    Write-Host ("  Category: {0}" -f $c.Category)
    if ($c.Details) {
        Write-Host ("  Details: {0}" -f $c.Details)
    }
    Write-Host ("  Recommendation: {0}" -f $c.Recommendation)
    Write-Host ''
}

Write-Host 'Root-Cause Summary:'
if ($permissionFindings.Count -gt 0) {
    Write-Host '- Permission boundary issues detected (sandbox or host socket/pipe access).'
}
if ($configFindings.Count -gt 0) {
    Write-Host '- Service/configuration issues detected (Desktop status, context, or plugin health).'
}
if ($permissionFindings.Count -eq 0 -and $configFindings.Count -eq 0) {
    Write-Host '- No major issues detected in this diagnostic scope.'
}

Write-Host ''
Write-Host 'Next Verification Commands:'
Write-Host '- docker context ls'
Write-Host '- docker info'
Write-Host '- docker compose version'
if ($IncludeScout) {
    Write-Host '- docker scout quickview <image>'
}
if ($IncludeOffload) {
    Write-Host '- docker offload status'
}



