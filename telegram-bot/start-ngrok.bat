@echo off
echo Starting ngrok tunnel on port 3000...
start /B ngrok http 3000
timeout /t 5 /nobreak > nul
echo.
echo Fetching ngrok URL...
curl -s http://localhost:4040/api/tunnels
echo.
echo Copy the HTTPS URL above and update .env file with WEBAPP_URL=https://xxxxx.ngrok-free.app
pause
