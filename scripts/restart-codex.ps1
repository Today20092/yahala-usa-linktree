param(
    [int]$DelaySeconds = 3,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$log = Join-Path $env:LOCALAPPDATA 'Codex-restart.log'

function Write-Log($message) {
    "$(Get-Date -Format o) $message" | Add-Content -LiteralPath $log
}

$app = Get-StartApps | Where-Object AppID -Like 'OpenAI.Codex_*!App' | Select-Object -First 1
$main = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq 'ChatGPT.exe' -and $_.CommandLine -notmatch '--type=' } |
    Select-Object -First 1

if (-not $app) { throw 'The installed OpenAI Codex application was not found.' }
if (-not $main) { throw 'The running Codex application process was not found.' }

Write-Log "Found $($app.AppID), PID $($main.ProcessId)."
if ($DryRun) {
    Write-Output "Ready to restart $($app.AppID), PID $($main.ProcessId). Log: $log"
    exit 0
}

Start-Sleep -Seconds $DelaySeconds
Get-Process ChatGPT -ErrorAction SilentlyContinue | Stop-Process -Force

$deadline = (Get-Date).AddSeconds(20)
while ((Get-Process ChatGPT -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 250
}
if (Get-Process ChatGPT -ErrorAction SilentlyContinue) {
    throw 'Codex did not stop within 20 seconds.'
}

Start-Process explorer.exe "shell:AppsFolder\$($app.AppID)"

$deadline = (Get-Date).AddSeconds(30)
do {
    Start-Sleep -Milliseconds 500
    $restarted = Get-CimInstance Win32_Process |
        Where-Object {
            $_.Name -eq 'ChatGPT.exe' -and
            $_.CommandLine -notmatch '--type=' -and
            $_.ProcessId -ne $main.ProcessId
        } |
        Select-Object -First 1
} until ($restarted -or (Get-Date) -ge $deadline)

if (-not $restarted) { throw 'Codex did not restart within 30 seconds.' }
Write-Log "Restart verified, new PID $($restarted.ProcessId)."
