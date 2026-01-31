import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sentry 소스맵 업로드를 위한 설정
  productionBrowserSourceMaps: true,
}

const sentryWebpackPluginOptions = {
  // Sentry 조직 및 프로젝트
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth 토큰 (소스맵 업로드용)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // 빌드 시 에러 무시 (토큰 없을 때도 빌드 가능)
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // 소스맵 숨기기 (프로덕션에서는 노출하지 않음)
  hideSourceMaps: true,

  // 자동 트리 쉐이킹
  disableLogger: true,
}

// Sentry DSN이 설정된 경우에만 Sentry 래핑
const config = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig

export default config
