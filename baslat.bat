@echo off
rem Gunluk uygulamasini bu bilgisayarda baslatir ve tarayicida acar.
cd /d "%~dp0"
if not exist node_modules call npm install
rem Backend (FastAPI) icin Python paketleri eksikse kurulur.
python -c "import fastapi, httpx, uvicorn" 2>nul || python -m pip install -r requirements.txt
if not exist .next\BUILD_ID call npm run build
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3210"
call npm start
