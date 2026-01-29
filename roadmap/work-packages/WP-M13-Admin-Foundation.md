# Work Package: M13 - Admin Foundation (백오피스 기반 구축)

---

**문서 버전:** 1.0
**작성일:** 2026-01-28
**Milestone:** M13
**예상 기간:** 1주
**선행 조건:** M5 완료 (기존 운영자 도구)

---

## 1. 개요

모든 Admin 기능이 올라갈 수 있는 **기술적 토대**를 마련합니다. 기존 M5에서 구현한 운영자 도구 위에 체계적인 Admin 인프라를 구축하여, 향후 M14~M17의 고도화된 백오피스 기능들이 안정적으로 동작할 수 있는 기반을 제공합니다.

**핵심 목표:**
- Admin 인증 및 권한 체크 미들웨어
- `app_settings` 테이블을 통한 중앙 설정 관리
- Admin 전용 레이아웃 (사이드바, 헤더)
- 대시보드 껍데기 (위젯 영역 준비)

---

## 2. Phase 구성 개요

```
[M5 완료: 기존 운영자 도구]
    |
    v
[Phase 13.1] Admin 인증 + 권한 미들웨어
    |
    v
[Phase 13.2] DB 스키마 - app_settings 테이블
    |
    v
[Phase 13.3] 공통 레이아웃 (사이드바, 헤더)
    |
    v
[Phase 13.4] 대시보드 껍데기 (위젯 영역)
    |
    v
[M13 완료] -> M14 시작 가능
```

---

## 3. Phase 상세

### Phase 13.1: Admin 인증 + 권한 미들웨어

**목표:** `/admin/*` 경로에 대한 체계적인 접근 제어

