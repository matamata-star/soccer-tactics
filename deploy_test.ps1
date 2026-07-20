# Copy the working app into test/ to build the TEST version.
# Usage: powershell -ExecutionPolicy Bypass -File deploy_test.ps1
#   Then: git add test/ ; git commit ; git push
#   -> https://matamata-star.github.io/soccer-tactics/test/
#   (Production stays untouched as long as root files are not committed.)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$test = Join-Path $root "test"
New-Item -ItemType Directory -Force $test | Out-Null

Copy-Item (Join-Path $root "app.js") $test -Force
Copy-Item (Join-Path $root "style.css") $test -Force
Copy-Item (Join-Path $root "manifest.webmanifest") $test -Force
Copy-Item -Recurse -Force (Join-Path $root "icons") $test

# Mark title/body as TEST (the app skips ServiceWorker registration when data-env=test)
$html = [IO.File]::ReadAllText((Join-Path $root "index.html"), [Text.Encoding]::UTF8)
$html = $html.Replace('<title>', '<title>[TEST] ')
$html = $html.Replace('<body>', '<body data-env="test">')
[IO.File]::WriteAllText((Join-Path $test "index.html"), $html, (New-Object Text.UTF8Encoding($false)))
Write-Host "OK: $test (git add test/ ; commit ; push -> test URL)"
