# 배포 체크리스트

## Firebase 설정 (FCM)
1. Firebase 콘솔에서 프로젝트 생성
2. Android 앱 등록 (패키지명: com.babyday.app)
3. `google-services.json` 다운로드 → `native-android/app/` 에 배치
4. SHA-1 인증서 지문 등록 (Google OAuth 용)
5. `app/build.gradle.kts` 에서 Firebase 의존성 주석 해제:
   ```kotlin
   // alias(libs.plugins.google.services)  →  alias(libs.plugins.google.services)
   // implementation(platform("com.google.firebase:firebase-bom:33.14.0"))  →  활성화
   // implementation("com.google.firebase:firebase-messaging-ktx")          →  활성화
   ```
6. FirebaseMessagingService 기반 수신 서비스를 새로 구현하고 AndroidManifest.xml에 등록
7. 알림 기능을 구현한 뒤 `POST_NOTIFICATIONS` 권한 선언과 Android 13+ 런타임 요청을 추가

## Kakao OAuth 설정
1. Kakao Developers 콘솔에서 앱 생성 (https://developers.kakao.com)
2. `local.properties`의 `kakao.native_app_key` 를 실제 키로 업데이트
3. 키 해시 등록 (디버그 + 릴리즈):
   ```bash
   # Debug key hash
   keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
   ```
4. Kakao 콘솔 → 앱 설정 → 플랫폼 → Android → 키 해시 등록
5. Kakao 로그인 활성화 (동의항목 설정)

## 앱 서명 (Play Store)
```bash
keytool -genkey -v -keystore babyday-release.jks \
  -alias babyday -keyalg RSA -keysize 2048 -validity 10000
```
생성된 `.jks` 파일을 안전한 곳에 보관하고 절대 git에 커밋하지 않는다.

`local.properties`에 추가:
```
keystore.path=../babyday-release.jks
keystore.password=YOUR_PASSWORD
key.alias=babyday
key.password=YOUR_KEY_PASSWORD
```

`app/build.gradle.kts` `android.signingConfigs.release` 블록에서 읽어 사용.

## Supabase 설정
- Redirect URL에 `babyday://auth/callback` 추가 (Authentication → URL Configuration)
- RLS 정책 확인 (baby_logs, babies, baby_members 모두 인증된 유저만 접근)
- `invite_codes` 테이블 만료 코드 자동 삭제 정책 설정 권장

## 최종 빌드 전 체크
- [ ] google-services.json 배치 완료
- [ ] kakao.native_app_key 실제 값 입력
- [ ] Firebase 의존성 주석 해제
- [ ] FirebaseMessagingService 수신 서비스 구현 및 Manifest 등록
- [ ] 알림 기능 구현 후 POST_NOTIFICATIONS 권한 요청 추가
- [ ] 앱 서명 키스토어 설정
- [ ] proguard-rules.pro Kakao/Supabase 규칙 추가
- [ ] targetSdk 35 Play Store 정책 준수 확인
