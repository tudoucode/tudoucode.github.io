@echo off
set /p input=请输入要压缩的视频路径：
powershell -ExecutionPolicy Bypass -File "%~dp0compress-video.ps1" -InputPath "%input%"
pause
