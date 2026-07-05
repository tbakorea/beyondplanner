const STORAGE_KEY = "franklinClassicPlanner2026.v1";
const STATE_META_KEY = "beyondWorkPlannerStateMeta.v1";
const INSTALLATION_KEY = "beyondWorkInstallationId";
const LOCK_CONFIG_KEY = "beyondWorkLockConfig.v1";
const BIOMETRIC_KEY = "beyondWorkBiometricCredential.v1";
const PRIVACY_CONFIG_KEY = "beyondWorkPrivacyConfig.v1";
const AUTH_USERS_KEY = "beyondWorkAuthUsers.v1";
const AUTH_SESSION_KEY = "beyondWorkAuthSession.v1";
const ONBOARDING_DISMISSED_KEY = "beyondWorkOnboardingDismissed.v1";
const DAILY_OPENING_SEEN_KEY = "beyondWorkDailyOpeningSeen.v1";
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_PRIVACY_TIMEOUT_SECONDS = 180;
requirePlannerAuth();
if (new URLSearchParams(window.location.search).get("reset") === "1") {
  localStorage.removeItem(plannerStorageKey());
  history.replaceState(null, "", window.location.pathname);
}
const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const koreanCalendarEvents = {
  "2026-01-01": [{ label: "신정", type: "holiday" }],
  "2026-02-16": [{ label: "설 연휴", type: "holiday" }],
  "2026-02-17": [{ label: "설날", type: "holiday" }],
  "2026-02-18": [{ label: "설 연휴", type: "holiday" }],
  "2026-03-01": [{ label: "삼일절", type: "national" }],
  "2026-03-02": [{ label: "삼일절 대체", type: "holiday" }],
  "2026-05-01": [{ label: "노동절", type: "holiday" }],
  "2026-05-05": [{ label: "어린이날", type: "holiday" }],
  "2026-05-24": [{ label: "부처님오신날", type: "holiday" }],
  "2026-05-25": [{ label: "부처님 대체", type: "holiday" }],
  "2026-06-03": [{ label: "지방선거", type: "holiday" }],
  "2026-06-06": [{ label: "현충일", type: "holiday" }],
  "2026-07-17": [{ label: "제헌절", type: "national" }],
  "2026-08-15": [{ label: "광복절", type: "national" }],
  "2026-08-17": [{ label: "광복절 대체", type: "holiday" }],
  "2026-09-24": [{ label: "추석 연휴", type: "holiday" }],
  "2026-09-25": [{ label: "추석", type: "holiday" }],
  "2026-09-26": [{ label: "추석 연휴", type: "holiday" }],
  "2026-10-03": [{ label: "개천절", type: "national" }],
  "2026-10-05": [{ label: "개천절 대체", type: "holiday" }],
  "2026-10-09": [{ label: "한글날", type: "national" }],
  "2026-12-25": [{ label: "성탄절", type: "holiday" }],
};
const recurringSolarEvents = {
  "01-01": [{ label: "신정", type: "holiday" }],
  "03-01": [{ label: "삼일절", type: "national" }],
  "05-01": [{ label: "노동절", type: "holiday" }],
  "05-05": [{ label: "어린이날", type: "holiday" }],
  "06-06": [{ label: "현충일", type: "holiday" }],
  "07-17": [{ label: "제헌절", type: "national" }],
  "08-15": [{ label: "광복절", type: "national" }],
  "10-03": [{ label: "개천절", type: "national" }],
  "10-09": [{ label: "한글날", type: "national" }],
  "12-25": [{ label: "성탄절", type: "holiday" }],
};
const lunarDateFormatter = new Intl.DateTimeFormat("ko-KR-u-ca-chinese", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  day: "numeric",
});
const priorities = [
  ["A", "가장 중요한 일"],
  ["B", "중요하지만 유연한 일"],
  ["C", "가능하면 처리할 일"],
];
const repeatFrequencies = [
  ["daily", "매일"],
  ["weekly", "매주"],
  ["monthly", "매월"],
  ["yearly", "매년"],
];
const repeatFrequencySortOrder = { yearly: 0, monthly: 1, weekly: 2, daily: 3 };
const REPEAT_PRIORITY_MIN_ROWS = 12;
const taskPriorityOptions = ["선택", "A", "B", "C", "취소", "연기"];
const moneyTypes = ["수입", "지출", "이자", "카드대금", "용돈", "기타"];
const moneyStatuses = ["예정", "확인", "보류", "완료"];
const projectStatuses = ["대기", "진행", "보류", "완료"];
const projectMoneyTypes = ["수입", "비용"];
const sheetCellTypes = ["general", "number", "currency", "date", "checkbox"];
const sheetAlignments = ["left", "center", "right"];
const sheetFills = ["none", "yellow", "sage", "rose"];
const SHEET_MIN_ROWS = 6;
const SHEET_MAX_ROWS = 100;
const SHEET_MIN_COLUMNS = 3;
const SHEET_MAX_COLUMNS = 12;
const SHEET_DEFAULT_COLUMN_WIDTH = 132;
const SHEET_MIN_COLUMN_WIDTH = 64;
const SHEET_MAX_COLUMN_WIDTH = 360;
const SHEET_DEFAULT_ROW_HEIGHT = 36;
const SHEET_MIN_ROW_HEIGHT = 28;
const SHEET_MAX_ROW_HEIGHT = 160;
const defaultRoles = ["개인", "가족", "일", "성장", "공헌", "건강", "관계"];
const isMacEnvironment = /Mac|iPhone|iPad/.test(navigator.platform || "") || /Macintosh|iPhone|iPad/.test(navigator.userAgent || "");
const timeSlots = Array.from({ length: 23 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});
const hourlyTimeSlots = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);

const defaultProfileFields = {
  age: "",
  job: "",
  roles: "",
  goals: "",
  decisionPrinciples: "",
  currentChallenges: "",
  strengths: "",
  risks: "",
  energyWindow: "",
  coachingStyle: "",
  healthStatus: "",
  medications: "",
  exerciseLimits: "",
  activityLevel: "",
  exerciseGoal: "",
  recoveryPattern: "",
};

let selectedDate = todayInPlanner();
let selectedFinanceMonth = monthKey(selectedDate);
let hasInitialDeviceCache = hasCachedPlannerState();
let state = loadState();
let searchQuery = "";
let aiSearch = { query: "", answer: "", loading: false, error: "" };
let saveStatus = { ready: false, environment: "db", message: "저장 확인 중", saving: false };
let accountSaveReady = false;
let accountSaveTimer = 0;
let passiveRefreshTimer = 0;
let lastServerUpdatedAt = "";
let daySwipeKey = "";
let plannerMode = localStorage.getItem("beyondWorkMode") || "";
const installationId = getInstallationId();
const dayPanelOrder = ["week", "main", "memo"];
let currentDayPanel = "main";
let dateSlideTimer = 0;
let dailyCalendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
let dailyCalendarSwipeSuppressClick = false;
let weekCalendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
let weekCalendarSwipeSuppressClick = false;
let monthCalendarSwipeSuppressClick = false;
let monthDateTap = { key: "", at: 0 };
let mobileDayFocusResetTimer = 0;
let dailyFieldEditingUntil = 0;
let dailyTextEditingActive = false;
let dailyTaskRefreshTimer = 0;
let lockTimer = 0;
let privacyTimer = 0;
let isLocked = false;
let isPrivacyBlind = false;
let financeTurnDirection = 0;
let financeSwipeSuppressClick = false;
let projectDetailOpen = false;
let projectSlideOpening = false;
let projectSwipeSuppressClick = false;
let selectedSheetId = state.customSheets.activeId;
let selectedSheetCell = "A1";
let selectedSheetHeader = null;
let sheetDetailOpen = false;
let sheetSlideOpening = false;
let sheetSwipeSuppressClick = false;
let sheetHeaderResizeSuppressClick = false;
let mobileDayFocusMode = "split";

function el(id) {
  return document.getElementById(id);
}

function confirmDelete(message = "삭제할까요? 이 작업은 되돌리기 어렵습니다.") {
  return window.confirm(message);
}

function requirePlannerAuth() {
  const session = getAuthSession();
  if (session?.email) return;
  const next = encodeURIComponent(`${window.location.pathname}${window.location.search}${window.location.hash}`);
  window.location.replace(`../login/?next=${next}`);
  throw new Error("Beyond Work login required");
}

function getAuthSession() {
  try {
    const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
    const users = JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "{}");
    const user = session?.email ? users[session.email] : null;
    if (!session?.email) return null;
    if (session.provider !== "supabase" || !session.accessToken) return null;
    return {
      ...session,
      tier: normalizeAccountTier(user?.tier || session.tier),
      name: user?.name || session.name || "",
    };
  } catch {
    return null;
  }
}

function isAuthSessionExpired(session, leewaySeconds = 60) {
  const expiresAt = Number(session?.expiresAt || 0);
  return Boolean(expiresAt && expiresAt * 1000 <= Date.now() + leewaySeconds * 1000);
}

async function ensureFreshAuthSession() {
  const session = getAuthSession();
  if (!session?.accessToken) return null;
  if (!isAuthSessionExpired(session)) return session;
  if (!session.refreshToken) {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "refresh", refreshToken: session.refreshToken }),
    });
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok || !payload.session?.accessToken) {
      throw new Error(payload.error || "로그인 세션을 갱신할 수 없습니다.");
    }
    const user = payload.user || {};
    const nextSession = {
      ...session,
      email: String(user.email || session.email).toLowerCase(),
      tier: normalizeAccountTier(user.tier || session.tier),
      name: user.name || session.name || "",
      provider: "supabase",
      accessToken: payload.session.accessToken,
      refreshToken: payload.session.refreshToken || session.refreshToken,
      expiresAt: payload.session.expiresAt || session.expiresAt || "",
      refreshedAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
    cacheAuthUser(nextSession);
    return getAuthSession();
  } catch {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

function cacheAuthUser(session) {
  if (!session?.email) return;
  try {
    const users = JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "{}");
    users[session.email] = {
      ...(users[session.email] || {}),
      email: session.email,
      name: session.name || users[session.email]?.name || "",
      tier: normalizeAccountTier(session.tier),
      provider: "supabase",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  } catch {
    // Auth cache is only a display helper; DB access depends on the session token.
  }
}

function logoutPlanner() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  const next = encodeURIComponent(`${window.location.pathname}${window.location.search}${window.location.hash}`);
  window.location.href = `../login/?next=${next}`;
}

