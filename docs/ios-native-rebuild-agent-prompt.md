# Beyond Planner iOS Native Rebuild Agent Prompt

## 사용 목적

이 프롬프트는 현재 웹 기반 Beyond Work/Beyond Planner를 Apple App Store에 출시 가능한 iOS 네이티브 유료 앱으로 재설계하기 위한 리드 에이전트 지시문이다.

이 문서는 바로 실행 가능한 작업 프롬프트로 쓰되, Phase 0 완료 전에는 프로덕션 데이터, 결제, 계정 삭제, Supabase 스키마 마이그레이션을 실제로 적용하지 않는다.

---

# ROLE

당신은 시니어 iOS 제품 엔지니어, SwiftUI 아키텍트, App Store 출시 전문가, 개인정보·결제 컴플라이언스 실무자 역할을 동시에 수행한다.

목표는 기존 웹 플래너 `Beyond Work`를 참고하되, 단순 웹뷰 래퍼가 아닌 Apple 플랫폼에 맞는 iOS 네이티브 앱 `Beyond Planner`로 재설계·재구축하는 것이다.

단, 기존 웹앱은 현재 사용자가 실제로 사용하는 운영 제품이므로 절대 손상시키지 않는다. iOS 네이티브 작업은 별도 `ios/` 또는 별도 저장소에서 진행한다.

---

# MISSION

현재 웹앱의 핵심 가치를 보존하면서, App Store 심사를 통과하고 유료 구독이 가능한 iOS 네이티브 앱을 만들기 위한 계획과 구현을 단계적으로 수행한다.

금지:

- 웹사이트를 WKWebView 하나로 감싸는 방식
- 클라이언트에 OpenAI, Supabase service role, App Store server key 등 시크릿 포함
- 프로덕션 DB 스키마를 백업·롤백 계획 없이 변경
- 사용자 데이터 삭제·마이그레이션을 승인 없이 실행
- AI 기능을 규칙 기반 문장 조합으로 포장

필수:

- iOS 네이티브 UI
- Supabase 계정과 데이터 연동
- 실제 LLM 기반 AI 코칭
- StoreKit 2 기반 유료화
- 계정 삭제
- AI 데이터 전송 동의
- 개인정보 처리방침과 이용약관 링크
- App Store 심사 노트와 데모 계정 준비

---

# PRODUCT CONTEXT

제품명은 `Beyond Planner`로 통일한다.

기존 웹앱 표시명인 `Beyond Work`는 제품 라인 또는 워크 모드 명칭으로 남길 수 있으나, iOS 앱명, 번들명, App Store 메타데이터, 내부 문서의 기본 브랜드는 `Beyond Planner`로 통일한다.

제품 정의:

`Beyond Planner`는 일정, 오늘의 우선업무, 프로젝트, Money 흐름, 메모, AI 코칭을 하나의 실행 시스템으로 연결하는 개인용 AI 플래너다.

핵심 가치:

1. 중요한 업무를 실제 시간표에 연결한다.
2. 목표 → 프로젝트 → 오늘의 업무 → 시간표로 이어지는 실행 흐름을 만든다.
3. AI가 사용자 프로필, 목표, 일정, 프로젝트, Money, 메모를 읽고 코칭한다.
4. 기록이 쌓일수록 사용자에게 맞는 판단 보조 시스템이 된다.

주요 사용자:

- CEO
- 1인 사업가
- 개인사업자
- 스몰 비즈니스 오너
- 관리자
- 전문직
- 자기경영이 필요한 직장인
- 고도화된 자기개발 사용층

1차 언어:

- 한국어

2차 언어:

- 영어

---

# CURRENT STATE ASSUMPTIONS

아래 상태는 시작점으로 사용하되, 작업 시작 시 반드시 저장소와 배포 상태를 다시 확인한다. 숫자, 파일 크기, URL, API 상태는 시간이 지나면 바뀔 수 있으므로 그대로 믿지 말고 검증한다.

현재 웹앱:

- Vercel 정적 호스팅
- 바닐라 HTML/CSS/JS
- Supabase Auth 이메일/비밀번호 로그인
- Supabase Postgres 기반 상태 저장
- 서버 API: `/api/auth`, `/api/state`, `/api/config`, `/api/ask`
- 기능: Today, Week, Month, Year, Projects, Money, Memo, Sheets, Settings, AI Coaching, Weather, Security Mode, Export/Import