**예상 소요:** 1~2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 13.1.1 | Admin 미들웨어 구현 | `middleware.ts` 수정 | /admin/* 경로 보호 |
| 13.1.2 | 권한 체크 유틸리티 | `lib/admin/auth.ts` | isAdmin, isSuperAdmin 함수 |
| 13.1.3 | 권한 상수 정의 | `lib/admin/permissions.ts` | ADMIN_PERMISSIONS enum |
| 13.1.4 | 접근 거부 페이지 | `app/admin/unauthorized/page.tsx` | 권한 없음 안내 |
| 13.1.5 | 리다이렉트 로직 | 미들웨어 | 비로그인/권한없음 시 리다이렉트 |
| 13.1.6 | Admin 세션 검증 | Server Component 유틸 | getAdminSession() |

#### 미들웨어 구현

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // /admin/* 경로 체크
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data: { session } } = await supabase.auth.getSession();

    // 미로그인 -> 로그인 페이지로 리다이렉트
    if (!session) {
      return NextResponse.redirect(new URL('/login?redirect=/admin', req.url));
    }

    // 사용자 권한 체크
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // admin 또는 super_admin이 아니면 거부
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

#### 권한 체크 유틸리티

```typescript
// lib/admin/auth.ts
import { createClient } from '@/lib/supabase/server';

export type AdminRole = 'member' | 'admin' | 'super_admin';

export interface AdminSession {
  userId: string;
  email: string;
  role: AdminRole;
  permissions: string[];
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: user } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', session.user.id)
    .single();

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return null;
  }

  // super_admin은 모든 권한
  if (user.role === 'super_admin') {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: ['*'],
    };
  }

  // admin은 부여된 권한만
  const { data: perms } = await supabase
    .from('admin_permissions')
    .select('permission')
    .eq('user_id', user.id);

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: perms?.map(p => p.permission) || [],
  };
}

export function hasPermission(session: AdminSession, permission: string): boolean {
  if (session.permissions.includes('*')) return true;
  return session.permissions.includes(permission);
}
```

#### Scenario (검증 기준)

:red_circle: **SC-M13-001: 비로그인 사용자 /admin 접속 시 리다이렉트**
- Given: 로그인하지 않은 상태
- When: `/admin` 또는 `/admin/*` 경로 접속 시도
- Then: `/login?redirect=/admin`으로 리다이렉트

:red_circle: **SC-M13-002: 일반 회원 /admin 접속 시 접근 거부**
- Given: role이 'member'인 사용자로 로그인
- When: `/admin` 경로 접속 시도
- Then: `/admin/unauthorized`로 리다이렉트, "권한이 없습니다" 메시지 표시

:red_circle: **SC-M13-003: Admin 사용자 정상 접속**
- Given: role이 'admin' 또는 'super_admin'인 사용자로 로그인
- When: `/admin` 경로 접속
- Then: Admin 대시보드 페이지 정상 표시

:yellow_circle: **SC-M13-004: 권한별 기능 접근 제어**
- Given: 특정 권한만 부여된 admin 사용자
- When: 부여되지 않은 권한의 페이지 접근 시도
- Then: 해당 페이지/기능에 접근 불가, 안내 메시지 표시

#### 사용자 가치
> "Admin 영역은 권한이 있는 운영자만 접근할 수 있어 보안이 강화된다"

---

### Phase 13.2: DB 스키마 - app_settings 테이블

**목표:** 서비스 전체 설정을 중앙에서 관리할 수 있는 테이블 구조

**예상 소요:** 1일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 13.2.1 | app_settings 테이블 생성 | `migration-m13-app-settings.sql` | 테이블 생성 완료 |
| 13.2.2 | 설정 카테고리 정의 | SQL ENUM/CHECK | threshold, timing, content, link |
| 13.2.3 | 기본 설정값 시드 | INSERT 문 | 초기 설정 데이터 |
| 13.2.4 | RLS 정책 설정 | SQL | admin만 수정 가능 |
| 13.2.5 | 설정 조회 유틸리티 | `lib/admin/settings.ts` | getSetting, getSettings |
| 13.2.6 | TypeScript 타입 정의 | `types/settings.ts` | AppSetting 타입 |

#### DB 스키마

```sql
-- migration-m13-app-settings.sql

-- 설정 카테고리 타입
CREATE TYPE setting_category AS ENUM (
  'threshold',  -- 임계값 (정원, 기간 등)
  'timing',     -- 타이밍 (알림 발송 시점 등)
  'content',    -- 콘텐츠 (문구, 메시지 등)
  'link'        -- 링크 (외부 URL 등)
);

-- app_settings 테이블
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category setting_category NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,  -- 클라이언트에서 조회 가능 여부
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_app_settings_category ON app_settings(category);
CREATE INDEX idx_app_settings_key ON app_settings(key);

-- RLS 정책
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 인증된 사용자 (is_public=true인 경우) 또는 admin
CREATE POLICY "app_settings_read" ON app_settings
FOR SELECT USING (
  is_public = true
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- 쓰기: super_admin만
CREATE POLICY "app_settings_write" ON app_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- 기본 설정값 시드
INSERT INTO app_settings (key, value, category, description, is_public) VALUES
-- threshold 카테고리
('capacity_warning_threshold', '3', 'threshold', '마감임박 표시 기준 (잔여 좌석)', true),
('eligibility_months', '6', 'threshold', '정기모임 자격 유지 기간 (개월)', false),
('transfer_timeout_hours', '24', 'threshold', '계좌이체 입금 기한 (시간)', false),
('waitlist_response_hours', '24', 'threshold', '대기자 응답 대기 시간 (시간)', false),

-- timing 카테고리
('reminder_days_before', '[3, 1, 0]', 'timing', '모임 리마인드 발송 시점 (일 전)', false),
('post_meeting_days', '3', 'timing', '모임 후 리뷰 요청 발송 시점 (일 후)', false),
('dormant_warning_months', '3', 'timing', '휴면 위험 경고 시점 (개월)', false),

-- content 카테고리
('service_name', '"지독해"', 'content', '서비스 이름', true),
('currency_name', '"콩"', 'content', '화폐 단위 명칭', true),
('bank_account', '{"bank": "카카오뱅크", "account": "3333-XX-XXXXXX", "holder": "지독해"}', 'content', '계좌이체 계좌 정보', false),

-- link 카테고리
('kakao_channel', '"http://pf.kakao.com/xxxxx"', 'link', '카카오톡 채널 링크', true),
('instagram', '"https://instagram.com/jidokhae"', 'link', '인스타그램 링크', true);
```

#### 설정 조회 유틸리티

```typescript
// lib/admin/settings.ts
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { AppSetting, SettingCategory } from '@/types/settings';

// 단일 설정 조회
export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) return null;
  return data.value as T;
}

// 카테고리별 설정 조회
export async function getSettingsByCategory(
  category: SettingCategory
): Promise<AppSetting[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('app_settings')
    .select('*')
    .eq('category', category)
    .order('key');

  return data || [];
}

// 설정 업데이트 (super_admin 전용)
export async function updateSetting(
  key: string,
  value: unknown
): Promise<boolean> {
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('app_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key);

  return !error;
}

// 공개 설정만 조회 (클라이언트용)
export async function getPublicSettings(): Promise<Record<string, unknown>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .eq('is_public', true);

  if (!data) return {};

  return data.reduce((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, unknown>);
}
```

#### TypeScript 타입 정의

```typescript
// types/settings.ts
export type SettingCategory = 'threshold' | 'timing' | 'content' | 'link';

export interface AppSetting {
  id: string;
  key: string;
  value: unknown;
  category: SettingCategory;
  description: string | null;
  is_public: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// 자주 사용하는 설정 타입
export interface BankAccountSetting {
  bank: string;
  account: string;
  holder: string;
}
```

#### Scenario (검증 기준)

:red_circle: **SC-M13-005: app_settings 테이블 생성 확인**
- Given: 마이그레이션 SQL 실행
- When: Supabase에서 테이블 조회
- Then: app_settings 테이블이 존재하고, 기본 설정값이 시드되어 있음

:red_circle: **SC-M13-006: 설정 조회 성공**
- Given: app_settings에 설정값이 저장되어 있음
- When: getSetting('capacity_warning_threshold') 호출
- Then: 3 (숫자) 반환

:yellow_circle: **SC-M13-007: 카테고리별 설정 조회**
- Given: 여러 카테고리의 설정이 저장되어 있음
- When: getSettingsByCategory('threshold') 호출
- Then: threshold 카테고리의 설정만 배열로 반환

:yellow_circle: **SC-M13-008: RLS 정책 - 일반 사용자 제한**
- Given: role이 'member'인 사용자
- When: is_public=false인 설정 조회 시도
- Then: 조회 결과 없음 (RLS에 의해 필터링)

#### 사용자 가치
> "서비스 전체 설정을 DB에서 중앙 관리하여 하드코딩 없이 동적으로 변경 가능하다"

---

### Phase 13.3: 공통 레이아웃 (사이드바, 헤더)

**목표:** Admin 전용 일관된 UI 레이아웃 구축

**예상 소요:** 2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 13.3.1 | Admin 레이아웃 컴포넌트 | `app/admin/layout.tsx` | 공통 레이아웃 적용 |
| 13.3.2 | Admin 사이드바 컴포넌트 | `components/admin/AdminSidebar.tsx` | 네비게이션 메뉴 |
| 13.3.3 | Admin 헤더 컴포넌트 | `components/admin/AdminHeader.tsx` | 사용자 정보, 로그아웃 |
| 13.3.4 | 페이지 컨테이너 컴포넌트 | `components/admin/AdminPageContainer.tsx` | 페이지 공통 래퍼 |
| 13.3.5 | 네비게이션 메뉴 설정 | `lib/admin/navigation.ts` | 메뉴 아이템 정의 |
| 13.3.6 | 반응형 사이드바 | CSS/Tailwind | 모바일 대응 |
| 13.3.7 | 사이드바 토글 | useState | 접기/펼치기 기능 |

#### Admin 레이아웃 구조

```
+------------------------------------------------------------------+
|  [Logo] 지독해 Admin                    [사용자명] [로그아웃]    |  <- Header
+------------------------------------------------------------------+
|         |                                                         |
|  [홈]   |    페이지 타이틀                                        |
|         |    ================================================    |
|  대시보드 |                                                       |
|         |    페이지 콘텐츠 영역                                   |
|  모임 관리|                                                       |
|         |                                                         |
|  회원 관리|                                                       |
|         |                                                         |
|  알림    |                                                         |
|         |                                                         |
|  설정    |                                                         |
|         |                                                         |
+---------+---------------------------------------------------------+
  Sidebar                     Page Container
```

#### Admin 레이아웃

```typescript
// app/admin/layout.tsx
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { getAdminSession } from '@/lib/admin/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/login?redirect=/admin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader session={session} />
      <div className="flex">
        <AdminSidebar session={session} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### Admin 사이드바

```typescript
// components/admin/AdminSidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminSession } from '@/lib/admin/auth';
import { hasPermission } from '@/lib/admin/auth';

interface AdminSidebarProps {
  session: AdminSession;
}

const menuItems = [
  {
    label: '대시보드',
    href: '/admin',
    icon: LayoutDashboard,
    permission: 'dashboard_view',
  },
  {
    label: '모임 관리',
    href: '/admin/meetings',
    icon: Calendar,
    permission: 'meeting_manage',
  },
  {
    label: '회원 관리',
    href: '/admin/users',
    icon: Users,
    permission: null, // super_admin 전용
  },
  {
    label: '알림',
    href: '/admin/notifications',
    icon: Bell,
    permission: 'notification_send',
  },
  {
    label: '설정',
    href: '/admin/settings',
    icon: Settings,
    permission: null, // super_admin 전용
  },
];

export function AdminSidebar({ session }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.permission) {
      return session.role === 'super_admin';
    }
    return hasPermission(session, item.permission);
  });

  return (
    <aside
      className={cn(
        'sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200',
        'transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <nav className="p-4 space-y-2">
        {visibleMenuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg',
                'transition-colors duration-200',
                isActive
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute bottom-4 right-0 translate-x-1/2 p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
```

#### Admin 헤더

```typescript
// components/admin/AdminHeader.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AdminSession } from '@/lib/admin/auth';

interface AdminHeaderProps {
  session: AdminSession;
}

export function AdminHeader({ session }: AdminHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 h-16 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-full px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-serif text-xl font-semibold text-brand-600">
            지독해
          </span>
          <span className="text-sm text-gray-500">Admin</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" strokeWidth={1.5} />
            <span>{session.email}</span>
            <span className="px-2 py-0.5 text-xs bg-gray-100 rounded">
              {session.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </header>
  );
}
```

#### 페이지 컨테이너

```typescript
// components/admin/AdminPageContainer.tsx
interface AdminPageContainerProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminPageContainer({
  title,
  description,
  actions,
  children,
}: AdminPageContainerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {children}
      </div>
    </div>
  );
}
```

#### Scenario (검증 기준)

:red_circle: **SC-M13-009: Admin 레이아웃 정상 렌더링**
- Given: Admin 권한이 있는 사용자로 로그인
- When: `/admin` 접속
- Then: 사이드바, 헤더, 메인 컨텐츠 영역이 정상 표시

:red_circle: **SC-M13-010: 사이드바 네비게이션 동작**
- Given: Admin 대시보드 화면
- When: 사이드바의 "모임 관리" 클릭
- Then: `/admin/meetings` 페이지로 이동, 해당 메뉴 활성화 표시

:yellow_circle: **SC-M13-011: 사이드바 접기/펼치기**
- Given: Admin 레이아웃 화면
- When: 사이드바 토글 버튼 클릭
- Then: 사이드바가 접히고/펼쳐지며 아이콘만 표시됨

:yellow_circle: **SC-M13-012: 권한별 메뉴 표시**
- Given: 특정 권한만 가진 admin 사용자
- When: Admin 레이아웃 진입
- Then: 권한이 있는 메뉴만 사이드바에 표시

:yellow_circle: **SC-M13-013: 로그아웃 기능**
- Given: Admin 레이아웃 화면
- When: 헤더의 "로그아웃" 버튼 클릭
- Then: 로그아웃 처리 후 `/login` 페이지로 리다이렉트

#### 사용자 가치
> "Admin 영역에서 일관된 네비게이션과 레이아웃을 제공받아 효율적으로 작업할 수 있다"

---

### Phase 13.4: 대시보드 껍데기 (위젯 영역)

**목표:** 통계 및 할 일 위젯을 배치할 수 있는 대시보드 기반 UI

**예상 소요:** 1~2일

#### 작업 목록

| # | 작업 | 산출물 | 완료 기준 |
|---|------|--------|----------|
| 13.4.1 | 대시보드 페이지 | `app/admin/page.tsx` | 위젯 그리드 레이아웃 |
| 13.4.2 | 위젯 컨테이너 컴포넌트 | `components/admin/Widget.tsx` | 공통 위젯 래퍼 |
| 13.4.3 | "오늘의 할 일" 위젯 영역 | `components/admin/TodoWidget.tsx` | Placeholder UI |
| 13.4.4 | 통계 위젯 영역 | `components/admin/StatsWidget.tsx` | Placeholder UI |
| 13.4.5 | 빠른 액션 위젯 | `components/admin/QuickActionsWidget.tsx` | 주요 기능 바로가기 |
| 13.4.6 | 위젯 스켈레톤 | `components/admin/WidgetSkeleton.tsx` | 로딩 상태 |

#### 대시보드 레이아웃

```
+------------------------------------------------------------------+
|                                                                    |
|  오늘의 할 일                                                       |
|  +------------------------+  +------------------------+            |
|  | 입금대기                |  | 환불대기                |            |
|  | 3건                    |  | 2건                    |            |
|  | [확인하러 가기]         |  | [처리하러 가기]         |            |
|  +------------------------+  +------------------------+            |
|                                                                    |
|  +----------------------------------------------------------------+|
|  | 이번 달 현황                                                    ||
|  |                                                                 ||
|  | [참가 현황]   [수입]     [환불]     [재참여율]                   ||
|  | 42건         420,000콩  30,000콩   68%                         ||
|  |                                                                 ||
|  +----------------------------------------------------------------+|
|                                                                    |
|  빠른 액션                                                         |
|  +----------------+  +----------------+  +----------------+        |
|  | [모임 생성]     |  | [알림 발송]     |  | [배너 관리]     |        |
|  +----------------+  +----------------+  +----------------+        |
|                                                                    |
+------------------------------------------------------------------+
```

#### 대시보드 페이지

```typescript
// app/admin/page.tsx
import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { TodoWidget } from '@/components/admin/TodoWidget';
import { StatsWidget } from '@/components/admin/StatsWidget';
import { QuickActionsWidget } from '@/components/admin/QuickActionsWidget';
import { getAdminSession } from '@/lib/admin/auth';

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  return (
    <AdminPageContainer
      title="대시보드"
      description="지독해 운영 현황을 한눈에 확인하세요"
    >
      <div className="space-y-6">
        {/* 오늘의 할 일 */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            오늘의 할 일
          </h2>
          <TodoWidget />
        </section>

        {/* 이번 달 현황 */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            이번 달 현황
          </h2>
          <StatsWidget />
        </section>

        {/* 빠른 액션 */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            빠른 액션
          </h2>
          <QuickActionsWidget session={session} />
        </section>
      </div>
    </AdminPageContainer>
  );
}
```

#### 위젯 컨테이너

```typescript
// components/admin/Widget.tsx
import { cn } from '@/lib/utils';

