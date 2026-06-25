@echo off
setlocal
cd /d "%~dp0"
echo Iniciando Chatbot Grupo 11 en http://localhost:3000
echo Cierra esta ventana para detener el servidor.
node backend/dist/server.js
pause
