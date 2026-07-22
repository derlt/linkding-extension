@echo off
setlocal enabledelayedexpansion

set EXTENSION_NAME=linkding
set DIST_DIR=dist
set MANIFEST_FILE=manifest.json
set INCLUDE_ITEMS=manifest.json build icons options popup styles

echo Updating dependencies...
call npm install

echo Building...
call npm run build

echo Creating dist directory...
if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"

if not exist "%MANIFEST_FILE%" (
    echo Error: %MANIFEST_FILE% not found
    exit /b 1
)

for /f "tokens=2 delims=:, " %%a in ('findstr "version" "%MANIFEST_FILE%"') do set VERSION=%%a
set VERSION=%VERSION:"=%

if "%VERSION%"=="" (
    echo Error: Could not extract version from %MANIFEST_FILE%.
    exit /b 1
)

set ZIP_FILE=%DIST_DIR%\%EXTENSION_NAME%-%VERSION%.zip

echo Packaging extension version %VERSION% into %ZIP_FILE%...
powershell -Command "Compress-Archive -Path manifest.json,build,icons,options,popup,styles -DestinationPath '%ZIP_FILE%' -Force"

if exist "%ZIP_FILE%" (
    echo Done
) else (
    echo Error: Failed to create archive
    exit /b 1
)