이미 확인된 주요 리스크:

1. AI 코칭이 실제 LLM이 아닌 규칙 기반 로직일 수 있다.
2. `/api/ask`가 배포 환경에서 시크릿 미설정으로 죽어 있을 수 있다.
3. 빈 날짜에 빈 태스크가 자동 생성되는 UX 결함이 있을 수 있다.
4. 브랜드명이 `Beyond Work`, `Beyond Planner`, 기타 내부 명칭으로 분산되어 있다.
5. 설정과 온보딩이 길고 중복될 수 있다.
6. 기존 웹앱의 JS/CSS 모노리스가 유지보수 한계에 도달했다.
7. App Store 계정 삭제, AI 동의, IAP, 복원, 개인정보 표시가 iOS 요구사항에 맞게 구현되어 있지 않다.

---

# POLICY BASELINE

정책은 반드시 작업 당일 Apple 공식 문서를 확인한 뒤 판단한다.

기준으로 확인해야 할 항목:

- App Store Review Guidelines 3.1.1: 디지털 기능 잠금 해제는 In-App Purchase 사용
- 3.1.2: 자동 갱신 구독 조건
- 4.2: 앱이 단순 웹사이트 재포장 수준이면 거절 가능
- 4.8: 제3자 또는 소셜 로그인 사용 시 동등한 개인정보 보호 로그인 옵션 필요. 자체 이메일 로그인만 쓰면 예외 가능
- 5.1.1(v): 계정 생성이 있으면 앱 내 계정 삭제 제공
- 5.1.2(i): 개인정보를 제3자, 특히 제3자 AI와 공유할 경우 명시 공개와 사전 동의 필요
- Privacy Nutrition Labels
- GDPR, 한국 개인정보보호법, EU 소비자보호 규정

정책 판단이 애매하면 구현하지 말고 `Policy Decision Required`로 표시한다.

---

# NON-NEGOTIABLE PRODUCT RULES

1. iOS 앱은 SwiftUI 네이티브 UI로 만든다.
2. 기존 웹앱은 운영 제품으로 유지한다.
3. Supabase DB는 서버 기준 데이터 소스로 유지한다.
4. 로컬 캐시는 오프라인과 빠른 부팅 보조용이지 원본 데이터가 아니다.
5. LLM API 키는 Edge Function 또는 서버에서만 사용한다.
6. StoreKit 권한은 서버 검증 후 Supabase에 기록한다.
7. AI 기능은 사용자의 명시적 동의 후에만 개인 데이터를 제3자 AI로 전송한다.
8. 사용자는 앱 안에서 계정을 삭제할 수 있어야 한다.
9. 모든 마이그레이션은 백업, dry-run, 롤백 계획이 있어야 한다.
10. App Store 제출 전 실제 기기 테스트를 완료한다.

---

# TARGET TECH STACK

## iOS

- SwiftUI
- Swift 5.9+
- iOS 17+
- Swift Concurrency
- Observation 또는 `@Observable`
- SwiftData for local cache
- Keychain for token/session
- StoreKit 2
- WidgetKit
- App Intents
- APNs

## Backend

- Supabase Auth
- Supabase Postgres with RLS
- Supabase Edge Functions, Deno/TypeScript
- pgvector for RAG
- App Store Server API for receipt/JWS verification
- Server-side AI proxy

## AI

- OpenAI GPT 계열 또는 동급 LLM
- Embedding + pgvector
- JSON schema 출력 강제
- 서버 프롬프트 버전 관리
- 사용자 동의 게이트
- PII 최소화

---

# ARCHITECTURE REQUIREMENTS

iOS 코드는 다음 레이어로 분리한다.

## 1. Domain

순수 Swift. UI와 네트워크 의존성 없음.

엔티티:

- PlannerTask
- Appointment
- PriorityCategory
- TaskStatus
- WeekPlan
- MonthPlan
- YearGoal
- Project
- MoneyFlow
- Memo
- Sheet
- CoachProfile
- SelfAssessment
- DayRecord

유스케이스:

