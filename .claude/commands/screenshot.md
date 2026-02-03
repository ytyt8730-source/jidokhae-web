# /screenshot - UI 스크린샷 촬영

웹/모바일 뷰포트로 모든 페이지의 스크린샷을 섹션별로 촬영합니다.

## 사용법

```
/screenshot              # 모든 뷰포트 (desktop, tablet, mobile)
/screenshot mobile       # 모바일만
/screenshot desktop      # 데스크톱만
/screenshot [섹션명]     # 특정 섹션만 (예: auth, admin, meetings)
```

## 실행 절차

1. **개발 서버 확인**: `npm run dev`가 실행 중인지 확인
2. **기존 스크린샷 삭제**: `jidokhae/screenshots/` 폴더 비우기
3. **스크린샷 촬영**: Playwright로 각 페이지 캡처
4. **결과 보고**: 촬영된 파일 목록 출력

## 명령어 실행

사용자의 요청에 따라 다음 명령어를 실행하세요:

```bash
# jidokhae 폴더에서 실행
cd jidokhae

# 기존 스크린샷 삭제
rm -rf screenshots/*

# 스크린샷 촬영
npm run screenshot              # 전체
npm run screenshot:mobile       # 모바일만
npm run screenshot:desktop      # 데스크톱만

# 특정 섹션만
node scripts/screenshot-pages.js --section=auth
node scripts/screenshot-pages.js --section=admin
node scripts/screenshot-pages.js --section=meetings
node scripts/screenshot-pages.js --section=mypage
```

## 섹션 구조

| 폴더 | 내용 |
|------|------|
| `01-landing/` | 홈, 소개 페이지 |
| `02-auth/` | 로그인, 회원가입 |
| `03-meetings/` | 모임 목록, 상세, 결제 |
| `04-mypage/` | 마이페이지, 티켓, 책장 |
| `05-admin-dashboard/` | 관리자 대시보드 |
| `06-admin-meetings/` | 모임 관리 |
| `07-admin-users/` | 회원 관리 |
| `08-admin-transfers/` | 입금 확인 |
| `09-admin-content/` | 배너, 요청함 |
| `10-admin-notifications/` | 알림 템플릿, 발송 |
| `11-admin-settings/` | 권한, 설정 |

## 뷰포트 크기

- **desktop**: 1440 x 900
- **tablet**: 768 x 1024
- **mobile**: 375 x 812

## 파일 명명 규칙

```
{섹션}/{페이지명}-{뷰포트}.png

예시:
01-landing/home-desktop.png
01-landing/home-mobile.png
03-meetings/meetings-list-tablet.png
```

## 주의사항

- 개발 서버가 `localhost:3001`에서 실행 중이어야 함
- 로그인이 필요한 페이지는 테스트 계정으로 자동 로그인
- Playwright가 설치되어 있어야 함 (`npm run screenshot:install`)