async function updateAccountPassword() {
  const message = el("accountPasswordMessage");
  const passwordInput = el("accountNewPassword");
  const confirmInput = el("accountNewPasswordConfirm");
  const button = el("accountPasswordButton");
  const nextPassword = passwordInput?.value || "";
  const confirmPassword = confirmInput?.value || "";
  if (message) message.textContent = "";
  if (nextPassword.length < 6) {
    if (message) message.textContent = "6자리 이상으로 설정하세요.";
    passwordInput?.focus();
    return;
  }
  if (nextPassword !== confirmPassword) {
    if (message) message.textContent = "확인 비밀번호가 일치하지 않습니다.";
    confirmInput?.focus();
    return;
  }
  const session = await ensureFreshAuthSession();
  if (!session?.accessToken) {
    if (message) message.textContent = "다시 로그인 후 변경하세요.";
    return;
  }
  try {
    if (button) button.disabled = true;
    if (message) message.textContent = "변경 중입니다...";
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_password", accessToken: session.accessToken, password: nextPassword }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "비밀번호를 변경하지 못했습니다.");
    passwordInput.value = "";
    confirmInput.value = "";
    if (message) message.textContent = "비밀번호가 변경되었습니다.";
  } catch (error) {
    if (message) message.textContent = error.message || "비밀번호 변경 실패";
  } finally {
    if (button) button.disabled = false;
  }
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function iso(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthKey(date = selectedDate) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function weekKey(date = selectedDate) {
  return iso(startOfWeek(date));
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(date) {
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
}

function formatShortDate(date) {
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit", weekday: "short" });
}

function formatCompassDate(date) {
  return `${pad(date.getMonth() + 1)}. ${pad(date.getDate())}. ${weekdays[date.getDay()]}`;
}

function todayInPlanner() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

function getInstallationId() {
  let id = localStorage.getItem(INSTALLATION_KEY);
  if (!id) {
    id = `installation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(INSTALLATION_KEY, id);
  }
  return id;
}

function plannerStorageKey() {
  const session = getAuthSession();
  const account = session?.email ? encodeURIComponent(session.email) : "anonymous";
  return `${STORAGE_KEY}.${account}`;
}

function hasCachedPlannerState() {
  try {
    return Boolean(localStorage.getItem(plannerStorageKey()));
  } catch {
    return false;
  }
}

function newTaskId() {
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTask(task = {}) {
  task.id ||= newTaskId();
  task.status ||= task.done ? "완료" : "미완료";
  task.delegate ||= "";
  task.carryoverDeletedFrom ||= "";
  if (!task.text?.trim() && task.status === "미완료" && task.priorityUnset === undefined) {
    task.priorityUnset = true;
  }
  return task;
}

function normalizeDayTasks(day) {
  if (!day) return;
  day.tasks ||= { A: emptyTasks(5), B: emptyTasks(5), C: emptyTasks(5) };
  priorities.forEach(([priority]) => {
    day.tasks[priority] ||= emptyTasks(5);
    day.tasks[priority].forEach(normalizeTask);
  });
}

function loadState() {
  try {
    const cached = JSON.parse(localStorage.getItem(plannerStorageKey()) || "null");
    if (cached && typeof cached === "object") {
      return migrateState(cached);
    }
  } catch {
    // Fall back to a blank planner if the local device cache is unreadable.
  }
  return loadEmptyState();
}

function migrateState(nextState) {
  nextState.finance ||= createFinanceState();
  normalizeFinanceState(nextState.finance);
  nextState.projects ||= createProjectState();
  normalizeProjectState(nextState.projects);
  nextState.customSheets ||= createCustomSheetsState();
  normalizeCustomSheetsState(nextState.customSheets);
  nextState.notes ||= { projects: Array.from({ length: 8 }, () => ""), references: Array.from({ length: 8 }, () => ""), freeform: "" };
  nextState.profile = { ...defaultProfileFields, ...(nextState.profile || {}) };
  nextState.calendar ||= {};
  nextState.calendar.events ||= [];
  nextState.scheduleUnitChanges = normalizeScheduleUnitChanges(nextState.scheduleUnitChanges);
  nextState.repeats ||= {};
  nextState.repeats.priorityTasks ||= emptyRepeatRules(REPEAT_PRIORITY_MIN_ROWS);
  while (nextState.repeats.priorityTasks.length < REPEAT_PRIORITY_MIN_ROWS) nextState.repeats.priorityTasks.push(emptyRepeatRule());
  nextState.repeats.priorityTasks.forEach(normalizeRepeatRule);
  Object.entries(nextState.weeks || {}).forEach(([key, week]) => {
    week.priorities ||= createWeeklyPriorities(key, nextState);
    while (week.priorities.length < 5) week.priorities.push({ text: "", done: false });
    week.priorities = week.priorities.slice(0, 5);
    week.compass ||= [];
    week.compass = week.compass.filter((item) => item.role !== "일");
    week.compass.forEach((item) => {
      if (Array.isArray(item.actions)) item.actions = item.actions.slice(0, 2);
    });
  });
  Object.values(nextState.days || {}).forEach((day) => {
    day.memo ||= "";
    day.appointmentMerges ||= {};
    day.scheduleUnit = normalizeScheduleUnit(day.scheduleUnit || "");
    ensureAppointmentSlots(day, day.scheduleUnit);
    normalizeDayTasks(day);
  });
  return nextState;
}

function createCustomSheetsState() {
  const firstSheet = createCustomSheet("새 시트 1", "blank");
  return { activeId: firstSheet.id, items: [firstSheet] };
}

function createCustomSheet(name = "새 시트", template = "blank") {
  const sheet = {
    id: `sheet-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    rows: 12,
    columns: 6,
    cells: {},
    formats: {},
    columnWidths: [],
    rowHeights: [],
    titleRows: 0,
    titleColumns: 0,
  };
  applySheetTemplate(sheet, template);
  return sheet;
}

function normalizeCustomSheetsState(customSheets) {
  customSheets.items = Array.isArray(customSheets.items) ? customSheets.items : [];
  if (!customSheets.items.length) customSheets.items.push(createCustomSheet("새 시트 1", "blank"));
  customSheets.items.forEach((sheet, index) => {
    sheet.id ||= `sheet-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;
    sheet.name = String(sheet.name || `시트 ${index + 1}`).slice(0, 40);
    sheet.rows = Math.max(SHEET_MIN_ROWS, Math.min(SHEET_MAX_ROWS, Number(sheet.rows) || 12));
    sheet.columns = Math.max(SHEET_MIN_COLUMNS, Math.min(SHEET_MAX_COLUMNS, Number(sheet.columns) || 6));
    sheet.cells = sheet.cells && typeof sheet.cells === "object" ? sheet.cells : {};
    sheet.formats = sheet.formats && typeof sheet.formats === "object" ? sheet.formats : {};
    sheet.columnWidths = normalizeSheetSizes(sheet.columnWidths, sheet.columns, SHEET_DEFAULT_COLUMN_WIDTH, SHEET_MIN_COLUMN_WIDTH, SHEET_MAX_COLUMN_WIDTH);
    sheet.rowHeights = normalizeSheetSizes(sheet.rowHeights, sheet.rows, SHEET_DEFAULT_ROW_HEIGHT, SHEET_MIN_ROW_HEIGHT, SHEET_MAX_ROW_HEIGHT);
    sheet.titleRows = clampNumber(sheet.titleRows, 0, 1, 0);
    sheet.titleColumns = clampNumber(sheet.titleColumns, 0, 1, 0);
  });
  if (!customSheets.items.some((sheet) => sheet.id === customSheets.activeId)) {
    customSheets.activeId = customSheets.items[0].id;
  }
}

function normalizeSheetSizes(values, count, fallback, min, max) {
  const next = Array.isArray(values) ? values.slice(0, count) : [];
  while (next.length < count) next.push(fallback);
  return next.map((value) => clampNumber(value, min, max, fallback));
}

function applySheetTemplate(sheet, template) {
  const templates = {
    checklist: {
      columns: 6,
      headers: ["완료", "중요도", "점검 항목", "담당", "확인일", "메모"],
      types: ["checkbox", "general", "general", "general", "date", "general"],
      widths: [70, 76, 220, 110, 118, 220],
      samples: [
        ["FALSE", "A", "오늘 반드시 확인할 점검 항목", "나", "", "기준과 결과를 짧게 기록"],
        ["FALSE", "B", "정기 확인 항목", "", "", ""],
      ],
    },
    finance: {
      columns: 7,
      headers: ["확인", "구분", "내용", "예정일", "수입", "지출", "메모"],
      types: ["checkbox", "general", "general", "date", "currency", "currency", "general"],
      widths: [68, 86, 210, 118, 120, 120, 220],
      samples: [
        ["FALSE", "지출", "카드대금", "", "", "", "우선업무 반영 필요"],
        ["FALSE", "수입", "계약금", "", "", "", "입금 확인"],
      ],
    },
    projectAction: {
      columns: 8,
      headers: ["상태", "프로젝트", "다음 행동", "담당", "시작일", "마감일", "리스크", "메모"],
      types: ["general", "general", "general", "general", "date", "date", "general", "general"],
      widths: [86, 190, 240, 110, 118, 118, 180, 220],
      samples: [
        ["진행", "신규 프로젝트", "이번 주 첫 실행 행동", "나", "", "", "의사결정 지연", "오늘 우선업무로 연결"],
        ["대기", "운영 개선", "자료 확인", "", "", "", "", ""],
      ],
    },
    meeting: {
      columns: 7,
      headers: ["일시", "회의명", "참석자", "결정사항", "후속업무", "담당", "기한"],
      types: ["date", "general", "general", "general", "general", "general", "date"],
      widths: [118, 180, 170, 260, 240, 110, 118],
      samples: [
        ["", "주간 회의", "참석자", "결정된 내용", "다음 행동", "담당자", ""],
      ],
    },
    goalTracker: {
      columns: 8,
      headers: ["목표", "역할/영역", "지표", "현재", "목표값", "달성률", "다음 액션", "점검일"],
      types: ["general", "general", "general", "number", "number", "number", "general", "date"],
      widths: [210, 130, 130, 92, 92, 92, 240, 118],
      samples: [
        ["핵심 목표", "일", "완료 건수", "", "", "", "오늘 할 첫 행동", ""],
        ["성장 목표", "성장", "학습 시간", "", "", "", "", ""],
      ],
    },
    client: {
      columns: 8,
      headers: ["구분", "이름/회사", "연락처", "관계", "최근 접촉", "다음 연락", "관심/이슈", "메모"],
      types: ["general", "general", "general", "general", "date", "date", "general", "general"],
      widths: [86, 170, 150, 110, 118, 118, 220, 220],
      samples: [
        ["고객", "거래처명", "", "핵심", "", "", "관심 이슈", "다음 연락 내용을 기록"],
      ],
    },
    profitSim: {
      columns: 8,
      headers: ["항목", "구분", "예상수입", "예상비용", "확률", "예상손익", "시점", "메모"],
      types: ["general", "general", "currency", "currency", "number", "currency", "date", "general"],
      widths: [180, 90, 120, 120, 80, 130, 118, 220],
      samples: [
        ["프로젝트 A", "수입", "", "", "80", "=C2*E2/100-D2", "", "확률 반영 손익"],
        ["외주 비용", "비용", "", "", "100", "=C3*E3/100-D3", "", ""],
      ],
    },
  };
  templates.project = templates.projectAction;
  const preset = templates[template];
  if (!preset) return;
  sheet.columns = preset.columns;
  sheet.titleRows = 1;
  sheet.titleColumns = 0;
  sheet.columnWidths = normalizeSheetSizes(preset.widths, sheet.columns, SHEET_DEFAULT_COLUMN_WIDTH, SHEET_MIN_COLUMN_WIDTH, SHEET_MAX_COLUMN_WIDTH);
  preset.headers.forEach((header, index) => {
    const reference = `${sheetColumnLabel(index)}1`;
    sheet.cells[reference] = header;
    sheet.formats[reference] = { type: "general", bold: true, fill: "sage", align: "center" };
    for (let row = 2; row <= sheet.rows; row += 1) {
      const cellReference = `${sheetColumnLabel(index)}${row}`;
      if (preset.types[index] !== "general") sheet.formats[cellReference] = { type: preset.types[index] };
    }
  });
  (preset.samples || []).forEach((rowValues, rowIndex) => {
    rowValues.forEach((value, columnIndex) => {
      const reference = `${sheetColumnLabel(columnIndex)}${rowIndex + 2}`;
      sheet.cells[reference] = value;
    });
  });
}

function createFinanceState() {
  return {
    months: createFinanceMonths(),
    fixed: Array.from({ length: 6 }, () => emptyMoneyItem("지출")),
    issueMemo: "",
    decisionMemo: "",
  };
}

function emptyMoneyItem(type = "지출") {
  return {
    id: `money-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title: "",
    amount: "",
    dueDay: "",
    status: "예정",
    memo: "",
    taskDate: "",
    repeatEndMode: "none",
    repeatEndDate: "",
  };
}

function financeMonthKeys() {
  const year = Number(String(selectedFinanceMonth || monthKey(selectedDate)).split("-")[0]) || selectedDate.getFullYear();
  return Array.from({ length: 12 }, (_, index) => `${year}-${pad(index + 1)}`);
}

function createFinanceMonths() {
  return Object.fromEntries(financeMonthKeys().map((key) => [key, Array.from({ length: 5 }, () => emptyMoneyItem())]));
}

function normalizeFinanceState(finance) {
  if (!finance.months) {
    finance.months = createFinanceMonths();
    const legacyMonth = monthKey(selectedDate);
    if (Array.isArray(finance.monthly)) finance.months[legacyMonth] = finance.monthly;
  }
  delete finance.monthly;
  finance.fixed ||= [];
  finance.issueMemo ||= "";
  finance.decisionMemo ||= "";
  financeMonthKeys().forEach((key) => {
    finance.months[key] ||= Array.from({ length: 5 }, () => emptyMoneyItem());
    while (finance.months[key].length < 5) finance.months[key].push(emptyMoneyItem());
  });
  while (finance.fixed.length < 6) finance.fixed.push(emptyMoneyItem("지출"));
  Object.keys(finance.months).forEach((key) => {
    finance.months[key] = finance.months[key].map((item) => normalizeMoneyItem(item));
  });
  finance.fixed = finance.fixed.map((item) => normalizeMoneyItem(item, "지출"));
}

function ensureFinanceMonth(key = selectedFinanceMonth) {
  state.finance ||= createFinanceState();
  state.finance.months ||= {};
  state.finance.months[key] ||= Array.from({ length: 5 }, () => emptyMoneyItem());
  while (state.finance.months[key].length < 5) state.finance.months[key].push(emptyMoneyItem());
  state.finance.months[key] = state.finance.months[key].map((item) => normalizeMoneyItem(item));
  return state.finance.months[key];
}

function normalizeMoneyItem(item, fallbackType = "지출") {
  return {
    id: item?.id || `money-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: moneyTypes.includes(item?.type) ? item.type : fallbackType,
    title: item?.title || "",
    amount: item?.amount || "",
    dueDay: item?.dueDay || "",
    status: moneyStatuses.includes(item?.status) ? item.status : "예정",
    memo: item?.memo || "",
    taskDate: item?.taskDate || "",
    repeatEndMode: item?.repeatEndMode === "date" ? "date" : "none",
    repeatEndDate: item?.repeatEndDate || "",
  };
}

function createProjectState() {
  return {
    items: [
      emptyProject("신규 프로젝트"),
      emptyProject("운영 개선"),
      emptyProject("매출 프로젝트"),
    ],
  };
}

function emptyProject(title = "") {
  return {
    id: `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    status: "진행",
    owner: "",
    startDate: "",
    endDate: "",
    goal: "",
    nextAction: "",
    dueDate: "",
    budget: "",
    actual: "",
    notes: "",
    finances: [emptyProjectMoney("수입"), emptyProjectMoney("비용"), emptyProjectMoney("비용")],
  };
}

function emptyProjectMoney(type = "비용") {
  return {
    id: `project-money-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title: "",
    amount: "",
    probability: type === "수입" ? "70" : "100",
    timing: "",
    memo: "",
  };
}

function normalizeProjectState(projects) {
  projects.items ||= [];
  if (!projects.items.length) projects.items = createProjectState().items;
  projects.items = projects.items.map((project) => normalizeProject(project));
  if (!projects.selectedId || !projects.items.some((project) => project.id === projects.selectedId)) {
    projects.selectedId = projects.items[0]?.id || "";
  }
}

function normalizeProject(project) {
  return {
    id: project?.id || `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: project?.title || "",
    status: projectStatuses.includes(project?.status) ? project.status : "진행",
    owner: project?.owner || "",
    startDate: project?.startDate || "",
    endDate: project?.endDate || "",
    goal: project?.goal || "",
    nextAction: project?.nextAction || "",
    dueDate: project?.dueDate || "",
    budget: project?.budget || "",
    actual: project?.actual || "",
    notes: project?.notes || "",
    finances: Array.isArray(project?.finances) ? project.finances.map((item) => normalizeProjectMoney(item)) : [emptyProjectMoney("수입"), emptyProjectMoney("비용")],
  };
}

function normalizeProjectMoney(item) {
  return {
    id: item?.id || `project-money-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: projectMoneyTypes.includes(item?.type) ? item.type : "비용",
    title: item?.title || "",
    amount: item?.amount || "",
    probability: item?.probability || (item?.type === "수입" ? "70" : "100"),
    timing: item?.timing || "",
    memo: item?.memo || "",
  };
}

function saveState(options = {}) {
  Object.values(state.days || {}).forEach((day) => normalizeDayTasks(day));
  localStorage.setItem(plannerStorageKey(), JSON.stringify(state));
  markLocalStateUpdated();
  scheduleAccountSave(options.fastSave ? 120 : 650);
}

function refreshDailyTaskRelatedViews() {
  renderSidebar();
  renderMonthCalendar();
  renderWeek();
}

function scheduleDailyTaskRelatedRefresh(delay = 180) {
  window.clearTimeout(dailyTaskRefreshTimer);
  dailyTaskRefreshTimer = window.setTimeout(() => {
    if (dailyTextEditingActive || isDailyFieldEditingRecent()) {
      scheduleDailyTaskRelatedRefresh(700);
      return;
    }
    refreshDailyTaskRelatedViews();
  }, delay);
}

function flushDailyTaskRelatedRefresh() {
  window.clearTimeout(dailyTaskRefreshTimer);
  refreshDailyTaskRelatedViews();
}

function renderSidebarAfterDailyInput() {
  if (dailyTextEditingActive || isDailyFieldEditingRecent()) {
    scheduleDailyTaskRelatedRefresh(700);
    return;
  }
  renderSidebar();
}

async function hydrateServerState() {
  try {
    await hydrateServerConfig();
    const session = await ensureFreshAuthSession();
    if (!session?.accessToken) {
      accountSaveReady = false;
      saveStatus.ready = false;
      saveStatus.message = "다시 로그인 필요";
      logoutPlanner();
      return;
    }
    const response = await fetch("/api/state", { cache: "no-store", headers: authStateHeaders() });
    if (!response.ok) throw new Error(await extractSaveError(response));
    const payload = await response.json();
    accountSaveReady = true;
    saveStatus.ready = true;
    if (payload.exists && payload.state) {
      const localMeta = getStateMeta();
      const localUpdatedAt = localMeta.updatedAt || "";
      lastServerUpdatedAt = payload.updatedAt || "";
      if (!localUpdatedAt || isTimestampNewer(payload.updatedAt, localUpdatedAt)) {
        setBootMessage("최신 서버 데이터를 반영하는 중");
        storeStateFromServer(payload, "최신 데이터 반영됨");
      } else {
        saveStatus.message = localMeta.dirty ? "기기 작업 유지 중" : "기기 캐시 최신";
        if (isTimestampNewer(localUpdatedAt, payload.updatedAt)) {
          setBootMessage("기기 작업을 서버에 맞추는 중");
          await persistStateToServer({ force: true });
        }
      }
    } else {
      const hadLocalContent = hasPlannerContent(state);
      if (!hadLocalContent) state = loadEmptyState();
      selectedSheetId = state.customSheets.activeId;
      localStorage.setItem(plannerStorageKey(), JSON.stringify(state));
      if (!getStateMeta().updatedAt) saveStateMeta({ updatedAt: "", lastSavedAt: "", dirty: false, accountEmail: getAuthSession()?.email || "" });
      if (hadLocalContent) {
        saveStatus.message = "기기 캐시 서버 반영 중";
        setBootMessage("기기 작업을 서버에 저장하는 중");
        await persistStateToServer({ force: true });
      } else {
        saveStatus.message = "새 플래너 준비됨";
      }
    }
  } catch (error) {
    accountSaveReady = false;
    saveStatus.ready = false;
    saveStatus.environment = "db";
    saveStatus.message = error.message || "저장 연결 실패";
  }
}

function loadEmptyState() {
  return {
    foundation: {
      mission: "",
      values: Array.from({ length: 6 }, () => ""),
      roles: defaultRoles.map((role) => ({ role, goal: "", renewal: "" })),
    },
    year: {
      goals: Array.from({ length: 8 }, () => ""),
      future: Array.from({ length: 8 }, () => ""),
    },
    months: {},
    weeks: {},
    days: {},
    repeats: {
      priorityTasks: emptyRepeatRules(REPEAT_PRIORITY_MIN_ROWS),
    },
    scheduleUnitChanges: [],
    profile: { ...defaultProfileFields },
    notes: {
      projects: Array.from({ length: 8 }, () => ""),
      references: Array.from({ length: 8 }, () => ""),
      freeform: "",
    },
    finance: createFinanceState(),
    projects: createProjectState(),
    customSheets: createCustomSheetsState(),
    calendar: {
      events: [],
    },
  };
}

async function hydrateServerConfig() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    saveStatus.environment = payload.storage === "supabase-db" ? "db" : payload.environment || "server";
  } catch {
    saveStatus.environment = "db";
  }
}

function scheduleAccountSave(delay = 650) {
  if (!accountSaveReady) {
    saveStatus.message = getAuthSession()?.accessToken ? "저장 대기" : "로그인이 필요합니다";
    renderSidebarAfterDailyInput();
    return;
  }
  window.clearTimeout(accountSaveTimer);
  saveStatus.saving = true;
  saveStatus.message = "저장 중";
  renderSidebarAfterDailyInput();
  accountSaveTimer = window.setTimeout(() => {
    persistStateToServer();
  }, delay);
}

async function persistStateToServer(options = {}) {
  if (!accountSaveReady) return;
  const session = await ensureFreshAuthSession();
  if (!session?.accessToken) {
    accountSaveReady = false;
    saveStatus.saving = false;
    saveStatus.message = "다시 로그인 필요";
    renderSidebarAfterDailyInput();
    logoutPlanner();
    return;
  }
  if (!options.force && !hasPlannerContent(state)) {
    saveStatus.saving = false;
    saveStatus.message = "저장됨";
    renderSidebarAfterDailyInput();
    return;
  }
  const updatedAt = options.bumpUpdatedAt ? markLocalStateUpdated() : getStateMeta().updatedAt || markLocalStateUpdated();
  try {
    const response = await fetch("/api/state", {
      method: "POST",
      headers: authStateHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ state, updatedAt }),
    });
    if (!response.ok) throw new Error(await extractSaveError(response));
    const payload = await response.json().catch(() => ({}));
    if (payload.stale) {
      lastServerUpdatedAt = payload.updatedAt || lastServerUpdatedAt;
      saveStatus.ready = true;
      saveStatus.saving = false;
      saveStatus.message = "최신 데이터 불러오는 중";
      await pullServerStateIfNewer({ force: true });
      return;
    }
    lastServerUpdatedAt = payload.updatedAt || updatedAt;
    saveStateMeta({ updatedAt: lastServerUpdatedAt, lastSavedAt: lastServerUpdatedAt, dirty: false, accountEmail: getAuthSession()?.email || "" });
    saveStatus.ready = true;
    saveStatus.saving = false;
    saveStatus.message = "저장됨";
    renderSidebarAfterDailyInput();
  } catch (error) {
    saveStatus.saving = false;
    saveStatus.message = error.message || "저장 실패";
    renderSidebarAfterDailyInput();
  }
}

async function pullServerStateIfNewer(options = {}) {
  if (!accountSaveReady || (!options.force && saveStatus.saving)) return;
  const session = await ensureFreshAuthSession();
  if (!session?.accessToken) {
    accountSaveReady = false;
    saveStatus.message = "다시 로그인 필요";
    renderSidebarAfterDailyInput();
    logoutPlanner();
    return;
  }
  const localMeta = getStateMeta();
  if (!options.force && localMeta.dirty && Date.now() - timestampMs(localMeta.updatedAt) < 3000) return;
  if (dailyTextEditingActive || isDailyFieldEditingRecent()) {
    saveStatus.message = "입력 완료 후 최신 확인";
    renderSidebarAfterDailyInput();
    return;
  }
  try {
    const response = await fetch("/api/state", { cache: "no-store", headers: authStateHeaders() });
    if (!response.ok) throw new Error(await extractSaveError(response));
    const payload = await response.json();
    if (!payload.exists || !payload.state || !payload.updatedAt) return;
    if (!options.force && lastServerUpdatedAt && !isTimestampNewer(payload.updatedAt, lastServerUpdatedAt)) return;
    storeStateFromServer(payload, "저장됨");
    renderAll();
  } catch (error) {
    saveStatus.message = error.message || "저장 확인 실패";
    renderSidebarAfterDailyInput();
  }
}

function authStateHeaders(extra = {}) {
  const session = getAuthSession();
  return {
    ...extra,
    ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
  };
}

function getStateMeta() {
  try {
    return JSON.parse(localStorage.getItem(STATE_META_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStateMeta(meta) {
  localStorage.setItem(STATE_META_KEY, JSON.stringify({ ...getStateMeta(), ...meta }));
}

function markLocalStateUpdated() {
  const updatedAt = new Date().toISOString();
  saveStateMeta({ updatedAt, dirty: true, accountEmail: getAuthSession()?.email || "" });
  return updatedAt;
}

function storeStateFromServer(payload, message) {
  state = migrateState(payload.state);
  selectedSheetId = state.customSheets.activeId;
  lastServerUpdatedAt = payload.updatedAt || "";
  localStorage.setItem(plannerStorageKey(), JSON.stringify(state));
  saveStateMeta({ updatedAt: lastServerUpdatedAt, lastSavedAt: lastServerUpdatedAt, dirty: false, accountEmail: getAuthSession()?.email || "" });
  saveStatus.message = message;
}

function isTimestampNewer(left, right) {
  return timestampMs(left) > timestampMs(right);
}

function timestampMs(value) {
  const ms = Date.parse(value || "");
  return Number.isFinite(ms) ? ms : 0;
}

async function extractSaveError(response) {
  try {
    const payload = await response.json();
    return payload.error || payload.message || "저장 실패";
  } catch {
    return "저장 실패";
  }
}

function queuePassiveServerPull() {
  if (!accountSaveReady || document.hidden) return;
  window.clearTimeout(passiveRefreshTimer);
  passiveRefreshTimer = window.setTimeout(() => {
    pullServerStateIfNewer();
  }, 420);
}

function hasPlannerContent(source = state) {
  const hasText = (value) => String(value || "").trim().length > 0;
  if (hasText(source.foundation?.mission)) return true;
  if ((source.foundation?.values || []).some(hasText)) return true;
  if ((source.foundation?.roles || []).some((role) => hasText(role.goal) || hasText(role.renewal))) return true;
  if ((source.year?.goals || []).some(hasText) || (source.year?.future || []).some(hasText)) return true;
  if (Object.values(source.months || {}).some((month) => hasText(month.focus) || (month.projects || []).some(hasText))) return true;
  if (Object.values(source.weeks || {}).some(weekHasContent)) return true;
  if (Object.values(source.days || {}).some(dayHasContent)) return true;
  if ((source.repeats?.priorityTasks || []).some((rule) => hasText(rule.text))) return true;
  if (Object.values(source.profile || {}).some(hasText)) return true;
  if ((source.notes?.projects || []).some(hasText) || (source.notes?.references || []).some(hasText) || hasText(source.notes?.freeform)) return true;
  if (financeHasContent(source.finance)) return true;
  if ((source.customSheets?.items || []).some((sheet) => Object.values(sheet.cells || {}).some(hasText))) return true;
  if ((source.calendar?.events || []).some((event) => hasText(event.title))) return true;
  return (source.projects?.items || []).some(projectHasUserContent);
}

function weekHasContent(week) {
  const hasText = (value) => String(value || "").trim().length > 0;
  return (week.priorities || []).some((item) => hasText(item.text) || item.done) ||
    (week.compass || []).some((item) => hasText(item.goal) || hasText(item.action) || (item.actions || []).some(hasText));
}

function dayHasContent(day) {
  const hasText = (value) => String(value || "").trim().length > 0;
  const hasTask = Object.values(day.tasks || {}).flat().some((task) => hasText(task.text) || task.done || task.status !== "미완료" || hasText(task.delegate));
  const hasAppointment = Object.values(day.appointments || {}).some(hasText) || Object.keys(day.appointmentMerges || {}).length > 0;
  return hasTask || hasAppointment || ["memo", "record", "wins", "carry", "lesson"].some((field) => hasText(day[field]));
}

function financeHasContent(finance) {
  if (!finance) return false;
  const moneyHasContent = (item) => ["title", "amount", "dueDay", "memo", "taskDate", "repeatEndDate"].some((field) => String(item?.[field] || "").trim());
  return (finance.fixed || []).some(moneyHasContent) ||
    Object.values(finance.months || {}).flat().some(moneyHasContent) ||
    ["issueMemo", "decisionMemo"].some((field) => String(finance[field] || "").trim());
}

function projectHasUserContent(project) {
  const hasText = (value) => String(value || "").trim().length > 0;
  const templateTitles = new Set(["신규 프로젝트", "운영 개선", "매출 프로젝트", "새 프로젝트"]);
  return (hasText(project.title) && !templateTitles.has(project.title.trim())) ||
    ["owner", "startDate", "endDate", "goal", "nextAction", "dueDate", "budget", "actual", "notes"].some((field) => hasText(project[field])) ||
    (project.finances || []).some((item) => ["title", "amount", "timing", "memo"].some((field) => hasText(item[field])));
}

function ensureMonth(key = monthKey()) {
  state.months[key] ||= {
    focus: "",
    projects: Array.from({ length: 8 }, () => ""),
  };
  return state.months[key];
}

function ensureWeek(key = weekKey()) {
  state.weeks[key] ||= {
    priorities: createWeeklyPriorities(key, state),
    compass: compassRoleNames().map((role) => ({ role, goal: "", action: "" })),
  };
  state.weeks[key].priorities ||= createWeeklyPriorities(key, state);
  while (state.weeks[key].priorities.length < 5) state.weeks[key].priorities.push({ text: "", done: false });
  state.weeks[key].priorities = state.weeks[key].priorities.slice(0, 5);
  state.weeks[key].compass ||= [];
  const roles = compassRoleNames();
  state.weeks[key].compass = roles.map((role, index) => {
    const existing = state.weeks[key].compass.find((item) => item.role === role) || state.weeks[key].compass[index] || {};
    existing.role = role;
    return existing;
  });
  return state.weeks[key];
}

function ensureDay(key = iso(selectedDate)) {
  const scheduleUnit = getEffectiveScheduleUnit(key);
  state.days[key] ||= {
    tasks: { A: emptyTasks(5), B: emptyTasks(5), C: emptyTasks(5) },
    appointments: Object.fromEntries(getScheduleSlotsForUnit(scheduleUnit).map((slot) => [slot, ""])),
    appointmentMerges: {},
    scheduleUnit,
    deletedRepeatIds: [],
    memo: "",
    record: "",
    wins: "",
    carry: "",
    lesson: "",
  };
  state.days[key].memo ||= "";
  state.days[key].scheduleUnit = normalizeScheduleUnit(state.days[key].scheduleUnit || scheduleUnit);
  state.days[key].appointmentMerges ||= {};
  state.days[key].deletedRepeatIds ||= [];
  ensureAppointmentSlots(state.days[key]);
  normalizeDayTasks(state.days[key]);
  applyRepeatingPriorityTasks(key);
  return state.days[key];
}

function normalizeScheduleUnit(value) {
  return value === "60" ? "60" : "30";
}

function normalizeScheduleUnitChanges(changes = []) {
  if (!Array.isArray(changes)) return [];
  return changes
    .filter((change) => isValidIsoDate(change?.date))
    .map((change) => ({ date: change.date, unit: normalizeScheduleUnit(change.unit) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getEffectiveScheduleUnit(key = iso(selectedDate)) {
  state.scheduleUnitChanges = normalizeScheduleUnitChanges(state.scheduleUnitChanges);
  const change = [...state.scheduleUnitChanges].reverse().find((item) => item.date <= key);
  return normalizeScheduleUnit(change?.unit || "30");
}

function setScheduleUnitFromDate(unit, key = iso(selectedDate)) {
  const nextUnit = normalizeScheduleUnit(unit);
  state.scheduleUnitChanges = normalizeScheduleUnitChanges(state.scheduleUnitChanges).filter((change) => change.date !== key);
  const previousUnit = getEffectiveScheduleUnit(previousDayKey(key));
  if (nextUnit !== previousUnit) state.scheduleUnitChanges.push({ date: key, unit: nextUnit });
  state.scheduleUnitChanges = normalizeScheduleUnitChanges(state.scheduleUnitChanges);
  const nextChangeDate = state.scheduleUnitChanges.find((change) => change.date > key)?.date || "";
  Object.entries(state.days || {}).forEach(([dayKey, day]) => {
    if (dayKey < key) return;
    if (nextChangeDate && dayKey >= nextChangeDate) return;
    convertAppointmentUnit(day, day.scheduleUnit || getEffectiveScheduleUnit(dayKey), nextUnit);
    day.scheduleUnit = nextUnit;
    ensureAppointmentSlots(day, nextUnit);
  });
  const day = ensureDay(key);
  convertAppointmentUnit(day, day.scheduleUnit || getEffectiveScheduleUnit(key), nextUnit);
  day.scheduleUnit = nextUnit;
  ensureAppointmentSlots(day, nextUnit);
  saveState();
  renderDay();
}

function previousDayKey(key) {
  const date = parseDate(key);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() - 1);
  return iso(date);
}

function getScheduleSlotsForUnit(unit = "30") {
  return normalizeScheduleUnit(unit) === "60" ? hourlyTimeSlots : timeSlots;
}

function getScheduleSlotsForDay(day = ensureDay()) {
  return getScheduleSlotsForUnit(day.scheduleUnit || getEffectiveScheduleUnit(iso(selectedDate)));
}

function ensureAppointmentSlots(day, unit = day?.scheduleUnit || "30") {
  if (!day) return;
  day.appointments ||= {};
  getScheduleSlotsForUnit(unit).forEach((slot) => {
    if (day.appointments[slot] === undefined) day.appointments[slot] = "";
  });
}

function convertAppointmentUnit(day, fromUnit, toUnit) {
  const previousUnit = normalizeScheduleUnit(fromUnit);
  const nextUnit = normalizeScheduleUnit(toUnit);
  if (!day?.appointments || previousUnit === nextUnit) return;
  if (previousUnit === "30" && nextUnit === "60") {
    hourlyTimeSlots.forEach((slot) => {
      const halfSlot = `${slot.slice(0, 3)}30`;
      const texts = [day.appointments[slot], day.appointments[halfSlot]].map((value) => String(value || "").trim()).filter(Boolean);
      if (texts.length) day.appointments[slot] = [...new Set(texts)].join(" ");
    });
  }
  day.appointmentMerges = {};
}

function createWeeklyPriorities(key, sourceState = null) {
  const previousKey = previousWeekKey(key);
  const previous = previousKey ? sourceState?.weeks?.[previousKey]?.priorities || [] : [];
  const carried = previous.filter((item) => item?.text && !item.done).map((item) => ({ text: item.text, done: false }));
  while (carried.length < 5) carried.push({ text: "", done: false });
  return carried.slice(0, 5);
}

function previousWeekKey(key) {
  if (!key) return "";
  const date = parseDate(key);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() - 7);
  return iso(date);
}

function compassRoleNames() {
  return state.foundation.roles.map((item) => item.role).filter(Boolean).filter((role) => role !== "일");
}

function emptyTasks(count) {
  return Array.from({ length: count }, () => ({ id: newTaskId(), text: "", status: "미완료", done: false, priorityUnset: true }));
}

function emptyRepeatRule() {
  const baseDate = selectedDate || todayInPlanner();
  return {
    text: "",
    priority: "A",
    frequency: "daily",
    weekday: baseDate.getDay(),
    weekdays: weekdays.map((_, index) => index),
    monthday: baseDate.getDate(),
    month: baseDate.getMonth() + 1,
    startDate: iso(baseDate),
    endMode: "none",
    endDate: "",
    active: true,
  };
}

function emptyRepeatRules(count) {
  return Array.from({ length: count }, () => emptyRepeatRule());
}

function ensureRepeatPriorityRows(minRows = REPEAT_PRIORITY_MIN_ROWS) {
  state.repeats ||= { priorityTasks: [] };
  state.repeats.priorityTasks ||= [];
  while (state.repeats.priorityTasks.length < minRows) state.repeats.priorityTasks.push(emptyRepeatRule());
  state.repeats.priorityTasks.forEach(normalizeRepeatRule);
}

function normalizeRepeatRule(rule = {}) {
  const baseDate = selectedDate || todayInPlanner();
  const frequencyValues = repeatFrequencies.map(([value]) => value);
  rule.text ||= "";
  rule.priority = ["A", "B", "C"].includes(rule.priority) ? rule.priority : "A";
  rule.frequency = frequencyValues.includes(rule.frequency) ? rule.frequency : "daily";
  rule.weekday = clampNumber(rule.weekday, 0, 6, baseDate.getDay());
  rule.weekdays = Array.isArray(rule.weekdays) ? rule.weekdays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) : [];
  if (!rule.weekdays.length) rule.weekdays = rule.frequency === "daily" ? weekdays.map((_, index) => index) : [rule.weekday];
  rule.weekdays = [...new Set(rule.weekdays)].sort((a, b) => a - b);
  rule.monthday = clampNumber(rule.monthday, 1, 31, baseDate.getDate());
  rule.month = clampNumber(rule.month, 1, 12, baseDate.getMonth() + 1);
  rule.startDate = isValidIsoDate(rule.startDate) ? rule.startDate : iso(baseDate);
  rule.endMode = rule.endMode === "date" ? "date" : "none";
  rule.endDate = isValidIsoDate(rule.endDate) ? rule.endDate : "";
  if (rule.endMode !== "date") rule.endDate = "";
  rule.deletedFrom = isValidIsoDate(rule.deletedFrom) ? rule.deletedFrom : "";
  rule.removed = rule.removed === true;
  rule.active = rule.active !== false;
  return rule;
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  return !Number.isNaN(parseDate(value).getTime());
}

function earliestIsoDate(...values) {
  return values.filter(isValidIsoDate).sort()[0] || iso(selectedDate || todayInPlanner());
}

function clampNumber(value, min, max, fallback) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}

function setPath(path, value) {
  const parts = path.split(".");
  let target = state;
  while (parts.length > 1) {
    const part = parts.shift();
    target = target[part];
  }
  target[parts[0]] = value;
  saveState();
  renderAll();
}

function getPath(path) {
  return path.split(".").reduce((target, part) => target?.[part], state);
}

function bindStoredTextareas() {
  document.querySelectorAll("[data-store]").forEach((field) => {
    field.value = getPath(field.dataset.store) || "";
    field.oninput = () => setPath(field.dataset.store, field.value);
  });
}

function setupSelectors() {
  el("dailyPrevDay").onclick = () => shiftDay(-1);
  el("dailyNextDay").onclick = () => shiftDay(1);
  el("dailyCalendarToggle").onclick = () => {
    if (dailyCalendarSwipeSuppressClick) {
      dailyCalendarSwipeSuppressClick = false;
      return;
    }
    toggleDailyCalendar();
  };
  el("dailyCalendarPrevMonth").onclick = () => shiftDailyCalendarMonth(-1);
  el("dailyCalendarNextMonth").onclick = () => shiftDailyCalendarMonth(1);
  el("dailyCalendarClose").onclick = () => closeDailyCalendar(true);
  el("dailyCalendarToday").onclick = () => selectDailyCalendarDate(todayInPlanner());
  el("weekCalendarToggle").onclick = () => {
    if (weekCalendarSwipeSuppressClick) {
      weekCalendarSwipeSuppressClick = false;
      return;
    }
    toggleWeekCalendar();
  };
  el("weekCalendarPrevMonth").onclick = () => shiftWeekCalendarMonth(-1);
  el("weekCalendarNextMonth").onclick = () => shiftWeekCalendarMonth(1);
  el("weekCalendarClose").onclick = () => closeWeekCalendar(true);
  el("monthPrevButton").onclick = () => shiftMonthWithAnimation(-1);
  el("monthNextButton").onclick = () => shiftMonthWithAnimation(1);
  el("monthPickerToggle").onclick = () => toggleMonthPicker();
  el("dailyTodayButton").onclick = () => {
    closeDailyCalendar();
    closeWeekCalendar();
    selectedDate = todayInPlanner();
    showView("day");
    renderAll();
  };
  el("printButton").onclick = () => window.print();
  el("exportButton").onclick = exportPlanner;
  el("importButton").onclick = () => el("importFile").click();
  el("topPrintButton").onclick = () => window.print();
  el("topExportButton").onclick = exportPlanner;
  el("topImportButton").onclick = () => el("importFile").click();
  el("lockNowButton").onclick = () => lockPlanner("수동 잠금");
  el("logoutButton").onclick = logoutPlanner;
  el("accountPasswordButton").onclick = updateAccountPassword;
  el("openRepeatManagerButton").onclick = openRepeatManager;
  el("closeRepeatManagerButton").onclick = closeRepeatManager;
  el("repeatManagerDialog").addEventListener("click", (event) => {
    if (event.target.id === "repeatManagerDialog") closeRepeatManager();
  });
  if (el("quickLogoutButton")) el("quickLogoutButton").onclick = logoutPlanner;
  el("privacyNowButton").onclick = () => activatePrivacyBlind("수동 보안모드가 실행되었습니다.");
  el("privacyTimeoutSelect").onchange = (event) => savePrivacyTimeout(Number(event.target.value));
  el("revealPrivacyButton").onclick = deactivatePrivacyBlind;
  el("lockFromPrivacyButton").onclick = () => lockPlanner("보안모드에서 완전 잠금으로 전환되었습니다.");
  el("dailyOpeningClose").onclick = closeDailyOpeningMessage;
  el("dailyOpeningStart").onclick = closeDailyOpeningMessage;
  el("dailyOpeningCoach").onclick = () => {
    closeDailyOpeningMessage();
    showView("coach");
    renderAll();
  };
  el("financePrevMonth").onclick = () => shiftFinanceMonth(-1);
  el("financeNextMonth").onclick = () => shiftFinanceMonth(1);
  el("financeMonthTitle").onclick = () => {
    if (financeSwipeSuppressClick) return;
    renderFinanceMonthTabs(true);
  };
  el("fixedMoneyAdd").onclick = () => addMoneyRow(state.finance.fixed, { fixed: true });
  el("addProjectButton").onclick = addProject;
  el("addSheetButton").onclick = () => addCustomSheet(el("sheetTemplateSelect").value);
  el("closeSheetDetailButton").onclick = closeSheetDetail;
  el("duplicateSheetButton").onclick = duplicateCurrentSheet;
  el("deleteSheetButton").onclick = deleteCurrentSheet;
  el("exportSheetCsvButton").onclick = exportCurrentSheetCsv;
  el("addSheetRowButton").onclick = () => resizeCurrentSheet("row", 1);
  el("removeSheetRowButton").onclick = () => resizeCurrentSheet("row", -1);
  el("addSheetColumnButton").onclick = () => resizeCurrentSheet("column", 1);
  el("removeSheetColumnButton").onclick = () => resizeCurrentSheet("column", -1);
  el("sheetAutoFitButton").onclick = autoFitSelectedSheetCell;
  el("sheetTitleRowButton").onclick = () => toggleSheetTitleAxis("row");
  el("sheetTitleColumnButton").onclick = () => toggleSheetTitleAxis("column");
  el("sheetNameInput").oninput = (event) => renameCurrentSheet(event.target.value);
  el("sheetCellType").onchange = (event) => updateSelectedSheetCellFormat("type", event.target.value);
  el("sheetCellAlign").onchange = (event) => updateSelectedSheetCellFormat("align", event.target.value);
  el("sheetBoldButton").onclick = () => toggleSelectedSheetCellBold();
  el("sheetFormulaInput").onchange = (event) => updateSelectedSheetCellValue(event.target.value);
  el("sheetFormulaInput").onkeydown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    updateSelectedSheetCellValue(event.target.value);
    moveSheetSelection(1, 0);
  };
  document.querySelectorAll("[data-sheet-fill]").forEach((button) => {
    button.onclick = () => updateSelectedSheetCellFormat("fill", button.dataset.sheetFill);
  });
  el("topSearchToggle").onclick = toggleTopSearch;
  el("topSearchSubmit").onclick = runHeaderSearch;
  el("topSearchClose").onclick = closeTopSearch;
  el("coachBubble").onclick = () => {
    showView("coach");
    renderAll();
  };
  el("modeToggle").onclick = () => {
    togglePlannerMode();
  };
  el("refreshCoach").onclick = () => renderCoach();
  el("aiTaskSuggest").onclick = () => renderTaskSuggestionPopover();
  el("aiScheduleSuggest").onclick = () => renderScheduleSuggestionPopover();
  el("scheduleUnit30").onclick = () => setScheduleUnitFromDate("30");
  el("scheduleUnit60").onclick = () => setScheduleUnitFromDate("60");
  el("aiMemoSuggest").onclick = () => applyMemoPrompt();
  el("closeSearchButton").onclick = closeSearch;
  el("closeCoachButton").onclick = closeCoach;
  el("unlockPasscodeButton").onclick = unlockWithPasscode;
  el("unlockBiometricButton").onclick = unlockWithBiometric;
  el("savePasscodeButton").onclick = saveLockPasscode;
  el("registerBiometricButton").onclick = registerBiometric;
  el("clearSecurityButton").onclick = clearSecuritySettings;
  el("lockPasscode").onkeydown = (event) => {
    if (event.key === "Enter") unlockWithPasscode();
  };
  document.querySelectorAll("[data-merge-range]").forEach((button) => {
    button.onclick = () => {
      mergeAppointmentRange(ensureDay(), button.dataset.mergeRange);
    };
  });
  el("addAnniversaryButton").onclick = addAnniversaryEvent;
  el("anniversaryTitle").onkeydown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addAnniversaryEvent();
  };
  document.querySelectorAll("[data-settings-view]").forEach((button) => {
    button.onclick = () => {
      showView(button.dataset.settingsView);
      renderAll();
    };
  });
  document.querySelectorAll("[data-onboarding-action]").forEach((button) => {
    button.onclick = () => handleOnboardingAction(button.dataset.onboardingAction);
  });
  document.querySelector("[data-onboarding-dismiss]")?.addEventListener("click", () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
    renderOnboarding(ensureDay());
  });
  el("importFile").onchange = importPlanner;
  el("plannerSearch").oninput = (event) => {
    updateSearch(event.target.value);
  };
  el("headerSearch").onkeydown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    runHeaderSearch();
  };
  setupQuickStrip();
  setupDailyCalendarDismissal();
  setupTopViews();
  setupDailyDateSwipe();
  setupWeekDateSwipe();
  setupMonthDateSwipe();
  setupCalendarMonthSwipe();
  setupDailyPageSwipe();
  setupDaySwipePager();
  setupMobileDayFocus();
  setupWheelDayNavigation();
  setupMonthCalendarWheel();
  setupFinanceMonthSwipe();
  setupSheetPageSwipe();
  setupAutoLock();
  applyPlannerMode();
  updateStickyPanelTop();
  window.addEventListener("resize", () => {
    applyPlannerMode();
    applyMobileDayFocusMode();
    updateStickyPanelTop();
    positionDaySwipe("main", true);
  });
  window.addEventListener("focus", queuePassiveServerPull);
  window.addEventListener("online", queuePassiveServerPull);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) queuePassiveServerPull();
  });
  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => {
      updateStickyPanelTop();
      positionDaySwipe("main", true);
    }, 250);
  });
}

function toggleTopSearch() {
  const popover = el("topSearchPopover");
  const input = el("headerSearch");
  if (!popover || !input) return;
  popover.hidden = !popover.hidden;
  el("topSearchToggle")?.classList.toggle("is-active", !popover.hidden);
  if (!popover.hidden) {
    showView("search");
    renderSearch();
    window.requestAnimationFrame(() => input.focus());
  }
}

function closeTopSearch() {
  const popover = el("topSearchPopover");
  if (popover) popover.hidden = true;
  el("topSearchToggle")?.classList.remove("is-active");
}

function runHeaderSearch() {
  const input = el("headerSearch");
  const popover = el("topSearchPopover");
  if (!input) return;
  updateSearch(input.value);
  if (popover && input.value.trim()) closeTopSearch();
  requestAiSearchAnswer(input.value);
}

function updateStickyPanelTop() {
  const header = document.querySelector(".app-header");
  if (!header) return;
  const height = Math.ceil(header.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--app-header-height", `${height}px`);
  document.documentElement.style.setProperty("--sticky-panel-top", `${height}px`);
  const dailyTitle = document.querySelector("#view-day .daily-title");
  if (dailyTitle) {
    document.documentElement.style.setProperty("--daily-title-height", `${Math.ceil(dailyTitle.getBoundingClientRect().height)}px`);
  }
}

function updateSearch(value) {
  searchQuery = value.trim();
  if (el("plannerSearch").value !== value) el("plannerSearch").value = value;
  if (el("headerSearch").value !== value) el("headerSearch").value = value;
  renderSearch();
  if (searchQuery) showView("search");
}

function closeSearch() {
  searchQuery = "";
  aiSearch = { query: "", answer: "", loading: false, error: "" };
  el("plannerSearch").value = "";
  el("headerSearch").value = "";
  closeToDailyPage();
}

function closeCoach() {
  closeToDailyPage();
}

function closeToDailyPage() {
  showView("day");
  renderAll();
  positionDaySwipe();
}

function setupAutoLock() {
  ["pointerdown", "keydown", "touchstart", "scroll"].forEach((eventName) => {
    window.addEventListener(eventName, resetLockTimer, { passive: true });
  });
  resetLockTimer();
  updateLockUi();
  updatePrivacyUi();
}

function hasSecuritySettings() {
  return Boolean(getLockConfig()?.passcodeHash || getBiometricCredential());
}

function resetLockTimer() {
  if (isLocked || isPrivacyBlind) return;
  window.clearTimeout(lockTimer);
  window.clearTimeout(privacyTimer);
  const privacySeconds = getPrivacyConfig().timeoutSeconds;
  if (!isSmartphoneDevice() && privacySeconds > 0) {
    privacyTimer = window.setTimeout(
      () => activatePrivacyBlind(`${formatPrivacyTimeout(privacySeconds)} 동안 사용이 없어 내용이 블라인드 처리되었습니다.`),
      privacySeconds * 1000,
    );
  }
  if (!hasSecuritySettings()) return;
  lockTimer = window.setTimeout(() => lockPlanner("일정 시간 사용이 없어 잠금 처리되었습니다."), LOCK_TIMEOUT_MS);
}

function lockPlanner(message = "플래너가 잠겼습니다.") {
  isLocked = true;
  deactivatePrivacyBlind(false);
  window.clearTimeout(lockTimer);
  window.clearTimeout(privacyTimer);
  document.body.classList.add("is-locked");
  const screen = el("lockScreen");
  screen.hidden = false;
  el("lockMessage").textContent = hasSecuritySettings()
    ? message
    : "먼저 비밀번호를 설정하면 자동 잠금이 활성화됩니다. 지원 기기에서는 생체인증도 등록할 수 있습니다.";
  el("lockPasscode").value = "";
  updateLockUi();
  window.setTimeout(() => el("lockPasscode")?.focus(), 80);
}

function unlockPlanner(message = "잠금 해제됨") {
  isLocked = false;
  document.body.classList.remove("is-locked");
  el("lockScreen").hidden = true;
  el("lockMessage").textContent = message;
  resetLockTimer();
}

function activatePrivacyBlind(message = "플래너 내용이 블라인드 처리되었습니다.") {
  if (isLocked || isSmartphoneDevice()) return;
  isPrivacyBlind = true;
  window.clearTimeout(lockTimer);
  window.clearTimeout(privacyTimer);
  document.body.classList.add("is-privacy-blind");
  const screen = el("privacyBlindScreen");
  if (screen) screen.hidden = false;
  if (el("privacyBlindMessage")) el("privacyBlindMessage").textContent = message;
  updatePrivacyUi();
}

function deactivatePrivacyBlind(resetTimer = true) {
  isPrivacyBlind = false;
  document.body.classList.remove("is-privacy-blind");
  const screen = el("privacyBlindScreen");
  if (screen) screen.hidden = true;
  updatePrivacyUi();
  if (resetTimer) resetLockTimer();
}

function updateLockUi() {
  const passcodeReady = Boolean(getLockConfig()?.passcodeHash);
  const biometricReady = Boolean(getBiometricCredential());
  if (el("unlockPasscodeButton")) el("unlockPasscodeButton").disabled = !passcodeReady;
  if (el("unlockBiometricButton")) el("unlockBiometricButton").disabled = !biometricReady || !canUseWebAuthn();
  if (el("registerBiometricButton")) el("registerBiometricButton").disabled = !canUseWebAuthn();
}

function getPrivacyConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRIVACY_CONFIG_KEY) || "null");
    const timeoutSeconds = Number(saved?.timeoutSeconds ?? DEFAULT_PRIVACY_TIMEOUT_SECONDS);
    return { timeoutSeconds: Number.isFinite(timeoutSeconds) ? timeoutSeconds : DEFAULT_PRIVACY_TIMEOUT_SECONDS };
  } catch {
    return { timeoutSeconds: DEFAULT_PRIVACY_TIMEOUT_SECONDS };
  }
}

function savePrivacyTimeout(timeoutSeconds) {
  const normalized = Number.isFinite(timeoutSeconds) ? Math.max(0, timeoutSeconds) : DEFAULT_PRIVACY_TIMEOUT_SECONDS;
  localStorage.setItem(PRIVACY_CONFIG_KEY, JSON.stringify({ timeoutSeconds: normalized, updatedAt: new Date().toISOString() }));
  updatePrivacyUi();
  resetLockTimer();
}

function updatePrivacyUi() {
  const config = getPrivacyConfig();
  const select = el("privacyTimeoutSelect");
  if (select && select.value !== String(config.timeoutSeconds)) select.value = String(config.timeoutSeconds);
  const button = el("privacyNowButton");
  if (button) button.textContent = isPrivacyBlind ? "보안중" : "보안모드";
}

function formatPrivacyTimeout(seconds) {
  if (seconds < 60) return `${seconds}초`;
  return `${Math.round(seconds / 60)}분`;
}

function getLockConfig() {
  try {
    return JSON.parse(localStorage.getItem(LOCK_CONFIG_KEY) || "null");
  } catch {
    return null;
  }
}

function getBiometricCredential() {
  try {
    return JSON.parse(localStorage.getItem(BIOMETRIC_KEY) || "null");
  } catch {
    return null;
  }
}

async function saveLockPasscode() {
  const passcode = el("newPasscode").value.trim();
  if (passcode.length < 4) {
    el("lockMessage").textContent = "비밀번호는 4자리 이상으로 설정하세요.";
    return;
  }
  const salt = randomBase64Url(16);
  const passcodeHash = await digestPasscode(passcode, salt);
  localStorage.setItem(LOCK_CONFIG_KEY, JSON.stringify({ salt, passcodeHash, updatedAt: new Date().toISOString() }));
  el("newPasscode").value = "";
  el("lockMessage").textContent = "비밀번호가 저장되었습니다. 잠금 버튼으로 완전 잠금을 사용할 수 있고, 보안모드는 설정한 시간 뒤 내용을 블라인드 처리합니다.";
  updateLockUi();
  resetLockTimer();
}

async function unlockWithPasscode() {
  const config = getLockConfig();
  if (!config?.passcodeHash) return;
  const passcode = el("lockPasscode").value.trim();
  const hash = await digestPasscode(passcode, config.salt);
  if (hash !== config.passcodeHash) {
    el("lockMessage").textContent = "비밀번호가 맞지 않습니다.";
    return;
  }
  unlockPlanner("비밀번호로 잠금 해제됨");
}

async function registerBiometric() {
  if (!canUseWebAuthn()) {
    el("lockMessage").textContent = "이 브라우저에서는 생체인증을 사용할 수 없습니다. HTTPS 또는 localhost에서 지원됩니다.";
    return;
  }
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "Beyond Work" },
        user: {
          id: textToBytes(installationId).slice(0, 64),
          name: "Beyond Work 사용자",
          displayName: "Beyond Work",
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000,
        attestation: "none",
      },
    });
    localStorage.setItem(BIOMETRIC_KEY, JSON.stringify({ id: bufferToBase64Url(credential.rawId), updatedAt: new Date().toISOString() }));
    el("lockMessage").textContent = "생체인증이 등록되었습니다.";
    updateLockUi();
    resetLockTimer();
  } catch {
    el("lockMessage").textContent = "생체인증 등록이 취소되었거나 실패했습니다.";
  }
}

async function unlockWithBiometric() {
  const stored = getBiometricCredential();
  if (!stored?.id || !canUseWebAuthn()) return;
  try {
    await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: "public-key", id: base64UrlToBuffer(stored.id) }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    unlockPlanner("생체인증으로 잠금 해제됨");
  } catch {
    el("lockMessage").textContent = "생체인증이 취소되었거나 실패했습니다.";
  }
}

function clearSecuritySettings() {
  if (!confirm("비밀번호와 생체인증 설정을 해제할까요?")) return;
  localStorage.removeItem(LOCK_CONFIG_KEY);
  localStorage.removeItem(BIOMETRIC_KEY);
  el("lockMessage").textContent = "보안 설정이 해제되었습니다.";
  updateLockUi();
  unlockPlanner("보안 설정 해제됨");
}

function canUseWebAuthn() {
  return Boolean(window.isSecureContext && window.PublicKeyCredential && navigator.credentials && crypto?.subtle);
}

async function digestPasscode(passcode, salt) {
  const bytes = textToBytes(`${salt}:${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bufferToBase64Url(digest);
}

function textToBytes(value) {
  return new TextEncoder().encode(value);
}

function randomBase64Url(length) {
  return bufferToBase64Url(crypto.getRandomValues(new Uint8Array(length)));
}

function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBuffer(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function shiftDay(delta, animate = true) {
  closeDailyCalendar();
  const next = new Date(selectedDate);
  next.setDate(next.getDate() + delta);
  if (animate) {
    animateDateTitle(delta, next);
    return;
  }
  selectedDate = next;
  renderAll();
}

function toggleDailyCalendar() {
  const popover = el("dailyCalendarPopover");
  if (!popover) return;
  if (!popover.hidden) return;
  dailyCalendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  renderDailyCalendar();
  popover.hidden = false;
  el("dailyCalendarToggle").setAttribute("aria-expanded", "true");
}

function closeDailyCalendar(restoreFocus = false) {
  const popover = el("dailyCalendarPopover");
  if (!popover || popover.hidden) return;
  popover.hidden = true;
  el("dailyCalendarToggle")?.setAttribute("aria-expanded", "false");
  if (restoreFocus) el("dailyCalendarToggle")?.focus();
}

function shiftDailyCalendarMonth(delta) {
  const next = new Date(dailyCalendarMonth.getFullYear(), dailyCalendarMonth.getMonth() + delta, 1);
  dailyCalendarMonth = next;
  renderDailyCalendar();
}

function isDailyCalendarOpen() {
  const popover = el("dailyCalendarPopover");
  return Boolean(popover && !popover.hidden);
}

function selectDailyCalendarDate(date) {
  closeDailyCalendar();
  const delta = daysBetween(selectedDate, date);
  if (!delta) {
    renderAll();
    return;
  }
  animateDateTitle(delta, date);
}

function toggleWeekCalendar() {
  const popover = el("weekCalendarPopover");
  if (!popover) return;
  if (!popover.hidden) return;
  weekCalendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  renderWeekCalendar();
  popover.hidden = false;
  el("weekCalendarToggle").setAttribute("aria-expanded", "true");
}

function closeWeekCalendar(restoreFocus = false) {
  const popover = el("weekCalendarPopover");
  if (!popover || popover.hidden) return;
  popover.hidden = true;
  el("weekCalendarToggle")?.setAttribute("aria-expanded", "false");
  if (restoreFocus) el("weekCalendarToggle")?.focus();
}

function shiftWeekCalendarMonth(delta) {
  const next = new Date(weekCalendarMonth.getFullYear(), weekCalendarMonth.getMonth() + delta, 1);
  weekCalendarMonth = next;
  renderWeekCalendar();
}

function isWeekCalendarOpen() {
  const popover = el("weekCalendarPopover");
  return Boolean(popover && !popover.hidden);
}

function selectWeekCalendarDate(date) {
  closeWeekCalendar();
  selectedDate = date;
  showView("week");
  renderAll();
}

function shiftWeek(delta) {
  closeWeekCalendar();
  const next = new Date(selectedDate);
  next.setDate(next.getDate() + delta * 7);
  selectedDate = next;
  renderAll();
}

function shiftMonth(delta) {
  const next = new Date(selectedDate);
  next.setMonth(next.getMonth() + delta, 1);
  selectedDate = next;
  renderAll();
}

function shiftMonthWithAnimation(delta) {
  const next = new Date(selectedDate);
  next.setMonth(next.getMonth() + delta, 1);
  closeMonthPicker();
  animateMonthTurn(delta, () => {
    selectedDate = next;
    renderAll();
  });
}

function animateMonthTurn(delta, update) {
  const title = el("monthTitle");
  const calendar = el("monthCalendar");
  const direction = delta > 0 ? "next" : "prev";
  [title, calendar].forEach((node) => node?.classList.remove("slide-out-next", "slide-out-prev", "slide-in-next", "slide-in-prev"));
  title?.classList.add(`slide-out-${direction}`);
  calendar?.classList.add(`slide-out-${direction}`);
  window.setTimeout(() => {
    update();
    const refreshedTitle = el("monthTitle");
    const refreshedCalendar = el("monthCalendar");
    refreshedTitle?.classList.add(`slide-in-${direction}`);
    refreshedCalendar?.classList.add(`slide-in-${direction}`);
    window.setTimeout(() => {
      refreshedTitle?.classList.remove(`slide-in-${direction}`);
      refreshedCalendar?.classList.remove(`slide-in-${direction}`);
    }, 240);
  }, 140);
}

function toggleMonthPicker() {
  const popover = el("monthPickerPopover");
  if (!popover) return;
  if (!popover.hidden) {
    closeMonthPicker(true);
    return;
  }
  renderMonthPicker();
  popover.hidden = false;
  el("monthPickerToggle")?.setAttribute("aria-expanded", "true");
}

function closeMonthPicker(restoreFocus = false) {
  const popover = el("monthPickerPopover");
  if (!popover || popover.hidden) return;
  popover.hidden = true;
  el("monthPickerToggle")?.setAttribute("aria-expanded", "false");
  if (restoreFocus) el("monthPickerToggle")?.focus();
}

function renderMonthPicker() {
  const grid = el("monthPickerGrid");
  if (!grid) return;
  const currentMonth = selectedDate.getMonth();
  grid.innerHTML = monthNames.map((name, index) => `
    <button type="button" data-month-index="${index}" class="${index === currentMonth ? "is-active" : ""}">
      ${name}
    </button>
  `).join("");
  grid.querySelectorAll("[data-month-index]").forEach((button) => {
    button.onclick = () => selectMonth(Number(button.dataset.monthIndex));
  });
}

function selectMonth(monthIndex) {
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) return;
  const current = selectedDate.getMonth();
  if (monthIndex === current) {
    closeMonthPicker(true);
    return;
  }
  const next = new Date(selectedDate);
  next.setMonth(monthIndex, 1);
  closeMonthPicker();
  animateMonthTurn(monthIndex > current ? 1 : -1, () => {
    selectedDate = next;
    renderAll();
  });
}

function setupMonthDateSwipe() {
  const zones = [el("monthSwipeZone"), el("monthCalendar")].filter(Boolean);
  zones.forEach((zone) => {
    let startX = 0;
    let startY = 0;
    zone.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      startY = event.clientY;
    }, { passive: true });
    zone.addEventListener("pointerup", (event) => {
      if (!startX) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      startX = 0;
      startY = 0;
      if (Math.abs(dx) < 54 || Math.abs(dx) < Math.abs(dy) * 1.18) return;
      event.preventDefault();
      monthCalendarSwipeSuppressClick = true;
      shiftMonthWithAnimation(dx < 0 ? 1 : -1);
      window.setTimeout(() => {
        monthCalendarSwipeSuppressClick = false;
      }, 260);
    });
  });
}

function setupMonthCalendarWheel() {
  const node = el("monthCalendar");
  if (!node) return;
  let wheelLock = false;
  let startX = 0;
  let startY = 0;
  node.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
    startY = event.clientY;
  }, { passive: true });
  node.addEventListener("pointerup", (event) => {
    if (!startY) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    startX = 0;
    startY = 0;
    if (Math.abs(dy) < 54 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
    event.preventDefault();
    monthCalendarSwipeSuppressClick = true;
    shiftMonthWithAnimation(dy < 0 ? 1 : -1);
    window.setTimeout(() => {
      monthCalendarSwipeSuppressClick = false;
    }, 260);
  });
  node.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) < 42 || Math.abs(event.deltaY) < Math.abs(event.deltaX) * 1.2 || wheelLock) return;
    event.preventDefault();
    wheelLock = true;
    shiftMonthWithAnimation(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLock = false;
    }, 360);
  }, { passive: false });
}

