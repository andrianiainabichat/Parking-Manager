@echo off
echo.
echo ============================================
echo  PARKING MANAGER - Demarrage
echo ============================================
echo.

echo Installation des dependances backend...
cd backend
call npm install
cd ..

echo Installation des dependances frontend...
cd frontend
call npm install
cd ..

echo.
echo IMPORTANT:
echo  - Configurez backend\.env avec vos identifiants MySQL
echo  - Executez backend\config\init.sql dans MySQL
echo.
echo Demarrage...
echo  Backend  -^> http://localhost:3000
echo  Frontend -^> http://localhost:5173
echo.

start "Backend" cmd /k "cd backend && npm run dev"
start "Frontend" cmd /k "cd frontend && npm run dev"

echo Serveurs demarres dans des fenetres separees.
pause