interface WidgetProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function Widget({ title, className, children }: WidgetProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4',
        className
      )}
    >
      {title && (
        <h3 className="text-sm font-medium text-gray-500 mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}
```

#### 오늘의 할 일 위젯 (Placeholder)

```typescript
// components/admin/TodoWidget.tsx
import Link from 'next/link';
import { Clock, CreditCard, ArrowRight } from 'lucide-react';
import { Widget } from './Widget';

interface TodoItem {
  id: string;
  label: string;
  count: number;
  href: string;
  icon: React.ElementType;
  urgent?: boolean;
}

// TODO: M14에서 실제 데이터 연동
const todoItems: TodoItem[] = [
  {
    id: 'pending_transfer',
    label: '입금대기',
    count: 0, // Placeholder
    href: '/admin/transfers',
    icon: Clock,
  },
  {
    id: 'pending_refund',
    label: '환불대기',
    count: 0, // Placeholder
    href: '/admin/refunds',
    icon: CreditCard,
  },
];

export function TodoWidget() {
  const hasItems = todoItems.some(item => item.count > 0);

  if (!hasItems) {
    return (
      <Widget>
        <p className="text-center text-gray-500 py-4">
          처리할 항목이 없습니다
        </p>
      </Widget>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {todoItems
        .filter(item => item.count > 0)
        .map(item => {
          const Icon = item.icon;
          return (
            <Widget key={item.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-100 rounded-lg">
                    <Icon className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {item.count}건
                    </p>
                  </div>
                </div>
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
                >
                  확인하기
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Widget>
          );
        })}
    </div>
  );
}
```

#### 통계 위젯 (Placeholder)

```typescript
// components/admin/StatsWidget.tsx
import { Users, Coins, RefreshCw, TrendingUp } from 'lucide-react';
import { Widget } from './Widget';

interface StatItem {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
}

// TODO: M14에서 실제 데이터 연동
const stats: StatItem[] = [
  { label: '참가 현황', value: '- 건', icon: Users },
  { label: '수입', value: '- 콩', icon: Coins },
  { label: '환불', value: '- 콩', icon: RefreshCw },
  { label: '재참여율', value: '- %', icon: TrendingUp },
];

export function StatsWidget() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <Widget key={stat.label}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Icon className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </Widget>
        );
      })}
    </div>
  );
}
```

#### 빠른 액션 위젯

```typescript
// components/admin/QuickActionsWidget.tsx
import Link from 'next/link';
import { Plus, Bell, Image } from 'lucide-react';
import { Widget } from './Widget';
import type { AdminSession } from '@/lib/admin/auth';
import { hasPermission } from '@/lib/admin/auth';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  permission: string | null;
}

