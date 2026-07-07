# Beyond Work 전체 회원 데이터 복구 기록

작성일: 2026-07-07 KST

## 현재 판단

- 앱 시작 시 로컬 캐시의 `updatedAt`이 서버보다 최신이면 `force` 저장으로 서버를 덮는 흐름이 있었습니다.
- 이 흐름 때문에 빈 로컬 캐시 또는 일부만 남은 캐시가 Supabase의 `planner_states.state`를 덮어쓴 것으로 보입니다.
- 현재 코드에는 앱 시작 시 서버에 의미 있는 데이터가 있으면 로컬 캐시가 더 최신처럼 보여도 자동 업로드하지 않도록 응급 보호 로직을 넣었습니다.

## 이미 확보한 복구 후보

- Supabase 단일 계정 복구 후보:
  - `outputs/db-backup-before-local-restore-2026-07-03T00-41-22-955Z.json`
  - `outputs/db-backup-before-local-restore-2026-07-07T06-20-36-750Z.json`
- Mac 브라우저 로컬 저장소 추출 후보:
  - `outputs/local-recovery-*/manifest.json`
  - 가장 풍부한 후보는 익명/레거시 로컬 상태로 `2026-07-23`까지 날짜 키가 있습니다.
  - `projch@naver.com` 후보는 `2026-07-06`까지 확인됩니다.

## 전체 회원 복구에 필요한 것

전체 회원의 Supabase 데이터를 직접 복구하려면 아래 중 하나가 필요합니다.

1. Supabase `service_role` 키
2. Supabase SQL Editor에서 실행 가능한 관리자 권한
3. Supabase PITR 또는 백업 프로젝트
4. 각 사용자 기기에 남아 있는 로컬 저장소 또는 JSON 백업

현재 로컬 프로젝트의 `.env.local`에는 공개 anon key만 있고, 전체 회원 row를 읽거나 복구할 수 있는 service role 권한은 없습니다.

## 권장 복구 순서

1. Supabase SQL Editor에서 `supabase/recovery_2026_07_07.sql`을 먼저 실행해 현재 상태를 스냅샷으로 남깁니다.
2. Supabase Dashboard에서 PITR 또는 백업 복원을 확인합니다.
3. 백업 프로젝트를 새로 만든 뒤 `auth.users`와 `public.planner_states`를 export합니다.
4. 현재 프로젝트에는 `planner_states`만 회원별 `user_id` 기준으로 upsert합니다.
5. 사용자 기기에만 남은 데이터는 JSON 백업 또는 로컬 저장소 추출본을 받아 회원 이메일과 매칭해 선별 복구합니다.

## 재발 방지

- 빈 state 또는 의미 있는 데이터가 없는 state는 서버에 저장하지 않습니다.
- 앱 시작 시 서버 state가 존재하면 로컬 캐시가 더 최신이어도 자동 force upload하지 않습니다.
- 전체 회원 복구 전에는 반드시 현재 `planner_states` 스냅샷을 남깁니다.
- 이후에는 `planner_state_revisions` 같은 revision/audit 테이블을 추가해 모든 저장 직전 버전을 보관하는 것이 필요합니다.