function getCalendarAnnotation(date) {
  const key = iso(date);
  const events = getCalendarEvents(key);
  const lunarLabel = getLunarDecadeLabel(date);
  const hasHoliday = events.some((event) => event.type === "holiday" || event.type === "national");
  return { key, events, lunarLabel, hasHoliday };
}

function renderCalendarAnnotationMarkup(events, lunarLabel, options = {}) {
  const limit = options.compact ? 1 : events.length;
  const visibleEvents = events.slice(0, limit);
  return [
    lunarLabel ? `<em class="lunar-mark">음 ${escapeHtml(lunarLabel)}</em>` : "",
    ...visibleEvents.map((event) => `<small class="calendar-event event-${event.type}">${escapeHtml(event.label)}</small>`),
  ].join("");
}

function calendarAriaLabel(date, events, lunarLabel, hasPlans = false) {
  return [
    formatDate(date),
    ...events.map((event) => event.label),
    lunarLabel ? `음력 ${lunarLabel}` : "",
    hasPlans ? "기록 있음" : "",
  ].filter(Boolean).join(", ");
}

function renderDailyCalendar() {
  const grid = el("dailyCalendarGrid");
  if (!grid) return;
  const year = dailyCalendarMonth.getFullYear();
  const month = dailyCalendarMonth.getMonth();
  const monthStart = new Date(year, month, 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const todayKey = iso(todayInPlanner());
  const selectedKey = iso(selectedDate);

  el("dailyCalendarMonthTitle").textContent = `${year}년 ${month + 1}월`;
  el("dailyCalendarPrevMonth").disabled = false;
  el("dailyCalendarNextMonth").disabled = false;
  grid.innerHTML = "";

  weekdays.forEach((weekday, index) => {
    const label = document.createElement("span");
    label.className = `daily-calendar-weekday ${index === 0 ? "is-sunday" : ""} ${index === 6 ? "is-saturday" : ""}`;
    label.textContent = weekday;
    label.setAttribute("aria-hidden", "true");
    grid.appendChild(label);
  });

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const key = iso(date);
    const button = document.createElement("button");
    const hasPlans = Boolean(state.days[key] && dayHasContent(state.days[key]));
    const annotation = getCalendarAnnotation(date);
    button.type = "button";
    button.className = [
      "daily-calendar-day",
      date.getMonth() !== month ? "is-outside" : "",
      key === selectedKey ? "is-selected" : "",
      key === todayKey ? "is-today" : "",
      hasPlans ? "has-plans" : "",
      annotation.hasHoliday ? "has-holiday" : "",
      annotation.lunarLabel ? "has-lunar" : "",
    ].filter(Boolean).join(" ");
    button.disabled = false;
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", calendarAriaLabel(date, annotation.events, annotation.lunarLabel, hasPlans));
    button.setAttribute("aria-selected", String(key === selectedKey));
    button.innerHTML = `
      <span class="daily-calendar-date-number">${date.getDate()}</span>
      ${renderCalendarAnnotationMarkup(annotation.events, annotation.lunarLabel, { compact: true })}
      ${hasPlans ? '<i aria-hidden="true"></i>' : ""}
    `;
    button.onclick = () => {
      if (dailyCalendarSwipeSuppressClick) return;
      selectDailyCalendarDate(date);
    };
    grid.appendChild(button);
  }
}

function renderWeekCalendar() {
  const grid = el("weekCalendarGrid");
  if (!grid) return;
  const year = weekCalendarMonth.getFullYear();
  const month = weekCalendarMonth.getMonth();
  const monthStart = new Date(year, month, 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const todayKey = iso(todayInPlanner());
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  el("weekCalendarMonthTitle").textContent = `${year}년 ${month + 1}월`;
  el("weekCalendarPrevMonth").disabled = false;
  el("weekCalendarNextMonth").disabled = false;
  grid.innerHTML = "";

  weekdays.forEach((weekday, index) => {
    const label = document.createElement("span");
    label.className = `daily-calendar-weekday ${index === 0 ? "is-sunday" : ""} ${index === 6 ? "is-saturday" : ""}`;
    label.textContent = weekday;
    label.setAttribute("aria-hidden", "true");
    grid.appendChild(label);
  });

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const key = iso(date);
    const hasPlans = Boolean(state.days[key] && dayHasContent(state.days[key]));
    const annotation = getCalendarAnnotation(date);
    const isSelectedWeek = date >= weekStart && date <= weekEnd;
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "daily-calendar-day",
      "week-calendar-day",
      date.getMonth() !== month ? "is-outside" : "",
      isSelectedWeek ? "is-selected-week" : "",
      key === iso(selectedDate) ? "is-selected" : "",
      key === todayKey ? "is-today" : "",
      hasPlans ? "has-plans" : "",
      annotation.hasHoliday ? "has-holiday" : "",
      annotation.lunarLabel ? "has-lunar" : "",
    ].filter(Boolean).join(" ");
    button.disabled = false;
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", `${calendarAriaLabel(date, annotation.events, annotation.lunarLabel, hasPlans)}, 이 주간 선택`);
    button.setAttribute("aria-selected", String(isSelectedWeek));
    button.innerHTML = `
      <span class="daily-calendar-date-number">${date.getDate()}</span>
      ${renderCalendarAnnotationMarkup(annotation.events, annotation.lunarLabel, { compact: true })}
      ${hasPlans ? '<i aria-hidden="true"></i>' : ""}
    `;
    button.onclick = () => {
      if (weekCalendarSwipeSuppressClick) return;
      selectWeekCalendarDate(date);
    };
    grid.appendChild(button);
  }
}

function setupDailyCalendarDismissal() {
  document.addEventListener("pointerdown", (event) => {
    const popover = el("dailyCalendarPopover");
    if (!popover || popover.hidden) return;
    if (event.target.closest("#dailyCalendarPopover") || event.target.closest("#dailyCalendarToggle")) return;
    closeDailyCalendar();
  });
  document.addEventListener("pointerdown", (event) => {
    const popover = el("weekCalendarPopover");
    if (!popover || popover.hidden) return;
    if (event.target.closest("#weekCalendarPopover") || event.target.closest("#weekCalendarToggle")) return;
    closeWeekCalendar();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDailyCalendar(true);
      closeWeekCalendar(true);
      closeRepeatManager();
    }
  });
}

function animateDateTitle(delta, nextDate) {
  const title = el("dayTitle");
  window.clearTimeout(dateSlideTimer);
  if (!title) {
    selectedDate = nextDate;
    renderAll();
    return;
  }
  title.classList.remove("slide-out-next", "slide-out-prev", "slide-in-next", "slide-in-prev");
  void title.offsetWidth;
  title.classList.add(delta > 0 ? "slide-out-next" : "slide-out-prev");
  dateSlideTimer = window.setTimeout(() => {
    selectedDate = nextDate;
    renderAll();
    animatePageTurn(delta);
    const refreshedTitle = el("dayTitle");
    refreshedTitle?.classList.add(delta > 0 ? "slide-in-next" : "slide-in-prev");
    dateSlideTimer = window.setTimeout(() => {
      refreshedTitle?.classList.remove("slide-out-next", "slide-out-prev", "slide-in-next", "slide-in-prev");
    }, 260);
  }, 140);
}

function animatePageTurn(delta) {
  const node = el("daySwipe");
  if (!node) return;
  node.classList.remove("is-turning-next", "is-turning-prev");
  void node.offsetWidth;
  node.classList.add(delta > 0 ? "is-turning-next" : "is-turning-prev");
  window.setTimeout(() => node.classList.remove("is-turning-next", "is-turning-prev"), 320);
}

function setupQuickStrip() {
  document.querySelectorAll("[data-quick-view]").forEach((button) => {
    button.onclick = () => {
      const view = button.dataset.quickView;
      if (view === "search") {
        showView("search");
        (el("headerSearch") || el("plannerSearch"))?.focus();
        return;
      }
      showView(view);
      renderAll();
      const panel = button.dataset.mobilePanel;
      if (panel) {
        scrollDayPanel(panel);
        return;
      }
      const target = button.dataset.scrollTarget ? el(button.dataset.scrollTarget) : null;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  });
}

function setupTopViews() {
  document.querySelectorAll("[data-top-view]").forEach((button) => {
    button.onclick = () => {
      showView(button.dataset.topView);
      renderAll();
    };
  });
}

function handleOnboardingAction(action) {
  if (action === "task") {
    const day = ensureDay();
    const hasEmptySlot = day.tasks.A.some((task) => !task.text?.trim());
    if (!hasEmptySlot) day.tasks.A.push({ text: "", status: "미완료", done: false, delegate: "", priorityUnset: true });
    showView("day");
    renderAll();
    window.requestAnimationFrame(() => document.querySelector(".day-task-panel .task-text-input")?.focus());
    return;
  }
  if (action === "week") {
    showView("week");
    renderAll();
    return;
  }
  if (action === "foundation") {
    showView("foundation");
    renderAll();
  }
}

function setupDailyDateSwipe() {
  const zone = el("dailyDateSwipeZone");
  if (!zone) return;
  let startX = 0;
  let startY = 0;
  zone.addEventListener("pointerdown", (event) => {
    dailyCalendarSwipeSuppressClick = false;
    startX = event.clientX;
    startY = event.clientY;
  });
  zone.addEventListener("pointerup", (event) => {
    if (!startX) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    startX = 0;
    startY = 0;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    event.preventDefault();
    dailyCalendarSwipeSuppressClick = true;
    if (isDailyCalendarOpen()) {
      shiftDailyCalendarMonth(dx < 0 ? 1 : -1);
      window.setTimeout(() => {
        dailyCalendarSwipeSuppressClick = false;
      }, 260);
      return;
    }
    shiftDay(dx < 0 ? 1 : -1);
  });
}

function setupWeekDateSwipe() {
  const zone = el("weekCalendarToggle");
  if (!zone) return;
  let startX = 0;
  let startY = 0;
  zone.addEventListener("pointerdown", (event) => {
    weekCalendarSwipeSuppressClick = false;
    startX = event.clientX;
    startY = event.clientY;
  });
  zone.addEventListener("pointerup", (event) => {
    if (!startX) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    startX = 0;
    startY = 0;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    event.preventDefault();
    weekCalendarSwipeSuppressClick = true;
    if (isWeekCalendarOpen()) {
      shiftWeekCalendarMonth(dx < 0 ? 1 : -1);
      window.setTimeout(() => {
        weekCalendarSwipeSuppressClick = false;
      }, 260);
      return;
    }
    shiftWeek(dx < 0 ? 1 : -1);
  });
}

function setupCalendarMonthSwipe() {
  const bind = (node, shift, suppressClick) => {
    if (!node) return;
    let startX = 0;
    let startY = 0;
    node.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      startY = event.clientY;
    }, { passive: true });
    node.addEventListener("pointerup", (event) => {
      if (!startX) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      startX = 0;
      startY = 0;
      if (Math.abs(dx) < 54 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      event.preventDefault();
      suppressClick();
      shift(dx < 0 ? 1 : -1);
    });
  };
  bind(el("dailyCalendarPopover"), shiftDailyCalendarMonth, () => {
    dailyCalendarSwipeSuppressClick = true;
    window.setTimeout(() => {
      dailyCalendarSwipeSuppressClick = false;
    }, 260);
  });
  bind(el("weekCalendarPopover"), shiftWeekCalendarMonth, () => {
    weekCalendarSwipeSuppressClick = true;
    window.setTimeout(() => {
      weekCalendarSwipeSuppressClick = false;
    }, 260);
  });
}

function setupDailyPageSwipe() {
  const zone = document.querySelector("#view-day .daily-title");
  if (!zone) return;
  let startX = 0;
  let startY = 0;
  zone.addEventListener("pointerdown", (event) => {
    if (event.target.closest("#dailyDateSwipeZone") || event.target.closest("#dailyCalendarPopover")) return;
    startX = event.clientX;
    startY = event.clientY;
  });
  zone.addEventListener("pointerup", (event) => {
    if (event.target.closest("#dailyDateSwipeZone") || event.target.closest("#dailyCalendarPopover")) return;
    if (!startX) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    startX = 0;
    startY = 0;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    event.preventDefault();
    shiftDay(dx < 0 ? 1 : -1);
  });
}

function setupDaySwipePager() {
  const node = el("daySwipe");
  if (!node) return;
  let startX = 0;
  let startY = 0;
  let startPanel = currentDayPanel;
  let wheelLock = false;
  let scrollTimer = 0;

  node.addEventListener("pointerdown", (event) => {
    if (!isPagedDaySwipe() || isSwipeInteractiveTarget(event.target)) return;
    startX = event.clientX;
    startY = event.clientY;
    startPanel = closestDayPanel();
  });

  node.addEventListener("pointerup", (event) => {
    if (!startX) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    startX = 0;
    startY = 0;
    if (!isPagedDaySwipe() || Math.abs(dx) < 54 || Math.abs(dx) < Math.abs(dy) * 1.24) return;
    event.preventDefault();
    stepDayPanel(dx < 0 ? 1 : -1, startPanel);
  });

  node.addEventListener("wheel", (event) => {
    if (!isPagedDaySwipe() || wheelLock) return;
    if (Math.abs(event.deltaX) < 34 || Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.15) return;
    event.preventDefault();
    wheelLock = true;
    stepDayPanel(event.deltaX > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLock = false;
    }, 520);
  }, { passive: false });

  node.addEventListener("scroll", () => {
    if (!isPagedDaySwipe()) return;
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      settleDayPanelScroll();
    }, 140);
  }, { passive: true });
}

function isPagedDaySwipe() {
  return document.body.classList.contains("ceo-mode") || window.matchMedia("(max-width: 1320px)").matches;
}

function isSmartphoneLayout() {
  return window.matchMedia("(max-width: 640px)").matches;
}

function isSmartphoneDevice() {
  return /iPhone|iPod|Windows Phone|Android.+Mobile/i.test(navigator.userAgent || "");
}

function markDailyFieldEditing(duration = 900) {
  dailyFieldEditingUntil = Date.now() + duration;
}

function isDailyFieldEditingRecent() {
  return Date.now() < dailyFieldEditingUntil;
}

function isEditingDailyField() {
  const active = document.activeElement;
  return dailyTextEditingActive || isDailyFieldEditingRecent() || Boolean(
    active?.matches?.("input, select, textarea") &&
    active.closest(".day-task-panel, .day-schedule-panel")
  );
}

function resetMobileDayFocusToSplit(options = {}) {
  if (!isSmartphoneLayout() || mobileDayFocusMode === "split") return;
  dailyTextEditingActive = false;
  if (options.blur && isEditingDailyField()) document.activeElement.blur();
  const panel = document.querySelector(".day-main-panel");
  panel?.classList.add("is-focus-restoring");
  window.clearTimeout(mobileDayFocusResetTimer);
  mobileDayFocusResetTimer = window.setTimeout(() => {
    panel?.classList.remove("is-focus-restoring");
  }, 240);
  setMobileDayFocusMode("split");
}

function setupMobileDayFocus() {
  const panel = document.querySelector(".day-main-panel");
  const taskPanel = panel?.querySelector(".day-task-panel");
  const schedulePanel = panel?.querySelector(".day-schedule-panel");
  if (!panel || !taskPanel || !schedulePanel) return;
  const expandOnInteraction = (mode) => (event) => {
    if (!isSmartphoneLayout() || !event.target.closest("input, select, textarea, button")) return;
    setMobileDayFocusMode(mode);
  };
  const resetOnVerticalSwipe = (node) => {
    let startX = 0;
    let startY = 0;
    const maybeReset = (x, y) => {
      if (!isSmartphoneLayout() || mobileDayFocusMode === "split" || !startX) return;
      if (isEditingDailyField()) return;
      const dx = x - startX;
      const dy = y - startY;
      if (Math.abs(dy) < 34 || Math.abs(dy) < Math.abs(dx) * 1.08) return;
      startX = 0;
      startY = 0;
      resetMobileDayFocusToSplit({ blur: true });
    };
    node.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      startY = event.clientY;
    }, { passive: true });
    node.addEventListener("pointermove", (event) => maybeReset(event.clientX, event.clientY), { passive: true });
    node.addEventListener("pointerup", (event) => maybeReset(event.clientX, event.clientY), { passive: true });
    node.addEventListener("pointercancel", () => {
      startX = 0;
      startY = 0;
    }, { passive: true });
  };
  const resetOnScrollIntent = (node) => {
    let lastTop = node.scrollTop || 0;
    let scrollTimer = 0;
    node.addEventListener("scroll", () => {
      if (!isSmartphoneLayout() || mobileDayFocusMode === "split") return;
      const currentTop = node.scrollTop || 0;
      const delta = Math.abs(currentTop - lastTop);
      lastTop = currentTop;
      if (delta < 6) return;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        if (!isEditingDailyField()) resetMobileDayFocusToSplit();
      }, 34);
    }, { passive: true });
    node.addEventListener("wheel", (event) => {
      if (!isSmartphoneLayout() || mobileDayFocusMode === "split") return;
      if (isEditingDailyField()) return;
      if (Math.abs(event.deltaY) < 12 || Math.abs(event.deltaY) < Math.abs(event.deltaX) * 1.1) return;
      resetMobileDayFocusToSplit({ blur: true });
    }, { passive: true });
  };
  let lastWindowTop = window.scrollY || 0;
  let windowScrollTimer = 0;
  window.addEventListener("scroll", () => {
    if (!isSmartphoneLayout() || mobileDayFocusMode === "split") return;
    const currentTop = window.scrollY || 0;
    const delta = Math.abs(currentTop - lastWindowTop);
    lastWindowTop = currentTop;
    if (delta < 6) return;
    window.clearTimeout(windowScrollTimer);
    windowScrollTimer = window.setTimeout(() => {
      if (!isEditingDailyField()) resetMobileDayFocusToSplit();
    }, 34);
  }, { passive: true });
  taskPanel.addEventListener("pointerdown", expandOnInteraction("tasks"), { passive: true });
  taskPanel.addEventListener("focusin", expandOnInteraction("tasks"));
  schedulePanel.addEventListener("pointerdown", expandOnInteraction("schedule"), { passive: true });
  schedulePanel.addEventListener("focusin", expandOnInteraction("schedule"));
  document.addEventListener("pointerdown", (event) => {
    if (!isSmartphoneLayout() || mobileDayFocusMode === "split") return;
    if (event.target.closest(".day-task-panel input, .day-task-panel select, .day-task-panel textarea, .day-task-panel button, .day-schedule-panel input, .day-schedule-panel select, .day-schedule-panel textarea, .day-schedule-panel button")) return;
    window.setTimeout(() => resetMobileDayFocusToSplit({ blur: true }), 0);
  }, { passive: true });
  resetOnVerticalSwipe(taskPanel);
  resetOnVerticalSwipe(schedulePanel);
  resetOnScrollIntent(taskPanel);
  resetOnScrollIntent(schedulePanel);
  applyMobileDayFocusMode();
}

function setMobileDayFocusMode(mode) {
  if (!["split", "tasks", "schedule"].includes(mode)) return;
  mobileDayFocusMode = mode;
  applyMobileDayFocusMode();
}

function applyMobileDayFocusMode() {
  const panel = document.querySelector(".day-main-panel");
  if (!panel) return;
  const activeMode = isSmartphoneLayout() ? mobileDayFocusMode : "split";
  const swipe = el("daySwipe");
  panel.classList.toggle("is-focus-tasks", activeMode === "tasks");
  panel.classList.toggle("is-focus-schedule", activeMode === "schedule");
  swipe?.classList.toggle("is-mobile-focus-active", activeMode !== "split");
}

function isSwipeInteractiveTarget(target) {
  return Boolean(target.closest("textarea, select, button, summary"));
}

function closestDayPanel() {
  const node = el("daySwipe");
  if (!node) return currentDayPanel;
  return dayPanelOrder.reduce((closest, panel) => {
    const target = node.querySelector(`[data-panel="${panel}"]`);
    if (!target) return closest;
    const distance = Math.abs(target.offsetLeft - node.scrollLeft);
    return distance < closest.distance ? { panel, distance } : closest;
  }, { panel: currentDayPanel, distance: Number.POSITIVE_INFINITY }).panel;
}

function stepDayPanel(delta, fromPanel = currentDayPanel) {
  const index = dayPanelOrder.indexOf(fromPanel);
  const nextIndex = Math.max(0, Math.min(dayPanelOrder.length - 1, index + delta));
  scrollDayPanel(dayPanelOrder[nextIndex], "smooth");
}

function settleDayPanelScroll() {
  const closest = closestDayPanel();
  const currentIndex = dayPanelOrder.indexOf(currentDayPanel);
  const closestIndex = dayPanelOrder.indexOf(closest);
  if (currentIndex < 0 || closestIndex < 0) {
    currentDayPanel = closest;
    return;
  }
  const jump = closestIndex - currentIndex;
  if (Math.abs(jump) > 1) {
    scrollDayPanel(dayPanelOrder[currentIndex + Math.sign(jump)], "smooth");
    return;
  }
  currentDayPanel = closest;
}

function setupWheelDayNavigation() {
  const zone = document.querySelector("#view-day .daily-title");
  if (!zone) return;
  let wheelLock = false;
  zone.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) < 36 || Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.15 || wheelLock) return;
    event.preventDefault();
    wheelLock = true;
    shiftDay(event.deltaX > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLock = false;
    }, 420);
  }, { passive: false });
}

function applyPlannerMode() {
  const isPhoneMode = isSmartphoneLayout();
  const isPhoneDevice = isSmartphoneDevice();
  const isAutoCeo = isPhoneMode;
  const isCeo = plannerMode === "ceo" || isAutoCeo;
  document.body.classList.toggle("mac-mode", isMacEnvironment);
  document.body.classList.toggle("phone-mode", isPhoneMode);
  document.body.classList.toggle("smartphone-device", isPhoneDevice);
  document.body.classList.toggle("ceo-mode", isCeo);
  document.body.classList.toggle("classic-mode", !isCeo);
  const button = el("modeToggle");
  if (button) button.textContent = isCeo ? "Classic mode" : "CEO mode";
  if (isPhoneDevice) {
    window.clearTimeout(privacyTimer);
    if (isPrivacyBlind) deactivatePrivacyBlind(false);
  }
  applyMobileDayFocusMode();
  updateStickyPanelTop();
}

function togglePlannerMode() {
  if (document.body.classList.contains("phone-mode")) return;
  plannerMode = document.body.classList.contains("ceo-mode") ? "classic" : "ceo";
  localStorage.setItem("beyondWorkMode", plannerMode);
  applyPlannerMode();
  updateStickyPanelTop();
  if (plannerMode === "classic") {
    if (isPagedDaySwipe()) {
      positionDaySwipe("main", true);
    } else {
      el("daySwipe")?.scrollTo({ left: 0, behavior: "auto" });
    }
  } else {
    positionDaySwipe("main", true);
  }
}

function normalizeCompassItem(item) {
  item.goal ||= "";
  if (!Array.isArray(item.actions)) {
    item.actions = [item.action || "", "", ""];
  }
  item.actions = item.actions.slice(0, 2);
  while (item.actions.length < 2) item.actions.push("");
  item.action = item.actions[0] || "";
  return item;
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.onclick = () => {
      showView(button.dataset.view);
    };
  });
}

