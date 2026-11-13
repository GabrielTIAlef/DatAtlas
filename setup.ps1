param([string]$PythonExe = '')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path '.venv\Scripts\python.exe')) {
    if (-not $PythonExe) {
        $PythonExe = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312\python.exe'
        if (-not (Test-Path -LiteralPath $PythonExe)) { throw 'Informe o Python 3.12 com -PythonExe C:\caminho\python.exe' }
    }
    & $PythonExe -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o ambiente Python.' }
}
& .\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar as bibliotecas.' }
Write-Host 'Pronto. Abra Iniciar.cmd. A interface compilada ja esta incluida.'
