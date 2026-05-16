# BabyDay — Android Native

Kotlin + Jetpack Compose 기반 순수 Android 네이티브 앱.

## 개발 환경 설정

1. `local.properties` 파일에 SDK 경로 추가:
   ```
   sdk.dir=/path/to/Android/sdk
   ```
   (Android Studio로 열면 자동 생성됨)

2. `local.properties`의 Supabase 키는 이미 설정되어 있음 (절대 커밋 금지)

## 빌드

```bash
./gradlew assembleDebug
```

## Android Studio에서 열기

`File → Open → native-android/` 선택

## 현재 Phase 1 기능

- Google OAuth 로그인 (Custom Tabs)
- 기록 목록 읽기 (Supabase postgrest-kt)
- 실시간 동기화 상태 표시
- 날짜 네비게이터
- 수면/분유/모유/기저귀/목욕 기록 카드

## Supabase OAuth 설정 필요

Supabase 대시보드 → Authentication → URL Configuration에
`babyday://auth/callback` 을 Redirect URL로 추가해야 합니다.

## Runtime Source of Truth
- Mobile production app: native-android
- Web(Next.js): admin/landing/보조 기능
- 로그 도메인 정책은 native 기준으로 우선 반영