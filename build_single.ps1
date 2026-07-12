# CSS/JS を index.html に埋め込んだ単一HTMLファイルを dist/ に生成する
# 使い方: powershell -ExecutionPolicy Bypass -File build_single.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$html = [IO.File]::ReadAllText((Join-Path $root "index.html"), [Text.Encoding]::UTF8)
$css  = [IO.File]::ReadAllText((Join-Path $root "style.css"),  [Text.Encoding]::UTF8)
$js   = [IO.File]::ReadAllText((Join-Path $root "app.js"),     [Text.Encoding]::UTF8)

# PWA関連のリンクは単一ファイルでは不要なので除去
$html = $html -replace '\s*<link rel="manifest"[^>]*>', ''
$html = $html -replace '\s*<link rel="apple-touch-icon"[^>]*>', ''
$html = $html -replace '\s*<link rel="icon"[^>]*>', ''

# CSS / JS をインライン化（literal置換）
$html = $html.Replace('<link rel="stylesheet" href="style.css">', "<style>`n$css`n  </style>")
$html = $html.Replace('<script src="app.js"></script>', "<script>`n$js`n  </script>")

$dist = Join-Path $root "dist"
New-Item -ItemType Directory -Force $dist | Out-Null
$out = Join-Path $dist "soccer-tactics.html"
[IO.File]::WriteAllText($out, $html, (New-Object Text.UTF8Encoding($false)))
Write-Host "OK: $out"