function renderSidebar() {
  const activeYear = selectedDate.getFullYear();
  const yearStart = new Date(`${activeYear}-01-01T00:00:00`);
  const yearEnd = new Date(`${activeYear}-12-31T00:00:00`);
  const totalDays = daysBetween(yearStart, yearEnd) + 1;
  const elapsed = Math.max(0, Math.min(totalDays, daysBetween(yearStart, selectedDate) + 1));
  el("selectedDateLabel").textContent = formatDate(selectedDate);
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekRange = `${formatShortDate(weekStart)} ~ ${formatShortDate(weekEnd)}`;
  el("selectedWeekLabel").textContent = weekRange;
  el("yearProgress").textContent = `${Math.round((elapsed / totalDays) * 100)}%`;
  el("yearProgressText").textContent = `${elapsed} / ${totalDays}`;
  el("carryoverCount").textContent = getCarryoverTasks(selectedDate).length;
  const results = searchQuery ? collectSearchResults(searchQuery) : [];
  el("searchCount").textContent = results.length;
  el("searchHint").textContent = searchQuery ? `${searchQuery}` : "검색어를 입력하세요";
  if (el("plannerSearch").value !== searchQuery) el("plannerSearch").value = searchQuery;
  if (el("headerSearch").value !== searchQuery) el("headerSearch").value = searchQuery;
  el("topYearProgress").textContent = `연간 ${Math.round((elapsed / totalDays) * 100)}%`;
  el("topCarryover").textContent = `이월 ${getCarryoverTasks(selectedDate).length}`;
  el("topSearchCount").textContent = `검색 ${results.length}`;
  const saveStatusNode = el("topSaveStatus");
  if (saveStatusNode) {
    saveStatusNode.textContent = saveStatus.saving ? "저장 중" : saveStatus.message;
    saveStatusNode.classList.toggle("is-warning", /실패|대기|필요/.test(saveStatus.message));
  }
  const auth = getAuthSession();
  el("topAccountStatus").textContent = auth ? `${auth.email} · ${formatTierName(auth.tier)}` : "로그인 필요";
  el("dailyTodayButton").hidden = iso(selectedDate) === iso(todayInPlanner());
  updateCoachBubble();
}

function normalizeAccountTier(tier = "staff") {
  const legacyMap = { basic: "staff", pro: "manager", executive: "director" };
  const normalized = legacyMap[tier] || tier;
  return ["ceo", "director", "manager", "staff"].includes(normalized) ? normalized : "staff";
}

function formatTierName(tier = "staff") {
  const names = { ceo: "CEO", director: "Director", manager: "Manager", staff: "Staff" };
  return names[normalizeAccountTier(tier)] || "Staff";
}

function renderFoundation() {
  bindStoredTextareas();
  bindProfileFields();
  const values = el("valuesList");
  values.innerHTML = "";
  state.foundation.values.forEach((value, index) => {
    const row = document.createElement("div");
    row.className = "value-item";
    row.innerHTML = `<span class="row-label">Value ${index + 1}</span><input type="text" value="${escapeAttr(value)}" placeholder="핵심 가치" />`;
    row.querySelector("input").oninput = (event) => {
      state.foundation.values[index] = event.target.value;
      saveState();
    };
    values.appendChild(row);
  });

  const roles = el("roleGoalTable");
  roles.innerHTML = "";
  state.foundation.roles.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "role-row";
    row.innerHTML = `
      <label><span class="row-label">역할</span><input type="text" value="${escapeAttr(item.role)}" /></label>
      <label><span class="row-label">장기 목표</span><input type="text" value="${escapeAttr(item.goal)}" /></label>
      <label><span class="row-label">회복 활동</span><input type="text" value="${escapeAttr(item.renewal)}" /></label>
    `;
    const inputs = row.querySelectorAll("input");
    inputs[0].oninput = (event) => updateRole(index, "role", event.target.value);
    inputs[1].oninput = (event) => updateRole(index, "goal", event.target.value);
    inputs[2].oninput = (event) => updateRole(index, "renewal", event.target.value);
    roles.appendChild(row);
  });
}

function updateRole(index, field, value) {
  state.foundation.roles[index][field] = value;
  saveState();
  renderWeek();
}

function renderYear() {
  const grid = el("yearGrid");
  grid.innerHTML = "";
  const activeYear = selectedDate.getFullYear();
  const title = el("yearPageTitle");
  if (title) title.textContent = `${activeYear} 연간 계획`;
  for (let month = 0; month < 12; month += 1) {
    const box = document.createElement("section");
    box.className = "mini-month";
    box.innerHTML = `<h4>${monthNames[month]}</h4><div class="mini-days"></div>`;
    const days = box.querySelector(".mini-days");
    const first = new Date(activeYear, month, 1);
    const offset = first.getDay();
    for (let i = 0; i < offset; i += 1) days.appendChild(document.createElement("span"));
    for (let day = 1; day <= new Date(activeYear, month + 1, 0).getDate(); day += 1) {
      const cell = document.createElement("span");
      const date = new Date(activeYear, month, day);
      const key = iso(date);
      const count = countTasksForDay(key);
      const events = getCalendarEvents(key);
      const lunarLabel = getLunarDecadeLabel(date);
      const hasHoliday = events.some((event) => event.type === "holiday" || event.type === "national");
      cell.className = `${hasHoliday ? "has-holiday" : ""} ${lunarLabel ? "has-lunar" : ""}`.trim();
      cell.innerHTML = `
        <b class="mini-day-number">${day}</b>
        ${lunarLabel ? `<em class="lunar-mark">음 ${lunarLabel}</em>` : ""}
        ${events.map((event) => `<small class="calendar-event event-${event.type}">${escapeHtml(event.label)}</small>`).join("")}
        ${count ? `<span class="count-pill mini-count">${count}</span>` : ""}
      `;
      const title = [
        ...events.map((event) => event.label),
        lunarLabel ? `음력 ${lunarLabel}` : "",
        count ? `${count} tasks` : "",
      ].filter(Boolean).join(" · ");
      if (title) cell.title = title;
      cell.onclick = () => {
        selectedDate = date;
        showView("day");
        renderAll();
      };
      days.appendChild(cell);
    }
    grid.appendChild(box);
  }
  renderEditableList(el("yearGoals"), state.year.goals, "연간 목표", () => saveState());
  renderEditableList(el("futureLog"), state.year.future, "언젠가 / 대기", () => saveState());
}

function getCalendarEvents(key) {
  const solarKey = String(key || "").slice(5);
  const fixedEvents = recurringSolarEvents[solarKey] || [];
  const datedEvents = koreanCalendarEvents[key] || [];
  const baseEvents = datedEvents.length ? datedEvents : fixedEvents;
  const customEvents = (state.calendar?.events || [])
    .filter((event) => event.date === key && event.title?.trim())
    .map((event) => ({ label: event.title.trim(), type: "anniversary", id: event.id }));
  return [...baseEvents, ...customEvents];
}

function getLunarDecadeLabel(date) {
  try {
    const parts = lunarDateFormatter.formatToParts(date);
    const monthPart = parts.find((part) => part.type === "month");
    const dayPart = parts.find((part) => part.type === "day");
    const month = Number(String(monthPart?.value || "").replace(/\D/g, ""));
    const day = Number(String(dayPart?.value || "").replace(/\D/g, ""));
    if (!month || ![1, 10, 20].includes(day)) return "";
    return `${month}/${day}`;
  } catch {
    return "";
  }
}

function renderMonth() {
  const current = ensureMonth();
  el("monthTitle").textContent = `${selectedDate.getFullYear()}년 ${monthNames[selectedDate.getMonth()]} 월간 계획`;
  if (!el("monthPickerPopover")?.hidden) renderMonthPicker();
  document.querySelector("[data-month-field='focus']").value = current.focus || "";
  document.querySelector("[data-month-field='focus']").oninput = (event) => {
    current.focus = event.target.value;
    saveState();
  };
  renderEditableList(el("monthProjects"), current.projects, "월간 프로젝트", () => saveState());
  renderAnniversaryList();
  renderMonthCalendar();
}

function renderMonthCalendar() {
  const node = el("monthCalendar");
  node.innerHTML = "";
  weekdays.forEach((day) => {
    const cell = document.createElement("div");
    cell.className = "weekday";
    cell.textContent = day;
    node.appendChild(cell);
  });
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = iso(date);
    const count = countTasksForDay(key);
    const annotation = getCalendarAnnotation(date);
    const cell = document.createElement("div");
    cell.className = [
      "month-cell",
      date.getMonth() !== month ? "is-muted" : "",
      key === iso(selectedDate) ? "is-selected" : "",
      annotation.hasHoliday ? "has-holiday" : "",
      annotation.lunarLabel ? "has-lunar" : "",
    ].filter(Boolean).join(" ");
    cell.innerHTML = `
      <strong>${date.getDate()}</strong>
      ${renderCalendarAnnotationMarkup(annotation.events, annotation.lunarLabel)}
      ${count ? `<span class="count-pill">${count} tasks</span>` : ""}
    `;
    cell.title = calendarAriaLabel(date, annotation.events, annotation.lunarLabel, Boolean(count));
    cell.onclick = () => {
      if (monthCalendarSwipeSuppressClick) return;
      const now = Date.now();
      if (monthDateTap.key === key && now - monthDateTap.at < 420) {
        monthDateTap = { key: "", at: 0 };
        selectedDate = date;
        showView("day");
        renderAll();
        return;
      }
      monthDateTap = { key, at: now };
      selectedDate = date;
      renderAll();
    };
    cell.ondblclick = () => {
      if (monthCalendarSwipeSuppressClick) return;
      selectedDate = date;
      showView("day");
      renderAll();
    };
    node.appendChild(cell);
  }
}

function addAnniversaryEvent() {
  const dateInput = el("anniversaryDate");
  const titleInput = el("anniversaryTitle");
  const date = dateInput?.value || iso(selectedDate);
  const title = titleInput?.value.trim() || "";
  if (!date || Number.isNaN(parseDate(date).getTime()) || !title) return;
  state.calendar ||= { events: [] };
  state.calendar.events ||= [];
  state.calendar.events.push({
    id: `anniversary-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date,
    title,
  });
  if (titleInput) titleInput.value = "";
  if (dateInput) dateInput.value = date;
  saveState({ fastSave: true });
  renderAll();
}

function renderAnniversaryList() {
  const node = el("anniversaryList");
  const dateInput = el("anniversaryDate");
  if (!node) return;
  state.calendar ||= { events: [] };
  state.calendar.events ||= [];
  if (dateInput && !dateInput.value) dateInput.value = iso(selectedDate);
  const month = selectedDate.getMonth();
  const events = state.calendar.events
    .filter((event) => parseDate(event.date).getMonth() === month)
    .sort((a, b) => a.date.localeCompare(b.date));
  node.innerHTML = events.length
    ? events.map((event) => `
      <div class="anniversary-item">
        <span>${formatCompactMonthDay(event.date)}</span>
        <strong>${escapeHtml(event.title)}</strong>
        <button type="button" data-anniversary-delete="${escapeAttr(event.id)}" aria-label="기념일 삭제">×</button>
      </div>
    `).join("")
    : `<p class="empty-hint">이 달의 기념일을 추가하세요.</p>`;
  node.querySelectorAll("[data-anniversary-delete]").forEach((button) => {
    button.onclick = () => {
      if (!confirmDelete("이 기념일을 삭제할까요? 일간·주간·월간 달력 반영도 함께 사라집니다.")) return;
      state.calendar.events = state.calendar.events.filter((event) => event.id !== button.dataset.anniversaryDelete);
      saveState({ fastSave: true });
      renderAll();
    };
  });
}

function renderWeek() {
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekRange = `${formatShortDate(weekStart)} ~ ${formatShortDate(weekEnd)}`;
  el("weekTitle").textContent = `주간 일정 (${weekRange})`;
  el("weekCalendarToggle").setAttribute("aria-label", `주간 일정 ${weekRange}, 달력에서 주간 선택`);

  const days = el("weekDays");
  days.innerHTML = "";
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const key = iso(date);
    const tasks = getDayTasks(key).filter((task) => task.text);
    const annotation = getCalendarAnnotation(date);
    const card = document.createElement("div");
    card.className = `week-day ${annotation.hasHoliday ? "has-holiday" : ""} ${annotation.lunarLabel ? "has-lunar" : ""}`.trim();
    card.innerHTML = `
      <strong>${weekdays[i]} · ${date.getDate()}</strong>
      <div class="week-day-marks">${renderCalendarAnnotationMarkup(annotation.events, annotation.lunarLabel)}</div>
      <small>${tasks.length ? tasks.slice(0, 3).map((task) => `${task.priority}. ${task.text}`).join("<br>") : "일간 페이지에 업무를 입력하세요."}</small>
    `;
    card.onclick = () => {
      selectedDate = date;
      showView("day");
      renderAll();
    };
    days.appendChild(card);
  }
  if (!el("weekCalendarPopover").hidden) renderWeekCalendar();
}

function renderDay() {
  const day = ensureDay();
  const formattedDate = formatDate(selectedDate);
  el("dayTitle").textContent = formattedDate;
  el("dailyCalendarToggle").setAttribute("aria-label", `${formattedDate}, 달력에서 날짜 선택`);
  const key = iso(selectedDate);
  const allTasks = getDayTasks(key);
  const carryovers = getCarryoverTasks(selectedDate);
  const done = allTasks.filter((task) => task.text && task.done).length + carryovers.filter((task) => isCarryoverCompletedOn(task, key)).length;
  const total = allTasks.filter((task) => task.text).length + carryovers.length;
  el("dailyCompletion").textContent = `${done}/${total}`;
  renderDailyPulse(day, allTasks, carryovers, { done, total });
  renderOnboarding(day);
  renderDayCompass();
  renderTaskBoard(day);
  renderRepeatPriorityList();
  renderScheduleUnitControls(day);
  renderAppointments(day);
  renderCoach();
  document.querySelectorAll("[data-day-field]").forEach((field) => {
    field.value = day[field.dataset.dayField] || "";
    field.oninput = () => {
      day[field.dataset.dayField] = field.value;
      saveState();
    };
  });
  if (!el("dailyCalendarPopover").hidden) renderDailyCalendar();
  positionDaySwipe();
}

function renderScheduleUnitControls(day = ensureDay()) {
  const unit = normalizeScheduleUnit(day.scheduleUnit || getEffectiveScheduleUnit(iso(selectedDate)));
  el("scheduleUnit30")?.classList.toggle("is-active", unit === "30");
  el("scheduleUnit60")?.classList.toggle("is-active", unit === "60");
  el("scheduleUnit30")?.setAttribute("aria-pressed", String(unit === "30"));
  el("scheduleUnit60")?.setAttribute("aria-pressed", String(unit === "60"));
}

function renderDailyPulse(day, tasks, carryovers, completion) {
  const node = el("dailyPulse");
  if (!node) return;
  const selectedKey = iso(selectedDate);
  const activeTasks = tasks.filter((task) => task.text);
  const carryoverOpen = carryovers.filter((task) => !isCarryoverCompletedOn(task, selectedKey));
  const openTasks = activeTasks.filter((task) => !shouldStrikeTask(task)).length + carryoverOpen.length;
  const nextAppointment = getNextAppointmentSummary(day);
  const coach = buildCoachAnalysis();
  const completionRate = completion.total ? Math.round((completion.done / completion.total) * 100) : 0;
  node.innerHTML = `
    <article class="pulse-card pulse-primary">
      <span>오늘 실행</span>
      <strong>${completion.done}/${completion.total}</strong>
      <small>${completionRate}% 완료 · 남은 핵심 ${openTasks}</small>
    </article>
    <article class="pulse-card">
      <span>다음 일정</span>
      <strong>${escapeHtml(nextAppointment.time)}</strong>
      <small>${escapeHtml(nextAppointment.text)}</small>
    </article>
    <article class="pulse-card">
      <span>이월 관리</span>
      <strong>${carryoverOpen.length}</strong>
      <small>${carryoverOpen.length ? "오늘 판단 필요" : "이월 없음"}</small>
    </article>
    <article class="pulse-card pulse-coach pulse-${coach.severity}">
      <span>AI 신호</span>
      <strong>${escapeHtml(coach.severity === "alert" ? "주의" : coach.severity === "warm" ? "조정" : "안정")}</strong>
      <small>${escapeHtml(coach.title)}</small>
    </article>
  `;
}

function getNextAppointmentSummary(day) {
  const slots = getScheduleSlotsForDay(day);
  const entries = slots
    .map((slot, index) => ({ slot, index, text: String(day.appointments?.[slot] || "").trim() }))
    .filter((entry) => entry.text);
  if (!entries.length) return { time: "비어 있음", text: "중요업무를 시간표에 배치하세요" };
  const selectedKey = iso(selectedDate);
  const todayKey = iso(todayInPlanner());
  const now = new Date();
  const anchorMinutes = selectedKey === todayKey ? now.getHours() * 60 + now.getMinutes() : 0;
  const next = entries.find((entry) => {
    const span = getAppointmentSpan(day, entry.slot);
    const endMinutes = slotToMinutes(entry.slot) + span * getScheduleSlotIntervalMinutes(slots);
    return selectedKey === todayKey ? endMinutes > anchorMinutes : slotToMinutes(entry.slot) >= anchorMinutes;
  });
  if (!next) {
    return selectedKey === todayKey
      ? { time: "완료", text: "남은 시간표 일정이 없습니다" }
      : { time: "비어 있음", text: "이 날짜의 다음 일정을 선택하세요" };
  }
  const span = getAppointmentSpan(day, next.slot);
  const end = span > 1 ? `~${getAppointmentEndLabel(next.index, span, slots)}` : "";
  return { time: `${next.slot}${end}`, text: next.text };
}

function slotToMinutes(slot) {
  const [hours, minutes] = String(slot).split(":").map(Number);
  return hours * 60 + minutes;
}

function renderOnboarding(day) {
  const node = el("onboardingPanel");
  if (!node) return;
  const isToday = iso(selectedDate) === iso(todayInPlanner());
  const dismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
  node.hidden = dismissed || !isToday || hasPlannerContent(state);
}

function maybeShowDailyOpeningMessage() {
  const node = el("dailyOpeningScreen");
  if (!node || isLocked || isPrivacyBlind) return;
  const todayKey = iso(todayInPlanner());
  if (localStorage.getItem(DAILY_OPENING_SEEN_KEY) === todayKey) return;
  const note = buildDailyOpeningNote(todayKey);
  el("dailyOpeningTitle").textContent = note.title;
  el("dailyOpeningMessage").textContent = note.message;
  el("dailyOpeningSignals").innerHTML = note.signals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("");
  node.hidden = false;
}

function closeDailyOpeningMessage() {
  const node = el("dailyOpeningScreen");
  if (node) node.hidden = true;
  localStorage.setItem(DAILY_OPENING_SEEN_KEY, iso(todayInPlanner()));
}

function buildDailyOpeningNote(key = iso(todayInPlanner())) {
  const date = parseDate(key);
  const day = ensureDay(key);
  const tasks = getDayTasks(key).filter((task) => task.text?.trim());
  const openTasks = tasks.filter((task) => !shouldStrikeTask(task));
  const carryovers = getCarryoverTasks(date).filter((task) => !isCarryoverCompletedOn(task, key));
  const appointments = Object.values(day.appointments || {}).filter((value) => String(value || "").trim());
  const season = getSeasonalContext(date);
  const goals = [state.profile?.goals, state.foundation?.mission, ...(state.year?.goals || [])]
    .filter(Boolean)
    .join(" ")
    .trim();
  const hash = hashString(`${key}:${tasks.length}:${carryovers.length}:${appointments.length}:${goals.slice(0, 42)}`);
  const praise = pickByHash(
    [
      "당신은 이미 오늘을 계획 앞에 세워 둔 사람입니다.",
      "어제의 무게가 남아 있어도 오늘의 첫 선택은 새롭습니다.",
      "일을 적는 손은 작아 보여도, 방향을 정하는 힘은 큽니다.",
      "바쁜 형편 속에서도 기록을 붙드는 태도는 충분히 칭찬받을 일입니다.",
    ],
    hash,
  );
  const challenge = dailyChallengeText(openTasks, carryovers, appointments, goals, hash);
  return {
    title: `${season.label} 아침의 작은 용기`,
    message: `${praise} ${season.shortTone} 오늘은 큰 결심보다 작은 실행 하나면 충분합니다. ${challenge}`,
    signals: [
      season.signal,
      `${appointments.length ? `시간표에 ${appointments.length}개의 일정이 있습니다.` : "시간표가 비어 있으니 중요한 일 하나를 먼저 고정할 수 있습니다."}`,
      `${carryovers.length ? `이월 ${carryovers.length}개는 탓할 짐이 아니라 오늘 결단할 재료입니다.` : "이월이 적습니다. 오늘은 새 추진력을 만들기 좋습니다."}`,
    ],
  };
}

function getSeasonalContext(date) {
  const month = date.getMonth() + 1;
  if ([3, 4, 5].includes(month)) {
    return {
      label: "봄",
      tone: "새싹이 조용히 뿌리를 밀어 올리듯, 오늘도 보이지 않는 준비가 성과를 만듭니다.",
      shortTone: "작게 시작해도 흐름은 자랍니다.",
      signal: "계절 감안: 봄의 리듬처럼 작게 시작해 꾸준히 밀고 가기 좋은 날입니다.",
    };
  }
  if ([6, 7, 8].includes(month)) {
    return {
      label: "여름",
      tone: "더운 계절에는 의욕보다 질서가 오래 갑니다.",
      shortTone: "오늘은 의욕보다 질서가 오래 갑니다.",
      signal: "계절 감안: 여름의 열기에는 일을 줄이고 핵심을 선명히 하는 편이 유리합니다.",
    };
  }
  if ([9, 10, 11].includes(month)) {
    return {
      label: "가을",
      tone: "수확의 계절은 한 번의 도약보다 매일의 손질을 기억합니다.",
      shortTone: "정리한 만큼 성과가 또렷해집니다.",
      signal: "계절 감안: 가을의 공기처럼 정리와 수확을 함께 생각하기 좋은 날입니다.",
    };
  }
  return {
    label: "겨울",
    tone: "차가운 계절일수록 따뜻한 원칙 하나가 하루를 붙듭니다.",
    shortTone: "차분한 원칙 하나가 오늘을 붙듭니다.",
    signal: "계절 감안: 겨울의 속도처럼 차분히, 그러나 멈추지 않는 실행이 필요합니다.",
  };
}

function dailyChallengeText(openTasks, carryovers, appointments, goals, hash) {
  if (carryovers.length >= 5) return "남길 일과 보낼 일을 분명히 나누세요.";
  if (openTasks.length >= 8) return "A업무 두 개만 남겨도 충분히 강합니다.";
  if (!appointments.length && openTasks.length) return "중요한 일 하나를 시간표에 앉히세요.";
  if (goals) return "목표와 닿은 작은 행동 하나를 끝내세요.";
  return pickByHash(
    [
      "첫 20분을 성실히 여세요.",
      "걱정보다 실행을 택하세요.",
      "가장 의미 있는 일을 먼저 대하세요.",
    ],
    hash + 7,
  );
}

function pickByHash(items, hash) {
  return items[Math.abs(hash) % items.length];
}

function hashString(value) {
  return Array.from(String(value)).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0);
}

function renderCoach() {
  bindProfileFields();
  const message = el("coachMessage");
  const suggestions = el("coachSuggestions");
  if (!message || !suggestions) return;
  const analysis = buildCoachAnalysis();
  message.className = `coach-card severity-${analysis.severity}`;
  message.innerHTML = `
    <strong>${escapeHtml(analysis.title)}</strong>
    <p>${escapeHtml(analysis.message)}</p>
    <small>${escapeHtml(analysis.detail)}</small>
  `;
  suggestions.innerHTML = "";
  analysis.suggestions.forEach((text) => {
    const item = document.createElement("button");
    item.className = "coach-suggestion";
    item.type = "button";
    item.textContent = text;
    item.onclick = () => addSuggestedTask(text);
    suggestions.appendChild(item);
  });
}

function bindProfileFields() {
  document.querySelectorAll("[data-profile-field]").forEach((field) => {
    const key = field.dataset.profileField;
    field.value = state.profile?.[key] || "";
    field.oninput = (event) => {
      state.profile ||= {};
      state.profile[key] = field.value;
      saveState();
      updateCoachBubble();
      if (event.inputType === "insertLineBreak") renderCoach();
    };
    field.onkeydown = (event) => {
      if (event.key === "Enter" && (field.tagName !== "TEXTAREA" || event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        field.blur();
        renderCoach();
      }
    };
  });
}

function buildCoachAnalysis() {
  const context = buildPlannerContext();
  const { openTasks, doneTasks, carryovers, appointmentEntries, goals, trend, freeSlots, highPriorityOpen, identitySummary, coachingStyle, currentChallenges, healthSummary, exerciseLimits } = context;
  let severity = "calm";
  let title = "오늘의 선택을 또렷하게 만들 시간입니다.";
  let message = "역할, 목표, 오늘의 우선업무가 서로 이어지도록 한 가지 중요한 결과를 먼저 고르세요.";
  if (carryovers.length >= 4 || openTasks.length >= 8) {
    severity = "alert";
    title = "업무가 과밀합니다. 오늘은 줄이는 결단이 성과입니다.";
    message = `열린 업무 ${openTasks.length}개, 이월 ${carryovers.length}개가 보입니다. A업무 1-2개만 시간표에 고정하고 나머지는 연기·위임·취소로 정리하세요.`;
  } else if (!appointmentEntries.length && openTasks.length > 0) {
    severity = "warm";
    title = "업무는 있지만 시간이 비어 있습니다.";
    message = "중요업무 한 개를 시간별 일정에 실제 블록으로 배치하면 오늘의 실행 확률이 크게 올라갑니다.";
  } else if (!highPriorityOpen && goals) {
    severity = "warm";
    title = "목표와 직접 연결된 A업무가 필요합니다.";
    message = "바쁜 일보다 방향을 만드는 일을 하나 고르세요. 오늘의 작은 A업무가 주간 흐름을 바꿉니다.";
  } else if (doneTasks.length >= 3) {
    title = "좋은 추진력이 보입니다.";
    message = `최근 흐름까지 보면 완료율이 ${trend.completionRate}%입니다. 지금은 새 일을 늘리기보다 마감 기록과 다음 첫 행동을 정리하기 좋은 타이밍입니다.`;
  } else if (freeSlots.length >= 5) {
    title = "오늘은 깊게 일할 여지가 있습니다.";
    message = "비어 있는 시간대가 있습니다. 중요한 업무 하나를 60-90분 블록으로 묶어 집중 시간을 만드세요.";
  }
  if (currentChallenges && severity !== "alert") {
    message += ` 지금 적어 둔 현재 과제는 '${currentChallenges.slice(0, 28)}'입니다. 오늘의 선택 하나가 이 부담을 조금 줄이는 방향이면 좋겠습니다.`;
  }
  if (healthSummary) {
    message += exerciseLimits
      ? " 건강 정보가 있으므로 오늘 활동은 무리보다 안전한 지속성을 우선으로 잡겠습니다."
      : " 건강 리듬도 함께 보겠습니다. 짧은 신체 활동을 시간표에 넣으면 집중 회복에 도움이 됩니다.";
  }
  if (/단호|직설|강하게/.test(coachingStyle)) {
    message += " 결론은 단순합니다. 덜 중요한 일은 과감히 뒤로 보내고, 가장 중요한 한 칸을 반드시 지키세요.";
  } else if (/격려|따뜻|칭찬/.test(coachingStyle)) {
    message += " 이미 기록하고 조정하려는 태도 자체가 좋은 출발입니다. 오늘은 작아도 끝나는 승리를 만드세요.";
  } else if (/숫자|데이터|분석/.test(coachingStyle)) {
    message += ` 현재 지표는 완료 ${doneTasks.length}개, 열린 업무 ${openTasks.length}개, 일정 ${appointmentEntries.length}개입니다.`;
  }
  const suggestions = generateTaskSuggestions(context);
  return {
    severity,
    title,
    message,
    detail: `${identitySummary || "사용자 정보"}${healthSummary ? ` · 건강: ${healthSummary}` : ""} · 최근 7일 완료율 ${trend.completionRate}% · 오늘 일정 ${appointmentEntries.length}개 · 이월 ${carryovers.length}개를 종합했습니다.`,
    suggestions,
  };
}

function buildPlannerContext(key = iso(selectedDate)) {
  const date = parseDate(key);
  const day = ensureDay(key);
  const tasks = getDayTasks(key).filter((task) => task.text?.trim());
  const carryovers = getCarryoverTasks(date).filter((task) => !isCarryoverCompletedOn(task, key));
  const openTasks = [...tasks.filter((task) => !shouldStrikeTask(task)), ...carryovers];
  const doneTasks = tasks.filter((task) => shouldStrikeTask(task));
  const scheduleSlots = getScheduleSlotsForDay(day);
  const appointmentEntries = scheduleSlots
    .filter((slot) => !isCoveredAppointmentSlot(day, slot, scheduleSlots))
    .map((slot) => ({ slot, text: String(day.appointments?.[slot] || "").trim(), span: getAppointmentSpan(day, slot) }))
    .filter((entry) => entry.text);
  const freeSlots = scheduleSlots.filter((slot) => !day.appointments?.[slot] && !isCoveredAppointmentSlot(day, slot, scheduleSlots));
  const profileText = Object.values(state.profile || {}).filter(Boolean).join(" ");
  const goals = [state.profile?.goals, state.foundation?.mission, ...(state.year?.goals || [])].filter(Boolean).join(" ");
  const weeklyFocus = ensureWeek(weekKey(date)).priorities?.filter((item) => item?.text && !item.done).map((item) => item.text) || [];
  const trend = getRecentTaskTrend(date);
  const identitySummary = summarizeProfileIdentity(state.profile);
  return {
    key,
    date,
    day,
    tasks,
    carryovers,
    openTasks,
    doneTasks,
    appointmentEntries,
    freeSlots,
    profileText,
    goals,
    weeklyFocus,
    trend,
    identitySummary,
    coachingStyle: state.profile?.coachingStyle || "",
    currentChallenges: state.profile?.currentChallenges || "",
    energyWindow: state.profile?.energyWindow || "",
    decisionPrinciples: state.profile?.decisionPrinciples || "",
    healthSummary: summarizeHealthProfile(state.profile),
    healthStatus: state.profile?.healthStatus || "",
    medications: state.profile?.medications || "",
    exerciseLimits: state.profile?.exerciseLimits || "",
    activityLevel: state.profile?.activityLevel || "",
    exerciseGoal: state.profile?.exerciseGoal || "",
    recoveryPattern: state.profile?.recoveryPattern || "",
    highPriorityOpen: openTasks.some((task) => task.priority === "A"),
  };
}

function summarizeProfileIdentity(profile = {}) {
  const parts = [
    profile.job && `${profile.job}`,
    profile.roles && `역할: ${profile.roles.slice(0, 22)}`,
    profile.goals && `목표: ${profile.goals.slice(0, 22)}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

function summarizeHealthProfile(profile = {}) {
  const parts = [
    profile.healthStatus && profile.healthStatus.slice(0, 18),
    profile.activityLevel && `활동 ${profile.activityLevel.slice(0, 12)}`,
    profile.exerciseGoal && `목표 ${profile.exerciseGoal.slice(0, 12)}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

function getRecentTaskTrend(anchorDate) {
  let total = 0;
  let done = 0;
  let carryover = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(anchorDate);
    date.setDate(anchorDate.getDate() - offset);
    const key = iso(date);
    const tasks = getDayTasks(key).filter((task) => task.text?.trim());
    total += tasks.length;
    done += tasks.filter((task) => shouldStrikeTask(task)).length;
    carryover += getCarryoverTasks(date).length;
  }
  return {
    total,
    done,
    carryover,
    completionRate: total ? Math.round((done / total) * 100) : 0,
  };
}

function generateTaskSuggestions(context = buildPlannerContext()) {
  const { openTasks, carryovers, goals, weeklyFocus, appointmentEntries, trend, profileText, decisionPrinciples, currentChallenges, energyWindow, healthStatus, medications, exerciseLimits, activityLevel, exerciseGoal, recoveryPattern } = context;
  const suggestions = [];
  const profileGoal = state.profile?.goals?.trim();
  if (profileGoal) suggestions.push(`목표 연결: ${profileGoal.slice(0, 22)}의 다음 행동 1개 완료하기`);
  if (decisionPrinciples) suggestions.push(`기준 점검: ${decisionPrinciples.slice(0, 18)}에 맞는 선택 1개 정리하기`);
  if (currentChallenges) suggestions.push(`현재 과제: ${currentChallenges.slice(0, 20)}를 20분 실행으로 쪼개기`);
  if (exerciseGoal) suggestions.push(`건강 실행: ${exerciseGoal.slice(0, 18)}를 오늘 일정에 넣기`);
  if (activityLevel && /앉|좌식|부족|거의/.test(activityLevel)) suggestions.push("신체 리셋: 10분 걷기 또는 가벼운 스트레칭 넣기");
  if (recoveryPattern && /피로|수면부족|부족|불면/.test(recoveryPattern)) suggestions.push("회복 관리: 무리한 추가업무 대신 휴식 15분 확보하기");
  if (healthStatus || medications || exerciseLimits) suggestions.push("건강 체크: 투약·통증·운동 제한사항을 확인하고 활동 강도 조절하기");
  if (weeklyFocus.length) suggestions.push(`주간 초점: ${weeklyFocus[0].slice(0, 22)}를 오늘 실행 단위로 만들기`);
  if (carryovers.length) suggestions.push(`이월 정리: ${carryovers[0].text.slice(0, 18)}을 완료·연기·위임 중 하나로 결정하기`);
  if (openTasks.length) suggestions.push(`집중 실행: ${openTasks[0].text.slice(0, 22)}을 25분 단위로 착수하기`);
  if (!openTasks.some((task) => task.priority === "A") && goals) suggestions.push("목표와 직접 연결되는 A업무 1개 추가하기");
  if (!appointmentEntries.length && openTasks.length) suggestions.push("가장 중요한 업무 1개를 오전 시간표에 고정하기");
  if (/오전/.test(energyWindow)) suggestions.push("오전 집중 시간에 가장 어려운 A업무 먼저 배치하기");
  if (/오후/.test(energyWindow)) suggestions.push("오전에는 정리, 오후 집중 시간에 핵심 실행 배치하기");
  if (trend.completionRate < 45 && trend.total >= 4) suggestions.push("오늘 업무 수를 줄이고 끝낼 수 있는 3개만 남기기");
  if (/대표|CEO|경영|사업|관리|컨설팅/i.test(profileText)) suggestions.push("의사결정 필요한 안건 1개를 먼저 검토하기");
  suggestions.push("오늘 끝내지 않을 일을 취소·연기·위임으로 정리하기");
  return [...new Set(suggestions)].slice(0, 5);
}

function addSuggestedTask(text) {
  const day = ensureDay();
  const priority = suggestedTaskPriority(text);
  day.tasks[priority].push({ text, status: "미완료", done: false, priorityUnset: false });
  saveState();
  showView("day");
  renderAll();
}

function suggestedTaskPriority(text = "") {
  if (/목표|A업무|집중|의사결정|주간 초점/.test(text)) return "A";
  if (/이월|정리|위임|연기|검토|건강|회복|신체|운동|투약/.test(text)) return "B";
  return "C";
}

function updateCoachBubble() {
  const node = el("coachBubble");
  if (!node) return;
  const analysis = buildCoachAnalysis();
  node.dataset.severity = analysis.severity;
  node.dataset.count = String(analysis.suggestions.length);
  node.textContent = "";
}

function renderTaskSuggestionPopover() {
  const node = el("taskSuggestPopover");
  if (!node) return;
  const suggestions = generateTaskSuggestions(buildPlannerContext()).slice(0, 4);
  node.hidden = false;
  node.innerHTML = `
    <div class="ai-suggest-header">
      <strong>AI 추천 업무</strong>
      <button class="icon-close ai-suggest-close" type="button" aria-label="AI 추천 닫기">×</button>
    </div>
    ${suggestions.map((text, index) => `
      <label>
        <input type="checkbox" data-suggestion-index="${index}" />
        <span>${escapeAttr(text)}</span>
      </label>
    `).join("")}
  `;
  node.querySelector(".ai-suggest-close").onclick = () => {
    node.hidden = true;
  };
  node.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.onchange = () => {
      if (!checkbox.checked) return;
      addSuggestedTask(suggestions[Number(checkbox.dataset.suggestionIndex)]);
      node.hidden = true;
    };
  });
}

function renderScheduleSuggestionPopover() {
  const node = el("scheduleSuggestPopover");
  if (!node) return;
  const suggestions = generateScheduleSuggestions(buildPlannerContext()).slice(0, 4);
  node.hidden = false;
  node.innerHTML = `
    <div class="ai-suggest-header">
      <strong>AI 일정 배분</strong>
      <button class="icon-close ai-suggest-close" type="button" aria-label="AI 일정 추천 닫기">×</button>
    </div>
    ${suggestions.map((item, index) => `
      <button class="ai-schedule-choice" type="button" data-suggestion-index="${index}">
        <b>${escapeHtml(item.slot)}</b>
        <span>${escapeHtml(item.text)}</span>
      </button>
    `).join("")}
  `;
  node.querySelector(".ai-suggest-close").onclick = () => {
    node.hidden = true;
  };
  node.querySelectorAll(".ai-schedule-choice").forEach((button) => {
    button.onclick = () => {
      applyScheduleSuggestion(suggestions[Number(button.dataset.suggestionIndex)]);
      node.hidden = true;
    };
  });
}

function generateScheduleSuggestions(context = buildPlannerContext()) {
  const { openTasks, freeSlots, appointmentEntries, carryovers, energyWindow, exerciseGoal, exerciseLimits, recoveryPattern } = context;
  const firstA = openTasks.find((task) => task.priority === "A") || openTasks[0];
  const preferredStart = /오후/.test(energyWindow) ? "13:00" : /저녁/.test(energyWindow) ? "16:00" : "09:00";
  const firstFree = freeSlots.find((slot) => slot >= preferredStart) || freeSlots.find((slot) => slot >= "09:00") || freeSlots[0] || "09:00";
  const secondFree = freeSlots.find((slot) => slot > firstFree && slot >= "13:00") || freeSlots.find((slot) => slot > firstFree) || "14:00";
  const suggestions = [];
  if (firstA) {
    suggestions.push({ slot: `${firstFree} 집중`, text: `${firstA.text.slice(0, 28)} 실행 블록` });
  }
  if (energyWindow) {
    suggestions.push({ slot: "에너지 맞춤", text: `${energyWindow.slice(0, 18)} 리듬에 맞춰 가장 어려운 일을 먼저 배치` });
  }
  if (exerciseGoal) {
    suggestions.push({ slot: "활동", text: exerciseLimits ? "무리 없는 강도의 건강 활동 또는 회복 시간 확보" : `${exerciseGoal.slice(0, 18)} 실행 시간 확보` });
  } else if (recoveryPattern) {
    suggestions.push({ slot: "회복", text: "짧은 산책, 스트레칭, 눈 휴식 중 하나를 일정에 배치" });
  }
  if (carryovers.length) {
    suggestions.push({ slot: `${secondFree} 정리`, text: `이월 ${carryovers.length}개 검토와 연기·위임 판단` });
  }
  if (appointmentEntries.length >= 4) {
    suggestions.push({ slot: "오전 15분", text: "일정 사이 완충시간과 준비물 확인" });
  } else {
    suggestions.push({ slot: "오전", text: "A업무 60분, B업무 30분, 기록 10분 순서로 배치" });
  }
  suggestions.push({ slot: "마감 전", text: "완료 체크, 내일 첫 행동, 배운 점 1줄 기록" });
  return [...new Map(suggestions.map((item) => [`${item.slot}:${item.text}`, item])).values()];
}

function applyScheduleSuggestion(suggestion) {
  if (!suggestion) return;
  const day = ensureDay();
  const target = pickScheduleTargetSlot(day, suggestion.slot);
  day.appointments[target] ||= suggestion.text;
  saveState();
  renderDay();
}

function pickScheduleTargetSlot(day, label = "") {
  const slots = getScheduleSlotsForDay(day);
  const preferred = label.includes("오후") || label.includes("마감") ? ["16:00", "15:00", "14:00"] : label.includes("정리") ? ["13:30", "14:00", "15:00"] : ["09:00", "09:30", "10:00", "08:30"];
  return preferred.find((slot) => slots.includes(slot) && !day.appointments?.[slot] && !isCoveredAppointmentSlot(day, slot, slots)) || slots.find((slot) => !day.appointments?.[slot] && !isCoveredAppointmentSlot(day, slot, slots)) || slots[0] || "09:00";
}

function applyMemoPrompt() {
  const day = ensureDay();
  const context = buildPlannerContext();
  const prompt = [
    "AI 기록 질문:",
    `1. 오늘 가장 중요한 선택은 무엇이었나요? (${context.openTasks.length}개 열린 업무 중 핵심 1개)`,
    `2. 일정 배분에서 막힌 시간대는 어디였나요? (${context.appointmentEntries.length}개 일정 기준)`,
    "3. 내일 아침 첫 20분에 바로 시작할 행동은 무엇인가요?",
  ].join("\n");
  day.memo = day.memo ? `${day.memo}\n${prompt}` : prompt;
  saveState();
  renderDay();
}

function shouldRepeatOnDate(rule, date) {
  normalizeRepeatRule(rule);
  if (!rule.active || !rule.text?.trim()) return false;
  const key = iso(date);
  if (key < rule.startDate) return false;
  if (rule.endMode === "date" && rule.endDate && key > rule.endDate) return false;
  if (rule.deletedFrom && key >= rule.deletedFrom) return false;
  if (rule.frequency === "daily") return rule.weekdays.includes(date.getDay());
  if (rule.frequency === "weekly") return Number(rule.weekday) === date.getDay();
  if (rule.frequency === "monthly") return Number(rule.monthday) === date.getDate();
  if (rule.frequency === "yearly") return Number(rule.month) === date.getMonth() + 1 && Number(rule.monthday) === date.getDate();
  return false;
}

function nextRepeatDateAfter(rule, fromKey) {
  normalizeRepeatRule(rule);
  const start = parseDate(fromKey);
  if (Number.isNaN(start.getTime())) return "";
  const candidate = new Date(start);
  candidate.setDate(candidate.getDate() + 1);
  const limit = new Date(start);
  limit.setFullYear(limit.getFullYear() + 5);
  while (candidate <= limit) {
    if (shouldRepeatOnDate(rule, candidate)) return iso(candidate);
    candidate.setDate(candidate.getDate() + 1);
  }
  return "";
}

function repeatRuleForTask(task) {
  const match = String(task?.repeatId || "").match(/^repeat-(\d+)-\d{4}-\d{2}-\d{2}$/);
  if (!match) return null;
  const index = Number(match[1]);
  const rule = state.repeats?.priorityTasks?.[index];
  return rule ? normalizeRepeatRule(rule) : null;
}

function shouldCarryRepeatTask(task, currentKey) {
  if (!task?.repeatId) return true;
  const sourceKey = task.repeatSourceDate || task.date || String(task.repeatId).match(/^repeat-\d+-(\d{4}-\d{2}-\d{2})$/)?.[1] || "";
  const rule = repeatRuleForTask(task);
  if (!sourceKey || !rule) return true;
  if (rule.deletedFrom && currentKey >= rule.deletedFrom) return false;
  const nextKey = nextRepeatDateAfter(rule, sourceKey);
  return !nextKey || currentKey < nextKey;
}

function resetFutureRepeatOccurrences(ruleIndex, fromKey = iso(selectedDate)) {
  Object.entries(state.days || {}).forEach(([key, day]) => {
    if (key < fromKey) return;
    normalizeDayTasks(day);
    priorities.forEach(([priority]) => {
      day.tasks[priority] = day.tasks[priority].filter((task) => task.repeatId !== `repeat-${ruleIndex}-${key}`);
    });
    day.deletedRepeatIds = (day.deletedRepeatIds || []).filter((id) => id !== `repeat-${ruleIndex}-${key}`);
  });
}

function markRepeatRuleChanged(rule, index) {
  const key = iso(selectedDate || todayInPlanner());
  if (!isValidIsoDate(rule.startDate)) rule.startDate = key;
  rule.deletedFrom = "";
  resetFutureRepeatOccurrences(index, earliestIsoDate(rule.startDate, key));
}

function applyRepeatingPriorityTasks(key = iso(selectedDate)) {
  const day = state.days[key];
  if (!day) return;
  const date = parseDate(key);
  ensureRepeatPriorityRows();
  state.repeats.priorityTasks.forEach((rule, index) => {
    if (!shouldRepeatOnDate(rule, date)) return;
    const priority = ["A", "B", "C"].includes(rule.priority) ? rule.priority : "A";
    const repeatId = `repeat-${index}-${key}`;
    if (Array.isArray(day.deletedRepeatIds) && day.deletedRepeatIds.includes(repeatId)) return;
    let existingPriority = "";
    let existingTask = null;
    priorities.some(([candidate]) => {
      existingTask = day.tasks[candidate].find((task) => task.repeatId === repeatId);
      existingPriority = existingTask ? candidate : "";
      return Boolean(existingTask);
    });
    if (existingTask) {
      return;
    }
    day.tasks[priority].push({
      text: rule.text.trim(),
      status: "미완료",
      done: false,
      repeatId,
      repeatStartDate: rule.startDate,
      repeatSourceDate: key,
      priorityUnset: false,
    });
  });
}

function renderRepeatPriorityList() {
  const node = el("repeatPriorityList");
  if (!node) return;
  ensureRepeatPriorityRows();
  node.innerHTML = "";
  getSortedRepeatRuleEntries().forEach(({ rule, index }) => {
    const scroller = document.createElement("div");
    scroller.className = "repeat-rule-scroll";
    scroller.tabIndex = 0;
    scroller.addEventListener("pointerdown", () => activateRepeatRuleScroller(scroller));
    scroller.addEventListener("focusin", () => activateRepeatRuleScroller(scroller));
    const row = document.createElement("div");
    row.className = "repeat-rule-row";
    row.innerHTML = `
      <input class="repeat-active" type="checkbox" ${rule.active ? "checked" : ""} aria-label="반복 사용" />
      <select class="repeat-priority" aria-label="중요도">
        ${["A", "B", "C"].map((priority) => `<option value="${priority}" ${rule.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}
      </select>
      <input class="repeat-text" type="text" value="${escapeAttr(rule.text)}" placeholder="반복 업무" />
      <select class="repeat-frequency" aria-label="반복 주기">
        ${repeatFrequencies.map(([value, label]) => `<option value="${value}" ${rule.frequency === value ? "selected" : ""}>${label}</option>`).join("")}
      </select>
      <div class="repeat-target-cell">${renderRepeatTargetControl(rule)}</div>
      <label class="repeat-date-field">
        <span>시작</span>
        <input class="repeat-start-date" type="date" value="${escapeAttr(rule.startDate)}" aria-label="반복 시작일" />
      </label>
      <select class="repeat-end-mode" aria-label="반복 종료 설정">
        <option value="none" ${rule.endMode !== "date" ? "selected" : ""}>종료없음</option>
        <option value="date" ${rule.endMode === "date" ? "selected" : ""}>종료일</option>
      </select>
      <input class="repeat-end-date" type="date" value="${escapeAttr(rule.endDate)}" ${rule.endMode === "date" ? "" : "disabled"} aria-label="반복 종료일" />
      <button class="repeat-delete" type="button" aria-label="반복 우선업무 삭제">×</button>
    `;
    const active = row.querySelector(".repeat-active");
    const priority = row.querySelector(".repeat-priority");
    const text = row.querySelector(".repeat-text");
    const frequency = row.querySelector(".repeat-frequency");
    const startDate = row.querySelector(".repeat-start-date");
    const endMode = row.querySelector(".repeat-end-mode");
    const endDate = row.querySelector(".repeat-end-date");
    active.onchange = () => {
      if (!active.checked && !confirmDelete("이 반복 우선업무를 비활성화할까요? 오늘 이후 자동 생성이 중단됩니다.")) {
        active.checked = true;
        return;
      }
      rule.active = active.checked;
      if (rule.active) markRepeatRuleChanged(rule, index);
      if (!rule.active) {
        rule.deletedFrom = iso(selectedDate || todayInPlanner());
        resetFutureRepeatOccurrences(index, rule.deletedFrom);
      }
      saveState();
      renderAll();
    };
    priority.onchange = () => {
      markRepeatRuleChanged(rule, index);
      rule.priority = priority.value;
      saveState();
      renderAll();
    };
    text.oninput = () => {
      const wasBlank = !rule.text?.trim();
      if (!wasBlank && rule.text !== text.value) markRepeatRuleChanged(rule, index);
      rule.text = text.value;
      if (wasBlank && rule.text.trim()) rule.startDate = iso(selectedDate || todayInPlanner());
      saveState();
    };
    text.onchange = () => renderAll();
    frequency.onchange = () => {
      markRepeatRuleChanged(rule, index);
      rule.frequency = frequency.value;
      setRepeatAnchorToSelectedDate(rule);
      saveState();
      renderAll();
    };
    row.querySelector(".repeat-weekday")?.addEventListener("change", (event) => {
      markRepeatRuleChanged(rule, index);
      rule.weekday = Number(event.target.value);
      saveState();
      renderAll();
    });
    row.querySelector(".repeat-weekday-toggle")?.addEventListener("click", () => {
      row.querySelector(".repeat-weekday-popover")?.toggleAttribute("hidden");
    });
    row.querySelectorAll(".repeat-weekdays input[type='checkbox']").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const selected = Array.from(row.querySelectorAll(".repeat-weekdays input[type='checkbox']:checked")).map((item) => Number(item.value));
        rule.weekdays = selected.length ? selected : [Number(checkbox.value)];
        if (!selected.length) checkbox.checked = true;
        markRepeatRuleChanged(rule, index);
        saveState();
        const toggle = row.querySelector(".repeat-weekday-toggle");
        if (toggle) toggle.textContent = repeatWeekdaySummary(rule);
      });
    });
    row.querySelector(".repeat-monthday")?.addEventListener("change", (event) => {
      markRepeatRuleChanged(rule, index);
      rule.monthday = Number(event.target.value);
      saveState();
      renderAll();
    });
    row.querySelector(".repeat-month")?.addEventListener("change", (event) => {
      markRepeatRuleChanged(rule, index);
      rule.month = Number(event.target.value);
      saveState();
      renderAll();
    });
    startDate.onchange = () => {
      const previousStart = rule.startDate;
      rule.startDate = isValidIsoDate(startDate.value) ? startDate.value : previousStart;
      resetFutureRepeatOccurrences(index, earliestIsoDate(previousStart, rule.startDate, iso(selectedDate || todayInPlanner())));
      saveState();
      renderAll();
    };
    endMode.onchange = () => {
      const resetFrom = iso(selectedDate || todayInPlanner());
      rule.endMode = endMode.value === "date" ? "date" : "none";
      if (rule.endMode === "date" && !isValidIsoDate(rule.endDate)) rule.endDate = rule.startDate;
      if (rule.endMode !== "date") rule.endDate = "";
      resetFutureRepeatOccurrences(index, resetFrom);
      saveState();
      renderAll();
    };
    endDate.onchange = () => {
      rule.endDate = isValidIsoDate(endDate.value) ? endDate.value : "";
      if (rule.endDate) rule.endMode = "date";
      resetFutureRepeatOccurrences(index, iso(selectedDate || todayInPlanner()));
      saveState();
      renderAll();
    };
    row.querySelector(".repeat-delete").onclick = () => {
      if (!confirmDelete("이 반복 우선업무를 삭제할까요? 이전 기록은 유지되고 오늘 이후 반복만 중단됩니다.")) return;
      rule.active = false;
      rule.deletedFrom = iso(selectedDate || todayInPlanner());
      rule.removed = true;
      resetFutureRepeatOccurrences(index, rule.deletedFrom);
      saveState();
      renderRepeatPriorityList();
      renderDay();
    };
    scroller.appendChild(row);
    node.appendChild(scroller);
  });
  const add = document.createElement("button");
  add.className = "add-row repeat-add";
  add.type = "button";
  add.textContent = "반복 업무 추가";
  add.onclick = () => {
    state.repeats.priorityTasks.push(emptyRepeatRule());
    saveState();
    renderRepeatPriorityList();
  };
  node.appendChild(add);
}

