$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$projectPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $projectPython)) {
    Write-Host 'Execute primeiro: powershell -NoProfile -ExecutionPolicy Bypass -File .\setup.ps1'
    exit 1
}
Write-Host 'DatAtlas - Analise de Dados'
Write-Host 'Abra http://127.0.0.1:8012 no navegador. Ctrl+C encerra.'
& $projectPython -m uvicorn backend.main:app --host 127.0.0.1 --port 8012 --limit-concurrency 8 --timeout-keep-alive 5 --no-access-log
