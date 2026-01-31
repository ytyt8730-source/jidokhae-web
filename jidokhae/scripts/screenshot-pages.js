/**
 * 자동 페이지 스크린샷 도구 v2
 * 기능별 섹션으로 분류
 *
 * 사용법:
 * 1. npm install (playwright 설치 필요)
 * 2. npx playwright install chromium (최초 1회)
 * 3. node scripts/screenshot-pages.js
 *
 * 옵션:
 * - node scripts/screenshot-pages.js --mobile-only
 * - node scripts/screenshot-pages.js --desktop-only
 * - node scripts/screenshot-pages.js --section=auth (특정 섹션만)
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const OUTPUT_DIR = path.join(__dirname, '../screenshots')

// 기능별 섹션으로 분류된 페이지 목록
const PAGES = [
  // ========== 01-landing (랜딩/홈) ==========
  { path: '/', name: 'home', description: '홈페이지', folder: '01-landing' },
  { path: '/about', name: 'about', description: '소개 페이지', folder: '01-landing' },

  // ========== 02-auth (인증) ==========
  { path: '/auth/login', name: 'login', description: '로그인', folder: '02-auth' },
  { path: '/auth/signup', name: 'signup', description: '회원가입', folder: '02-auth' },

  // ========== 03-meetings (모임) ==========
  { path: '/meetings', name: 'meetings-list', description: '모임 목록', folder: '03-meetings' },
  // 동적 페이지는 실제 모임 ID로 대체 필요
  { path: '/meetings/{meetingId}', name: 'meeting-detail', description: '모임 상세', folder: '03-meetings', dynamic: true },
  { path: '/meetings/{meetingId}/transfer-pending', name: 'transfer-pending', description: '입금대기 안내', folder: '03-meetings', dynamic: true, requiresAuth: true },
  { path: '/meetings/{meetingId}/payment-complete', name: 'payment-complete', description: '결제 완료', folder: '03-meetings', dynamic: true, requiresAuth: true },

  // ========== 04-mypage (마이페이지) ==========
  { path: '/mypage', name: 'mypage-main', description: '마이페이지 메인', folder: '04-mypage', requiresAuth: true },
  { path: '/mypage/tickets', name: 'mypage-tickets', description: '티켓 보관함', folder: '04-mypage', requiresAuth: true },
  { path: '/mypage/bookshelf', name: 'mypage-bookshelf', description: '나의 책장', folder: '04-mypage', requiresAuth: true },

  // ========== 05-admin-dashboard (관리자 대시보드) ==========
  { path: '/admin', name: 'admin-dashboard', description: '관리자 대시보드', folder: '05-admin-dashboard', requiresAuth: true, requiresAdmin: true },

  // ========== 06-admin-meetings (모임 관리) ==========
  { path: '/admin/meetings', name: 'admin-meetings-list', description: '모임 목록', folder: '06-admin-meetings', requiresAuth: true, requiresAdmin: true },
  { path: '/admin/meetings/new', name: 'admin-meetings-new', description: '모임 생성', folder: '06-admin-meetings', requiresAuth: true, requiresAdmin: true },

  // ========== 07-admin-users (회원 관리) ==========
  { path: '/admin/users', name: 'admin-users-list', description: '회원 목록', folder: '07-admin-users', requiresAuth: true, requiresAdmin: true },

  // ========== 08-admin-transfers (입금 관리) ==========
  { path: '/admin/transfers', name: 'admin-transfers', description: '입금 확인', folder: '08-admin-transfers', requiresAuth: true, requiresAdmin: true },

  // ========== 09-admin-content (콘텐츠 관리) ==========
  { path: '/admin/banners', name: 'admin-banners', description: '배너 관리', folder: '09-admin-content', requiresAuth: true, requiresAdmin: true },
  { path: '/admin/requests', name: 'admin-requests', description: '요청함 관리', folder: '09-admin-content', requiresAuth: true, requiresAdmin: true },

  // ========== 10-admin-notifications (알림 관리) ==========
  { path: '/admin/templates', name: 'admin-templates', description: '알림 템플릿', folder: '10-admin-notifications', requiresAuth: true, requiresAdmin: true },
  { path: '/admin/notifications', name: 'admin-notifications', description: '알림 발송', folder: '10-admin-notifications', requiresAuth: true, requiresAdmin: true },

  // ========== 11-admin-settings (설정) ==========
  { path: '/admin/permissions', name: 'admin-permissions', description: '권한 관리', folder: '11-admin-settings', requiresAuth: true, requiresAdmin: true },
  { path: '/admin/settings', name: 'admin-settings', description: '시스템 설정', folder: '11-admin-settings', requiresAuth: true, requiresAdmin: true },
]

// 뷰포트 설정
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

// 테스트 계정
const TEST_ACCOUNTS = {
  admin: { email: 'super@test.com', password: 'test1234' },
  member: { email: 'member@test.com', password: 'test1234' },
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function login(page, isAdmin = false) {
  const account = isAdmin ? TEST_ACCOUNTS.admin : TEST_ACCOUNTS.member

  await page.goto(`${BASE_URL}/auth/login`)
  await page.waitForLoadState('networkidle')

  const emailInput = await page.$('input[name="email"], input[type="email"]')
  const passwordInput = await page.$('input[name="password"], input[type="password"]')
  const submitButton = await page.$('button[type="submit"]')

  if (emailInput && passwordInput && submitButton) {
    await emailInput.fill(account.email)
    await passwordInput.fill(account.password)
    await submitButton.click()

    try {
      await page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 10000 })
      await page.waitForLoadState('networkidle')
      console.log(`  ✓ 로그인 완료: ${account.email}`)
      return true
    } catch (e) {
      console.log(`  ⚠ 로그인 실패: ${account.email}`)
      return false
    }
  }
  return false
}

async function getMeetingId(page) {
  // 실제 모임 ID 가져오기
  await page.goto(`${BASE_URL}/meetings`)
  await page.waitForLoadState('networkidle')

  // 첫 번째 모임 링크 찾기
  const meetingLink = await page.$('a[href*="/meetings/"]')
  if (meetingLink) {
    const href = await meetingLink.getAttribute('href')
    const match = href.match(/\/meetings\/([^/]+)/)
    if (match) {
      return match[1]
    }
  }
  return null
}

async function takeScreenshot(page, pageConfig, viewport, meetingId = null) {
  const { width, height } = VIEWPORTS[viewport]
  await page.setViewportSize({ width, height })

  let pagePath = pageConfig.path

  // 동적 경로 처리
  if (pageConfig.dynamic && meetingId) {
    pagePath = pagePath.replace('{meetingId}', meetingId)
  } else if (pageConfig.dynamic && !meetingId) {
    console.log(`    ⏭ ${pageConfig.name} - 모임 ID 없음, 스킵`)
    return
  }

  try {
    await page.goto(`${BASE_URL}${pagePath}`, { timeout: 30000 })
    await page.waitForLoadState('networkidle', { timeout: 10000 })
  } catch (e) {
    console.log(`    ⚠ 페이지 로드 실패: ${pagePath}`)
    return
  }

  // 추가 로딩 대기
  await page.waitForTimeout(800)

  // 폴더 생성
  const folderPath = path.join(OUTPUT_DIR, pageConfig.folder)
  ensureDir(folderPath)

  const filename = `${pageConfig.name}-${viewport}.png`
  const filepath = path.join(folderPath, filename)

  await page.screenshot({
    path: filepath,
    fullPage: true,
  })

  console.log(`    📸 ${pageConfig.folder}/${filename}`)
}

async function main() {
  console.log('\n🚀 기능별 스크린샷 시작\n')
  console.log(`서버: ${BASE_URL}`)
  console.log(`출력: ${OUTPUT_DIR}\n`)

  // 서버 접속 확인
  try {
    const testResponse = await fetch(BASE_URL)
    if (!testResponse.ok) {
      console.log('⚠ 서버 응답이 비정상입니다')
    }
  } catch (e) {
    console.error(`❌ 서버에 접속할 수 없습니다: ${BASE_URL}`)
    console.log('먼저 npm run dev 로 서버를 시작해주세요.\n')
    process.exit(1)
  }

  // 기존 폴더 정리
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true })
  }
  ensureDir(OUTPUT_DIR)

  const browser = await chromium.launch({ headless: true })

  const args = process.argv.slice(2)
  const mobileOnly = args.includes('--mobile-only')
  const desktopOnly = args.includes('--desktop-only')
  const sectionArg = args.find(a => a.startsWith('--section='))
  const targetSection = sectionArg ? sectionArg.split('=')[1] : null

  let viewportsToUse = Object.keys(VIEWPORTS)
  if (mobileOnly) viewportsToUse = ['mobile']
  if (desktopOnly) viewportsToUse = ['desktop']

  // 섹션별로 그룹화
  const sections = {}
  PAGES.forEach(p => {
    if (!sections[p.folder]) sections[p.folder] = []
    sections[p.folder].push(p)
  })

  try {
    // 모임 ID 먼저 가져오기
    const tempContext = await browser.newContext()
    const tempPage = await tempContext.newPage()
    const meetingId = await getMeetingId(tempPage)
    console.log(`📌 테스트 모임 ID: ${meetingId || '없음'}\n`)
    await tempContext.close()

    // 1. 공개 페이지 (로그인 불필요)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📂 공개 페이지')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const publicContext = await browser.newContext()
    const publicPage = await publicContext.newPage()

    for (const [folder, pages] of Object.entries(sections)) {
      if (targetSection && !folder.includes(targetSection)) continue

      const publicPages = pages.filter(p => !p.requiresAuth)
      if (publicPages.length === 0) continue

      console.log(`\n📁 ${folder}`)
      for (const pageConfig of publicPages) {
        console.log(`  ${pageConfig.description} (${pageConfig.path})`)
        for (const viewport of viewportsToUse) {
          await takeScreenshot(publicPage, pageConfig, viewport, meetingId)
        }
      }
    }
    await publicContext.close()

    // 2. 일반 회원 페이지
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📂 회원 페이지 (로그인 필요)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const memberContext = await browser.newContext()
    const memberPage = await memberContext.newPage()
    const memberLoggedIn = await login(memberPage, false)

    if (memberLoggedIn) {
      for (const [folder, pages] of Object.entries(sections)) {
        if (targetSection && !folder.includes(targetSection)) continue

        const memberPages = pages.filter(p => p.requiresAuth && !p.requiresAdmin)
        if (memberPages.length === 0) continue

        console.log(`\n📁 ${folder}`)
        for (const pageConfig of memberPages) {
          console.log(`  ${pageConfig.description} (${pageConfig.path})`)
          for (const viewport of viewportsToUse) {
            await takeScreenshot(memberPage, pageConfig, viewport, meetingId)
          }
        }
      }
    }
    await memberContext.close()

    // 3. 관리자 페이지
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📂 관리자 페이지')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const adminLoggedIn = await login(adminPage, true)

    if (adminLoggedIn) {
      for (const [folder, pages] of Object.entries(sections)) {
        if (targetSection && !folder.includes(targetSection)) continue

        const adminPages = pages.filter(p => p.requiresAdmin)
        if (adminPages.length === 0) continue

        console.log(`\n📁 ${folder}`)
        for (const pageConfig of adminPages) {
          console.log(`  ${pageConfig.description} (${pageConfig.path})`)
          for (const viewport of viewportsToUse) {
            await takeScreenshot(adminPage, pageConfig, viewport, meetingId)
          }
        }
      }
    }
    await adminContext.close()

    // 결과 요약
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 결과 요약')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    let totalFiles = 0
    const folders = fs.readdirSync(OUTPUT_DIR).filter(f =>
      fs.statSync(path.join(OUTPUT_DIR, f)).isDirectory()
    ).sort()

    for (const folder of folders) {
      const folderPath = path.join(OUTPUT_DIR, folder)
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.png'))
      totalFiles += files.length
      console.log(`📁 ${folder}/ (${files.length}개)`)
      files.sort().forEach(f => console.log(`   └─ ${f}`))
    }

    console.log(`\n✅ 완료! 총 ${totalFiles}개 스크린샷 저장됨`)
    console.log(`📁 위치: ${OUTPUT_DIR}\n`)

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message)
    throw error
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