const actions: QuickAction[] = [
  { label: '모임 생성', href: '/admin/meetings/new', icon: Plus, permission: 'meeting_manage' },
  { label: '알림 발송', href: '/admin/notifications/send', icon: Bell, permission: 'notification_send' },
  { label: '배너 관리', href: '/admin/banners', icon: Image, permission: 'banner_manage' },
];

interface QuickActionsWidgetProps {
  session: AdminSession;
}

export function QuickActionsWidget({ session }: QuickActionsWidgetProps) {
  const visibleActions = actions.filter(action => {
    if (!action.permission) return session.role === 'super_admin';
    return hasPermission(session, action.permission);
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      {visibleActions.map(action => {
        const Icon = action.icon;
        return (
          <Link key={action.href} href={action.href}>
            <Widget className="hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer">
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="p-3 bg-brand-100 rounded-full">
                  <Icon className="w-6 h-6 text-brand-600" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {action.label}
                </span>
              </div>
            </Widget>
          </Link>
        );
      })}
    </div>
  );
}
```

#### Scenario (검증 기준)

:red_circle: **SC-M13-014: 빈 대시보드 화면 렌더링 성공**
- Given: Admin 권한이 있는 사용자로 로그인
- When: `/admin` 접속
- Then: 대시보드 페이지가 정상 렌더링, 위젯 영역들이 표시됨

:red_circle: **SC-M13-015: 위젯 영역 구조 확인**
- Given: Admin 대시보드 화면
- When: 화면 렌더링 완료
- Then: "오늘의 할 일", "이번 달 현황", "빠른 액션" 3개 섹션이 표시됨

:yellow_circle: **SC-M13-016: 빠른 액션 네비게이션**
- Given: Admin 대시보드 화면
- When: "모임 생성" 빠른 액션 클릭
- Then: `/admin/meetings/new` 페이지로 이동

:yellow_circle: **SC-M13-017: 위젯 스켈레톤 로딩**
- Given: 데이터 로딩 중
- When: 대시보드 접속
- Then: 각 위젯에 스켈레톤 로딩 UI 표시

#### 사용자 가치
> "대시보드에서 오늘 처리할 일과 현황을 한눈에 파악하고, 자주 사용하는 기능에 빠르게 접근할 수 있다"

---

## 4. 기술 스택

| 영역 | 기술 | 용도 |
|------|------|------|
| 인증 | Supabase Auth | 사용자 인증 |
| 미들웨어 | Next.js Middleware | 경로 보호 |
| 데이터 | Supabase PostgreSQL | app_settings 테이블 |
| UI | Tailwind CSS | Admin 스타일링 |
| 애니메이션 | Framer Motion | 사이드바 토글 |
| 아이콘 | Lucide React | 메뉴/위젯 아이콘 |

---

## 5. 파일 구조

```
/lib
├── admin/
│   ├── auth.ts             # Admin 인증/권한 유틸
│   ├── permissions.ts      # 권한 상수
│   ├── settings.ts         # 설정 조회 유틸
│   └── navigation.ts       # 메뉴 설정

/types
└── settings.ts             # 설정 타입 정의

/components/admin
├── AdminSidebar.tsx        # 사이드바
├── AdminHeader.tsx         # 헤더
├── AdminPageContainer.tsx  # 페이지 컨테이너
├── Widget.tsx              # 위젯 컨테이너
├── WidgetSkeleton.tsx      # 위젯 스켈레톤
├── TodoWidget.tsx          # 할 일 위젯
├── StatsWidget.tsx         # 통계 위젯
└── QuickActionsWidget.tsx  # 빠른 액션 위젯

/app/admin
├── layout.tsx              # Admin 레이아웃
├── page.tsx                # 대시보드
└── unauthorized/
    └── page.tsx            # 권한 없음 페이지

/supabase
└── migration-m13-app-settings.sql
```

---

## 6. 전체 완료 검증

### Phase 13.1 완료 조건
- [ ] `/admin` 미들웨어 경로 보호 동작
- [ ] 비로그인/권한없음 시 리다이렉트
- [ ] getAdminSession() 함수 동작
- [ ] hasPermission() 함수 동작

### Phase 13.2 완료 조건
- [ ] app_settings 테이블 생성
- [ ] 기본 설정값 시드
- [ ] RLS 정책 동작 확인
- [ ] getSetting/getSettings 유틸 동작

### Phase 13.3 완료 조건
- [ ] Admin 레이아웃 렌더링
- [ ] 사이드바 네비게이션 동작
- [ ] 헤더 사용자 정보/로그아웃 동작
- [ ] 사이드바 토글 동작
- [ ] 권한별 메뉴 필터링

### Phase 13.4 완료 조건
- [ ] 대시보드 페이지 렌더링
- [ ] 위젯 영역 3개 표시
- [ ] 빠른 액션 링크 동작
- [ ] 위젯 스켈레톤 UI

### 전체 M13 완료 조건
- [ ] 모든 Phase 완료
- [ ] 모든 Scenario 통과
- [ ] TypeScript 에러 0개
- [ ] 빌드 성공
- [ ] main 머지 완료

---

## 7. 의존성 다이어그램

```
[M5 완료: 기존 운영자 도구]
├── 기존 admin 페이지
├── admin_permissions 테이블
└── 권한 체크 로직
    |
    v
[Phase 13.1] Admin 인증 + 미들웨어
    |
    v
[Phase 13.2] app_settings 테이블 (13.1 완료 후)
    |
    v
[Phase 13.3] 공통 레이아웃 (13.1 완료 후)
    |
    v
[Phase 13.4] 대시보드 껍데기 (13.3 완료 후)
    |
    v
[M13 완료] -> M14 시작 가능
```

---

## 8. 위험 관리

| 위험 | 영향 | 대응 방안 |
|------|------|----------|
| 미들웨어 성능 | 모든 /admin 요청 지연 | 세션 캐싱, 권한 캐싱 검토 |
| RLS 정책 복잡성 | 설정 조회 실패 | 정책 단순화, 테스트 강화 |
| 레이아웃 깨짐 | 모바일 사용성 저하 | 반응형 테스트 강화 |
| 기존 코드 충돌 | M5 기능 영향 | 단계적 통합, 회귀 테스트 |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-28 | 1.0 | 최초 작성 |
