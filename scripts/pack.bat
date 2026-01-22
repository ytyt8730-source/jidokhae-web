@echo off
REM Smart Context Packer 실행 배치 파일
REM 사용법: pack [옵션]
REM 예시: pack
REM       pack --target src/lib
REM       pack --target "core,docs" --max-tokens 50000

cd /d "%~dp0\.."
python scripts/pack_context.py %*
