# Beyond Work 전체 회원 데이터 복구 기록

작성일: 2026-07-07 KST

## 현재 판단

- 앱 시작 시 로컬 캐시의 `updatedAt`이 서버보다 최신이면 `force` 저장으로 서버를 덮는 흐름이 있었습니다.
- 이 흐름 때문에 빈 로컬 캐시 또는 일부만 남은 캐시가 Supabase의 `planner_states.state`를 덮어쓴 것으로 보입니다.
- 기존 구조에는 DB 저장 전 버전을 별도로 남기는 revision 테이블이 없어서, 한번 덮어쓴 뒤에는 Supabase 백업/PITR 또는 각 기기의 로컬 저장소가 사실상 유일한 복구원입니다.

## 적용한 재발 방지 구현

- 앱 시작 시 서버에 의미 있는 데이터가 있으면 로컬 캐시가 더 최신처럼 보여도 자동 업로드하지 않습니다.
- `/api/state`와 로컬 `server.py` 모두 기존 데이터 대비 새 데이터가 비어 있거나 80% 이상 급감하면 `409`로 저장을 거부합니다.
- 특수한 운영 복구 상황에서만 서버 환경변수 `ALLOW_DESTRUCTIVE_PLANNER_SAVE=1`로 차단을 해제할 수 있습니다.
- `supabase/planner_states.sql`에 `planner_state_revisions` 테이블과 트리거를 추가했습니다.
- `planner_states`가 update/delete되기 직전의 이전 state가 `planner_state_revisions`에 자동 보관됩니다.
- Supabase DB 트리거에서도 급격한 축소 저장을 한 번 더 차단합니다.

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
2. Supabase SQL Editor에서 최신 `supabase/planner_states.sql`을 실행해 revision/audit/guard 트리거를 적용합니다.
3. Supabase Dashboard에서 PITR 또는 백업 복원을 확인합니다.
4. 백업 프로젝트를 새로 만든 뒤 `auth.users`와 `public.planner_states`를 export합니다.
5. 현재 프로젝트에는 `planner_states`만 회원별 `user_id` 기준으로 upsert합니다.
6. 사용자 기기에만 남은 데이터는 JSON 백업 또는 로컬 저장소 추출본을 받아 회원 이메일과 매칭해 선별 복구합니다.

## 재발 방지

- 빈 state 또는 의미 있는 데이터가 없는 state는 서버에 저장하지 않습니다.
- 앱 시작 시 서버 state가 존재하면 로컬 캐시가 더 최신이어도 자동 force upload하지 않습니다.
- 전체 회원 복구 전에는 반드시 현재 `planner_states` 스냅샷을 남깁니다.
- `planner_state_revisions` revision/audit 테이블로 모든 update/delete 직전 버전을 보관합니다.
- Supabase SQL Editor에서 긴급 복구를 위해 작은 state로 의도적으로 되돌릴 때는 같은 transaction 안에서 `set local app.allow_destructive_planner_save = 'on';`을 먼저 실행합니다.
