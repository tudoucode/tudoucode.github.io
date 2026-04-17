$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$portfolioDir = Join-Path $root "assets\portfolio"
$outputFile = Join-Path $root "portfolio.auto.js"

$imageExtensions = @(".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif")
$videoExtensions = @(".mp4", ".webm", ".mov", ".m4v")
$maxGitHubFileSize = 95MB

if (-not (Test-Path $portfolioDir)) {
  New-Item -ItemType Directory -Force -Path $portfolioDir | Out-Null
}

function Convert-NameToTitle {
  param([string] $Name)

  $title = [System.IO.Path]::GetFileNameWithoutExtension($Name)
  $title = $title -replace "[-_]+", " "
  return (Get-Culture).TextInfo.ToTitleCase($title)
}

function Get-RelativePath {
  param([string] $FullName)

  $relative = $FullName.Substring($root.Length + 1)
  return $relative -replace "\\", "/"
}

$files = Get-ChildItem -Path $portfolioDir -File |
  Where-Object {
    $extension = $_.Extension.ToLowerInvariant()
    ($imageExtensions + $videoExtensions) -contains $extension
  } |
  Where-Object {
    $_.Length -le $maxGitHubFileSize
  } |
  Where-Object {
    $_.BaseName -notmatch "(?i)(-cover|-poster|_cover|_poster)$"
  } |
  Sort-Object Name

$items = foreach ($file in $files) {
  $extension = $file.Extension.ToLowerInvariant()
  $isVideo = $videoExtensions -contains $extension
  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)

  $item = [ordered]@{
    title = Convert-NameToTitle $file.Name
    type = if ($isVideo) { "video" } else { "image" }
    category = if ($isVideo) { "AI Video" } else { "AI Image" }
    year = (Get-Date).Year.ToString()
    src = Get-RelativePath $file.FullName
    description = "Edit this description in site.config.js if needed."
  }

  if ($isVideo) {
    $posterNames = @(
      "$($baseName)-cover",
      "$($baseName)-poster",
      "$($baseName)_cover",
      "$($baseName)_poster"
    )

    $poster = Get-ChildItem -Path $portfolioDir -File |
      Where-Object {
        $posterExtension = $_.Extension.ToLowerInvariant()
        ($imageExtensions -contains $posterExtension) -and ($posterNames -contains $_.BaseName)
      } |
      Select-Object -First 1

    $item.poster = if ($poster) { Get-RelativePath $poster.FullName } else { "" }
  } else {
    $item.alt = Convert-NameToTitle $file.Name
  }

  [pscustomobject]$item
}

$json = $items | ConvertTo-Json -Depth 5
if (-not $json) {
  $json = "[]"
}

$content = "window.autoPortfolio = $json;`r`n"
[System.IO.File]::WriteAllText($outputFile, $content, [System.Text.UTF8Encoding]::new($false))

Write-Host "Synced $($items.Count) portfolio item(s) to portfolio.auto.js"
Write-Host "Portfolio folder: $portfolioDir"
