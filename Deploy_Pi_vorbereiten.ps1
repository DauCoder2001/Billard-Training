# Baut die App und legt das Ergebnis unter .\deploy\ ab.
# Der Inhalt von .\deploy\ kommt anschliessend in das Web-Verzeichnis des Pi.
#
# Aufruf:  .\Deploy_Pi_vorbereiten.ps1
#          .\Deploy_Pi_vorbereiten.ps1 -SkipBuild      (nur neu kopieren)

param(
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist   = Join-Path $root 'dist'
$deploy = Join-Path $root 'deploy'

Write-Host ''
Write-Host 'Billard Training - Deploy vorbereiten' -ForegroundColor Cyan
Write-Host '-------------------------------------'

if (-not $SkipBuild) {
    Write-Host 'Baue die App ...'
    Push-Location $root
    try {
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build ist mit Code $LASTEXITCODE fehlgeschlagen." }
    }
    finally {
        Pop-Location
    }
}

if (-not (Test-Path $dist)) {
    throw "Es gibt kein dist-Verzeichnis. Bitte zuerst ohne -SkipBuild starten."
}

if (Test-Path $deploy) {
    Remove-Item -Recurse -Force $deploy
}
New-Item -ItemType Directory -Path $deploy | Out-Null

Copy-Item -Path (Join-Path $dist '*') -Destination $deploy -Recurse -Force

$files = Get-ChildItem -Path $deploy -Recurse -File
$bytes = ($files | Measure-Object -Property Length -Sum).Sum

Write-Host ''
Write-Host ("Fertig: {0} Dateien, {1:N1} MB" -f $files.Count, ($bytes / 1MB)) -ForegroundColor Green
Write-Host "Ordner: $deploy"
Write-Host ''
Write-Host 'Naechster Schritt - Inhalt auf den Pi kopieren, zum Beispiel:' -ForegroundColor Yellow
Write-Host '  scp -r .\deploy\* pi@raspberrypi:/var/www/html/billard/'
Write-Host ''
Write-Host 'Hinweis: Die App nutzt relative Pfade und einen Hash-Router und'
Write-Host 'laeuft daher auch in einem Unterverzeichnis. Der Offline-Modus'
Write-Host 'braucht HTTPS oder localhost; ueber http:// im WLAN registriert'
Write-Host 'der Browser keinen Service Worker.'
Write-Host ''