function activateRepeatRuleScroller(scroller) {
  const node = el("repeatPriorityList");
  if (!node) return;
  node.querySelectorAll(".repeat-rule-scroll.is-active").forEach((item) => {
    if (item !== scroller) item.classList.remove("is-active");
  });
  scroller.classList.add("is-active");
}

function getSortedRepeatRuleEntries() {
  return (state.repeats?.priorityTasks || [])
    .map((rule, index) => ({ rule: normalizeRepeatRule(rule), index }))
    .filter(({ rule }) => !rule.removed)
    .sort((a, b) => {
      const aFilled = Boolean(a.rule.text?.trim());
      const bFilled = Boolean(b.rule.text?.trim());
      if (aFilled !== bFilled) return aFilled ? -1 : 1;
      if (aFilled && bFilled) {
        const frequencyDelta = (repeatFrequencySortOrder[a.rule.frequency] ?? 9) - (repeatFrequencySortOrder[b.rule.frequency] ?? 9);
        if (frequencyDelta) return frequencyDelta;
      }
      return a.index - b.index;
    });
}

function openRepeatManager() {
  ensureRepeatPriorityRows();
  renderRepeatPriorityList();
  const dialog = el("repeatManagerDialog");
  if (dialog) dialog.hidden = false;
}

function closeRepeatManager() {
  const dialog = el("repeatManagerDialog");
  if (!dialog || dialog.hidden) return;
  dialog.hidden = true;
  renderDay();
}

function setRepeatAnchorToSelectedDate(rule) {
  const baseDate = selectedDate || todayInPlanner();
  if (rule.frequency === "daily") rule.weekdays = weekdays.map((_, index) => index);
  if (rule.frequency === "weekly") rule.weekday = baseDate.getDay();
  if (rule.frequency === "monthly") rule.monthday = baseDate.getDate();
  if (rule.frequency === "yearly") {
    rule.month = baseDate.getMonth() + 1;
    rule.monthday = baseDate.getDate();
  }
  normalizeRepeatRule(rule);
}

function renderRepeatTargetControl(rule) {
  if (rule.frequency === "daily") {
    const selected = Array.isArray(rule.weekdays) && rule.weekdays.length ? rule.weekdays : weekdays.map((_, index) => index);
    const summary = repeatWeekdaySummary(rule);
    return `
      <div class="repeat-weekday-picker">
        <button class="repeat-weekday-toggle" type="button" aria-label="반복 요일 선택">${escapeHtml(summary || "요일 선택")}</button>
        <div class="repeat-weekday-popover" hidden>
          <div class="repeat-weekdays" aria-label="반복 요일 선택">
            ${weekdays.map((day, dayIndex) => `
              <label>
                <input type="checkbox" value="${dayIndex}" ${selected.includes(dayIndex) ? "checked" : ""} />
                <span>${day}</span>
              </label>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }
  if (rule.frequency === "weekly") {
    return `
      <select class="repeat-weekday" aria-label="반복 요일">
        ${weekdays.map((day, dayIndex) => `<option value="${dayIndex}" ${Number(rule.weekday) === dayIndex ? "selected" : ""}>${day}</option>`).join("")}
      </select>
    `;
  }
  if (rule.frequency === "monthly") {
    return `
      <select class="repeat-monthday" aria-label="반복 일자">
        ${Array.from({ length: 31 }, (_, index) => {
          const day = index + 1;
          return `<option value="${day}" ${Number(rule.monthday) === day ? "selected" : ""}>${day}일</option>`;
        }).join("")}
      </select>
    `;
  }
  if (rule.frequency === "yearly") {
    return `
      <div class="repeat-yearly-controls">
        <select class="repeat-month" aria-label="반복 월">
          ${Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            return `<option value="${month}" ${Number(rule.month) === month ? "selected" : ""}>${month}월</option>`;
          }).join("")}
        </select>
        <select class="repeat-monthday" aria-label="반복 일자">
          ${Array.from({ length: 31 }, (_, index) => {
            const day = index + 1;
            return `<option value="${day}" ${Number(rule.monthday) === day ? "selected" : ""}>${day}일</option>`;
          }).join("")}
        </select>
      </div>
    `;
  }
  return `<span class="repeat-target-static">매일</span>`;
}

function repeatWeekdaySummary(rule) {
  const selected = Array.isArray(rule.weekdays) && rule.weekdays.length ? rule.weekdays : weekdays.map((_, index) => index);
  return selected.length === 7 ? "매일" : selected.map((dayIndex) => weekdays[dayIndex]).filter(Boolean).join(", ");
}

function renderDayCompass() {
  const node = el("dayCompass");
  if (!node) return;
  const title = document.querySelector(".day-compass-panel h3");
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  if (title) title.textContent = `위클리 콤파스 (${formatCompassDate(weekStart)} ~ ${formatCompassDate(weekEnd)})`;
  const week = ensureWeek();
  const roleNames = compassRoleNames();
  while (week.compass.length < roleNames.length) {
    week.compass.push({ role: roleNames[week.compass.length], goal: "", action: "" });
  }
  node.innerHTML = "";
  const priorityBlock = document.createElement("section");
  priorityBlock.className = "weekly-priority-block";
  priorityBlock.innerHTML = `<h4>금주의 주요일정</h4>`;
  week.priorities.slice(0, 5).forEach((item, index) => {
    item ||= { text: "", done: false };
    week.priorities[index] = item;
    const row = document.createElement("label");
    row.className = `weekly-priority-row ${item.done ? "done" : ""}`;
    row.innerHTML = `
      <input type="checkbox" ${item.done ? "checked" : ""} />
      <input class="weekly-priority-text" type="text" value="${escapeAttr(item.text)}" placeholder="주요일정 ${index + 1}" />
    `;
    const checkbox = row.querySelector("input[type='checkbox']");
    const text = row.querySelector(".weekly-priority-text");
    checkbox.onchange = () => {
      item.done = checkbox.checked;
      saveState();
      renderDayCompass();
    };
    text.oninput = () => {
      item.text = text.value;
      saveState();
    };
    priorityBlock.appendChild(row);
  });
  node.appendChild(priorityBlock);
  week.compass.forEach((item, index) => {
    normalizeCompassItem(item);
    item.role = roleNames[index] || item.role || `역할 ${index + 1}`;
    const row = document.createElement("div");
    row.className = "compass-row";
    row.innerHTML = `
      <span class="row-label">${item.role}</span>
      <input type="text" value="${escapeAttr(item.goal)}" placeholder="이번 주 목표" />
      <div class="compass-actions">
        ${item.actions.slice(0, 2).map((value, actionIndex) => `<input type="text" value="${escapeAttr(value)}" placeholder="핵심 행동 ${actionIndex + 1}" />`).join("")}
      </div>
    `;
    const inputs = row.querySelectorAll("input");
    inputs[0].oninput = (event) => {
      item.goal = event.target.value;
      saveState();
      renderWeek();
    };
    inputs.forEach((input, inputIndex) => {
      if (inputIndex === 0) return;
      input.oninput = (event) => {
        item.actions[inputIndex - 1] = event.target.value;
        item.action = item.actions[0] || "";
        saveState();
        renderWeek();
      };
    });
    node.appendChild(row);
  });
}

function positionDaySwipe(panel = "main", force = false) {
  const node = el("daySwipe");
  if (!node || !isPagedDaySwipe()) return;
  const key = `${iso(selectedDate)}:${panel}`;
  if (!force && daySwipeKey === key && panel === "main") return;
  daySwipeKey = key;
  window.requestAnimationFrame(() => scrollDayPanel(panel, "auto"));
}

function scrollDayPanel(panel, behavior = "smooth") {
  const node = el("daySwipe");
  if (!node) return;
  const target = node.querySelector(`[data-panel="${panel}"]`);
  if (!target) return;
  currentDayPanel = panel;
  window.requestAnimationFrame(() => {
    node.scrollTo({ left: target.offsetLeft, behavior });
  });
}

function renderTaskBoard(day) {
  const board = el("taskBoard");
  board.innerHTML = "";
  const list = document.createElement("section");
  list.className = "task-list";
  const carryovers = getCarryoverTasks(selectedDate);
  if (carryovers.length) {
    carryovers.forEach((task) => list.appendChild(renderCarryoverTask(task)));
  }
  getTaskRefs(day).forEach(({ task, priority, index }) => list.appendChild(renderTaskRow(task, priority, index)));
  const add = document.createElement("button");
  add.className = "add-row";
  add.textContent = "업무 추가";
  add.onclick = () => {
    day.tasks.A.push({ text: "", status: "미완료", done: false, delegate: "", priorityUnset: true });
    saveState({ fastSave: true });
    renderDay();
  };
  list.appendChild(add);
  board.appendChild(list);
}

function getTaskRefs(day) {
  const priorityOrder = Object.fromEntries(priorities.map(([priority], index) => [priority, index]));
  return priorities
    .flatMap(([priority]) => day.tasks[priority].map((task, index) => ({ task, priority, index })))
    .sort((a, b) => {
      const activeDelta = Number(isActiveTaskSlot(b.task)) - Number(isActiveTaskSlot(a.task));
      if (activeDelta) return activeDelta;
      return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0) || a.index - b.index;
    });
}

function isActiveTaskSlot(task = {}) {
  return Boolean(
    task.text?.trim() ||
      task.done ||
      task.delegate?.trim() ||
      task.priorityUnset === false ||
      (task.status && task.status !== "미완료") ||
      task.repeatId ||
      task.projectTaskId ||
      task.financeItemId,
  );
}

function renderTaskRow(task, priority, index) {
  const row = document.createElement("div");
  const marker = getTaskMarker(task);
  const isStruck = shouldStrikeTask(task);
  const menuValue = getPriorityMenuValue(task, priority);
  row.className = `task-row priority-${menuValue === "A" ? "a" : "none"} marker-${marker} ${task.status === "위임" ? "is-delegated" : ""} ${isStruck ? "done" : ""}`;
  const statusControl = getTaskStatusControl(task, menuValue);
  row.innerHTML = `
    <button class="task-cycle" type="button" aria-label="완료 상태 변경">${getTaskMarkerLabel(marker)}</button>
    <div class="task-status-cell" data-status="${escapeAttr(getTaskStatusLabel(task, menuValue))}">${getTaskStatusDisplay(task, menuValue)}${statusControl}</div>
    <input class="task-text-input" type="text" value="${escapeAttr(task.text)}" placeholder="업무 내용" />
    <button class="task-delete" type="button" aria-label="우선업무 삭제">×</button>
  `;
  const cycle = row.querySelector(".task-cycle");
  const prioritySelect = row.querySelector(".priority-select");
  const delegateInput = row.querySelector(".delegate-input");
  const postponeSelect = row.querySelector(".postpone-select");
  const postponeDate = row.querySelector(".postpone-date");
  const text = row.querySelector(".task-text-input");
  const deleteButton = row.querySelector(".task-delete");
  cycle.onclick = () => {
    cycleTaskMarker(task);
    saveState({ fastSave: true });
    renderAll();
  };
  if (prioritySelect) {
    let handledValue = "";
    const applyPrioritySelection = () => {
      if (handledValue === prioritySelect.value) return;
      handledValue = prioritySelect.value;
      handlePriorityMenuChange(task, priority, index, prioritySelect.value);
    };
    prioritySelect.oninput = applyPrioritySelection;
    prioritySelect.onchange = applyPrioritySelection;
  }
  if (delegateInput) {
    delegateInput.oninput = () => {
      task.delegate = delegateInput.value;
      saveState({ fastSave: true });
    };
  }
  if (postponeSelect) {
    postponeSelect.onchange = () => {
      task.postponeMode = postponeSelect.value;
      saveState({ fastSave: true });
      renderAll();
    };
  }
  if (postponeDate) {
    postponeDate.onchange = () => schedulePostponedTask(task, priority, postponeDate.value);
  }
  bindDailyTaskTextInput(text);
  text.oninput = () => {
    dailyTextEditingActive = true;
    markDailyFieldEditing(10 * 60 * 1000);
    task.text = text.value;
    saveState({ fastSave: true });
  };
  deleteButton.onclick = () => deleteTask(priority, index);
  return row;
}

function bindDailyTaskTextInput(input) {
  if (!input) return;
  input.onfocus = () => {
    dailyTextEditingActive = true;
    markDailyFieldEditing(10 * 60 * 1000);
  };
  input.oncompositionstart = () => {
    dailyTextEditingActive = true;
    markDailyFieldEditing(10 * 60 * 1000);
  };
  input.oncompositionend = () => {
    dailyTextEditingActive = true;
    markDailyFieldEditing(10 * 60 * 1000);
  };
  input.onkeydown = (event) => {
    dailyTextEditingActive = true;
    markDailyFieldEditing(10 * 60 * 1000);
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    dailyTextEditingActive = false;
    flushDailyTaskRelatedRefresh();
    resetMobileDayFocusToSplit({ blur: true });
  };
  input.onblur = () => {
    dailyTextEditingActive = false;
    markDailyFieldEditing(0);
    scheduleDailyTaskRelatedRefresh(60);
  };
}

function getTaskStatusLabel(task, menuValue) {
  if (task.status === "위임") return task.delegate?.trim() || "위임";
  if (task.status === "연기") {
    if (task.postponeMode === "date" && task.postponeDate) return formatCompactMonthDay(task.postponeDate);
    return task.postponeMode === "date" ? "날자" : "미정";
  }
  return menuValue === "선택" ? "?" : menuValue || "?";
}