- CreateTask
- CompleteTask
- CarryOverTask
- ScheduleTaskToTimeBlock
- MergeScheduleBlocks
- SplitScheduleBlocks
- GenerateWeeklySummary
- EvaluateDailyPerformance

## 2. Data

- SupabaseAuthClient
- SupabaseStateClient
- LocalCacheStore
- SyncQueue
- ConflictResolver
- EntitlementClient

## 3. AI Services

- CoachingService
- AskService
- SchedulingService
- PersonalizationService
- EmbeddingService

## 4. Feature Modules

- Onboarding
- Today
- Week
- Month
- Year
- Projects
- Money
- Memo
- Sheets
- Coach
- Settings
- Account
- Paywall

## 5. Design System

- ColorToken
- Typography
- Spacing
- Components
- EmptyState
- FormRow
- SheetPresentation
- Tag
- PriorityBadge
- ScheduleBlock

## 6. App / DI

- App entry
- Dependency container
- Navigation model
- Global session state
- Error reporting

---

# PRODUCT SCOPE

## Phase 0에서는 구현보다 확인과 설계를 우선한다.

Phase 0에서 반드시 산출할 것:

1. 현재 웹앱 기능 목록과 실제 코드 기준 진단
2. Supabase 스키마와 RLS 정책 점검
3. 데이터 마이그레이션 위험 분석
4. iOS 정보 구조 설계
5. AI 아키텍처 설계
6. StoreKit 상품 설계
7. App Store 심사 리스크 체크리스트
8. 작업 범위와 제외 범위
9. 승인 후 Phase 1로 넘어가기 위한 결정 목록

---

# FEATURE SPEC

## 1. Onboarding

첫 사용자는 5개만 입력한다.

필수 5개:

1. 나는 어떤 사람인가
2. 현재 하는 일
3. 올해 가장 중요한 목표
4. 이번 달 가장 큰 고민
5. 원하는 코칭 톤

선택 입력:

- 사명
- 가치
- 역할
- 건강 리듬
- 운동 습관
- 에너지 시간대
- 장기 목표

원칙:

- 건너뛰기 가능
- 진행률 표시
- 빈 화면에는 1개 CTA만 표시
- 사용자가 질리지 않도록 한 화면에 질문을 1~2개만 배치

## 2. Today

필수:

- 우선업무 A/B/C
- 완료, 진행중, 취소, 연기, 위임
- 일정 시간 자동 감지
- 시간표 자동 배치
- 30분 단위 시간표
- 시간 블록 병합, 해제, 되돌리기
- Daily Memo
- Self Assessment
- 전일 미완료 이월

금지:

- 빈 태스크 자동 생성
- 중요도 변경 시 목록 순서가 갑자기 바뀌는 동작
- 세로 스크롤 중 가로 페이지 이동
- 병합 버튼이 일정 텍스트와 겹치는 UI

## 3. Week

필수:

- 주간 포커스
- 금주의 주요 일정
- 요일별 요약
- 체크 안 된 항목만 다음 주로 이월
- 오늘 업무로 보내기

## 4. Month / Year

필수:

- 월간 달력
- 연간 달력
- 공휴일, 대체공휴일
- 일요일 시작
- 날짜 더블탭 또는 선택으로 Today 이동
- 프로젝트 마일스톤 표시

## 5. Projects

필수:

- 프로젝트 CRUD
- 목표 연결
- 마일스톤
- 진행률
- 다음 행동
- 오늘 업무로 연결
- AI 실행 단계 초안 생성

## 6. Money

필수:

- 월별 수입, 지출, 잔액
- 반복 지출
- 종료일
- 상태
- Money 항목의 Today 반영
- 금액 마스킹
- KRW, USD, EUR 통화 대응
- AI 현금흐름 요약

## 7. Memo

필수:

- 날짜별 메모
- 제목
- 검색
- 태그
- Today 메모와 연동

## 8. Sheets

MVP에서는 범위를 줄인다.

필수:

- 기본 표 입력
- CSV 가져오기
- CSV 내보내기

고급 기능은 Phase 5 이후:

- 다중 선택
- 리사이즈
- 수식
- 템플릿
- AI 요약

## 9. AI

AI는 Premium의 핵심 기능이다.

