@echo off
rem chcp 65001

set NODE_OPTIONS=--max-old-space-size=8192

:start

node scaner.js

pause