function formatCompactMonthDay(value) {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return value || "";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getTaskStatusDisplay(task, menuValue) {
  if (task.status === "위임") return "";
  if (task.status === "연기" && task.postponeMode === "date" && task.postponeDate) {
    const date = parseDate(task.postponeDate);
    if (Number.isNaN(date.getTime())) return "";
    return `<span class="postpone-date-label"><b>${date.getMonth() + 1}</b><b>${date.getDate()}</b></span>`;
  }
  const label = getTaskStatusLabel(task, menuValue);
  const isPriorityLetter = ["A", "B", "C", "?"].includes(label);
  return `<span class="task-status-label ${isPriorityLetter ? "is-priority-letter" : ""}">${escapeHtml(label)}</span>`;
}

function getTaskStatusControl(task, menuValue) {
  if (task.status === "위임") {
    return `<input class="delegate-input" type="text" value="${escapeAttr(task.delegate || "")}" placeholder="위임자" />`;
  }
  if (task.status === "연기") {
    const mode = task.postponeMode === "date" ? "date" : "";
    if (mode === "date" && task.postponeDate) {
      return `<input class="postpone-date" type="date" value="${escapeAttr(task.postponeDate)}" />`;
    }
    return `
      <select class="postpone-select" aria-label="연기 일정 선택">
        <option value="" ${mode === "" ? "selected" : ""}>미정</option>
        <option value="date" ${mode === "date" ? "selected" : ""}>날자기입</option>
      </select>
      ${mode === "date" ? `<input class="postpone-date" type="date" value="${escapeAttr(task.postponeDate || "")}" />` : ""}
    `;
  }
  return `
    <select class="priority-select" aria-label="중요도 선택">
      ${taskPriorityOptions.map((value) => `<option value="${value}" ${menuValue === value ? "selected" : ""}>${value === "선택" ? "?" : value}</option>`).join("")}
    </select>
  `;
}

function getTaskMarker(task) {
  if (task.status === "연기") return "postpone";
  if (task.status === "위임") return "delegate";
  if (task.status === "진행중") return "dot";
  if (task.done || task.status === "완료") return "check";
  return "empty";
}

function getTaskMarkerLabel(marker) {
  if (marker === "check") return "✓";
  if (marker === "dot") return "•";
  if (marker === "delegate") return "위임";
  if (marker === "postpone") return "연기";
  return "";
}

function cycleTaskMarker(task) {
  const marker = getTaskMarker(task);
  if (marker === "empty") {
    task.done = true;
    task.status = "완료";
    return;
  }
  if (marker === "check") {
    task.done = false;
    task.status = "진행중";
    return;
  }
  if (marker === "dot") {
    task.done = false;
    task.status = "위임";
    task.delegate ||= "";
    return;
  }
  if (marker === "delegate") {
    task.done = false;
    task.status = "연기";
    task.postponeMode ||= "";
    return;
  }
  task.done = false;
  task.status = "미완료";
  task.delegate = "";
  task.postponeMode = "";
}

function getPriorityMenuValue(task, priority) {
  if (task.status === "취소" || task.status === "연기") return task.status;
  if (task.priorityUnset) return "선택";
  return ["A", "B", "C"].includes(priority) ? priority : "선택";
}

function shouldStrikeTask(task) {
  return task.done || ["완료", "위임", "취소", "연기"].includes(task.status);
}

function handlePriorityMenuChange(task, fromPriority, index, value) {
  if (value === "취소" || value === "연기") {
    task.status = value;
    task.done = false;
    saveState({ fastSave: true });
    renderAll();
    return;
  }
  task.status = task.status === "취소" || task.status === "연기" ? "미완료" : task.status;
  task.done = task.status === "완료";
  if (["A", "B", "C"].includes(value)) {
    task.priorityUnset = false;
    moveTaskPriority(fromPriority, index, value);
    return;
  }
  task.priorityUnset = true;
  saveState({ fastSave: true });
  renderAll();
}

function moveTaskPriority(fromPriority, index, toPriority) {
  if (fromPriority === toPriority) {
    saveState({ fastSave: true });
    renderAll();
    return;
  }
  const day = ensureDay();
  const [task] = day.tasks[fromPriority].splice(index, 1);
  if (!task) return;
  day.tasks[toPriority].push(task);
  saveState({ fastSave: true });
  renderAll();
}

function deleteTask(priority, index) {
  const day = ensureDay();
  const task = day.tasks?.[priority]?.[index];
  if (!task) return;
  if (!confirmDelete("이 우선업무를 삭제할까요? 반복업무라면 오늘 이후 자동 생성도 함께 조정됩니다.")) return;
  if (task.repeatId) {
    day.deletedRepeatIds ||= [];
    if (!day.deletedRepeatIds.includes(task.repeatId)) day.deletedRepeatIds.push(task.repeatId);
  }
  day.tasks[priority].splice(index, 1);
  saveState({ fastSave: true });
  renderAll();
}

function schedulePostponedTask(task, priority, targetDate) {
  if (!targetDate || Number.isNaN(parseDate(targetDate).getTime())) return;
  task.postponeDate = targetDate;
  task.postponeId ||= `postpone-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  task.carryoverDeletedFrom = targetDate;
  const targetDay = ensureDay(targetDate);
  const targetPriority = ["A", "B", "C"].includes(priority) ? priority : "A";
  removePostponedTaskOccurrence(task.postponeId, targetDate);
  let existingTask = null;
  let existingPriority = "";
  priorities.some(([candidate]) => {
    existingTask = targetDay.tasks[candidate].find((item) => item.postponedFrom === task.postponeId);
    existingPriority = existingTask ? candidate : "";
    return Boolean(existingTask);
  });
  if (!existingTask && task.text?.trim()) {
    existingTask = {
      text: task.text.trim(),
      status: "미완료",
      done: false,
      priorityUnset: false,
      postponedFrom: task.postponeId,
      postponedSourceDate: iso(selectedDate),
      originalPriority: targetPriority,
    };
    targetDay.tasks[targetPriority].push(existingTask);
  } else if (existingTask) {
    existingTask.text = task.text.trim();
    existingTask.status = "미완료";
    existingTask.done = false;
    existingTask.priorityUnset = false;
    existingTask.originalPriority = targetPriority;
    if (existingPriority && existingPriority !== targetPriority) {
      targetDay.tasks[existingPriority] = targetDay.tasks[existingPriority].filter((item) => item !== existingTask);
      targetDay.tasks[targetPriority].push(existingTask);
    }
  }
  saveState({ fastSave: true });
  renderAll();
}

function removePostponedTaskOccurrence(postponeId, keepDate = "") {
  if (!postponeId) return;
  Object.entries(state.days || {}).forEach(([key, day]) => {
    if (key === keepDate) return;
    normalizeDayTasks(day);
    priorities.forEach(([priority]) => {
      day.tasks[priority] = day.tasks[priority].filter((item) => item.postponedFrom !== postponeId);
    });
  });
}

function findTaskSource(taskRef) {
  const day = state.days[taskRef.date];
  if (!day) return null;
  normalizeDayTasks(day);
  if (taskRef.id) {
    for (const [priority] of priorities) {
      const index = day.tasks[priority].findIndex((task) => task.id === taskRef.id);
      if (index >= 0) return { day, task: day.tasks[priority][index], priority, index };
    }
  }
  const fallback = day.tasks?.[taskRef.priority]?.[taskRef.index];
  if (!fallback) return null;
  normalizeTask(fallback);
  return { day, task: fallback, priority: taskRef.priority, index: taskRef.index };
}

function moveTaskSourcePriority(taskRef, toPriority) {
  if (!["A", "B", "C"].includes(toPriority)) return null;
  const source = findTaskSource(taskRef);
  if (!source) return null;
  source.task.priorityUnset = false;
  if (source.priority === toPriority) return source;
  const fromList = source.day.tasks[source.priority];
  const index = fromList.indexOf(source.task);
  if (index < 0) return null;
  const [task] = fromList.splice(index, 1);
  source.day.tasks[toPriority].push(task);
  return {
    day: source.day,
    task,
    priority: toPriority,
    index: source.day.tasks[toPriority].length - 1,
  };
}

function carryoverForkKey(taskRef, source) {
  return source.task.id || `${taskRef.date}-${source.priority}-${source.index}`;
}

function materializeCarryoverTask(taskRef) {
  const selectedKey = iso(selectedDate);
  const source = findTaskSource(taskRef);
  if (!source) return null;
  if (taskRef.date === selectedKey) return source;
  const day = ensureDay(selectedKey);
  const forkKey = carryoverForkKey(taskRef, source);
  let targetPriority = source.priority;
  let targetTask = null;
  priorities.some(([priority]) => {
    targetTask = day.tasks[priority].find((task) => task.carryoverForkFrom === forkKey);
    targetPriority = targetTask ? priority : targetPriority;
    return Boolean(targetTask);
  });
  if (!targetTask) {
    targetTask = {
      ...source.task,
      id: newTaskId(),
      done: false,
      carryoverDoneDate: "",
      carryoverDeletedFrom: "",
      carryoverForkFrom: forkKey,
      carryoverSourceDate: taskRef.date,
      repeatSourceDate: source.task.repeatSourceDate || taskRef.date,
    };
    day.tasks[targetPriority].push(targetTask);
    targetPriority = source.priority;
  }
  source.task.carryoverDeletedFrom = selectedKey;
  return {
    day,
    task: targetTask,
    priority: targetPriority,
    index: day.tasks[targetPriority].indexOf(targetTask),
  };
}

function renderCarryoverTask(task) {
  const row = document.createElement("div");
  const selectedKey = iso(selectedDate);
  const completedHere = isCarryoverCompletedOn(task, selectedKey);
  const marker = completedHere ? "check" : getTaskMarker(task);
  const priority = ["A", "B", "C"].includes(task.priority) ? task.priority : "A";
  const menuValue = getPriorityMenuValue(task, priority);
  const statusControl = getTaskStatusControl(task, menuValue);
  row.className = `task-row carryover-row priority-${menuValue === "A" ? "a" : "none"} marker-${marker} ${completedHere ? "done" : ""}`;
  row.innerHTML = `
    <button class="task-cycle" type="button" aria-label="이월업무 완료 상태 변경">${getTaskMarkerLabel(marker)}</button>
    <div class="task-status-cell" data-status="${escapeAttr(getTaskStatusLabel(task, menuValue))}">${getTaskStatusDisplay(task, menuValue)}${statusControl}</div>
    <input class="task-text-input" type="text" value="${escapeAttr(task.text)}" />
    <button class="task-delete" type="button" aria-label="이월 우선업무 삭제">×</button>
  `;
  const prioritySelect = row.querySelector(".priority-select");
  const delegateInput = row.querySelector(".delegate-input");
  const postponeSelect = row.querySelector(".postpone-select");
  const postponeDate = row.querySelector(".postpone-date");
  row.querySelector(".task-cycle").onclick = () => {
    updateCarryoverTaskMarker(task);
  };
  if (prioritySelect) {
    let handledValue = "";
    const applyPrioritySelection = () => {
      if (handledValue === prioritySelect.value) return;
      handledValue = prioritySelect.value;
      updateCarryoverTaskPriority(task, prioritySelect.value);
    };
    prioritySelect.oninput = applyPrioritySelection;
    prioritySelect.onchange = applyPrioritySelection;
  }
  if (delegateInput) {
    delegateInput.oninput = () => updateCarryoverDelegate(task, delegateInput.value);
  }
  if (postponeSelect) {
    postponeSelect.onchange = () => updateCarryoverPostponeMode(task, postponeSelect.value);
  }
  if (postponeDate) {
    postponeDate.onchange = () => scheduleCarryoverPostponedTask(task, postponeDate.value);
  }
  const textInput = row.querySelector(".task-text-input");
  bindDailyTaskTextInput(textInput);
  textInput.oninput = (event) => {
    dailyTextEditingActive = true;
    markDailyFieldEditing(10 * 60 * 1000);
    updateCarryoverTaskText(task, event.target.value);
  };
  row.querySelector(".task-delete").onclick = () => deleteCarryoverTask(task);
  return row;
}

function deleteCarryoverTask(taskRef) {
  const source = findTaskSource(taskRef);
  if (!source) return;
  if (!confirmDelete("이월된 우선업무를 삭제할까요? 원래 날짜의 기록은 유지되고 오늘 이후 이월에서 제외됩니다.")) return;
  if (source.task.repeatId) {
    const selectedKey = iso(selectedDate);
    const day = ensureDay(selectedKey);
    day.deletedRepeatIds ||= [];
    if (!day.deletedRepeatIds.includes(source.task.repeatId)) day.deletedRepeatIds.push(source.task.repeatId);
  }
  source.task.carryoverDeletedFrom = iso(selectedDate);
  saveState({ fastSave: true });
  renderAll();
}

function updateCarryoverTaskMarker(taskRef) {
  const sourceRef = findTaskSource(taskRef);
  const source = sourceRef?.task;
  if (!source) return;
  const completedKey = iso(selectedDate);
  if (isCarryoverCompletedOn(source, completedKey)) {
    delete source.carryoverDoneDate;
  } else {
    source.carryoverDoneDate = completedKey;
  }
  source.done = false;
  if (source.status === "완료") source.status = "미완료";
  saveState({ fastSave: true });
  renderAll();
}

function updateCarryoverTaskPriority(taskRef, value) {
  const source = materializeCarryoverTask(taskRef);
  if (!source) return;
  if (value === "취소" || value === "연기") {
    source.task.status = value;
    source.task.done = false;
    saveState({ fastSave: true });
    renderAll();
    return;
  }
  source.task.status = source.task.status === "취소" || source.task.status === "연기" ? "미완료" : source.task.status;
  source.task.done = source.task.status === "완료";
  if (["A", "B", "C"].includes(value)) {
    source.task.priorityUnset = false;
    if (source.priority !== value) {
      source.day.tasks[source.priority] = source.day.tasks[source.priority].filter((task) => task !== source.task);
      source.day.tasks[value].push(source.task);
    }
    saveState({ fastSave: true });
    renderAll();
    return;
  }
  source.task.priorityUnset = true;
  saveState({ fastSave: true });
  renderAll();
}

function updateCarryoverDelegate(taskRef, value) {
  const source = materializeCarryoverTask(taskRef)?.task;
  if (!source) return;
  source.delegate = value;
  saveState({ fastSave: true });
}

function updateCarryoverPostponeMode(taskRef, value) {
  const source = materializeCarryoverTask(taskRef)?.task;
  if (!source) return;
  source.postponeMode = value;
  saveState({ fastSave: true });
  renderAll();
}

function scheduleCarryoverPostponedTask(taskRef, targetDate) {
  const source = materializeCarryoverTask(taskRef);
  if (!source) return;
  schedulePostponedTask(source.task, source.priority, targetDate);
}

function updateCarryoverTaskText(taskRef, value) {
  const source = materializeCarryoverTask(taskRef)?.task;
  if (!source) return;
  source.text = value;
  saveState({ fastSave: true });
}

function formatCarryoverDate(value) {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function renderAppointments(day) {
  const node = el("appointmentList");
  node.innerHTML = "";
  const slots = getScheduleSlotsForDay(day);
  ensureAppointmentSlots(day, day.scheduleUnit);
  slots.forEach((slot, slotIndex) => {
    if (isCoveredAppointmentSlot(day, slot, slots)) return;
    const span = getAppointmentSpan(day, slot);
    const endSlot = getAppointmentEndLabel(slotIndex, span, slots);
    const row = document.createElement("div");
    const value = day.appointments[slot] || "";
    const isCurrent = isCurrentAppointmentSlot(slotIndex, span, slots);
    const currentSegment = span > 1 && isCurrent ? getCurrentAppointmentSegmentLabel(slotIndex, span, slots) : "";
    row.className = `appointment-row ${value ? "is-filled" : ""} ${span > 1 ? "is-merged" : ""} ${isCurrent ? "is-current-time" : ""}`;
    row.style.setProperty("--slot-span", span);
    const nextIndex = slotIndex + span;
    const canMerge = nextIndex < slots.length;
    row.innerHTML = `
      <span class="appointment-time ${span > 1 ? "range" : ""}">${span > 1 ? `<b>${slot}</b>${currentSegment ? `<em class="appointment-current-segment">${currentSegment}</em>` : ""}<b>${endSlot}</b>` : slot}${isCurrent && !currentSegment ? `<em>지금</em>` : ""}</span>
      <input type="text" value="${escapeAttr(value)}" placeholder="일정" />
      ${span > 1 ? `<button class="split-appointment" type="button" title="분리">-</button>` : ""}
      ${canMerge ? `<button class="appointment-merge-button" type="button" title="아래 시간칸과 합치기">+</button>` : ""}
    `;
    const input = row.querySelector("input");
    let valueBeforeEdit = value;
    input.onfocus = () => {
      valueBeforeEdit = day.appointments[slot] || "";
    };
    input.oninput = (event) => {
      const nextValue = event.target.value;
      if (!nextValue.trim() && valueBeforeEdit.trim()) {
        row.classList.remove("is-filled");
        return;
      }
      day.appointments[slot] = nextValue;
      saveState();
      row.classList.toggle("is-filled", Boolean(nextValue.trim()));
      renderSidebar();
    };
    input.onblur = () => {
      const nextValue = input.value;
      if (!nextValue.trim() && valueBeforeEdit.trim()) {
        if (!confirmDelete(`${slot} 일정 '${valueBeforeEdit}'을 삭제할까요?`)) {
          input.value = valueBeforeEdit;
          day.appointments[slot] = valueBeforeEdit;
          row.classList.add("is-filled");
          renderSidebar();
          return;
        }
        day.appointments[slot] = "";
        saveState();
        row.classList.remove("is-filled");
        renderSidebar();
        valueBeforeEdit = "";
      }
    };
    row.querySelector(".split-appointment")?.addEventListener("click", () => {
      delete day.appointmentMerges[slot];
      saveState();
      renderAppointments(day);
    });
    row.querySelector(".appointment-merge-button")?.addEventListener("click", () => mergeAppointmentSlot(day, slot));
    node.appendChild(row);
  });
}

function isCurrentAppointmentSlot(slotIndex, span, slots = timeSlots) {
  if (iso(selectedDate) !== iso(todayInPlanner())) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = slotToMinutes(slots[slotIndex] || slots[0] || "00:00");
  const end = start + span * getScheduleSlotIntervalMinutes(slots);
  return currentMinutes >= start && currentMinutes < end;
}

function getCurrentAppointmentSegmentLabel(slotIndex, span, slots = timeSlots) {
  if (iso(selectedDate) !== iso(todayInPlanner())) return "";
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = slotToMinutes(slots[slotIndex] || slots[0] || "00:00");
  const end = start + span * getScheduleSlotIntervalMinutes(slots);
  if (currentMinutes < start || currentMinutes >= end) return "";
  const segmentStart = Math.max(start, Math.floor(currentMinutes / 30) * 30);
  const segmentEnd = Math.min(end, segmentStart + 30);
  return `${minutesToTimeLabel(segmentStart)}-${minutesToTimeLabel(segmentEnd)}`;
}

function minutesToTimeLabel(minutes) {
  if (minutes >= 1440) return "24:00";
  const normalized = Math.max(0, minutes);
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function getAppointmentSpan(day, slot) {
  return Math.max(1, Number(day.appointmentMerges?.[slot] || 1));
}

function isCoveredAppointmentSlot(day, slot, slots = getScheduleSlotsForDay(day)) {
  const index = slots.indexOf(slot);
  return slots.some((start, startIndex) => {
    if (start === slot || startIndex >= index) return false;
    const span = getAppointmentSpan(day, start);
    return startIndex + span > index;
  });
}

function getAppointmentEndLabel(slotIndex, span, slots = timeSlots) {
  const start = slotToMinutes(slots[slotIndex] || slots[0] || "08:00");
  const minutes = start + span * getScheduleSlotIntervalMinutes(slots);
  return minutesToTimeLabel(minutes);
}

function getScheduleSlotIntervalMinutes(slots = timeSlots) {
  if (slots.length < 2) return 30;
  return Math.max(30, slotToMinutes(slots[1]) - slotToMinutes(slots[0]));
}

function mergeAppointmentSlot(day, slot) {
  const slots = getScheduleSlotsForDay(day);
  const startIndex = slots.indexOf(slot);
  if (startIndex < 0) return;
  const span = getAppointmentSpan(day, slot);
  const nextIndex = startIndex + span;
  if (nextIndex >= slots.length) return;
  const nextSlot = slots[nextIndex];
  const nextSpan = getAppointmentSpan(day, nextSlot);
  const currentText = day.appointments[slot] || "";
  const nextText = day.appointments[nextSlot] || "";
  if (nextText && !currentText) day.appointments[slot] = nextText;
  if (nextText && currentText) day.appointments[slot] = `${currentText} ${nextText}`;
  day.appointments[nextSlot] = "";
  day.appointmentMerges[slot] = span + nextSpan;
  delete day.appointmentMerges[nextSlot];
  saveState();
  renderAppointments(day);
}

function mergeAppointmentRange(day, range) {
  const slots = getScheduleSlotsForDay(day);
  const isHourly = normalizeScheduleUnit(day.scheduleUnit) === "60";
  const ranges = isHourly
    ? { all: [0, slots.length], am: [0, 12], pm: [12, 12] }
    : { all: [0, slots.length], am: [0, 8], pm: [8, slots.length - 8] };
  const [startIndex, span] = ranges[range] || ranges.all;
  const startSlot = slots[startIndex];
  const covered = slots.slice(startIndex, startIndex + span);
  const mergedText = covered.map((slot) => day.appointments[slot]).filter(Boolean).join(" ");
  covered.forEach((slot) => {
    if (slot !== startSlot) {
      day.appointments[slot] = "";
      delete day.appointmentMerges[slot];
    }
  });
  if (mergedText) day.appointments[startSlot] = mergedText;
  day.appointmentMerges[startSlot] = span;
  saveState();
  renderAppointments(day);
}

function renderNotes() {
  state.finance ||= createFinanceState();
  normalizeFinanceState(state.finance);
  if (!state.finance.months[selectedFinanceMonth]) selectedFinanceMonth = monthKey(selectedDate);
  renderFinanceMonthNav();
  renderFinanceYearRows();
  renderMoneyRows(el("fixedMoneyRows"), state.finance.fixed, { fixed: true });
  document.querySelectorAll("[data-finance-field]").forEach((field) => {
    field.value = state.finance[field.dataset.financeField] || "";
    field.oninput = () => {
      state.finance[field.dataset.financeField] = field.value;
      saveState();
    };
  });
  renderFinanceSummary();
}

function getCurrentSheet() {
  state.customSheets ||= createCustomSheetsState();
  normalizeCustomSheetsState(state.customSheets);
  let sheet = state.customSheets.items.find((item) => item.id === selectedSheetId);
  if (!sheet) sheet = state.customSheets.items.find((item) => item.id === state.customSheets.activeId) || state.customSheets.items[0];
  selectedSheetId = sheet.id;
  state.customSheets.activeId = sheet.id;
  selectedSheetCell = clampSheetCellReference(selectedSheetCell, sheet);
  if (selectedSheetHeader?.axis === "column" && selectedSheetHeader.index >= sheet.columns) selectedSheetHeader = null;
  if (selectedSheetHeader?.axis === "row" && selectedSheetHeader.index >= sheet.rows) selectedSheetHeader = null;
  return sheet;
}

function renderSheets() {
  const sheet = getCurrentSheet();
  renderSheetList(sheet);
  const board = el("sheetBoard");
  if (board) {
    board.className = `sheet-board ${sheetDetailOpen && !sheetSlideOpening ? "is-detail-open" : ""}`;
    if (sheetDetailOpen && sheetSlideOpening) {
      window.requestAnimationFrame(() => {
        board.classList.add("is-detail-open");
        sheetSlideOpening = false;
      });
    }
  }
  el("sheetNameInput").value = sheet.name;
  el("deleteSheetButton").disabled = state.customSheets.items.length <= 1;
  el("removeSheetRowButton").disabled = sheet.rows <= SHEET_MIN_ROWS;
  el("removeSheetColumnButton").disabled = sheet.columns <= SHEET_MIN_COLUMNS;
  el("addSheetRowButton").disabled = sheet.rows >= SHEET_MAX_ROWS;
  el("addSheetColumnButton").disabled = sheet.columns >= SHEET_MAX_COLUMNS;
  el("sheetSizeStatus").textContent = `${sheet.rows}행 × ${sheet.columns}열`;
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
}

function renderSheetList(activeSheet) {
  const node = el("sheetList");
  const count = el("sheetListCount");
  if (!node) return;
  if (count) count.textContent = String(state.customSheets.items.length);
  node.innerHTML = "";
  state.customSheets.items.forEach((sheet, index) => {
    const stats = getSheetListStats(sheet);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.sheetId = sheet.id;
    button.className = `sheet-list-item ${sheet.id === activeSheet.id ? "is-active" : ""}`;
    button.innerHTML = `
      <span class="sheet-list-title">${index + 1}. ${escapeHtml(sheet.name)}</span>
      <span class="sheet-list-meta">
        <b>${sheet.rows}행 × ${sheet.columns}열</b>
        <span>입력 ${stats.filled}칸</span>
        <span>수식 ${stats.formulas}</span>
      </span>
      <small>${escapeHtml(stats.preview || "시트를 열어 필요한 양식을 만드세요")}</small>
    `;
    button.onclick = () => {
      if (sheetSwipeSuppressClick) return;
      selectCustomSheet(sheet.id, { openDetail: true });
    };
    node.appendChild(button);
  });
}

function getSheetListStats(sheet) {
  const entries = Object.entries(sheet.cells || {}).filter(([, value]) => String(value || "").trim());
  const formulas = entries.filter(([, value]) => String(value).trim().startsWith("=")).length;
  const preview = entries
    .slice(0, 4)
    .map(([reference, value]) => `${reference} ${String(value).trim()}`)
    .join(" · ");
  return { filled: entries.length, formulas, preview };
}

function addCustomSheet(template = "blank") {
  const templateNames = {
    blank: "새 시트",
    checklist: "체크리스트",
    finance: "자금 체크표",
    projectAction: "프로젝트 실행표",
    meeting: "회의 기록표",
    goalTracker: "목표 추적표",
    client: "고객 관리표",
    profitSim: "손익 시뮬레이션",
  };
  const count = state.customSheets.items.length + 1;
  const sheet = createCustomSheet(`${templateNames[template] || "새 시트"} ${count}`, template);
  state.customSheets.items.push(sheet);
  selectCustomSheet(sheet.id, { openDetail: true });
  window.requestAnimationFrame(() => el("sheetNameInput")?.focus());
}

function selectCustomSheet(sheetId, options = {}) {
  if (!state.customSheets.items.some((sheet) => sheet.id === sheetId)) return;
  selectedSheetId = sheetId;
  selectedSheetCell = "A1";
  selectedSheetHeader = null;
  state.customSheets.activeId = sheetId;
  if (options.openDetail) {
    sheetSlideOpening = !sheetDetailOpen;
    sheetDetailOpen = true;
  }
  saveState();
  renderSheets();
}

function closeSheetDetail() {
  const board = el("sheetBoard");
  if (board?.classList.contains("is-detail-open")) {
    board.classList.remove("is-detail-open");
    window.setTimeout(() => {
      sheetDetailOpen = false;
      renderSheets();
    }, 320);
    return;
  }
  sheetDetailOpen = false;
  renderSheets();
}

function setupSheetPageSwipe() {
  const listPage = document.querySelector(".sheet-list-panel");
  const detailPage = document.querySelector(".sheet-detail-panel");
  const bind = (node, page) => {
    if (!node || node.dataset.sheetSwipeReady) return;
    node.dataset.sheetSwipeReady = "true";
    let startX = 0;
    let startY = 0;
    let lastSwipeAt = 0;
    const markStart = (x, y) => {
      startX = x;
      startY = y;
    };
    const finishSwipe = (x, y) => {
      const dx = x - startX;
      const dy = y - startY;
      if (Math.abs(dx) < 58 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      const now = Date.now();
      if (now - lastSwipeAt < 280) return;
      lastSwipeAt = now;
      if (page === "list" && dx < 0 && state.customSheets.items.length) {
        sheetSlideOpening = !sheetDetailOpen;
        sheetDetailOpen = true;
        sheetSwipeSuppressClick = true;
        renderSheets();
        window.setTimeout(() => {
          sheetSwipeSuppressClick = false;
        }, 260);
      }
      if (page === "detail" && dx > 0) {
        closeSheetDetail();
      }
    };
    node.addEventListener("pointerdown", (event) => {
      markStart(event.clientX, event.clientY);
    }, { passive: true });
    node.addEventListener("pointerup", (event) => finishSwipe(event.clientX, event.clientY), { passive: true });
    node.addEventListener("touchstart", (event) => {
      const touch = event.touches?.[0];
      if (touch) markStart(touch.clientX, touch.clientY);
    }, { passive: true });
    node.addEventListener("touchend", (event) => {
      const touch = event.changedTouches?.[0];
      if (touch) finishSwipe(touch.clientX, touch.clientY);
    }, { passive: true });
  };
  bind(listPage, "list");
  bind(detailPage, "detail");
}

function renameCurrentSheet(value) {
  const sheet = getCurrentSheet();
  sheet.name = String(value || "").slice(0, 40) || "이름 없는 시트";
  renderSheetList(sheet);
  saveState();
}

function duplicateCurrentSheet() {
  const source = getCurrentSheet();
  const copy = JSON.parse(JSON.stringify(source));
  copy.id = `sheet-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  copy.name = `${source.name} 복사본`.slice(0, 40);
  state.customSheets.items.push(copy);
  selectCustomSheet(copy.id);
}

function deleteCurrentSheet() {
  if (state.customSheets.items.length <= 1) return;
  const sheet = getCurrentSheet();
  if (!confirmDelete(`'${sheet.name}' 시트를 삭제할까요? 이 시트의 모든 셀 내용이 사라집니다.`)) return;
  const index = state.customSheets.items.findIndex((item) => item.id === sheet.id);
  state.customSheets.items.splice(index, 1);
  const next = state.customSheets.items[Math.max(0, index - 1)] || state.customSheets.items[0];
  selectedSheetId = next.id;
  selectedSheetCell = "A1";
  state.customSheets.activeId = next.id;
  saveState();
  renderSheets();
}

function resizeCurrentSheet(axis, delta) {
  const sheet = getCurrentSheet();
  if (delta < 0) {
    const label = axis === "row" ? "마지막 행" : "마지막 열";
    if (!confirmDelete(`${label}을 삭제할까요? 해당 영역의 셀 내용도 함께 삭제될 수 있습니다.`)) return;
  }
  if (axis === "row") sheet.rows = Math.max(SHEET_MIN_ROWS, Math.min(SHEET_MAX_ROWS, sheet.rows + delta));
  if (axis === "column") sheet.columns = Math.max(SHEET_MIN_COLUMNS, Math.min(SHEET_MAX_COLUMNS, sheet.columns + delta));
  sheet.columnWidths = normalizeSheetSizes(sheet.columnWidths, sheet.columns, SHEET_DEFAULT_COLUMN_WIDTH, SHEET_MIN_COLUMN_WIDTH, SHEET_MAX_COLUMN_WIDTH);
  sheet.rowHeights = normalizeSheetSizes(sheet.rowHeights, sheet.rows, SHEET_DEFAULT_ROW_HEIGHT, SHEET_MIN_ROW_HEIGHT, SHEET_MAX_ROW_HEIGHT);
  pruneSheetOutsideBounds(sheet);
  selectedSheetCell = clampSheetCellReference(selectedSheetCell, sheet);
  if (selectedSheetHeader?.axis === "column" && selectedSheetHeader.index >= sheet.columns) selectedSheetHeader = null;
  if (selectedSheetHeader?.axis === "row" && selectedSheetHeader.index >= sheet.rows) selectedSheetHeader = null;
  saveState();
  renderSheets();
}

function pruneSheetOutsideBounds(sheet) {
  [...Object.keys(sheet.cells), ...Object.keys(sheet.formats)].forEach((reference) => {
    const position = parseSheetCellReference(reference);
    if (!position || position.row >= sheet.rows || position.column >= sheet.columns) {
      delete sheet.cells[reference];
      delete sheet.formats[reference];
    }
  });
}

function renderSheetGrid(sheet) {
  const table = el("customSheetGrid");
  table.className = [
    "custom-sheet-grid",
    sheet.titleRows ? "has-title-row" : "",
    sheet.titleColumns ? "has-title-column" : "",
  ].filter(Boolean).join(" ");
  const colgroup = `
    <col class="sheet-row-header-col" style="width: var(--sheet-row-header-width, 42px)" />
    ${Array.from({ length: sheet.columns }, (_, column) => `<col data-sheet-col-index="${column}" style="width: ${getSheetColumnWidth(sheet, column)}px" />`).join("")}
  `;
  const header = Array.from(
    { length: sheet.columns },
    (_, column) => `
      <th scope="col" data-sheet-column="${column}" class="${selectedSheetHeader?.axis === "column" && selectedSheetHeader.index === column ? "is-header-selected" : ""}">
        <span>${sheetColumnLabel(column)}</span>
        <button class="sheet-column-resize" type="button" aria-label="${sheetColumnLabel(column)} 열 폭 조절"></button>
      </th>
    `,
  ).join("");
  const body = Array.from({ length: sheet.rows }, (_, row) => {
    const cells = Array.from({ length: sheet.columns }, (_, column) => renderSheetCellMarkup(sheet, row, column)).join("");
    return `
      <tr data-sheet-row-index="${row}" style="height: ${getSheetRowHeight(sheet, row)}px">
        <th class="sheet-row-number ${selectedSheetHeader?.axis === "row" && selectedSheetHeader.index === row ? "is-header-selected" : ""}" scope="row" data-sheet-row="${row}">
          <span>${row + 1}</span>
          <button class="sheet-row-resize" type="button" aria-label="${row + 1}행 높이 조절"></button>
        </th>
        ${cells}
      </tr>
    `;
  }).join("");
  table.innerHTML = `
    <colgroup>${colgroup}</colgroup>
    <thead>
      <tr>
        <th class="sheet-corner" aria-label="전체 시트">
          <button class="sheet-all-resize" type="button" aria-label="전체 셀 폭과 높이 조절"></button>
        </th>
        ${header}
      </tr>
    </thead>
    <tbody>${body}</tbody>
  `;
  table.querySelectorAll("[data-sheet-cell]").forEach((cell) => bindSheetCell(cell, sheet));
  bindSheetResizeHandles(table, sheet);
}

function renderSheetCellMarkup(sheet, row, column) {
  const reference = `${sheetColumnLabel(column)}${row + 1}`;
  const raw = String(sheet.cells[reference] ?? "");
  const format = getSheetCellFormat(sheet, reference);
  const classes = [
    "sheet-cell",
    row < (sheet.titleRows || 0) ? "is-title-row" : "",
    column < (sheet.titleColumns || 0) ? "is-title-column" : "",
    `fill-${format.fill}`,
    `align-${format.align}`,
    format.bold ? "is-bold" : "",
    selectedSheetCell === reference ? "is-selected" : "",
  ].filter(Boolean).join(" ");
  if (format.type === "checkbox") {
    const checked = raw === "TRUE" || raw === "1";
    return `<td class="${classes}" data-sheet-cell="${reference}"><input class="sheet-cell-checkbox" type="checkbox" aria-label="${reference}" ${checked ? "checked" : ""} /></td>`;
  }
  const display = formatSheetCellDisplay(sheet, reference);
  return `<td class="${classes}" data-sheet-cell="${reference}"><input class="sheet-cell-input" type="text" aria-label="${reference}" value="${escapeAttr(display)}" title="${escapeAttr(raw.startsWith("=") ? raw : "")}" /></td>`;
}

function getSheetColumnWidth(sheet, column) {
  return clampNumber(sheet.columnWidths?.[column], SHEET_MIN_COLUMN_WIDTH, SHEET_MAX_COLUMN_WIDTH, SHEET_DEFAULT_COLUMN_WIDTH);
}

function getSheetRowHeight(sheet, row) {
  return clampNumber(sheet.rowHeights?.[row], SHEET_MIN_ROW_HEIGHT, SHEET_MAX_ROW_HEIGHT, SHEET_DEFAULT_ROW_HEIGHT);
}

function setSheetColumnWidth(sheet, column, width) {
  sheet.columnWidths = normalizeSheetSizes(sheet.columnWidths, sheet.columns, SHEET_DEFAULT_COLUMN_WIDTH, SHEET_MIN_COLUMN_WIDTH, SHEET_MAX_COLUMN_WIDTH);
  sheet.columnWidths[column] = clampNumber(width, SHEET_MIN_COLUMN_WIDTH, SHEET_MAX_COLUMN_WIDTH, SHEET_DEFAULT_COLUMN_WIDTH);
}

function setSheetRowHeight(sheet, row, height) {
  sheet.rowHeights = normalizeSheetSizes(sheet.rowHeights, sheet.rows, SHEET_DEFAULT_ROW_HEIGHT, SHEET_MIN_ROW_HEIGHT, SHEET_MAX_ROW_HEIGHT);
  sheet.rowHeights[row] = clampNumber(height, SHEET_MIN_ROW_HEIGHT, SHEET_MAX_ROW_HEIGHT, SHEET_DEFAULT_ROW_HEIGHT);
}

function bindSheetResizeHandles(table, sheet) {
  table.querySelector(".sheet-all-resize")?.addEventListener("pointerdown", (event) => startSheetAllResize(event, table, sheet));
  table.querySelector(".sheet-all-resize")?.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    autoFitAllSheetCells(sheet);
  });
  table.querySelectorAll(".sheet-column-resize").forEach((handle) => {
    const column = Number(handle.closest("[data-sheet-column]")?.dataset.sheetColumn);
    handle.addEventListener("pointerdown", (event) => startSheetColumnResize(event, table, sheet, column));
    handle.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      autoFitSheetColumn(sheet, column);
    });
  });
  table.querySelectorAll(".sheet-row-resize").forEach((handle) => {
    const row = Number(handle.closest("[data-sheet-row]")?.dataset.sheetRow);
    handle.addEventListener("pointerdown", (event) => startSheetRowResize(event, table, sheet, row));
    handle.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      autoFitSheetRow(sheet, row);
    });
  });
  table.querySelectorAll("[data-sheet-column]").forEach((header) => {
    header.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".sheet-column-resize")) return;
      const column = Number(header.dataset.sheetColumn);
      if (!Number.isInteger(column)) return;
      if (!isNearSheetHeaderEdge(event, header, "column")) return;
      sheetHeaderResizeSuppressClick = true;
      startSheetColumnResize(event, table, sheet, column);
    });
    header.addEventListener("dblclick", (event) => {
      const column = Number(header.dataset.sheetColumn);
      if (!Number.isInteger(column) || !isNearSheetHeaderEdge(event, header, "column")) return;
      event.preventDefault();
      autoFitSheetColumn(sheet, column);
    });
    header.onclick = () => {
      if (sheetHeaderResizeSuppressClick) {
        sheetHeaderResizeSuppressClick = false;
        return;
      }
      const column = Number(header.dataset.sheetColumn);
      if (!Number.isInteger(column)) return;
      selectSheetHeader("column", column);
    };
  });
  table.querySelectorAll("[data-sheet-row]").forEach((header) => {
    header.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".sheet-row-resize")) return;
      const row = Number(header.dataset.sheetRow);
      if (!Number.isInteger(row)) return;
      if (!isNearSheetHeaderEdge(event, header, "row")) return;
      sheetHeaderResizeSuppressClick = true;
      startSheetRowResize(event, table, sheet, row);
    });
    header.addEventListener("dblclick", (event) => {
      const row = Number(header.dataset.sheetRow);
      if (!Number.isInteger(row) || !isNearSheetHeaderEdge(event, header, "row")) return;
      event.preventDefault();
      autoFitSheetRow(sheet, row);
    });
    header.onclick = () => {
      if (sheetHeaderResizeSuppressClick) {
        sheetHeaderResizeSuppressClick = false;
        return;
      }
      const row = Number(header.dataset.sheetRow);
      if (!Number.isInteger(row)) return;
      selectSheetHeader("row", row);
    };
  });
}

