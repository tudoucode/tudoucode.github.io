param(
  [Parameter(Mandatory = $true)]
  [string] $InputPath,

  [string] $OutputPath = "",
  [int] $Crf = 30,
  [string] $Preset = "slow",
  [int] $AudioBitrateKbps = 128,
  [int64] $MaxBytes = 95MB
)

$ErrorActionPreference = "Stop"

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw "ffmpeg is required. Install it first, then run this script again."
}

if (-not $OutputPath) {
  $directory = Split-Path -Parent $resolvedInput
  $name = [System.IO.Path]::GetFileNameWithoutExtension($resolvedInput)
  $OutputPath = Join-Path $directory "$name-web.mp4"
}

$resolvedOutput = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
$outputDirectory = Split-Path -Parent $resolvedOutput
if (-not (Test-Path $outputDirectory)) {
  New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
}

ffmpeg `
  -y `
  -i $resolvedInput `
  -c:v libx264 `
  -crf $Crf `
  -preset $Preset `
  -pix_fmt yuv420p `
  -movflags +faststart `
  -c:a aac `
  -b:a "$($AudioBitrateKbps)k" `
  $resolvedOutput

$outputFile = Get-Item -LiteralPath $resolvedOutput
$sizeMb = [Math]::Round($outputFile.Length / 1MB, 2)
$limitMb = [Math]::Round($MaxBytes / 1MB, 2)

Write-Host "Output: $resolvedOutput"
Write-Host "Size: $sizeMb MB"

if ($outputFile.Length -gt $MaxBytes) {
  Write-Warning "The compressed video is still larger than $limitMb MB. Try a higher -Crf value, such as 32 or 34."
} else {
  Write-Host "OK: This file is below $limitMb MB and can be committed to GitHub."
}
