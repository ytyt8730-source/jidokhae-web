#!/usr/bin/env node
/**
 * 보호 파일 검사 스크립트
 * PreToolUse hook에서 호출되어 민감한 파일 수정을 차단합니다.
 *
 * 사용법: stdin으로 JSON 입력 받음
 * 종료 코드:
 *   0 = 허용
 *   2 = 차단 (Claude에게 피드백 전달)
 */

const PROTECTED_PATTERNS = [
  '.env',
  '.env.local',
  '.env.production',
  'package-lock.json',
  '.git/',
  'node_modules/',
  'credentials',
  'secrets',
  'id_rsa',
  '.pem',
  '.key'
];

async function main() {
  let input = '';

  // stdin에서 JSON 읽기
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path || '';

    // 보호 패턴 검사
    for (const pattern of PROTECTED_PATTERNS) {
      if (filePath.includes(pattern)) {
        console.error(`Blocked: "${filePath}" matches protected pattern "${pattern}"`);
        console.error('This file is protected and cannot be modified.');
        process.exit(2);
      }
    }

    // 통과
    process.exit(0);
  } catch (err) {
    // JSON 파싱 실패 시 통과 (안전한 기본값)
    console.error('Warning: Could not parse hook input');
    process.exit(0);
  }
}

main();