function isNearSheetHeaderEdge(event, header, axis) {
  const rect = header.getBoundingClientRect();
  const edgeSize = window.matchMedia("(pointer: coarse)").matches ? 18 : 10;
  if (axis === "column") return rect.right - event.clientX <= edgeSize;
  return rect.bottom - event.clientY <= edgeSize;
}

function startSheetColumnResize(event, table, sheet, column) {
  if (!Number.isInteger(column)) return;
  event.preventDefault();
  event.stopPropagation();
  document.body.classList.add("is-resizing-sheet-column");
  selectSheetHeader("column", column);
  const startX = event.clientX;
  const startWidth = getSheetColumnWidth(sheet, column);
  const col = table.querySelector(`col[data-sheet-col-index="${column}"]`);
  const move = (moveEvent) => {
    const width = Math.max(SHEET_MIN_COLUMN_WIDTH, Math.min(SHEET_MAX_COLUMN_WIDTH, startWidth + moveEvent.clientX - startX));
    setSheetColumnWidth(sheet, column, width);
    if (col) col.style.width = `${sheet.columnWidths[column]}px`;
  };
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    document.body.classList.remove("is-resizing-sheet-column");
    saveState({ fastSave: true });
    renderSheetList(sheet);
    window.setTimeout(() => {
      sheetHeaderResizeSuppressClick = false;
    }, 80);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
}

function startSheetRowResize(event, table, sheet, row) {
  if (!Number.isInteger(row)) return;
  event.preventDefault();
  event.stopPropagation();
  document.body.classList.add("is-resizing-sheet-row");
  selectSheetHeader("row", row);
  const startY = event.clientY;
  const startHeight = getSheetRowHeight(sheet, row);
  const tr = table.querySelector(`tr[data-sheet-row-index="${row}"]`);
  const move = (moveEvent) => {
    const height = Math.max(SHEET_MIN_ROW_HEIGHT, Math.min(SHEET_MAX_ROW_HEIGHT, startHeight + moveEvent.clientY - startY));
    setSheetRowHeight(sheet, row, height);
    if (tr) tr.style.height = `${sheet.rowHeights[row]}px`;
  };
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    document.body.classList.remove("is-resizing-sheet-row");
    saveState({ fastSave: true });
    renderSheetList(sheet);
    window.setTimeout(() => {
      sheetHeaderResizeSuppressClick = false;
    }, 80);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
}

function startSheetAllResize(event, table, sheet) {
  event.preventDefault();
  event.stopPropagation();
  document.body.classList.add("is-resizing-sheet-all");
  selectSheetCell("A1");
  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = getSheetColumnWidth(sheet, 0);
  const startHeight = getSheetRowHeight(sheet, 0);
  const move = (moveEvent) => {
    const width = Math.max(SHEET_MIN_COLUMN_WIDTH, Math.min(SHEET_MAX_COLUMN_WIDTH, startWidth + moveEvent.clientX - startX));
    const height = Math.max(SHEET_MIN_ROW_HEIGHT, Math.min(SHEET_MAX_ROW_HEIGHT, startHeight + moveEvent.clientY - startY));
    sheet.columnWidths = Array.from({ length: sheet.columns }, () => width);
    sheet.rowHeights = Array.from({ length: sheet.rows }, () => height);
    table.querySelectorAll("col[data-sheet-col-index]").forEach((col) => {
      col.style.width = `${width}px`;
    });
    table.querySelectorAll("tr[data-sheet-row-index]").forEach((row) => {
      row.style.height = `${height}px`;
    });
  };
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    document.body.classList.remove("is-resizing-sheet-all");
    saveState({ fastSave: true });
    renderSheetGrid(sheet);
    renderSelectedSheetCellControls(sheet);
    renderSheetList(sheet);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
}

function bindSheetCell(cell, sheet) {
  const reference = cell.dataset.sheetCell;
  const input = cell.querySelector("input");
  cell.onclick = () => selectSheetCell(reference);
  if (input.type === "checkbox") {
    input.onfocus = () => selectSheetCell(reference);
    input.onchange = () => {
      sheet.cells[reference] = input.checked ? "TRUE" : "";
      saveState();
      renderSelectedSheetCellControls(sheet);
    };
    return;
  }
  input.onfocus = () => {
    selectSheetCell(reference);
    input.value = String(sheet.cells[reference] ?? "");
    input.select();
  };
  input.oninput = () => {
    sheet.cells[reference] = input.value;
    el("sheetFormulaInput").value = input.value;
    saveState();
  };
  input.onblur = () => renderSheetGrid(sheet);
  input.onkeydown = (event) => {
    const moves = {
      Enter: [1, 0],
      Tab: [0, event.shiftKey ? -1 : 1],
      ArrowDown: [1, 0],
      ArrowUp: [-1, 0],
      ArrowRight: [0, 1],
      ArrowLeft: [0, -1],
    };
    if (!moves[event.key]) return;
    event.preventDefault();
    sheet.cells[reference] = input.value;
    saveState();
    moveSheetSelection(moves[event.key][0], moves[event.key][1], sheet);
  };
}

function selectSheetCell(reference, options = {}) {
  const sheet = getCurrentSheet();
  if (!options.keepHeader) selectedSheetHeader = null;
  selectedSheetCell = clampSheetCellReference(reference, sheet);
  el("customSheetGrid").querySelectorAll("[data-sheet-cell]").forEach((cell) => {
    cell.classList.toggle("is-selected", cell.dataset.sheetCell === selectedSheetCell);
  });
  updateSheetHeaderSelection();
  renderSelectedSheetCellControls(sheet);
}

function selectSheetHeader(axis, index) {
  const sheet = getCurrentSheet();
  const current = parseSheetCellReference(selectedSheetCell) || { row: 0, column: 0 };
  selectedSheetHeader = { axis, index };
  if (axis === "column") {
    selectedSheetCell = clampSheetCellReference(`${sheetColumnLabel(index)}${current.row + 1}`, sheet);
  } else {
    selectedSheetCell = clampSheetCellReference(`${sheetColumnLabel(current.column)}${index + 1}`, sheet);
  }
  el("customSheetGrid").querySelectorAll("[data-sheet-cell]").forEach((cell) => {
    cell.classList.toggle("is-selected", cell.dataset.sheetCell === selectedSheetCell);
  });
  updateSheetHeaderSelection();
  renderSelectedSheetCellControls(sheet);
}

function updateSheetHeaderSelection() {
  const table = el("customSheetGrid");
  if (!table) return;
  table.querySelectorAll("[data-sheet-column]").forEach((header) => {
    const column = Number(header.dataset.sheetColumn);
    header.classList.toggle("is-header-selected", selectedSheetHeader?.axis === "column" && selectedSheetHeader.index === column);
  });
  table.querySelectorAll("[data-sheet-row]").forEach((header) => {
    const row = Number(header.dataset.sheetRow);
    header.classList.toggle("is-header-selected", selectedSheetHeader?.axis === "row" && selectedSheetHeader.index === row);
  });
}

function moveSheetSelection(rowDelta, columnDelta, sheet = getCurrentSheet()) {
  const current = parseSheetCellReference(selectedSheetCell) || { row: 0, column: 0 };
  selectedSheetHeader = null;
  const row = Math.max(0, Math.min(sheet.rows - 1, current.row + rowDelta));
  const column = Math.max(0, Math.min(sheet.columns - 1, current.column + columnDelta));
  selectedSheetCell = `${sheetColumnLabel(column)}${row + 1}`;
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
  window.requestAnimationFrame(() => el("customSheetGrid").querySelector(`[data-sheet-cell="${selectedSheetCell}"] input`)?.focus());
}

function renderSelectedSheetCellControls(sheet) {
  const reference = clampSheetCellReference(selectedSheetCell, sheet);
  const position = parseSheetCellReference(reference) || { row: 0, column: 0 };
  const format = getSheetCellFormat(sheet, reference);
  el("sheetCellReference").textContent = reference;
  el("sheetFormulaInput").value = String(sheet.cells[reference] ?? "");
  el("sheetCellType").value = format.type;
  el("sheetCellAlign").value = format.align;
  el("sheetTitleRowButton").classList.toggle("is-active", Boolean(sheet.titleRows));
  el("sheetTitleColumnButton").classList.toggle("is-active", Boolean(sheet.titleColumns));
  el("sheetTitleRowButton").setAttribute("aria-pressed", String(Boolean(sheet.titleRows)));
  el("sheetTitleColumnButton").setAttribute("aria-pressed", String(Boolean(sheet.titleColumns)));
  el("sheetBoldButton").classList.toggle("is-active", format.bold);
  el("sheetBoldButton").setAttribute("aria-pressed", String(format.bold));
  document.querySelectorAll("[data-sheet-fill]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sheetFill === format.fill);
  });
}

function updateSelectedSheetColumnWidth(value) {
  const sheet = getCurrentSheet();
  const position = parseSheetCellReference(selectedSheetCell);
  if (!position) return;
  setSheetColumnWidth(sheet, position.column, value);
  saveState({ fastSave: true });
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
  renderSheetList(sheet);
}

function updateSelectedSheetRowHeight(value) {
  const sheet = getCurrentSheet();
  const position = parseSheetCellReference(selectedSheetCell);
  if (!position) return;
  setSheetRowHeight(sheet, position.row, value);
  saveState({ fastSave: true });
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
  renderSheetList(sheet);
}

function updateAllSheetColumnWidths(value) {
  const sheet = getCurrentSheet();
  const width = clampNumber(value, SHEET_MIN_COLUMN_WIDTH, SHEET_MAX_COLUMN_WIDTH, SHEET_DEFAULT_COLUMN_WIDTH);
  sheet.columnWidths = Array.from({ length: sheet.columns }, () => width);
  saveState({ fastSave: true });
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
  renderSheetList(sheet);
}

function updateAllSheetRowHeights(value) {
  const sheet = getCurrentSheet();
  const height = clampNumber(value, SHEET_MIN_ROW_HEIGHT, SHEET_MAX_ROW_HEIGHT, SHEET_DEFAULT_ROW_HEIGHT);
  sheet.rowHeights = Array.from({ length: sheet.rows }, () => height);
  saveState({ fastSave: true });
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
  renderSheetList(sheet);
}

function toggleSheetTitleAxis(axis) {
  const sheet = getCurrentSheet();
  if (axis === "row") sheet.titleRows = sheet.titleRows ? 0 : 1;
  if (axis === "column") sheet.titleColumns = sheet.titleColumns ? 0 : 1;
  saveState({ fastSave: true });
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
  renderSheetList(sheet);
}

function autoFitSelectedSheetCell() {
  const sheet = getCurrentSheet();
  const position = parseSheetCellReference(selectedSheetCell);
  if (!position) return;
  autoFitSheetColumn(sheet, position.column, { render: false });
  autoFitSheetRow(sheet, position.row, { render: false });
  saveState({ fastSave: true });
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
  renderSheetList(sheet);
}

function autoFitSheetColumn(sheet, column, options = {}) {
  if (!Number.isInteger(column)) return;
  const columnValues = Array.from({ length: sheet.rows }, (_, row) => String(sheet.cells[`${sheetColumnLabel(column)}${row + 1}`] || ""));
  const longestColumn = Math.max(sheetColumnLabel(column).length, ...columnValues.map((value) => value.length));
  setSheetColumnWidth(sheet, column, Math.min(SHEET_MAX_COLUMN_WIDTH, Math.max(SHEET_DEFAULT_COLUMN_WIDTH, longestColumn * 9 + 34)));
  if (options.render === false) return;
  saveState({ fastSave: true });
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
  renderSheetList(sheet);
}

function autoFitSheetRow(sheet, row, options = {}) {
  if (!Number.isInteger(row)) return;
  const rowValues = Array.from({ length: sheet.columns }, (_, column) => String(sheet.cells[`${sheetColumnLabel(column)}${row + 1}`] || ""));
  const longestRow = Math.max(...rowValues.map((value) => value.length), 1);
  setSheetRowHeight(sheet, row, Math.min(SHEET_MAX_ROW_HEIGHT, Math.max(SHEET_DEFAULT_ROW_HEIGHT, Math.ceil(longestRow / 22) * 18 + 22)));
  if (options.render === false) return;
  saveState({ fastSave: true });
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
  renderSheetList(sheet);
}

function autoFitAllSheetCells(sheet) {
  sheet.columnWidths = Array.from({ length: sheet.columns }, (_, column) => {
    const values = Array.from({ length: sheet.rows }, (_, row) => String(sheet.cells[`${sheetColumnLabel(column)}${row + 1}`] || ""));
    const longest = Math.max(sheetColumnLabel(column).length, ...values.map((value) => value.length));
    return Math.min(SHEET_MAX_COLUMN_WIDTH, Math.max(SHEET_DEFAULT_COLUMN_WIDTH, longest * 9 + 34));
  });
  sheet.rowHeights = Array.from({ length: sheet.rows }, (_, row) => {
    const values = Array.from({ length: sheet.columns }, (_, column) => String(sheet.cells[`${sheetColumnLabel(column)}${row + 1}`] || ""));
    const longest = Math.max(...values.map((value) => value.length), 1);
    return Math.min(SHEET_MAX_ROW_HEIGHT, Math.max(SHEET_DEFAULT_ROW_HEIGHT, Math.ceil(longest / 22) * 18 + 22));
  });
  saveState({ fastSave: true });
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
  renderSheetList(sheet);
}

function updateSelectedSheetCellValue(value) {
  const sheet = getCurrentSheet();
  sheet.cells[selectedSheetCell] = value;
  saveState();
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
}

function updateSelectedSheetCellFormat(field, value) {
  const sheet = getCurrentSheet();
  const valid = {
    type: sheetCellTypes,
    align: sheetAlignments,
    fill: sheetFills,
  };
  if (!valid[field]?.includes(value)) return;
  const format = { ...getSheetCellFormat(sheet, selectedSheetCell), [field]: value };
  sheet.formats[selectedSheetCell] = format;
  if (field === "type" && value === "checkbox" && !["TRUE", "1"].includes(String(sheet.cells[selectedSheetCell] || ""))) {
    sheet.cells[selectedSheetCell] = "";
  }
  saveState();
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
}

function toggleSelectedSheetCellBold() {
  const sheet = getCurrentSheet();
  const format = getSheetCellFormat(sheet, selectedSheetCell);
  sheet.formats[selectedSheetCell] = { ...format, bold: !format.bold };
  saveState();
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
}

function getSheetCellFormat(sheet, reference) {
  const stored = sheet.formats[reference] || {};
  return {
    type: sheetCellTypes.includes(stored.type) ? stored.type : "general",
    bold: Boolean(stored.bold),
    fill: sheetFills.includes(stored.fill) ? stored.fill : "none",
    align: sheetAlignments.includes(stored.align) ? stored.align : "left",
  };
}

function sheetColumnLabel(column) {
  return String.fromCharCode(65 + Math.max(0, column));
}

function sheetColumnIndex(label) {
  return String(label || "").toUpperCase().charCodeAt(0) - 65;
}

function parseSheetCellReference(reference) {
  const match = /^([A-L])([1-9]\d*)$/i.exec(String(reference || "").trim());
  if (!match) return null;
  return { column: sheetColumnIndex(match[1]), row: Number(match[2]) - 1 };
}

function clampSheetCellReference(reference, sheet) {
  const position = parseSheetCellReference(reference) || { row: 0, column: 0 };
  const row = Math.max(0, Math.min(sheet.rows - 1, position.row));
  const column = Math.max(0, Math.min(sheet.columns - 1, position.column));
  return `${sheetColumnLabel(column)}${row + 1}`;
}

function formatSheetCellDisplay(sheet, reference) {
  const raw = String(sheet.cells[reference] ?? "");
  const format = getSheetCellFormat(sheet, reference);
  let value = raw;
  if (raw.startsWith("=")) {
    const result = evaluateSheetFormula(sheet, raw, new Set([reference]));
    value = Number.isFinite(result) ? result : "#오류";
  }
  if (value === "" || value === null || value === undefined) return "";
  if (value === "#오류") return value;
  if (format.type === "currency") {
    const number = parseSheetNumber(value);
    return Number.isFinite(number) ? `${new Intl.NumberFormat("ko-KR").format(number)}원` : String(value);
  }
  if (format.type === "number" || (raw.startsWith("=") && typeof value === "number")) {
    const number = parseSheetNumber(value);
    return Number.isFinite(number) ? new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 }).format(number) : String(value);
  }
  return String(value);
}

function evaluateSheetFormula(sheet, rawFormula, trail = new Set()) {
  let expression = String(rawFormula || "").trim().replace(/^=/, "");
  if (!expression) return Number.NaN;
  expression = expression.replace(/\b(SUM|AVERAGE|MIN|MAX)\s*\(\s*([A-L][1-9]\d*)\s*:\s*([A-L][1-9]\d*)\s*\)/gi, (_, operation, start, end) => {
    const values = sheetRangeReferences(start, end).map((reference) => getSheetCellNumericValue(sheet, reference, trail)).filter(Number.isFinite);
    if (!values.length) return "0";
    if (operation.toUpperCase() === "SUM") return String(values.reduce((sum, value) => sum + value, 0));
    if (operation.toUpperCase() === "AVERAGE") return String(values.reduce((sum, value) => sum + value, 0) / values.length);
    if (operation.toUpperCase() === "MIN") return String(Math.min(...values));
    return String(Math.max(...values));
  });
  expression = expression.replace(/\b([A-L][1-9]\d*)\b/gi, (reference) => {
    const value = getSheetCellNumericValue(sheet, reference.toUpperCase(), trail);
    return Number.isFinite(value) ? String(value) : "0";
  });
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) return Number.NaN;
  try {
    const result = Function(`"use strict"; return (${expression});`)();
    return Number.isFinite(result) ? result : Number.NaN;
  } catch {
    return Number.NaN;
  }
}

function getSheetCellNumericValue(sheet, reference, trail) {
  if (trail.has(reference)) return Number.NaN;
  const raw = String(sheet.cells[reference] ?? "").trim();
  if (!raw) return 0;
  if (raw === "TRUE") return 1;
  if (!raw.startsWith("=")) return parseSheetNumber(raw);
  const nextTrail = new Set(trail);
  nextTrail.add(reference);
  return evaluateSheetFormula(sheet, raw, nextTrail);
}

function parseSheetNumber(value) {
  const number = Number(String(value ?? "").replace(/[원,\s]/g, ""));
  return Number.isFinite(number) ? number : Number.NaN;
}

function sheetRangeReferences(start, end) {
  const first = parseSheetCellReference(start);
  const last = parseSheetCellReference(end);
  if (!first || !last) return [];
  const references = [];
  for (let row = Math.min(first.row, last.row); row <= Math.max(first.row, last.row); row += 1) {
    for (let column = Math.min(first.column, last.column); column <= Math.max(first.column, last.column); column += 1) {
      references.push(`${sheetColumnLabel(column)}${row + 1}`);
    }
  }
  return references;
}

