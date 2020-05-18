@echo off
title TERA Client
cd /d "%~dp0"

if not exist ./config.json (
	bin\node.exe --use-strict bin/configurator
	cls
)

bin\node.exe --use-strict --harmony .
pause