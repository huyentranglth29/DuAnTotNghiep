# Build & install Android app on Windows (short path + x86_64 emulator)
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$driveLetter = "Z:"

subst $driveLetter /D 2>$null | Out-Null
subst $driveLetter $projectRoot

if (-not (Test-Path "$driveLetter\android\gradlew.bat")) {
  Write-Error "Cannot map drive $driveLetter - check project path."
}

$env:GRADLE_USER_HOME = "C:\gradle"
Set-Location "$driveLetter\android"

Write-Host ">> Building x86_64 for Android Emulator..." -ForegroundColor Cyan
& .\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=x86_64

if ($LASTEXITCODE -ne 0) {
  Write-Error "Build failed."
}

Write-Host ">> Installed. Launching app..." -ForegroundColor Green
adb shell am force-stop com.duantotnghiep 2>$null | Out-Null
adb shell am start -n com.duantotnghiep/.MainActivity

Write-Host ">> Done. Run mock-api and npm start in separate terminals." -ForegroundColor Green
