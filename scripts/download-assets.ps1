# Download all assets listed in manifest-assets.txt
# Skips comment lines (starting with #) and blank lines
# Run from the project root: .\scripts\download-assets.ps1

$manifest = Join-Path $PSScriptRoot "..\manifest-assets.txt"

Get-Content $manifest | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq '' -or $line -match '^#') { return }

    $parts = $line -split '\s+', 2
    if ($parts.Count -lt 2) { return }

    $filepath = $parts[0]
    $url      = $parts[1]

    $dir = Split-Path $filepath
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }

    Write-Host "Downloading $filepath ..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $filepath -UseBasicParsing
    } catch {
        Write-Warning "Failed: $url`n  $_"
    }
}

Write-Host "Done."
