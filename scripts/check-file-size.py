#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
파일 크기 검사 스크립트 (PostToolUse Hook용)
Edit/Write 후 200줄 초과 파일 경고
Windows/Linux 호환
"""

import sys
import os
import json

def check_file_size():
    try:
        # stdin에서 JSON 입력 읽기
        input_data = json.load(sys.stdin)

        # tool_input에서 file_path 추출
        file_path = input_data.get('tool_input', {}).get('file_path')

        if file_path and os.path.exists(file_path):
            # 줄 수 계산
            with open(file_path, 'r', encoding='utf-8') as f:
                line_count = sum(1 for _ in f)

            if line_count > 200:
                # stderr로 출력해야 Claude가 경고로 인식
                print(f"⚠️ 경고: {file_path} 파일이 {line_count}줄입니다. (200줄 초과)", file=sys.stderr)

    except Exception:
        pass  # 에러 발생 시 워크플로우를 방해하지 않도록 조용히 종료

if __name__ == "__main__":
    check_file_size()