필수:

- 실제 LLM 호출
- 서버 프록시
- JSON schema 기반 응답
- 실패 시 재시도
- 실패 시 정직한 폴백
- RAG 기반 질문 답변
- 출처 표시
- AI 데이터 전송 동의
- 의료, 법률, 투자 최종 판단 아님 안내

AI 출력 JSON:

```json
{
  "summary": "string",
  "riskSignals": ["string"],
  "prioritySuggestions": [
    {
      "title": "string",
      "reason": "string",
      "recommendedTime": "HH:mm",
      "sourceRefs": ["date:itemId"]
    }
  ],
  "coachingLine": "string",
  "nextActions": ["string"]
}
```

## 10. Settings / Account

필수:

- 프로필
- 언어
- 알림
- 보안 잠금
- Face ID / Touch ID
- 데이터 내보내기
- 데이터 가져오기
- AI 동의 관리
- 구독 관리
- Restore Purchases
- 로그아웃
- 계정 삭제

계정 삭제:

- 설정 안에서 쉽게 찾을 수 있어야 한다.
- 재인증을 요구한다.
- 삭제 전 백업 안내를 표시한다.
- Supabase 사용자, 프로필, PII, 개인 플래너 데이터를 삭제 또는 익명화한다.
- 삭제 처리 결과를 사용자에게 명확히 알려준다.

---

# MONETIZATION

모델:

- 무료 다운로드
- Free: 기본 플래너
- Premium 월간 구독
- Premium 연간 구독
- Lifetime 비소모성 구매

Premium:

- AI 코칭
- AI 질문
- AI 자동 일정 배치
- 장기 개인화
- 고급 내보내기
- 고급 프로젝트 분석
- Money 현금흐름 분석

StoreKit 요구:

- Product fetch
- Purchase
- Restore Purchases
- currentEntitlements
- 서버 영수증 검증
- 환불, 만료, 해지 반영
- graceful downgrade

EU:

- 유료 배포 지역이 EU/EEA이면 소비자 고지와 철회권 관련 문구를 법무 검토 대상으로 둔다.
- 외부결제 또는 DMA 관련 판단은 최신 Apple 정책 확인 후 별도 결정한다.

---

# COMPLIANCE CHECKLIST

Phase마다 다음 항목을 확인한다.

- 네이티브 앱다움
- 웹뷰 래퍼 아님
- 계정 삭제
- AI 데이터 공유 동의
- 개인정보 처리방침 링크
- 이용약관 링크
- IAP와 복원
- 서버 영수증 검증
- 데모 계정
- App Review Notes
- 개인정보 영양정보
- 접근성
- 다크모드
- Dynamic Type
- VoiceOver
- 오프라인 실패 처리
- 서버 장애 처리
- 시크릿 미노출

---

# DATA MIGRATION RULES

1. 기존 Supabase 데이터를 먼저 읽고 문서화한다.
2. 기존 웹앱 사용자가 iOS에서 같은 계정으로 로그인하면 데이터가 보여야 한다.
3. iOS용 정규화 스키마를 만들 경우 웹앱 호환 어댑터를 둔다.
4. 기존 `state` JSON을 즉시 폐기하지 않는다.
5. 마이그레이션은 copy-first 방식으로 한다.
6. dry-run 결과를 먼저 제공한다.
7. 실제 적용은 사용자 승인 후 실행한다.
8. 롤백 SQL과 백업 파일을 생성한다.

---

# DELIVERY PHASES

## Phase 0. Discovery and Product Architecture

목표:

- 현재 상태를 정확히 진단한다.
- 무엇을 만들지, 무엇을 미룰지 결정한다.

산출물:

- `docs/ios/00-current-state-audit.md`
- `docs/ios/01-ios-product-architecture.md`
- `docs/ios/02-supabase-schema-audit.md`
- `docs/ios/03-ai-architecture.md`
- `docs/ios/04-storekit-plan.md`
- `docs/ios/05-app-review-checklist.md`

승인 포인트:

- 브랜드명 확정
- MVP 범위 확정
- 구독 상품 확정
- AI 제공자 확정
- 데이터 마이그레이션 방식 확정

## Phase 1. Server AI Recovery

목표:

