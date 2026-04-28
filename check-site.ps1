$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$maxFileSize = 95MB
$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Add-Error {
  param([string] $Message)
  $errors.Add($Message) | Out-Null
}

function Add-Warning {
  param([string] $Message)
  $warnings.Add($Message) | Out-Null
}

function Get-DeployFiles {
  $allFiles = Get-ChildItem -Path $root -Recurse -File |
    Where-Object { $_.FullName -notmatch "\\\.git\\" }

  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    return $allFiles | ForEach-Object { $_.FullName }
  }

  $deployFiles = New-Object System.Collections.Generic.List[string]
  Push-Location $root
  try {
    foreach ($file in $allFiles) {
      $relative = Resolve-Path -LiteralPath $file.FullName -Relative
      git check-ignore -q -- $relative
      if ($LASTEXITCODE -eq 0) {
        continue
      }
      $deployFiles.Add($file.FullName) | Out-Null
    }
  } finally {
    Pop-Location
  }

  return $deployFiles
}

function Resolve-LocalReference {
  param(
    [string] $HtmlFile,
    [string] $Reference
  )

  if (-not $Reference) { return $null }
  if ($Reference.StartsWith("#")) { return $null }
  if ($Reference -match "^(https?:|mailto:|tel:|data:|javascript:)") { return $null }

  $clean = ($Reference -split "#", 2)[0]
  $clean = ($clean -split "\?", 2)[0]
  if (-not $clean) { return $null }

  $base = Split-Path -Parent $HtmlFile
  return [System.IO.Path]::GetFullPath((Join-Path $base $clean))
}

$deployFiles = @(Get-DeployFiles)

foreach ($file in $deployFiles) {
  if (-not (Test-Path -LiteralPath $file)) { continue }
  $item = Get-Item -LiteralPath $file
  if ($item.Length -gt $maxFileSize) {
    $sizeMb = [Math]::Round($item.Length / 1MB, 2)
    $relative = Resolve-Path -LiteralPath $item.FullName -Relative
    Add-Error "$relative is $sizeMb MB. GitHub Pages deploy files should stay below 95 MB."
  }
}

$textFiles = $deployFiles | Where-Object { $_ -match "\.(html|js|css|md)$" -and (Test-Path -LiteralPath $_) }
$badTextPatterns = @(
  "\?\?\?",
  "\uFFFD",
  "Ã",
  "Â"
)

foreach ($file in $textFiles) {
  $content = Get-Content -LiteralPath $file -Raw -Encoding UTF8
  foreach ($pattern in $badTextPatterns) {
    if ($content -match $pattern) {
      $relative = Resolve-Path -LiteralPath $file -Relative
      Add-Error "$relative contains suspicious text or encoding residue: $pattern"
      break
    }
  }
}

$htmlFiles = $deployFiles | Where-Object { $_ -match "\.html$" -and (Test-Path -LiteralPath $_) }
foreach ($htmlFile in $htmlFiles) {
  $content = Get-Content -LiteralPath $htmlFile -Raw -Encoding UTF8
  $matches = [regex]::Matches($content, '\b(?:href|src)="([^"]+)"')

  foreach ($match in $matches) {
    $target = Resolve-LocalReference -HtmlFile $htmlFile -Reference $match.Groups[1].Value
    if (-not $target) { continue }
    if (-not (Test-Path -LiteralPath $target)) {
      $relativeHtml = Resolve-Path -LiteralPath $htmlFile -Relative
      Add-Error "$relativeHtml references missing file: $($match.Groups[1].Value)"
    }
  }
}

$sitemapPath = Join-Path $root "sitemap.xml"
$robotsPath = Join-Path $root "robots.txt"
if (-not (Test-Path -LiteralPath $sitemapPath)) {
  Add-Warning "sitemap.xml not found. Run generate-articles.ps1 before deploying."
}
if (-not (Test-Path -LiteralPath $robotsPath)) {
  Add-Warning "robots.txt not found. Run generate-articles.ps1 before deploying."
} else {
  $robots = Get-Content -LiteralPath $robotsPath -Raw -Encoding UTF8
  if ($robots -notmatch "Sitemap:") {
    Add-Warning "robots.txt does not declare a Sitemap URL."
  }
}

if (Get-Command node -ErrorAction SilentlyContinue) {
  Push-Location $root
  try {
    foreach ($script in @("script.js", "site.config.js", "portfolio.auto.js", "search-index.js")) {
      if (Test-Path -LiteralPath $script) {
        node --check $script | Out-Null
        if ($LASTEXITCODE -ne 0) {
          Add-Error "node --check failed for $script"
        }
      }
    }
  } finally {
    Pop-Location
  }
} else {
  Add-Warning "Node.js not found; skipped JavaScript syntax checks."
}

if ($warnings.Count -gt 0) {
  Write-Host "Warnings:" -ForegroundColor Yellow
  $warnings | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
}

if ($errors.Count -gt 0) {
  Write-Host "Site check failed:" -ForegroundColor Red
  $errors | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host "Site check passed." -ForegroundColor Green
