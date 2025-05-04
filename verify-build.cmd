@echo off
REM Build verification script for Windows

REM Clean up node_modules and package-lock.json to ensure a fresh start
echo Cleaning up existing node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f package-lock.json

REM Install dependencies with --legacy-peer-deps
echo Installing dependencies with --legacy-peer-deps...
npm install --legacy-peer-deps

REM Run the build
echo Running build...
npm run build

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
  echo Build successful! You can now deploy to Vercel.
  exit /b 0
) else (
  echo Build failed. Please check the error messages above.
  exit /b 1
)