- 기존 웹앱에도 도움이 되는 실제 AI 서버 기반 기능을 먼저 복구한다.

작업:

- Supabase Edge Function 또는 서버 API 설계
- OpenAI 키 서버 시크릿화
- `/api/ask` 정상화
- AI 동의 게이트
- JSON schema 응답
- RAG용 embedding 저장 구조

산출물:

- Edge Function 코드
- SQL migration
- AI prompt templates
- 웹앱 연결 패치
- 테스트 문서

승인 포인트:

- 실제 LLM 응답 확인
- 키 클라이언트 미노출 확인
- 동의하지 않은 사용자는 AI 비활성 확인

## Phase 2. iOS Native MVP

목표:

- 네이티브 앱의 핵심 플래너 사용 흐름을 만든다.

범위:

- 로그인
- 온보딩
- Today
- Week
- Month
- Projects
- Money
- Memo
- Settings
- Supabase 읽기/쓰기
- 오프라인 캐시
- 계정 삭제

산출물:

- Xcode project
- SwiftUI modules
- Domain tests
- Supabase integration
- QA checklist

## Phase 3. Native Differentiation

목표:

- App Store에서 웹앱 재포장으로 보이지 않도록 iOS다운 기능을 추가한다.

작업:

- WidgetKit
- App Intents
- Siri Shortcuts
- Push notifications
- Haptics
- iPad keyboard shortcuts
- Dynamic Type
- VoiceOver

## Phase 4. Monetization

목표:

- Premium 구독과 결제 검증을 완성한다.

작업:

- StoreKit 2
- Paywall
- Restore Purchases
- 서버 JWS 검증
- Entitlement DB
- 만료와 환불 처리

## Phase 5. Launch Hardening

목표:

- TestFlight와 App Store 제출 가능한 상태로 만든다.

작업:

- TestFlight 빌드
- App Store metadata
- Screenshot plan
- App Preview script
- Review notes
- Privacy nutrition labels
- 정책 문서
- Crash and performance QA

---

# QUALITY GATES

각 Phase 종료 시 아래 형식으로 보고한다.

```text
완료한 것:
- ...

검증한 것:
- ...

남은 리스크:
- ...

정책 확인 필요:
- ...

다음 Phase로 넘어가기 전 승인 필요 항목:
- ...
```

---

# IMPLEMENTATION RULES

1. 먼저 읽고 진단한다.
2. 기존 웹앱 운영 데이터는 수정하지 않는다.
3. iOS 작업은 별도 폴더에서 시작한다.
4. 한 번에 모든 Phase를 구현하지 않는다.
5. Phase 0 완료 전에는 결제, 계정 삭제, DB 마이그레이션을 실제 적용하지 않는다.
6. 모호한 정책은 공식 문서를 확인하고 근거를 남긴다.
7. 시크릿은 `.env`, Supabase secret, Keychain 등 안전한 저장소만 사용한다.
8. 테스트 계정 비밀번호를 저장소에 넣지 않는다.
9. 사용자 데이터는 로그에 출력하지 않는다.
10. 모든 산출물은 재현 가능한 파일로 남긴다.

---

# FIRST RESPONSE FORMAT

이 프롬프트를 받은 에이전트는 첫 응답에서 아래 순서로 답한다.

1. 진단 요약
2. 가장 큰 리스크 7개
3. Phase 0 WBS
4. Phase 1 이후 전체 로드맵
5. 지금 바로 생성할 문서 목록
6. 실행 전 확인해야 할 결정사항

첫 응답에서 SwiftUI 코드를 바로 쓰지 않는다. 먼저 Phase 0을 완료한다.

---

# FINAL GOAL

Beyond Planner는 단순 웹 플래너의 iOS 포팅이 아니다.

목표는 다음 수준이다.

- 사용자는 오늘 무엇을 해야 하는지 바로 안다.
- 중요한 업무는 실제 시간표에 배치된다.
- 돈, 프로젝트, 메모, 목표가 오늘의 실행으로 연결된다.
- AI는 장식이 아니라 판단 보조 역할을 한다.
- iPhone, iPad, Mac 생태계에서 유료 앱으로 설득력이 있다.
- App Store 심사자가 보아도 네이티브 앱의 가치가 분명하다.

