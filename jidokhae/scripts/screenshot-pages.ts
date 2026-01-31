/**
 * 자동 페이지 스크린샷 도구
 *
 * 사용법:
 * 1. npx playwright install chromium (최초 1회)
 * 2. npx ts-node scripts/screenshot-pages.ts
 *
 * 결과: screenshots/ 폴더에 각 페이지별 이미지 저장
 */

import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const OUTPUT_DIR = path.join(__dirname, '../screenshots')

// 스크린샷할 페이지 목록
const PAGES = [
  // 공개 페이지
  { path: '/', name: 'home', description: '홈페이지' },
  { path: '/meetings', name: 'meetings-list', description: '모임 목록' },
  { path: '/about', name: 'about', description: '소개 페이지' },
  { path: '/auth/login', name: 'login', description: '로그인' },
  { path: '/auth/signup', name: 'signup', description: '회원가입' },

  // 인증 필요 페이지 (로그인 후)
  { path: '/mypage', name: 'mypage', description: '마이페이지', requiresAuth: true },
  { path: '/mypage/tickets', name: 'tickets', description: '티켓 보관함', requiresAuth: true },
  { path: '/mypage/bookshelf', name: 'bookshelf', description: '책장', requiresAuth: true },

  // 관리자 페이지
  { path: '/admin', name: 'admin-dashboard', description: '관리자 대시보드', requiresAuth: true, requiresAdmin: true },
  { path: '/admin/meetings', name: 'admin-meetings', description: '모임 관리', requiresAuth: true, requiresAdmin: true },
  { path: '/admin/users', name: 'admin-users', description: '회원 관리', requiresAuth: true, requiresAdmin: true },
  { path: '/admin/transfers', name: 'admin-transfers', description: '입금 관리', requiresAuth: true, requiresAdmin: true },
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

interface PageConfig {
  path: string
  name: string
  description: string
  requiresAuth?: boolean
  requiresAdmin?: boolean
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function login(page: Page, isAdmin: boolean = false) {
  const account = isAdmin ? TEST_ACCOUNTS.admin : TEST_ACCOUNTS.member

  await page.goto(`${BASE_URL}/auth/login`)
  await page.waitForLoadState('networkidle')

  await page.fill('input[name="email"]', account.email)
  await page.fill('input[name="password"]', account.password)
  await page.click('button[type="submit"]')

  // 로그인 완료 대기
  await page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 10000 })
  await page.waitForLoadState('networkidle')

  console.log(`  ✓ 로그인 완료: ${account.email}`)
}

async function takeScreenshot(
  page: Page,
  pageConfig: PageConfig,
  viewport: keyof typeof VIEWPORTS
) {
  const { width, height } = VIEWPORTS[viewport]
  await page.setViewportSize({ width, height })

  await page.goto(`${BASE_URL}${pageConfig.path}`)
  await page.waitForLoadState('networkidle')

  // 추가 로딩 대기 (애니메이션 등)
  await page.waitForTimeout(500)

  const filename = `${pageConfig.name}-${viewport}.png`
  const filepath = path.join(OUTPUT_DIR, filename)

  await page.screenshot({
    path: filepath,
    fullPage: viewport === 'desktop', // 데스크톱은 전체 페이지
  })

  console.log(`  📸 ${filename}`)
}

async function main() {
  console.log('\n🚀 페이지 스크린샷 시작\n')
  console.log(`서버: ${BASE_URL}`)
  console.log(`출력: ${OUTPUT_DIR}\n`)

  await ensureDir(OUTPUT_DIR)

  const browser: Browser = await chromium.launch({
    headless: true,
  })

  try {
    // 1. 공개 페이지 스크린샷
    console.log('📂 공개 페이지')
    const publicContext = await browser.newContext()
    const publicPage = await publicContext.newPage()

    for (const pageConfig of PAGES.filter(p => !p.requiresAuth)) {
      console.log(`\n  ${pageConfig.description} (${pageConfig.path})`)
      for (const viewport of Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]) {
        await takeScreenshot(publicPage, pageConfig, viewport)
      }
    }
    await publicContext.close()

    // 2. 일반 회원 페이지 스크린샷
    console.log('\n📂 일반 회원 페이지')
    const memberContext = await browser.newContext()
    const memberPage = await memberContext.newPage()
    await login(memberPage, false)

    for (const pageConfig of PAGES.filter(p => p.requiresAuth && !p.requiresAdmin)) {
      console.log(`\n  ${pageConfig.description} (${pageConfig.path})`)
      for (const viewport of Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]) {
        await takeScreenshot(memberPage, pageConfig, viewport)
      }
    }
    await memberContext.close()

    // 3. 관리자 페이지 스크린샷
    console.log('\n📂 관리자 페이지')
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    await login(adminPage, true)

    for (const pageConfig of PAGES.filter(p => p.requiresAdmin)) {
      console.log(`\n  ${pageConfig.description} (${pageConfig.path})`)
      for (const viewport of Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]) {
        await takeScreenshot(adminPage, pageConfig, viewport)
      }
    }
    await adminContext.close()

    // 결과 요약
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'))
    console.log(`\n✅ 완료! ${files.length}개 스크린샷 저장됨`)
    console.log(`📁 위치: ${OUTPUT_DIR}\n`)

  } catch (error) {
    console.error('\n❌ 오류 발생:', error)
    throw error
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