function exportCurrentSheetCsv() {
  const sheet = getCurrentSheet();
  const rows = Array.from({ length: sheet.rows }, (_, row) => Array.from({ length: sheet.columns }, (_, column) => {
    const reference = `${sheetColumnLabel(column)}${row + 1}`;
    const value = formatSheetCellDisplay(sheet, reference);
    return `"${String(value).replaceAll('"', '""')}"`;
  }).join(","));
  const blob = new Blob([`\ufeff${rows.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sheet.name.replace(/[\\/:*?"<>|]/g, "-") || "custom-sheet"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function renderProjects() {
  state.projects ||= createProjectState();
  normalizeProjectState(state.projects);
  renderProjectSummary();
  renderProjectBoard();
}

function renderProjectSummary() {
  const node = el("projectSummaryStrip");
  if (!node) return;
  const projects = state.projects.items || [];
  const active = projects.filter((project) => project.status !== "완료").length;
  const totalExpected = projects.reduce((sum, project) => sum + calculateProjectFinance(project).expectedProfit, 0);
  const dueSoon = projects.filter((project) => {
    if (!project.dueDate || project.status === "완료") return false;
    const left = daysBetween(todayInPlanner(), parseDate(project.dueDate));
    return left >= 0 && left <= 14;
  }).length;
  node.innerHTML = `
    <span>진행 ${active}</span>
    <span>2주 내 행동 ${dueSoon}</span>
    <span>예상 손익 ${formatMoneyAmount(totalExpected)}</span>
  `;
}

function renderProjectBoard() {
  const node = el("projectBoard");
  if (!node) return;
  node.innerHTML = "";
  node.className = `project-board ${projectDetailOpen && !projectSlideOpening ? "is-detail-open" : ""}`;
  if (projectDetailOpen && projectSlideOpening) {
    window.requestAnimationFrame(() => {
      node.classList.add("is-detail-open");
      projectSlideOpening = false;
    });
  }
  const listPanel = document.createElement("article");
  listPanel.className = "panel project-page project-list-panel";
  listPanel.innerHTML = `
    <div class="project-page-sticky">
      <h3 class="panel-title-row">
        <span>프로젝트 리스트</span>
        <span class="project-list-count">${state.projects.items.filter((project) => project.status !== "완료").length}</span>
      </h3>
      <button class="add-row project-add-inline" id="projectAddInline" type="button">신규 프로젝트</button>
    </div>
    <div class="project-list" id="projectList"></div>
  `;
  node.appendChild(listPanel);

  const list = listPanel.querySelector("#projectList");
  state.projects.items.forEach((project, index) => {
    const finance = calculateProjectFinance(project);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `project-list-item project-status-${project.status} ${project.id === state.projects.selectedId ? "is-active" : ""}`;
    button.dataset.projectIndex = String(index);
    button.innerHTML = `
      <span class="project-list-title">${index + 1}. ${escapeHtml(projectTitle(project))}</span>
      <span class="project-list-meta">
        <b>${escapeHtml(project.status)}</b>
        <span>${project.dueDate ? formatShortDate(parseDate(project.dueDate)) : "실행일 미정"}</span>
        <span>${formatMoneyAmount(finance.expectedProfit)}</span>
      </span>
      <small>${escapeHtml(project.nextAction || "다음 행동을 입력하세요")}</small>
    `;
    button.onclick = () => {
      if (projectSwipeSuppressClick) return;
      selectProject(project.id, { openDetail: true });
    };
    list.appendChild(button);
  });
  listPanel.querySelector("#projectAddInline").onclick = addProject;
  setupProjectPageSwipe(listPanel, "list");

  const index = getSelectedProjectIndex();
  const project = state.projects.items[index];
  const detailPage = document.createElement("article");
  detailPage.className = "project-page project-detail-panel";
  if (!project) {
    const empty = document.createElement("article");
    empty.className = "panel project-card";
    empty.innerHTML = `
      <div class="project-page-sticky">
        <h3 class="panel-title-row">
          <span>프로젝트 세부내용</span>
          <button class="icon-close project-detail-close" type="button" aria-label="프로젝트 세부내용 닫기">×</button>
        </h3>
      </div>
      <p class="project-empty-message">프로젝트를 추가하세요.</p>
    `;
    detailPage.appendChild(empty);
    node.appendChild(detailPage);
    empty.querySelector(".project-detail-close").onclick = closeProjectDetail;
    setupProjectPageSwipe(detailPage, "detail");
    return;
  }

  const card = document.createElement("article");
  card.className = `panel project-card project-status-${project.status}`;
  card.dataset.projectIndex = String(index);
  const finance = calculateProjectFinance(project);
  card.innerHTML = `
      <div class="project-page-sticky">
        <h3 class="panel-title-row">
          <span>프로젝트 세부내용</span>
          <button class="icon-close project-detail-close" type="button" aria-label="프로젝트 세부내용 닫기">×</button>
        </h3>
      </div>
      <div class="project-card-head">
        <input class="project-title-input" type="text" value="${escapeAttr(project.title)}" placeholder="프로젝트명" />
        <select aria-label="프로젝트 상태">
          ${projectStatuses.map((status) => `<option value="${status}" ${project.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </div>
      <div class="project-meta-grid">
        <label><span class="row-label">담당</span><input type="text" data-field="owner" value="${escapeAttr(project.owner)}" placeholder="담당자" /></label>
        <label><span class="row-label">시작</span><input type="date" data-field="startDate" value="${escapeAttr(project.startDate)}" /></label>
        <label><span class="row-label">마감</span><input type="date" data-field="endDate" value="${escapeAttr(project.endDate)}" /></label>
        <label><span class="row-label">예산</span><input type="text" data-field="budget" inputmode="numeric" value="${escapeAttr(project.budget)}" placeholder="예산" /></label>
        <label><span class="row-label">실사용</span><input type="text" data-field="actual" inputmode="numeric" value="${escapeAttr(project.actual)}" placeholder="실사용" /></label>
      </div>
      <label class="project-wide-field"><span class="row-label">목표</span><textarea data-field="goal" rows="2" placeholder="완료 기준과 기대 결과">${escapeHtml(project.goal)}</textarea></label>
      <div class="project-action-row">
        <label><span class="row-label">다음 행동</span><input type="text" data-field="nextAction" value="${escapeAttr(project.nextAction)}" placeholder="오늘 또는 이번 주 실행할 일" /></label>
        <label><span class="row-label">실행일</span><input type="date" data-field="dueDate" value="${escapeAttr(project.dueDate)}" /></label>
      </div>
      <div class="project-sim-summary">
        <span>예상 수입 ${formatMoneyAmount(finance.expectedIncome)}</span>
        <span>예상 비용 ${formatMoneyAmount(finance.expectedCost)}</span>
        <strong>예상 손익 ${formatMoneyAmount(finance.expectedProfit)}</strong>
        <span>예산 차이 ${formatMoneyAmount(finance.budgetLeft)}</span>
      </div>
      <div class="project-money-grid"></div>
      <button class="add-row project-money-add" type="button">시뮬레이션 항목 추가</button>
      <label class="project-wide-field"><span class="row-label">메모</span><textarea data-field="notes" rows="3" placeholder="리스크, 의사결정, 확인할 숫자">${escapeHtml(project.notes)}</textarea></label>
    `;
  const [titleInput, statusSelect] = card.querySelectorAll(".project-card-head input, .project-card-head select");
  titleInput.oninput = () => updateProjectField(index, "title", titleInput.value);
  statusSelect.onchange = () => updateProjectField(index, "status", statusSelect.value);
  card.querySelector(".project-detail-close").onclick = closeProjectDetail;
  card.querySelectorAll("[data-field]").forEach((field) => {
    field.oninput = () => updateProjectField(index, field.dataset.field, field.value);
    field.onchange = () => updateProjectField(index, field.dataset.field, field.value);
  });
  renderProjectMoneyRows(card.querySelector(".project-money-grid"), project.finances, index);
  card.querySelector(".project-money-add").onclick = () => addProjectMoneyRow(index);
  detailPage.appendChild(card);
  node.appendChild(detailPage);
  setupProjectPageSwipe(detailPage, "detail");
}

function projectTitle(project) {
  return project.title?.trim() || "새 프로젝트";
}

function getSelectedProjectIndex() {
  const projects = state.projects?.items || [];
  const index = projects.findIndex((project) => project.id === state.projects.selectedId);
  return index >= 0 ? index : 0;
}

function selectProject(projectId, options = {}) {
  state.projects.selectedId = projectId;
  if (options.openDetail) {
    projectSlideOpening = !projectDetailOpen;
    projectDetailOpen = true;
  }
  saveState();
  renderProjects();
}

function closeProjectDetail() {
  const node = el("projectBoard");
  if (node?.classList.contains("is-detail-open")) {
    node.classList.remove("is-detail-open");
    window.setTimeout(() => {
      projectDetailOpen = false;
      renderProjects();
    }, 320);
    return;
  }
  projectDetailOpen = false;
  renderProjects();
}

function setupProjectPageSwipe(node, page) {
  if (!node) return;
  let startX = 0;
  let startY = 0;
  let lastSwipeAt = 0;
  const markStart = (x, y) => {
    startX = x;
    startY = y;
  };
  const finishSwipe = (x, y) => {
    const dx = x - startX;
    const dy = y - startY;
    if (Math.abs(dx) < 58 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    const now = Date.now();
    if (now - lastSwipeAt < 280) return;
    lastSwipeAt = now;
    if (page === "list" && dx < 0 && state.projects.items.length) {
      projectSlideOpening = !projectDetailOpen;
      projectDetailOpen = true;
      projectSwipeSuppressClick = true;
      renderProjects();
      window.setTimeout(() => {
        projectSwipeSuppressClick = false;
      }, 260);
    }
    if (page === "detail" && dx > 0) {
      closeProjectDetail();
    }
  };
  node.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
    startY = event.clientY;
  }, { passive: true });
  node.addEventListener("pointerup", (event) => finishSwipe(event.clientX, event.clientY), { passive: true });
  node.addEventListener("touchstart", (event) => {
    const touch = event.touches?.[0];
    if (touch) markStart(touch.clientX, touch.clientY);
  }, { passive: true });
  node.addEventListener("touchend", (event) => {
    const touch = event.changedTouches?.[0];
    if (touch) finishSwipe(touch.clientX, touch.clientY);
  }, { passive: true });
}

function renderProjectMoneyRows(node, rows, projectIndex) {
  if (!node) return;
  node.innerHTML = "";
  rows.forEach((item, rowIndex) => {
    const row = document.createElement("div");
    row.className = "project-money-row";
    row.innerHTML = `
      <select aria-label="수입 또는 비용">
        ${projectMoneyTypes.map((type) => `<option value="${type}" ${item.type === type ? "selected" : ""}>${type}</option>`).join("")}
      </select>
      <input type="text" value="${escapeAttr(item.title)}" placeholder="항목" />
      <input type="text" inputmode="numeric" value="${escapeAttr(item.amount)}" placeholder="금액" />
      <input type="number" min="0" max="100" value="${escapeAttr(item.probability)}" placeholder="%" />
      <input type="text" value="${escapeAttr(item.timing)}" placeholder="시점" />
      <input type="text" value="${escapeAttr(item.memo)}" placeholder="메모" />
    `;
    const [type, title, amount, probability, timing, memo] = row.querySelectorAll("select, input");
    type.onchange = () => updateProjectMoney(projectIndex, rowIndex, "type", type.value);
    title.oninput = () => updateProjectMoney(projectIndex, rowIndex, "title", title.value);
    amount.oninput = () => updateProjectMoney(projectIndex, rowIndex, "amount", amount.value);
    probability.oninput = () => updateProjectMoney(projectIndex, rowIndex, "probability", probability.value);
    timing.oninput = () => updateProjectMoney(projectIndex, rowIndex, "timing", timing.value);
    memo.oninput = () => updateProjectMoney(projectIndex, rowIndex, "memo", memo.value);
    node.appendChild(row);
  });
}

function addProject() {
  state.projects ||= createProjectState();
  const project = emptyProject("새 프로젝트");
  state.projects.items.push(project);
  state.projects.selectedId = project.id;
  projectSlideOpening = !projectDetailOpen;
  projectDetailOpen = true;
  saveState();
  renderProjects();
  window.requestAnimationFrame(() => document.querySelector(".project-title-input")?.focus());
}

function updateProjectField(index, field, value) {
  const project = state.projects.items[index];
  if (!project) return;
  project[field] = value;
  if (["title", "nextAction", "dueDate", "status"].includes(field)) linkProjectToTask(project);
  saveState();
  renderProjectSummary();
  renderProjectCardSummary(index);
  renderProjectListItem(index);
}

function addProjectMoneyRow(projectIndex) {
  const project = state.projects.items[projectIndex];
  if (!project) return;
  project.finances.push(emptyProjectMoney("비용"));
  saveState();
  renderProjects();
}

function updateProjectMoney(projectIndex, rowIndex, field, value) {
  const item = state.projects.items[projectIndex]?.finances?.[rowIndex];
  if (!item) return;
  item[field] = value;
  saveState();
  renderProjectSummary();
  renderProjectCardSummary(projectIndex);
}

function renderProjectCardSummary(index) {
  const summary = document.querySelector(`.project-card[data-project-index="${index}"] .project-sim-summary`);
  const project = state.projects.items[index];
  if (!summary || !project) return;
  const finance = calculateProjectFinance(project);
  summary.innerHTML = `
    <span>예상 수입 ${formatMoneyAmount(finance.expectedIncome)}</span>
    <span>예상 비용 ${formatMoneyAmount(finance.expectedCost)}</span>
    <strong>예상 손익 ${formatMoneyAmount(finance.expectedProfit)}</strong>
    <span>예산 차이 ${formatMoneyAmount(finance.budgetLeft)}</span>
  `;
}

function renderProjectListItem(index) {
  const project = state.projects.items[index];
  const item = document.querySelector(`.project-list-item[data-project-index="${index}"]`);
  if (!project || !item) return;
  const finance = calculateProjectFinance(project);
  item.className = `project-list-item project-status-${project.status} ${project.id === state.projects.selectedId ? "is-active" : ""}`;
  item.innerHTML = `
    <span class="project-list-title">${index + 1}. ${escapeHtml(projectTitle(project))}</span>
    <span class="project-list-meta">
      <b>${escapeHtml(project.status)}</b>
      <span>${project.dueDate ? formatShortDate(parseDate(project.dueDate)) : "실행일 미정"}</span>
      <span>${formatMoneyAmount(finance.expectedProfit)}</span>
    </span>
    <small>${escapeHtml(project.nextAction || "다음 행동을 입력하세요")}</small>
  `;
}

function calculateProjectFinance(project) {
  const expectedIncome = project.finances
    .filter((item) => item.type === "수입")
    .reduce((sum, item) => sum + parseMoneyAmount(item.amount) * normalizeProbability(item.probability), 0);
  const expectedCost = project.finances
    .filter((item) => item.type === "비용")
    .reduce((sum, item) => sum + parseMoneyAmount(item.amount) * normalizeProbability(item.probability), 0);
  const expectedProfit = expectedIncome - expectedCost;
  const budgetLeft = parseMoneyAmount(project.budget) - parseMoneyAmount(project.actual || expectedCost);
  return { expectedIncome, expectedCost, expectedProfit, budgetLeft };
}

function normalizeProbability(value) {
  const number = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(number)) return 1;
  return Math.max(0, Math.min(100, number)) / 100;
}

function linkProjectToTask(project) {
  removeProjectLinkedTask(project.id);
  if (!project.dueDate || !project.nextAction?.trim() || project.status === "완료") return;
  const targetDay = ensureDay(project.dueDate);
  const task = targetDay.tasks.B.find((item) => item.projectTaskId === project.id) || targetDay.tasks.B.find((item) => !item.text?.trim()) || { text: "", status: "미완료", done: false, priorityUnset: false };
  task.text = `프로젝트: ${project.title || "이름 없음"} - ${project.nextAction.trim()}`;
  task.status = "미완료";
  task.done = false;
  task.priorityUnset = false;
  task.projectTaskId = project.id;
  if (!targetDay.tasks.B.includes(task)) targetDay.tasks.B.push(task);
}

function removeProjectLinkedTask(projectId) {
  Object.values(state.days || {}).forEach((day) => {
    priorities.forEach(([priority]) => {
      day.tasks[priority] = day.tasks[priority].filter((task) => task.projectTaskId !== projectId);
    });
  });
}

function renderFinanceMonthNav() {
  const title = el("financeMonthTitle");
  if (title) {
    const yearNumber = Number(selectedFinanceMonth.split("-")[0]);
    const monthNumber = Number(selectedFinanceMonth.split("-")[1]);
    title.textContent = `${yearNumber}년 ${monthNumber}월 자금 체크`;
  }
  renderFinanceMonthTabs(false);
}

function renderFinanceMonthTabs(forceOpen = false) {
  const node = el("financeMonthTabs");
  if (!node) return;
  node.classList.toggle("is-open", forceOpen || node.classList.contains("is-open"));
  node.innerHTML = "";
  financeMonthKeys().forEach((key) => {
    const monthNumber = Number(key.split("-")[1]);
    const button = document.createElement("button");
    button.type = "button";
    button.className = key === selectedFinanceMonth ? "is-active" : "";
    button.textContent = `${monthNumber}월`;
    button.onclick = () => {
      const keys = financeMonthKeys();
      const previousIndex = keys.indexOf(selectedFinanceMonth);
      const nextIndex = keys.indexOf(key);
      selectedFinanceMonth = key;
      node.classList.remove("is-open");
      financeTurnDirection = nextIndex >= previousIndex ? 1 : -1;
      renderNotes();
    };
    node.appendChild(button);
  });
}

function renderFinanceYearRows() {
  const node = el("financeYearRows");
  if (!node) return;
  node.innerHTML = "";
  const key = selectedFinanceMonth;
  const rows = ensureFinanceMonth(key);
  const monthPanel = document.createElement("section");
  monthPanel.className = "finance-month-card";
  const yearNumber = Number(key.split("-")[0]);
  const monthNumber = Number(key.split("-")[1]);
  monthPanel.innerHTML = `
    <h4>
      <span>${yearNumber}년 ${monthNumber}월 자금 체크</span>
      <small>${monthNumber}월 예정 수입·지출·이자·카드대금</small>
    </h4>
    <div class="finance-grid"></div>
    <button class="add-row finance-add-row" type="button">항목 추가</button>
  `;
  renderMoneyRows(monthPanel.querySelector(".finance-grid"), rows, { monthKey: key });
  monthPanel.querySelector(".finance-add-row").onclick = () => addMoneyRow(rows, { monthKey: key });
  node.appendChild(monthPanel);
  if (financeTurnDirection) {
    const direction = financeTurnDirection;
    financeTurnDirection = 0;
    window.requestAnimationFrame(() => animateFinancePageTurn(direction));
  }
}

function shiftFinanceMonth(delta) {
  const [year, month] = selectedFinanceMonth.split("-").map(Number);
  const next = new Date(year || selectedDate.getFullYear(), (month || selectedDate.getMonth() + 1) - 1 + delta, 1);
  selectedFinanceMonth = monthKey(next);
  ensureFinanceMonth(selectedFinanceMonth);
  financeTurnDirection = delta;
  renderNotes();
}

function animateFinancePageTurn(delta) {
  const node = el("financeYearRows");
  if (!node) return;
  node.classList.remove("is-turning-next", "is-turning-prev");
  void node.offsetWidth;
  node.classList.add(delta > 0 ? "is-turning-next" : "is-turning-prev");
  window.setTimeout(() => node.classList.remove("is-turning-next", "is-turning-prev"), 340);
}

function setupFinanceMonthSwipe() {
  const zone = el("financeMonthSwipeZone");
  const panel = el("financeYearRows");
  [zone, panel].forEach((node) => {
    if (!node) return;
    let startX = 0;
    let startY = 0;
    let pointerId = 0;
    node.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button") && node === panel) return;
      startX = event.clientX;
      startY = event.clientY;
      pointerId = event.pointerId;
    });
    node.addEventListener("pointerup", (event) => {
      if (!startX || (pointerId && event.pointerId !== pointerId)) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      startX = 0;
      startY = 0;
      pointerId = 0;
      if (Math.abs(dx) < 52 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      event.preventDefault();
      financeSwipeSuppressClick = true;
      if (document.activeElement?.blur) document.activeElement.blur();
      shiftFinanceMonth(dx < 0 ? 1 : -1);
      window.setTimeout(() => {
        financeSwipeSuppressClick = false;
      }, 260);
    });
    node.addEventListener("pointercancel", () => {
      startX = 0;
      startY = 0;
      pointerId = 0;
    });
  });
}

function renderRepeatsAndInsights() {
  // Kept for compatibility with earlier data extraction. Full planner uses Notes/Index instead.
}

function renderEditableList(node, array, placeholder, onSave) {
  node.innerHTML = "";
  array.forEach((value, index) => {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `<span class="row-label">${index + 1}</span><input type="text" value="${escapeAttr(value)}" placeholder="${placeholder}" />`;
    row.querySelector("input").oninput = (event) => {
      array[index] = event.target.value;
      onSave();
    };
    node.appendChild(row);
  });
}

function renderMoneyRows(node, rows, options = {}) {
  if (!node) return;
  node.innerHTML = "";
  rows.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = `finance-row ${options.fixed ? "finance-row-fixed" : ""} finance-status-${item.status}`;
    row.innerHTML = `
      <select class="finance-type" aria-label="구분">
        ${moneyTypes.map((type) => `<option value="${type}" ${item.type === type ? "selected" : ""}>${type}</option>`).join("")}
      </select>
      <input class="finance-title" type="text" value="${escapeAttr(item.title)}" placeholder="내용" />
      <input class="finance-amount" type="text" inputmode="numeric" value="${escapeAttr(item.amount)}" placeholder="금액" />
      <input class="finance-due" type="number" min="1" max="31" value="${escapeAttr(item.dueDay)}" placeholder="일" />
      <select class="finance-status" aria-label="상태">
        ${moneyStatuses.map((status) => `<option value="${status}" ${item.status === status ? "selected" : ""}>${status}</option>`).join("")}
      </select>
      <input class="finance-memo" type="text" value="${escapeAttr(item.memo)}" placeholder="메모" />
      ${
        options.fixed
          ? `<select class="finance-repeat-end-mode" aria-label="반복지출 종료 설정">
              <option value="none" ${item.repeatEndMode !== "date" ? "selected" : ""}>종료없음</option>
              <option value="date" ${item.repeatEndMode === "date" ? "selected" : ""}>종료일</option>
            </select>
            <input class="finance-repeat-end-date" type="date" value="${escapeAttr(item.repeatEndDate)}" ${item.repeatEndMode === "date" ? "" : "disabled"} aria-label="반복지출 종료일" />`
          : ""
      }
      <button class="finance-delete" type="button" aria-label="자금 항목 삭제" title="삭제">×</button>
    `;
    const type = row.querySelector(".finance-type");
    const title = row.querySelector(".finance-title");
    const amount = row.querySelector(".finance-amount");
    const dueDay = row.querySelector(".finance-due");
    const status = row.querySelector(".finance-status");
    const memo = row.querySelector(".finance-memo");
    const repeatEndMode = row.querySelector(".finance-repeat-end-mode");
    const repeatEndDate = row.querySelector(".finance-repeat-end-date");
    type.onchange = () => updateMoneyItem(rows, index, "type", type.value, options);
    title.oninput = () => updateMoneyItem(rows, index, "title", title.value, options);
    amount.oninput = () => updateMoneyItem(rows, index, "amount", amount.value, options);
    dueDay.oninput = () => updateMoneyItem(rows, index, "dueDay", dueDay.value, options);
    status.onchange = () => updateMoneyItem(rows, index, "status", status.value, options);
    memo.oninput = () => updateMoneyItem(rows, index, "memo", memo.value, options);
    if (repeatEndMode) {
      repeatEndMode.onchange = () => {
        updateMoneyItem(rows, index, "repeatEndMode", repeatEndMode.value, options);
        if (repeatEndDate) repeatEndDate.disabled = repeatEndMode.value !== "date";
      };
    }
    if (repeatEndDate) repeatEndDate.oninput = () => updateMoneyItem(rows, index, "repeatEndDate", repeatEndDate.value, options);
    row.querySelector(".finance-delete").onclick = () => removeMoneyRow(rows, index, options);
    node.appendChild(row);
  });
}

function addMoneyRow(rows, options = {}) {
  rows.push(emptyMoneyItem("지출"));
  saveState();
  renderNotes();
}

function removeMoneyRow(rows, index, options = {}) {
  if (!confirmDelete("이 자금 항목을 삭제할까요? 연결된 우선업무도 함께 정리됩니다.")) return;
  const [removed] = rows.splice(index, 1);
  if (removed?.id) removeFinanceLinkedTask(removed.id, Boolean(options.fixed));
  if (!rows.length) rows.push(emptyMoneyItem(options.fixed ? "지출" : "지출"));
  saveState();
  renderNotes();
}

function updateMoneyItem(rows, index, field, value, options = {}) {
  rows[index][field] = value;
  if (options.monthKey) linkMoneyItemToTask(rows[index], options.monthKey);
  if (options.fixed) linkFixedMoneyItemToTasks(rows[index]);
  saveState();
  renderFinanceSummary();
}

function renderFinanceSummary() {
  const node = el("financeSummary");
  if (!node) return;
  const activeMonthRows = (state.finance.months?.[selectedFinanceMonth] || []).filter((item) => item.title || item.amount);
  const yearlyRows = Object.values(state.finance.months || {}).flat().filter((item) => item.title || item.amount);
  const activeOpenRows = activeMonthRows.filter((item) => item.status !== "완료");
  const yearlyOpenRows = yearlyRows.filter((item) => item.status !== "완료");
  const expenseTotal = activeMonthRows
    .filter((item) => item.type !== "수입")
    .reduce((sum, item) => sum + parseMoneyAmount(item.amount), 0);
  const incomeTotal = activeMonthRows
    .filter((item) => item.type === "수입")
    .reduce((sum, item) => sum + parseMoneyAmount(item.amount), 0);
  const monthNumber = Number(selectedFinanceMonth.split("-")[1]);
  node.textContent = `${monthNumber}월 ${activeOpenRows.length}건 · 수입 ${formatMoneyAmount(incomeTotal)} · 지출 ${formatMoneyAmount(expenseTotal)} · 연간 미확인 ${yearlyOpenRows.length}`;
}

function linkMoneyItemToTask(item, key, linkId = item.id, fixed = false) {
  const targetDate = getMoneyItemDate(item, key);
  removeFinanceLinkedTask(linkId);
  if (!targetDate || !item.title?.trim()) {
    item.taskDate = "";
    return;
  }
  const targetDay = ensureDay(targetDate);
  const targetPriority = item.type === "수입" ? "B" : "A";
  const taskText = buildMoneyTaskText(item, fixed);
  const existing = targetDay.tasks[targetPriority].find((task) => task.financeItemId === linkId);
  const targetTask = existing || targetDay.tasks[targetPriority].find((task) => !task.text?.trim());
  const task = targetTask || { text: "", status: "미완료", done: false, priorityUnset: false };
  task.text = taskText;
  task.status = item.status === "완료" ? "완료" : "미완료";
  task.done = item.status === "완료";
  task.priorityUnset = false;
  task.financeItemId = linkId;
  if (!existing && !targetDay.tasks[targetPriority].includes(task)) targetDay.tasks[targetPriority].push(task);
  item.taskDate = targetDate;
}

function linkFixedMoneyItemToTasks(item) {
  removeFinanceLinkedTask(item.id, true);
  if (!item.title?.trim() || !Number(item.dueDay)) return;
  Object.keys(createFinanceMonths()).forEach((key) => {
    if (isFixedMoneyActiveForMonth(item, key)) linkMoneyItemToTask(item, key, `${item.id}-${key}`, true);
  });
}

function isFixedMoneyActiveForMonth(item, key) {
  if (item.repeatEndMode !== "date" || !item.repeatEndDate) return true;
  const targetDate = getMoneyItemDate(item, key);
  if (!targetDate) return false;
  return targetDate <= item.repeatEndDate;
}

function removeFinanceLinkedTask(linkId, prefix = false) {
  if (!linkId) return;
  Object.values(state.days || {}).forEach((day) => {
    priorities.forEach(([priority]) => {
      day.tasks[priority] = day.tasks[priority].filter((task) => {
        if (!task.financeItemId) return true;
        return prefix ? !task.financeItemId.startsWith(`${linkId}-`) : task.financeItemId !== linkId;
      });
    });
  });
}

function getMoneyItemDate(item, key) {
  const dueDay = Number(item.dueDay);
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return "";
  const [year, month] = key.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${pad(month)}-${pad(Math.min(dueDay, lastDay))}`;
}

function buildMoneyTaskText(item, fixed = false) {
  const amount = item.amount ? ` ${item.amount}` : "";
  return `자금 확인${fixed ? "(매월)" : ""}: ${item.title.trim()}${amount}`;
}

function parseMoneyAmount(value) {
  const number = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function formatMoneyAmount(value) {
  if (!value) return "0";
  return value.toLocaleString("ko-KR");
}

function getDayTasks(key) {
  const day = state.days[key];
  if (!day) return [];
  normalizeDayTasks(day);
  return priorities.flatMap(([priority]) => day.tasks[priority].map((task, index) => ({ ...task, priority, date: key, index })));
}

function getCarryoverTasks(date) {
  const currentKey = iso(date);
  return Object.keys(state.days)
    .filter((key) => key < currentKey)
    .sort()
    .flatMap((key) => getDayTasks(key))
    .filter((task) => {
      const completedKey = task.carryoverDoneDate || "";
      const deletedFrom = task.carryoverDeletedFrom || "";
      if (deletedFrom && deletedFrom <= currentKey) return false;
      if (completedKey && completedKey < currentKey) return false;
      if (task.status === "연기" && task.postponeMode === "date" && task.postponeDate) return false;
      if (!shouldCarryRepeatTask(task, currentKey)) return false;
      return task.text && !task.done && ["미완료", "진행중", "연기"].includes(task.status);
    });
}

function isCarryoverCompletedOn(task, key = iso(selectedDate)) {
  return Boolean(task?.carryoverDoneDate && task.carryoverDoneDate === key);
}

function countTasksForDay(key) {
  return getDayTasks(key).filter((task) => task.text).length;
}

function escapeAttr(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function showView(name) {
  const previousView = document.querySelector(".view.active")?.id?.replace("view-", "") || "";
  if (name === "projects" && previousView !== "projects") projectDetailOpen = false;
  if (name === "sheets" && previousView !== "sheets") sheetDetailOpen = false;
  if (name !== "day") closeDailyCalendar();
  if (name !== "week") closeWeekCalendar();
  if (name !== "month") closeMonthPicker();
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  document.querySelectorAll("[data-top-view]").forEach((item) => item.classList.toggle("is-active", item.dataset.topView === name));
  document.querySelectorAll(".view").forEach((item) => item.classList.toggle("active", item.id === `view-${name}`));
  if (name === "day") positionDaySwipe();
  keepActiveTopViewVisible(name);
}

function keepActiveTopViewVisible(name) {
  const strip = document.querySelector(".quick-strip");
  const button = document.querySelector(`[data-top-view="${name}"]`);
  if (!strip || !button || window.innerWidth > 1024) return;
  window.requestAnimationFrame(() => {
    button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  });
}

function collectSearchResults(query) {
  const terms = getSearchTerms(query);
  const results = [];
  const push = (type, label, text, date = "") => {
    if (matchesSearchText(`${label} ${text} ${date}`, terms)) results.push({ type, label, text, date });
  };
  push("foundation", "사명 선언", state.foundation.mission);
  state.foundation.values.forEach((value, index) => push("foundation", `핵심 가치 ${index + 1}`, value));
  state.foundation.roles.forEach((role) => {
    push("foundation", `역할 ${role.role}`, role.goal);
    push("foundation", `회복 활동 ${role.role}`, role.renewal);
  });
  state.year.goals.forEach((value, index) => push("year", `연간 목표 ${index + 1}`, value));
  state.year.future.forEach((value, index) => push("year", `대기 목록 ${index + 1}`, value));
  Object.entries(state.months).forEach(([key, month]) => {
    push("month", `${key} 월간 초점`, month.focus, `${key}-01`);
    month.projects.forEach((value, index) => push("month", `${key} 프로젝트 ${index + 1}`, value, `${key}-01`));
  });
  Object.entries(state.weeks).forEach(([key, week]) => {
    week.priorities?.forEach((item, index) => push("week", `${key} 금주의 주요일정 ${index + 1}`, item.text, key));
    week.compass.forEach((item) => {
      normalizeCompassItem(item);
      push("week", `${key} ${item.role}`, item.goal, key);
      item.actions.forEach((action, index) => push("week", `${key} ${item.role} 행동 ${index + 1}`, action, key));
    });
  });
  state.repeats?.priorityTasks?.forEach((rule, index) => {
    push("notes", `반복 우선업무 ${index + 1}`, rule.text);
  });
  Object.entries(state.days).forEach(([key, day]) => {
    getDayTasks(key).forEach((task) => push("day", `${key} ${task.priority}`, task.text, key));
    Object.entries(day.appointments).forEach(([slot, text]) => push("day", `${key} ${slot}`, text, key));
    ["memo", "record"].forEach((field) => push("day", `${key} ${field}`, day[field], key));
  });
  Object.entries(state.finance?.months || {}).forEach(([key, rows]) => {
    rows.forEach((item, index) => push("notes", `${key} 자금 ${index + 1} ${item.type} ${item.status}`, `${item.title} ${item.amount} ${item.dueDay} ${item.memo}`, `${key}-01`));
  });
  state.finance?.fixed?.forEach((item, index) => push("notes", `반복 지출 ${index + 1} ${item.type} ${item.status}`, `${item.title} ${item.amount} ${item.dueDay} ${item.memo}`));
  push("notes", "경영자 메모", state.finance?.issueMemo || "");
  push("notes", "이번 달 판단", state.finance?.decisionMemo || "");
  state.notes.projects.forEach((value, index) => push("notes", `프로젝트 ${index + 1}`, value));
  state.notes.references.forEach((value, index) => push("notes", `참고 ${index + 1}`, value));
  push("notes", "자유 노트", state.notes.freeform);
  state.projects?.items?.forEach((project, index) => {
    push("projects", `프로젝트 ${index + 1} ${project.status}`, `${project.title} ${project.owner} ${project.goal} ${project.nextAction} ${project.notes}`, project.dueDate || project.endDate);
    project.finances?.forEach((item, financeIndex) => {
      push("projects", `프로젝트 자금 ${index + 1}-${financeIndex + 1} ${item.type}`, `${item.title} ${item.amount} ${item.probability} ${item.timing} ${item.memo}`, project.dueDate || project.endDate);
    });
  });
  state.customSheets?.items?.forEach((sheet) => {
    Object.entries(sheet.cells || {}).forEach(([reference, value]) => {
      push("sheets", `${sheet.name} ${reference}`, value);
    });
  });
  return results.slice(0, 80);
}

function getSearchTerms(query) {
  const normalized = normalizeSearchText(query);
  const terms = normalized
    .split(/\s+/)
    .map((term) => term.replace(/(했나요|인가요|일까요|인가|이지|나요|어요|으로|에서|에게|에는|은|는|이|가|을|를|의|도|와|과|로|에|날)$/g, ""))
    .filter((term) => term && !["언제", "어디", "무엇", "뭐", "찾아", "검색", "알려줘", "날짜", "날"].includes(term));
  return terms.length ? [...new Set(terms)] : [normalized].filter(Boolean);
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[?？!！.,，。]/g, " ")
    .replace(/간\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesSearchText(text, terms) {
  if (!terms.length) return false;
  const normalized = normalizeSearchText(text);
  const compact = normalized.replace(/\s+/g, "");
  return terms.every((term) => {
    const compactTerm = term.replace(/\s+/g, "");
    return normalized.includes(term) || compact.includes(compactTerm) || compact.includes(compactTerm.replace(/기$/g, ""));
  });
}

async function requestAiSearchAnswer(value) {
  const question = value.trim();
  if (!question) return;
  aiSearch = { query: question, answer: "", loading: true, error: "" };
  showView("search");
  renderSearch();
  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context: buildPlannerAiContext() }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "AI 답변을 받아오지 못했습니다.");
    aiSearch = { query: question, answer: payload.answer || "AI 답변이 비어 있습니다.", loading: false, error: "" };
  } catch (error) {
    aiSearch = {
      query: question,
      answer: "",
      loading: false,
      error: `${error.message || "AI 연결 오류"} · OPENAI_API_KEY로 server.py를 실행했는지 확인하세요.`,
    };
  }
  renderSearch();
}

function buildPlannerAiContext() {
  const key = iso(selectedDate);
  const day = ensureDay(key);
  const tasks = getDayTasks(key)
    .filter((task) => task.text)
    .slice(0, 20)
    .map((task) => ({
      priority: task.priority,
      text: task.text,
      status: task.status,
      done: Boolean(task.done),
    }));
  const appointments = Object.entries(day.appointments || {})
    .filter(([, text]) => String(text || "").trim())
    .slice(0, 20)
    .map(([time, text]) => ({ time, text }));
  return {
    date: formatDate(selectedDate),
    profile: state.profile,
    mission: state.foundation?.mission || "",
    values: (state.foundation?.values || []).filter(Boolean).slice(0, 8),
    yearGoals: (state.year?.goals || []).filter(Boolean).slice(0, 8),
    monthProjects: (ensureMonth().projects || []).filter(Boolean).slice(0, 8),
    weeklyPriorities: (ensureWeek().priorities || []).filter((item) => item.text).slice(0, 5),
    tasks,
    appointments,
    memo: {
      dayMemo: day.memo || "",
      dayRecord: day.record || "",
    },
    carryovers: getCarryoverTasks(selectedDate).slice(0, 10).map((task) => ({
      priority: task.priority,
      text: task.text,
      date: task.date,
    })),
  };
}

function renderSearch() {
  const node = el("searchResults");
  if (!node) return;
  node.innerHTML = "";
  const results = searchQuery ? collectSearchResults(searchQuery) : [];
  if (aiSearch.query) {
    const card = document.createElement("article");
    card.className = `search-result ai-answer ${aiSearch.loading ? "is-loading" : ""}`;
    card.innerHTML = `
      <strong>AI 답변</strong>
      <small>${escapeAttr(aiSearch.query)}</small>
      <p>${escapeAttr(aiSearch.loading ? "AI가 플래너 내용을 읽고 답변을 준비하고 있습니다." : aiSearch.error || aiSearch.answer)}</p>
    `;
    node.appendChild(card);
  } else if (!searchQuery) {
    const card = document.createElement("article");
    card.className = "search-result ai-answer";
    card.innerHTML = `
      <strong>AI 답변 대기</strong>
      <small>검색/질문 칸에 문장으로 질문을 입력하세요.</small>
      <p>예: “소풍간 날이 언제이지?”처럼 물으면 플래너 기록을 기준으로 답변합니다.</p>
    `;
    node.appendChild(card);
  }
  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "search-result";
    empty.innerHTML = `<strong>검색 결과 없음</strong><small>업무, 목표, 기록, 일정 내용을 검색할 수 있습니다.</small>`;
    node.appendChild(empty);
    renderSidebar();
    return;
  }
  results.forEach((result) => {
    const item = document.createElement("article");
    item.className = "search-result";
    item.innerHTML = `<strong>${result.label}</strong><small>${escapeAttr(result.text).slice(0, 160)}</small><button type="button">열기</button>`;
    item.querySelector("button").onclick = () => {
      if (result.date) selectedDate = parseDate(result.date);
      showView(result.type);
      renderAll();
    };
    node.appendChild(item);
  });
  renderSidebar();
}

function exportPlanner() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `beyond-planner-${selectedDate.getFullYear()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importPlanner(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      if (!parsed.foundation || !parsed.year || !parsed.days) throw new Error("Invalid planner file");
      state = migrateState(parsed);
      selectedSheetId = state.customSheets.activeId;
      saveState();
      renderAll();
    } catch {
      alert("복원 파일을 읽을 수 없습니다.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function renderAll() {
  ensureMonth();
  ensureWeek();
  ensureDay();
  renderSidebar();
  renderFoundation();
  renderYear();
  renderMonth();
  renderWeek();
  renderDay();
  renderProjects();
  renderNotes();
  renderSheets();
  renderSearch();
  updateStickyPanelTop();
}

function setBootMessage(message) {
  const node = el("bootMessage");
  if (node) node.textContent = message;
}

function hideBootScreen(delay = 120) {
  const boot = el("bootScreen");
  if (!boot || boot.classList.contains("is-hidden")) return;
  window.setTimeout(() => {
    boot.classList.add("is-hidden");
    window.setTimeout(() => boot.remove(), 360);
  }, delay);
}

async function setup() {
  setupSelectors();
  setupTabs();
  selectedDate = todayInPlanner();
  currentDayPanel = "main";
  daySwipeKey = "";
  showView("day");
  setBootMessage(hasInitialDeviceCache ? "이 기기의 마지막 작업을 여는 중" : "최신 플래너를 불러오는 중");
  renderAll();
  if (hasInitialDeviceCache) hideBootScreen(80);
  await hydrateServerState();
  renderAll();
  hideBootScreen(hasInitialDeviceCache ? 0 : 120);
  window.setTimeout(maybeShowDailyOpeningMessage, hasInitialDeviceCache ? 420 : 620);
  positionDaySwipe("main", true);
  window.setTimeout(() => positionDaySwipe("main", true), 180);
  window.setInterval(pullServerStateIfNewer, 15000);
  window.addEventListener("focus", pullServerStateIfNewer);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pullServerStateIfNewer();
  });
}

setup();
