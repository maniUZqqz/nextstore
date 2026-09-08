@echo off
REM ===========================================================================
REM  NextStore - Launcher
REM ---------------------------------------------------------------------------
REM  This file is only a thin wrapper. All the real work happens in
REM  scripts\run.ps1 because Windows batch files handle UTF-8 (Persian)
REM  text poorly, while PowerShell handles it correctly.
REM
REM  Usage:
REM    run.bat            check dependencies and start both servers
REM    run.bat -Fresh     rebuild the database from scratch and reseed
REM    run.bat -Prod      run the frontend in production mode
REM    run.bat -Force     free a busy port without asking first
REM    run.bat -Stop      stop the running servers
REM ===========================================================================

setlocal

REM ---------------------------------------------------------------------------
REM  Console code page
REM ---------------------------------------------------------------------------
REM  Switch to UTF-8 so Persian output renders instead of turning into "?????".
REM  The script sets [Console]::OutputEncoding itself as well, so this is only
REM  the first of two layers - but it is the one that also fixes the *font*
REM  fallback in the legacy console host.
REM
REM  The previous code page is saved and restored on exit; leaving the window
REM  stuck in 65001 breaks other tools people run in the same window afterwards.
REM ---------------------------------------------------------------------------
for /f "tokens=2 delims=:" %%a in ('chcp') do set "_OLDCP=%%a"
set "_OLDCP=%_OLDCP: =%"
chcp 65001 >nul 2>&1

REM ---------------------------------------------------------------------------
REM  Locate PowerShell
REM ---------------------------------------------------------------------------
REM  Without this check, a machine missing powershell.exe shows the cryptic
REM  "'powershell' is not recognized" line and a bare exit code, which tells
REM  the user nothing about what to do next.
REM ---------------------------------------------------------------------------
where powershell.exe >nul 2>&1
if errorlevel 1 (
    echo.
    echo   [X] Windows PowerShell was not found on this machine.
    echo       NextStore's launcher needs it. It ships with Windows 7 and newer;
    echo       if it was removed, reinstall it or run the commands in
    echo       README.md by hand.
    echo.
    goto :restore_and_pause
)

REM  Verify the real script is present before handing off.
if not exist "%~dp0scripts\run.ps1" (
    echo.
    echo   [X] scripts\run.ps1 is missing.
    echo       Expected at: %~dp0scripts\run.ps1
    echo       Re-download the project or restore the file from git.
    echo.
    goto :restore_and_pause
)

REM ---------------------------------------------------------------------------
REM  Hand off to PowerShell
REM ---------------------------------------------------------------------------
REM  -NoProfile keeps a user's custom profile from changing behaviour here.
REM  %* forwards -Fresh / -Stop / -Prod / -Force straight through.
REM ---------------------------------------------------------------------------
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run.ps1" %*
set "_CODE=%ERRORLEVEL%"

if "%_CODE%"=="0" goto :restore_and_exit

REM ---------------------------------------------------------------------------
REM  Explain the failure
REM ---------------------------------------------------------------------------
REM  A bare "Exit code: 1" is useless to whoever double-clicked this file.
REM  Each code the script can return gets a sentence saying what to do.
REM  Kept in English on purpose: this branch runs *after* the code page may
REM  have been restored, so Persian here is the one place it could still
REM  come out garbled.
REM ---------------------------------------------------------------------------
echo.
if "%_CODE%"=="1" (
    echo   [X] Missing prerequisites - see the list above for what to install.
) else if "%_CODE%"=="2" (
    echo   [X] Project folders are missing or incomplete.
    echo       Expected nextstore-api\ and nextstore-web\ next to this file.
) else if "%_CODE%"=="3" (
    echo   [X] A required port is still busy.
    echo       Try:  run.bat -Stop       stop NextStore's own servers
    echo             run.bat -Force      close whatever holds the port
) else if "%_CODE%"=="4" (
    echo   [X] A service started but never became healthy.
    echo       The last lines of its log are printed above; the full logs
    echo       are in the .logs folder.
) else if "%_CODE%"=="9" (
    echo   [X] Unexpected error - details are printed above.
) else (
    echo   [X] The launcher stopped with exit code %_CODE%.
)
echo.

:restore_and_pause
REM  Keep the window open when launched by double-click so errors stay readable.
if defined _OLDCP chcp %_OLDCP% >nul 2>&1
pause
exit /b 1

:restore_and_exit
if defined _OLDCP chcp %_OLDCP% >nul 2>&1
exit /b 0
