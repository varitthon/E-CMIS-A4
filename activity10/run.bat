@echo off
cd /d "%~dp0"
echo Starting E-CMIS activity10 server on http://localhost:8811 ...
start "E-CMIS Server (close this window to stop)" cmd /k python -m http.server 8811
timeout /t 2 /nobreak >nul
start http://localhost:8811/index.html
