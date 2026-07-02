const YEAR = 2026;
const STORAGE_KEY = "franklinClassicPlanner2026.v1";
const STATE_META_KEY = "beyondWorkPlannerStateMeta.v1";
const DEVICE_KEY = "beyondWorkDeviceId";
const LOCK_CONFIG_KEY = "beyondWorkLockConfig.v1";
const BIOMETRIC_KEY = "beyondWorkBiometricCredential.v1";
const PRIVACY_CONFIG_KEY = "beyondWorkPrivacyConfig.v1";
const AUTH_USERS_KEY = "beyondWorkAuthUsers.v1";
const AUTH_SESSION_KEY = "beyondWorkAuthSession.v1";
const ONBOARDING_DISMISSED_KEY = "beyondWorkOnboardingDismissed.v1";
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_PRIVACY_TIMEOUT_SECONDS = 180;
requirePlannerAuth();
if (new URLSearchParams(window.location.search).get("reset") === "1") {
  localStorage.removeItem(STORAGE_KEY);
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
];
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
const defaultRoles = ["개인", "가족", "일", "성장", "공헌", "건강", "관계"];
const isMacEnvironment = /Mac|iPhone|iPad/.test(navigator.platform || "") || /Macintosh|iPhone|iPad/.test(navigator.userAgent || "");
const timeSlots = Array.from({ length: 23 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

let selectedDate = todayInPlanner();
let selectedFinanceMonth = monthKey(selectedDate);
let state = loadState();
let searchQuery = "";
let aiSearch = { query: "", answer: "", loading: false, error: "" };
let syncStatus = { enabled: false, environment: "local", message: "이 기기에 저장됨", saving: false };
let serverSyncReady = false;
let serverSyncTimer = 0;
let passiveSyncTimer = 0;
let lastServerUpdatedAt = "";
let daySwipeKey = "";
let plannerMode = localStorage.getItem("beyondWorkMode") || "";
const deviceId = getDeviceId();
const dayPanelOrder = ["week", "main", "memo"];
let currentDayPanel = "main";
let dateSlideTimer = 0;
let dailyCalendarMonth = new Date(YEAR, selectedDate.getMonth(), 1);
let dailyCalendarSwipeSuppressClick = false;
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
let sheetDetailOpen = false;
let sheetSlideOpening = false;
let sheetSwipeSuppressClick = false;
let mobileDayFocusMode = "split";

function el(id) {
  return document.getElementById(id);
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
    if (!user && session.provider !== "supabase") return null;
    return {
      ...session,
      tier: normalizeAccountTier(user?.tier || session.tier),
      name: user?.name || session.name || "",
    };
  } catch {
    return null;
  }
}

function logoutPlanner() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  const next = encodeURIComponent(`${window.location.pathname}${window.location.search}${window.location.hash}`);
  window.location.href = `../login/?next=${next}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function iso(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthKey(date = selectedDate) {
  return `${YEAR}-${pad(date.getMonth() + 1)}`;
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
  return today.getFullYear() === YEAR ? today : new Date(`${YEAR}-01-01T00:00:00`);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return migrateState(JSON.parse(saved));
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
      priorityTasks: emptyRepeatRules(4),
    },
    profile: {
      age: "",
      job: "",
      goals: "",
      strengths: "",
      risks: "",
    },
    notes: {
      projects: Array.from({ length: 8 }, () => ""),
      references: Array.from({ length: 8 }, () => ""),
      freeform: "",
    },
    finance: createFinanceState(),
    projects: createProjectState(),
    customSheets: createCustomSheetsState(),
  };
}

function migrateState(nextState) {
  nextState.finance ||= createFinanceState();
  normalizeFinanceState(nextState.finance);
  nextState.projects ||= createProjectState();
  normalizeProjectState(nextState.projects);
  nextState.customSheets ||= createCustomSheetsState();
  normalizeCustomSheetsState(nextState.customSheets);
  nextState.notes ||= { projects: Array.from({ length: 8 }, () => ""), references: Array.from({ length: 8 }, () => ""), freeform: "" };
  nextState.profile ||= { age: "", job: "", goals: "", strengths: "", risks: "" };
  nextState.repeats ||= {};
  nextState.repeats.priorityTasks ||= emptyRepeatRules(4);
  while (nextState.repeats.priorityTasks.length < 4) nextState.repeats.priorityTasks.push(emptyRepeatRule());
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
    priorities.forEach(([priority]) => {
      day.tasks?.[priority]?.forEach((task) => {
        task.status ||= task.done ? "완료" : "미완료";
        task.delegate ||= "";
        if (!task.text?.trim() && task.status === "미완료" && task.priorityUnset === undefined) {
          task.priorityUnset = true;
        }
      });
    });
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
  });
  if (!customSheets.items.some((sheet) => sheet.id === customSheets.activeId)) {
    customSheets.activeId = customSheets.items[0].id;
  }
}

function applySheetTemplate(sheet, template) {
  const templates = {
    checklist: {
      columns: 5,
      headers: ["완료", "항목", "담당", "기한", "메모"],
      types: ["checkbox", "general", "general", "date", "general"],
    },
    finance: {
      columns: 6,
      headers: ["구분", "내용", "예정일", "수입", "지출", "메모"],
      types: ["general", "general", "date", "currency", "currency", "general"],
    },
    project: {
      columns: 6,
      headers: ["업무", "담당", "시작일", "마감일", "진행률", "상태"],
      types: ["general", "general", "date", "date", "number", "general"],
    },
  };
  const preset = templates[template];
  if (!preset) return;
  sheet.columns = preset.columns;
  preset.headers.forEach((header, index) => {
    const reference = `${sheetColumnLabel(index)}1`;
    sheet.cells[reference] = header;
    sheet.formats[reference] = { type: "general", bold: true, fill: "sage", align: "center" };
    for (let row = 2; row <= sheet.rows; row += 1) {
      const cellReference = `${sheetColumnLabel(index)}${row}`;
      if (preset.types[index] !== "general") sheet.formats[cellReference] = { type: preset.types[index] };
    }
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
  return Array.from({ length: 12 }, (_, index) => `${YEAR}-${pad(index + 1)}`);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  markLocalStateUpdated();
  scheduleServerSync(options.fastSync ? 120 : 650);
}

async function hydrateServerState() {
  try {
    await hydrateServerConfig();
    if (syncStatus.environment === "db" && !getAuthSession()?.accessToken) {
      serverSyncReady = false;
      syncStatus.enabled = false;
      syncStatus.message = "DB 동기화용 재로그인 필요";
      return;
    }
    const response = await fetch("/api/state", { cache: "no-store", headers: authStateHeaders() });
    if (!response.ok) throw new Error(await extractSyncError(response));
    const payload = await response.json();
    serverSyncReady = true;
    syncStatus.enabled = true;
    if (payload.exists && payload.state) {
      const localUpdatedAt = getStateMeta().updatedAt || "";
      if (hasPlannerContent(state) && isTimestampNewer(localUpdatedAt, payload.updatedAt)) {
        syncStatus.message = "이 기기 최신본 DB 저장 중";
        await persistStateToServer({ force: true });
      } else {
        storeStateFromServer(payload, "서버 동기화됨");
      }
    } else {
      if (hasPlannerContent(state)) {
        syncStatus.message = "내 기기 데이터 DB 저장 중";
        await persistStateToServer();
      } else {
        syncStatus.message = "DB 저장 준비됨";
      }
    }
  } catch (error) {
    serverSyncReady = false;
    syncStatus.enabled = false;
    syncStatus.environment = "local";
    syncStatus.message = error.message || "이 기기에 저장됨";
  }
}

async function hydrateServerConfig() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    syncStatus.environment = payload.storage === "supabase-db" ? "db" : payload.environment || "server";
  } catch {
    syncStatus.environment = "server";
  }
}

function scheduleServerSync(delay = 650) {
  if (!serverSyncReady) {
    syncStatus.message = syncStatus.environment === "db" && !getAuthSession()?.accessToken ? "DB 동기화용 재로그인 필요" : "DB 동기화 대기";
    return;
  }
  window.clearTimeout(serverSyncTimer);
  syncStatus.saving = true;
  syncStatus.message = "서버 저장 중";
  serverSyncTimer = window.setTimeout(() => {
    persistStateToServer();
  }, delay);
}

async function persistStateToServer(options = {}) {
  if (!serverSyncReady) return;
  if (!options.force && !hasPlannerContent(state)) {
    syncStatus.saving = false;
    syncStatus.message = "저장할 내용 없음";
    renderSidebar();
    return;
  }
  const updatedAt = options.bumpUpdatedAt ? markLocalStateUpdated() : getStateMeta().updatedAt || markLocalStateUpdated();
  try {
    const response = await fetch("/api/state", {
      method: "POST",
      headers: authStateHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ state, updatedAt, deviceId }),
    });
    if (!response.ok) throw new Error(await extractSyncError(response));
    const payload = await response.json().catch(() => ({}));
    if (payload.stale) {
      lastServerUpdatedAt = payload.updatedAt || lastServerUpdatedAt;
      syncStatus.enabled = true;
      syncStatus.saving = false;
      syncStatus.message = "DB 최신본 우선";
      await pullServerStateIfNewer({ force: true });
      return;
    }
    lastServerUpdatedAt = payload.updatedAt || updatedAt;
    saveStateMeta({ updatedAt: lastServerUpdatedAt, lastSyncedAt: lastServerUpdatedAt, dirty: false });
    syncStatus.enabled = true;
    syncStatus.saving = false;
    syncStatus.message = "서버 동기화됨";
    renderSidebar();
  } catch (error) {
    syncStatus.saving = false;
    syncStatus.message = error.message || "서버 저장 실패";
    renderSidebar();
  }
}

async function pullServerStateIfNewer(options = {}) {
  if (!serverSyncReady) return;
  try {
    const response = await fetch("/api/state", { cache: "no-store", headers: authStateHeaders() });
    if (!response.ok) throw new Error(await extractSyncError(response));
    const payload = await response.json();
    if (!payload.exists || !payload.state || !payload.updatedAt) return;
    if (payload.deviceId === deviceId) {
      lastServerUpdatedAt = payload.updatedAt;
      saveStateMeta({ updatedAt: payload.updatedAt, lastSyncedAt: payload.updatedAt, dirty: false });
      return;
    }
    const localMeta = getStateMeta();
    if (!options.force && localMeta.dirty && isTimestampNewer(localMeta.updatedAt, payload.updatedAt)) {
      syncStatus.message = "이 기기 최신본 DB 저장 중";
      await persistStateToServer({ force: true });
      return;
    }
    if (!options.force && lastServerUpdatedAt && !isTimestampNewer(payload.updatedAt, lastServerUpdatedAt)) return;
    storeStateFromServer(payload, "다른 기기 변경 반영됨");
    renderAll();
  } catch (error) {
    syncStatus.message = error.message || "서버 확인 실패";
    renderSidebar();
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
  saveStateMeta({ updatedAt, dirty: true, deviceId });
  return updatedAt;
}

function storeStateFromServer(payload, message) {
  state = migrateState(payload.state);
  lastServerUpdatedAt = payload.updatedAt || "";
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  saveStateMeta({ updatedAt: lastServerUpdatedAt, lastSyncedAt: lastServerUpdatedAt, dirty: false, sourceDeviceId: payload.deviceId || "" });
  syncStatus.message = message;
}

function isTimestampNewer(left, right) {
  return timestampMs(left) > timestampMs(right);
}

function timestampMs(value) {
  const ms = Date.parse(value || "");
  return Number.isFinite(ms) ? ms : 0;
}

async function extractSyncError(response) {
  try {
    const payload = await response.json();
    return payload.error || payload.message || "DB 동기화 실패";
  } catch {
    return "DB 동기화 실패";
  }
}

async function manualSyncNow() {
  syncStatus.message = "수동 동기화 중";
  renderSidebar();
  if (!serverSyncReady) await hydrateServerState();
  if (!serverSyncReady) {
    renderSidebar();
    return;
  }
  if (hasPlannerContent(state)) await persistStateToServer({ force: true });
  await pullServerStateIfNewer();
  if (!hasPlannerContent(state)) syncStatus.message = "DB 데이터 없음";
  renderSidebar();
}

async function uploadThisDeviceToDb() {
  if (!hasPlannerContent(state)) {
    syncStatus.message = "이 기기에 올릴 내용 없음";
    renderSidebar();
    window.alert("현재 이 기기에 저장할 플래너 내용이 없습니다.");
    return;
  }
  const ok = window.confirm("현재 이 기기의 내용을 DB 기준 데이터로 저장합니다. 아이폰을 기준으로 삼으려면 아이폰에서 이 버튼을 누르세요.");
  if (!ok) return;
  syncStatus.message = "이 기기 기준 DB 저장 중";
  renderSidebar();
  const ready = await prepareServerStateApi();
  if (!ready) {
    renderSidebar();
    return;
  }
  await persistStateToServer({ force: true, bumpUpdatedAt: true });
}

async function pullDbToThisDevice() {
  const ok = !hasPlannerContent(state) || window.confirm("DB 기준 데이터를 이 기기로 불러옵니다. 이 기기의 현재 로컬 내용은 DB 내용으로 바뀝니다.");
  if (!ok) return;
  syncStatus.message = "DB에서 불러오는 중";
  renderSidebar();
  const ready = await prepareServerStateApi();
  if (!ready) {
    renderSidebar();
    return;
  }
  try {
    const response = await fetch("/api/state", { cache: "no-store", headers: authStateHeaders() });
    if (!response.ok) throw new Error(await extractSyncError(response));
    const payload = await response.json();
    if (!payload.exists || !payload.state) {
      syncStatus.message = "DB 데이터 없음";
      renderSidebar();
      window.alert("아직 DB에 저장된 플래너 데이터가 없습니다. 기준 기기에서 먼저 기기→DB를 눌러주세요.");
      return;
    }
    storeStateFromServer(payload, "DB 데이터 불러옴");
    syncStatus.enabled = true;
    renderAll();
  } catch (error) {
    syncStatus.message = error.message || "DB 불러오기 실패";
    renderSidebar();
  }
}

function queuePassiveServerPull() {
  if (!serverSyncReady || document.hidden) return;
  window.clearTimeout(passiveSyncTimer);
  passiveSyncTimer = window.setTimeout(() => {
    pullServerStateIfNewer();
  }, 420);
}

async function prepareServerStateApi() {
  try {
    await hydrateServerConfig();
    if (syncStatus.environment === "db" && !getAuthSession()?.accessToken) {
      throw new Error("DB 동기화를 위해 다시 로그인하세요.");
    }
    const response = await fetch("/api/state", { cache: "no-store", headers: authStateHeaders() });
    if (!response.ok && response.status !== 404) throw new Error(await extractSyncError(response));
    serverSyncReady = true;
    syncStatus.enabled = true;
    return true;
  } catch (error) {
    serverSyncReady = false;
    syncStatus.enabled = false;
    syncStatus.message = error.message || "DB 연결 실패";
    return false;
  }
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
  state.days[key] ||= {
    tasks: { A: emptyTasks(5), B: emptyTasks(5), C: emptyTasks(5) },
    appointments: Object.fromEntries(timeSlots.map((slot) => [slot, ""])),
    appointmentMerges: {},
    memo: "",
    record: "",
    wins: "",
    carry: "",
    lesson: "",
  };
  state.days[key].memo ||= "";
  state.days[key].appointmentMerges ||= {};
  applyRepeatingPriorityTasks(key);
  return state.days[key];
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
  return date.getFullYear() === YEAR ? iso(date) : "";
}

function compassRoleNames() {
  return state.foundation.roles.map((item) => item.role).filter(Boolean).filter((role) => role !== "일");
}

function emptyTasks(count) {
  return Array.from({ length: count }, () => ({ text: "", status: "미완료", done: false, priorityUnset: true }));
}

function emptyRepeatRule() {
  return { text: "", priority: "A", frequency: "daily", weekday: 1, active: true };
}

function emptyRepeatRules(count) {
  return Array.from({ length: count }, () => emptyRepeatRule());
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
  el("dailyTodayButton").onclick = () => {
    closeDailyCalendar();
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
  el("topSyncButton").onclick = manualSyncNow;
  el("topUploadDeviceButton").onclick = uploadThisDeviceToDb;
  el("topPullDbButton").onclick = pullDbToThisDevice;
  el("lockNowButton").onclick = () => lockPlanner("수동 잠금");
  el("logoutButton").onclick = logoutPlanner;
  if (el("quickLogoutButton")) el("quickLogoutButton").onclick = logoutPlanner;
  el("privacyNowButton").onclick = () => activatePrivacyBlind("수동 보안모드가 실행되었습니다.");
  el("privacyTimeoutSelect").onchange = (event) => savePrivacyTimeout(Number(event.target.value));
  el("revealPrivacyButton").onclick = deactivatePrivacyBlind;
  el("lockFromPrivacyButton").onclick = () => lockPlanner("보안모드에서 완전 잠금으로 전환되었습니다.");
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
  el("sheetNameInput").oninput = (event) => renameCurrentSheet(event.target.value);
  el("sheetCellType").onchange = (event) => updateSelectedSheetCellFormat("type", event.target.value);
  el("sheetCellAlign").onchange = (event) => updateSelectedSheetCellFormat("align", event.target.value);
  el("sheetBoldButton").onclick = () => toggleSelectedSheetCellBold();
  el("sheetFormulaInput").onchange = (event) => updateSelectedSheetCellValue(event.target.value);
  el("sheetFormulaInput").onkeydown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    updateSelectedSheetCellValue(event.target.value);
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
  el("aiScheduleSuggest").onclick = () => applyScheduleSuggestion();
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
  setupDailyPageSwipe();
  setupDaySwipePager();
  setupMobileDayFocus();
  setupWheelDayNavigation();
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
  if (!popover.hidden) {
    showView("search");
    renderSearch();
    window.requestAnimationFrame(() => input.focus());
  }
}

function closeTopSearch() {
  const popover = el("topSearchPopover");
  if (popover) popover.hidden = true;
}

function runHeaderSearch() {
  const input = el("headerSearch");
  const popover = el("topSearchPopover");
  if (!input) return;
  updateSearch(input.value);
  if (popover && input.value.trim()) popover.hidden = true;
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
          id: textToBytes(deviceId).slice(0, 64),
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
  if (next.getFullYear() !== YEAR) return;
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
  if (!popover.hidden) {
    closeDailyCalendar(true);
    return;
  }
  dailyCalendarMonth = new Date(YEAR, selectedDate.getMonth(), 1);
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
  const next = new Date(YEAR, dailyCalendarMonth.getMonth() + delta, 1);
  if (next.getFullYear() !== YEAR) return;
  dailyCalendarMonth = next;
  renderDailyCalendar();
}

function selectDailyCalendarDate(date) {
  if (date.getFullYear() !== YEAR) return;
  closeDailyCalendar();
  const delta = daysBetween(selectedDate, date);
  if (!delta) {
    renderAll();
    return;
  }
  animateDateTitle(delta, date);
}

function renderDailyCalendar() {
  const grid = el("dailyCalendarGrid");
  if (!grid) return;
  const month = dailyCalendarMonth.getMonth();
  const monthStart = new Date(YEAR, month, 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const todayKey = iso(todayInPlanner());
  const selectedKey = iso(selectedDate);

  el("dailyCalendarMonthTitle").textContent = `${YEAR}년 ${month + 1}월`;
  el("dailyCalendarPrevMonth").disabled = month === 0;
  el("dailyCalendarNextMonth").disabled = month === 11;
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
    button.type = "button";
    button.className = [
      "daily-calendar-day",
      date.getMonth() !== month ? "is-outside" : "",
      key === selectedKey ? "is-selected" : "",
      key === todayKey ? "is-today" : "",
      hasPlans ? "has-plans" : "",
    ].filter(Boolean).join(" ");
    button.disabled = date.getFullYear() !== YEAR;
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", `${formatDate(date)}${hasPlans ? ", 기록 있음" : ""}`);
    button.setAttribute("aria-selected", String(key === selectedKey));
    button.innerHTML = `<span>${date.getDate()}</span>${hasPlans ? '<i aria-hidden="true"></i>' : ""}`;
    button.onclick = () => selectDailyCalendarDate(date);
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
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDailyCalendar(true);
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
    shiftDay(dx < 0 ? 1 : -1);
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
    node.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      startY = event.clientY;
    }, { passive: true });
    node.addEventListener("pointerup", (event) => {
      if (!isSmartphoneLayout() || mobileDayFocusMode === "split") return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dy) < 52 || Math.abs(dy) < Math.abs(dx) * 1.25) return;
      setMobileDayFocusMode("split");
    }, { passive: true });
  };
  taskPanel.addEventListener("pointerdown", expandOnInteraction("tasks"), { passive: true });
  taskPanel.addEventListener("focusin", expandOnInteraction("tasks"));
  schedulePanel.addEventListener("pointerdown", expandOnInteraction("schedule"), { passive: true });
  schedulePanel.addEventListener("focusin", expandOnInteraction("schedule"));
  resetOnVerticalSwipe(taskPanel);
  resetOnVerticalSwipe(schedulePanel);
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
  panel.classList.toggle("is-focus-tasks", activeMode === "tasks");
  panel.classList.toggle("is-focus-schedule", activeMode === "schedule");
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
  const yearStart = new Date(`${YEAR}-01-01T00:00:00`);
  const elapsed = Math.max(0, Math.min(365, daysBetween(yearStart, selectedDate) + 1));
  el("selectedDateLabel").textContent = formatDate(selectedDate);
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekRange = `${formatShortDate(weekStart)} ~ ${formatShortDate(weekEnd)}`;
  el("selectedWeekLabel").textContent = weekRange;
  el("yearProgress").textContent = `${Math.round((elapsed / 365) * 100)}%`;
  el("yearProgressText").textContent = `${elapsed} / 365`;
  el("carryoverCount").textContent = getCarryoverTasks(selectedDate).length;
  const results = searchQuery ? collectSearchResults(searchQuery) : [];
  el("searchCount").textContent = results.length;
  el("searchHint").textContent = searchQuery ? `${searchQuery}` : "검색어를 입력하세요";
  if (el("plannerSearch").value !== searchQuery) el("plannerSearch").value = searchQuery;
  if (el("headerSearch").value !== searchQuery) el("headerSearch").value = searchQuery;
  el("topYearProgress").textContent = `연간 ${Math.round((elapsed / 365) * 100)}%`;
  el("topCarryover").textContent = `이월 ${getCarryoverTasks(selectedDate).length}`;
  el("topSearchCount").textContent = `검색 ${results.length} · ${syncStatus.environment.toUpperCase()} · ${syncStatus.message}`;
  const syncButton = el("topSyncButton");
  if (syncButton) {
    syncButton.textContent = syncStatus.saving ? "저장 중" : "동기화";
    syncButton.classList.toggle("is-warning", /실패|대기|필요|준비|없음/.test(syncStatus.message) && syncStatus.message !== "서버 동기화됨");
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
  for (let month = 0; month < 12; month += 1) {
    const box = document.createElement("section");
    box.className = "mini-month";
    box.innerHTML = `<h4>${monthNames[month]}</h4><div class="mini-days"></div>`;
    const days = box.querySelector(".mini-days");
    const first = new Date(YEAR, month, 1);
    const offset = first.getDay();
    for (let i = 0; i < offset; i += 1) days.appendChild(document.createElement("span"));
    for (let day = 1; day <= new Date(YEAR, month + 1, 0).getDate(); day += 1) {
      const cell = document.createElement("span");
      const date = new Date(YEAR, month, day);
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
  return koreanCalendarEvents[key] || [];
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
  el("monthTitle").textContent = `${YEAR}년 ${monthNames[selectedDate.getMonth()]} 월간 계획`;
  document.querySelector("[data-month-field='focus']").value = current.focus || "";
  document.querySelector("[data-month-field='focus']").oninput = (event) => {
    current.focus = event.target.value;
    saveState();
  };
  renderEditableList(el("monthProjects"), current.projects, "월간 프로젝트", () => saveState());
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
  const month = selectedDate.getMonth();
  const first = new Date(YEAR, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = iso(date);
    const count = countTasksForDay(key);
    const cell = document.createElement("div");
    cell.className = `month-cell ${date.getMonth() !== month ? "is-muted" : ""} ${key === iso(selectedDate) ? "is-selected" : ""}`;
    cell.innerHTML = `<strong>${date.getDate()}</strong>${count ? `<span class="count-pill">${count} tasks</span>` : ""}`;
    cell.onclick = () => {
      selectedDate = date;
      renderAll();
    };
    node.appendChild(cell);
  }
}

function renderWeek() {
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekRange = `${formatShortDate(weekStart)} ~ ${formatShortDate(weekEnd)}`;
  el("weekTitle").textContent = `주간 일정 (${weekRange})`;

  const days = el("weekDays");
  days.innerHTML = "";
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const key = iso(date);
    const tasks = getDayTasks(key).filter((task) => task.text);
    const card = document.createElement("div");
    card.className = "week-day";
    card.innerHTML = `<strong>${weekdays[i]} · ${date.getDate()}</strong><small>${tasks.length ? tasks.slice(0, 3).map((task) => `${task.priority}. ${task.text}`).join("<br>") : "일간 페이지에 업무를 입력하세요."}</small>`;
    card.onclick = () => {
      selectedDate = date;
      showView("day");
      renderAll();
    };
    days.appendChild(card);
  }
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
  const entries = timeSlots
    .map((slot, index) => ({ slot, index, text: String(day.appointments?.[slot] || "").trim() }))
    .filter((entry) => entry.text);
  if (!entries.length) return { time: "비어 있음", text: "중요업무를 시간표에 배치하세요" };
  const selectedKey = iso(selectedDate);
  const todayKey = iso(todayInPlanner());
  const now = new Date();
  const anchorMinutes = selectedKey === todayKey ? now.getHours() * 60 + now.getMinutes() : 0;
  const next = entries.find((entry) => slotToMinutes(entry.slot) >= anchorMinutes) || entries[0];
  const span = getAppointmentSpan(day, next.slot);
  const end = span > 1 ? `~${getAppointmentEndLabel(next.index, span)}` : "";
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

function renderCoach() {
  bindProfileFields();
  const message = el("coachMessage");
  const suggestions = el("coachSuggestions");
  if (!message || !suggestions) return;
  const analysis = buildCoachAnalysis();
  message.className = `coach-card severity-${analysis.severity}`;
  message.innerHTML = `
    <strong>${analysis.title}</strong>
    <p>${analysis.message}</p>
    <small>${analysis.detail}</small>
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
  const day = ensureDay();
  const tasks = getDayTasks(iso(selectedDate));
  const openTasks = tasks.filter((task) => task.text && !task.done);
  const doneTasks = tasks.filter((task) => task.text && task.done);
  const appointments = Object.values(day.appointments).filter(Boolean).length;
  const goals = [state.profile?.goals, state.foundation.mission, ...state.year.goals].filter(Boolean).join(" ");
  let severity = "calm";
  let title = "오늘의 선택을 또렷하게 만들 시간입니다.";
  let message = "역할, 목표, 오늘의 우선업무가 서로 이어지도록 한 가지 중요한 결과를 먼저 고르세요.";
  if (openTasks.length >= 8) {
    severity = "alert";
    title = "업무가 과밀합니다.";
    message = "오늘은 A 업무를 1-2개로 좁히고, 나머지는 위임·연기·취소 중 한 가지로 정리하는 편이 좋겠습니다.";
  } else if (appointments === 0 && openTasks.length > 0) {
    severity = "warm";
    title = "업무는 있지만 시간이 비어 있습니다.";
    message = "중요업무 한 개를 시간별 일정에 실제 블록으로 배치해 실행 가능성을 높이세요.";
  } else if (doneTasks.length >= 3) {
    title = "좋은 추진력이 보입니다.";
    message = "완료 흐름이 생겼습니다. 다음 업무를 추가하기 전에 기록란에 배운 점을 짧게 남기면 패턴 학습에 도움이 됩니다.";
  }
  const suggestions = generateTaskSuggestions(openTasks, goals);
  return {
    severity,
    title,
    message,
    detail: "코칭은 입력된 프로필, 목표, 업무 완료 흐름, 일정 배치를 바탕으로 로컬에서 생성됩니다.",
    suggestions,
  };
}

function generateTaskSuggestions(openTasks, goals) {
  const suggestions = [];
  const profileGoal = state.profile?.goals?.trim();
  if (profileGoal) suggestions.push(`목표 점검: ${profileGoal.slice(0, 24)} 실행 단계 1개 정하기`);
  if (openTasks.length) suggestions.push(`가장 부담되는 업무 1개를 20분 실행 단위로 쪼개기`);
  if (!Object.values(ensureDay().appointments).some(Boolean)) suggestions.push("A업무 한 개를 오전 시간표에 고정하기");
  if (goals && !openTasks.some((task) => task.priority === "A")) suggestions.push("올해 목표와 연결되는 A업무 1개 추가하기");
  suggestions.push("오늘 끝내지 않을 일을 취소/연기/위임으로 정리하기");
  return [...new Set(suggestions)].slice(0, 5);
}

function addSuggestedTask(text) {
  const day = ensureDay();
  day.tasks.A.push({ text, status: "미완료", done: false, priorityUnset: false });
  saveState();
  showView("day");
  renderAll();
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
  const suggestions = generateTaskSuggestions(getDayTasks(iso(selectedDate)).filter((task) => task.text && !task.done), state.profile?.goals || "").slice(0, 3);
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

function applyScheduleSuggestion() {
  const day = ensureDay();
  const firstOpen = getDayTasks(iso(selectedDate)).find((task) => task.text && !task.done);
  if (!firstOpen) return;
  const target = day.appointments["09:00"] ? "10:00" : "09:00";
  day.appointments[target] ||= firstOpen.text;
  saveState();
  renderDay();
}

function applyMemoPrompt() {
  const day = ensureDay();
  const prompt = "오늘 관찰: 가장 중요한 일, 막힌 지점, 내일의 첫 행동을 각각 한 줄로 적습니다.";
  day.memo = day.memo ? `${day.memo}\n${prompt}` : prompt;
  saveState();
  renderDay();
}

function shouldRepeatOnDate(rule, date) {
  if (!rule.active || !rule.text?.trim()) return false;
  if (rule.frequency === "daily") return true;
  if (rule.frequency === "weekly") return Number(rule.weekday) === date.getDay();
  return false;
}

function applyRepeatingPriorityTasks(key = iso(selectedDate)) {
  const day = state.days[key];
  if (!day) return;
  const date = parseDate(key);
  state.repeats ||= { priorityTasks: emptyRepeatRules(4) };
  state.repeats.priorityTasks.forEach((rule, index) => {
    if (!shouldRepeatOnDate(rule, date)) return;
    const priority = ["A", "B", "C"].includes(rule.priority) ? rule.priority : "A";
    const repeatId = `repeat-${index}-${key}`;
    let existingPriority = "";
    let existingTask = null;
    priorities.some(([candidate]) => {
      existingTask = day.tasks[candidate].find((task) => task.repeatId === repeatId);
      existingPriority = existingTask ? candidate : "";
      return Boolean(existingTask);
    });
    if (existingTask) {
      existingTask.text = rule.text.trim();
      if (existingPriority && existingPriority !== priority) {
        day.tasks[existingPriority] = day.tasks[existingPriority].filter((task) => task.repeatId !== repeatId);
        day.tasks[priority].push(existingTask);
      }
      return;
    }
    day.tasks[priority].push({
      text: rule.text.trim(),
      status: "미완료",
      done: false,
      repeatId,
    });
  });
}

function renderRepeatPriorityList() {
  const node = el("repeatPriorityList");
  if (!node) return;
  state.repeats ||= { priorityTasks: emptyRepeatRules(4) };
  node.innerHTML = "";
  state.repeats.priorityTasks.forEach((rule, index) => {
    const row = document.createElement("div");
    row.className = "repeat-rule-row";
    row.innerHTML = `
      <input type="checkbox" ${rule.active ? "checked" : ""} aria-label="반복 사용" />
      <select aria-label="중요도">
        ${["A", "B", "C"].map((priority) => `<option value="${priority}" ${rule.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}
      </select>
      <input type="text" value="${escapeAttr(rule.text)}" placeholder="반복 업무" />
      <select aria-label="반복 주기">
        ${repeatFrequencies.map(([value, label]) => `<option value="${value}" ${rule.frequency === value ? "selected" : ""}>${label}</option>`).join("")}
      </select>
      <select aria-label="요일" ${rule.frequency === "daily" ? "disabled" : ""}>
        ${weekdays.map((day, dayIndex) => `<option value="${dayIndex}" ${Number(rule.weekday) === dayIndex ? "selected" : ""}>${day}</option>`).join("")}
      </select>
    `;
    const [active, priority, text, frequency, weekday] = row.querySelectorAll("input, select");
    active.onchange = () => {
      rule.active = active.checked;
      saveState();
      renderAll();
    };
    priority.onchange = () => {
      rule.priority = priority.value;
      saveState();
      renderAll();
    };
    text.oninput = () => {
      rule.text = text.value;
      saveState();
    };
    text.onchange = () => renderAll();
    frequency.onchange = () => {
      rule.frequency = frequency.value;
      saveState();
      renderAll();
    };
    weekday.onchange = () => {
      rule.weekday = Number(weekday.value);
      saveState();
      renderAll();
    };
    node.appendChild(row);
  });
  const add = document.createElement("button");
  add.className = "add-row repeat-add";
  add.type = "button";
  add.textContent = "반복 업무 추가";
  add.onclick = () => {
    state.repeats.priorityTasks.push(emptyRepeatRule());
    saveState();
    renderDay();
  };
  node.appendChild(add);
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
    saveState({ fastSync: true });
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
  `;
  const cycle = row.querySelector(".task-cycle");
  const prioritySelect = row.querySelector(".priority-select");
  const delegateInput = row.querySelector(".delegate-input");
  const postponeSelect = row.querySelector(".postpone-select");
  const postponeDate = row.querySelector(".postpone-date");
  const text = row.querySelector("input[type='text']:last-child");
  cycle.onclick = () => {
    cycleTaskMarker(task);
    saveState({ fastSync: true });
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
      saveState({ fastSync: true });
    };
  }
  if (postponeSelect) {
    postponeSelect.onchange = () => {
      task.postponeMode = postponeSelect.value;
      saveState({ fastSync: true });
      renderAll();
    };
  }
  if (postponeDate) {
    postponeDate.onchange = () => schedulePostponedTask(task, priority, postponeDate.value);
  }
  text.oninput = () => {
    task.text = text.value;
    task.priorityUnset = false;
    saveState({ fastSync: true });
    renderSidebar();
    renderMonthCalendar();
    renderWeek();
  };
  return row;
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
  if (task.priorityUnset && !task.text?.trim()) return "선택";
  return ["A", "B", "C"].includes(priority) ? priority : "선택";
}

function shouldStrikeTask(task) {
  return task.done || ["완료", "위임", "취소", "연기"].includes(task.status);
}

function handlePriorityMenuChange(task, fromPriority, index, value) {
  if (value === "취소" || value === "연기") {
    task.status = value;
    task.done = false;
    saveState({ fastSync: true });
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
  saveState({ fastSync: true });
  renderAll();
}

function moveTaskPriority(fromPriority, index, toPriority) {
  if (fromPriority === toPriority) {
    saveState({ fastSync: true });
    renderAll();
    return;
  }
  const day = ensureDay();
  const [task] = day.tasks[fromPriority].splice(index, 1);
  if (!task) return;
  day.tasks[toPriority].push(task);
  saveState({ fastSync: true });
  renderAll();
}

function schedulePostponedTask(task, priority, targetDate) {
  if (!targetDate || parseDate(targetDate).getFullYear() !== YEAR) return;
  task.postponeDate = targetDate;
  task.postponeId ||= `postpone-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const targetDay = ensureDay(targetDate);
  const targetPriority = ["A", "B", "C"].includes(priority) ? priority : "A";
  const exists = targetDay.tasks[targetPriority].some((item) => item.postponedFrom === task.postponeId);
  if (!exists && task.text?.trim()) {
    targetDay.tasks[targetPriority].push({
      text: task.text.trim(),
      status: "미완료",
      done: false,
      priorityUnset: false,
      postponedFrom: task.postponeId,
    });
  }
  saveState({ fastSync: true });
  renderAll();
}

function renderCarryoverTask(task) {
  const row = document.createElement("div");
  const selectedKey = iso(selectedDate);
  const completedHere = isCarryoverCompletedOn(task, selectedKey);
  const marker = completedHere ? "check" : getTaskMarker(task);
  row.className = `task-row carryover-row priority-${task.priority === "A" ? "a" : "none"} marker-${marker} ${completedHere ? "done" : ""}`;
  row.innerHTML = `<button class="task-cycle" type="button" aria-label="이월업무 완료 상태 변경">${getTaskMarkerLabel(marker)}</button><div class="task-status-cell" data-status="${escapeAttr(task.priority)}"><select class="priority-select" disabled><option>${task.priority}</option></select></div><input class="task-text-input" type="text" value="${escapeAttr(task.text)}" />`;
  row.querySelector(".task-cycle").onclick = () => {
    updateCarryoverTaskMarker(task);
  };
  row.querySelector(".task-text-input").oninput = (event) => {
    updateCarryoverTaskText(task, event.target.value);
  };
  return row;
}

function updateCarryoverTaskMarker(taskRef) {
  const source = state.days[taskRef.date]?.tasks?.[taskRef.priority]?.[taskRef.index];
  if (!source) return;
  const completedKey = iso(selectedDate);
  if (isCarryoverCompletedOn(source, completedKey)) {
    delete source.carryoverDoneDate;
  } else {
    source.carryoverDoneDate = completedKey;
  }
  source.done = false;
  if (source.status === "완료") source.status = "미완료";
  saveState({ fastSync: true });
  renderAll();
}

function updateCarryoverTaskText(taskRef, value) {
  const source = state.days[taskRef.date]?.tasks?.[taskRef.priority]?.[taskRef.index];
  if (!source) return;
  source.text = value;
  saveState({ fastSync: true });
  renderSidebar();
  renderMonthCalendar();
  renderWeek();
}

function formatCarryoverDate(value) {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function renderAppointments(day) {
  const node = el("appointmentList");
  node.innerHTML = "";
  timeSlots.forEach((slot, slotIndex) => {
    if (isCoveredAppointmentSlot(day, slot)) return;
    const span = getAppointmentSpan(day, slot);
    const endSlot = getAppointmentEndLabel(slotIndex, span);
    const row = document.createElement("div");
    const value = day.appointments[slot] || "";
    row.className = `appointment-row ${value ? "is-filled" : ""} ${span > 1 ? "is-merged" : ""}`;
    row.style.setProperty("--slot-span", span);
    const nextIndex = slotIndex + span;
    const canMerge = nextIndex < timeSlots.length && !value && !day.appointments[timeSlots[nextIndex]];
    row.innerHTML = `
      <span class="appointment-time ${span > 1 ? "range" : ""}">${span > 1 ? `<b>${slot}</b><b>${endSlot}</b>` : slot}</span>
      <input type="text" value="${escapeAttr(value)}" placeholder="일정" />
      ${span > 1 ? `<button class="split-appointment" type="button" title="분리">-</button>` : ""}
      ${canMerge ? `<button class="appointment-merge-button" type="button" title="아래 시간칸과 합치기">+</button>` : ""}
    `;
    row.querySelector("input").oninput = (event) => {
      day.appointments[slot] = event.target.value;
      saveState();
      row.classList.toggle("is-filled", Boolean(event.target.value));
      if (event.target.value) {
        row.querySelector(".appointment-merge-button")?.remove();
        const previousButton = row.previousElementSibling?.querySelector?.(".appointment-merge-button");
        previousButton?.remove();
      }
      renderSidebar();
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

function getAppointmentSpan(day, slot) {
  return Math.max(1, Number(day.appointmentMerges?.[slot] || 1));
}

function isCoveredAppointmentSlot(day, slot) {
  const index = timeSlots.indexOf(slot);
  return timeSlots.some((start, startIndex) => {
    if (start === slot || startIndex >= index) return false;
    const span = getAppointmentSpan(day, start);
    return startIndex + span > index;
  });
}

function getAppointmentEndLabel(slotIndex, span) {
  const minutes = 8 * 60 + (slotIndex + span) * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function mergeAppointmentSlot(day, slot) {
  const startIndex = timeSlots.indexOf(slot);
  if (startIndex < 0) return;
  const span = getAppointmentSpan(day, slot);
  const nextIndex = startIndex + span;
  if (nextIndex >= timeSlots.length) return;
  const nextSlot = timeSlots[nextIndex];
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
  const ranges = {
    all: [0, timeSlots.length],
    am: [0, 8],
    pm: [8, timeSlots.length - 8],
  };
  const [startIndex, span] = ranges[range] || ranges.all;
  const startSlot = timeSlots[startIndex];
  const covered = timeSlots.slice(startIndex, startIndex + span);
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
    finance: "자금표",
    project: "프로젝트표",
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
    node.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      startY = event.clientY;
    }, { passive: true });
    node.addEventListener("pointerup", (event) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) < 58 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
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
  if (!window.confirm(`'${sheet.name}' 시트를 삭제할까요?`)) return;
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
  if (axis === "row") sheet.rows = Math.max(SHEET_MIN_ROWS, Math.min(SHEET_MAX_ROWS, sheet.rows + delta));
  if (axis === "column") sheet.columns = Math.max(SHEET_MIN_COLUMNS, Math.min(SHEET_MAX_COLUMNS, sheet.columns + delta));
  pruneSheetOutsideBounds(sheet);
  selectedSheetCell = clampSheetCellReference(selectedSheetCell, sheet);
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
  const header = Array.from({ length: sheet.columns }, (_, column) => `<th scope="col">${sheetColumnLabel(column)}</th>`).join("");
  const body = Array.from({ length: sheet.rows }, (_, row) => {
    const cells = Array.from({ length: sheet.columns }, (_, column) => renderSheetCellMarkup(sheet, row, column)).join("");
    return `<tr><th class="sheet-row-number" scope="row">${row + 1}</th>${cells}</tr>`;
  }).join("");
  table.innerHTML = `<thead><tr><th class="sheet-corner" aria-label="전체 시트"></th>${header}</tr></thead><tbody>${body}</tbody>`;
  table.querySelectorAll("[data-sheet-cell]").forEach((cell) => bindSheetCell(cell, sheet));
}

function renderSheetCellMarkup(sheet, row, column) {
  const reference = `${sheetColumnLabel(column)}${row + 1}`;
  const raw = String(sheet.cells[reference] ?? "");
  const format = getSheetCellFormat(sheet, reference);
  const classes = [
    "sheet-cell",
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
    if (event.key !== "Enter") return;
    event.preventDefault();
    sheet.cells[reference] = input.value;
    saveState();
    moveSheetSelection(1, 0, sheet);
  };
}

function selectSheetCell(reference) {
  const sheet = getCurrentSheet();
  selectedSheetCell = clampSheetCellReference(reference, sheet);
  el("customSheetGrid").querySelectorAll("[data-sheet-cell]").forEach((cell) => {
    cell.classList.toggle("is-selected", cell.dataset.sheetCell === selectedSheetCell);
  });
  renderSelectedSheetCellControls(sheet);
}

function moveSheetSelection(rowDelta, columnDelta, sheet = getCurrentSheet()) {
  const current = parseSheetCellReference(selectedSheetCell) || { row: 0, column: 0 };
  const row = Math.max(0, Math.min(sheet.rows - 1, current.row + rowDelta));
  const column = Math.max(0, Math.min(sheet.columns - 1, current.column + columnDelta));
  selectedSheetCell = `${sheetColumnLabel(column)}${row + 1}`;
  renderSheetGrid(sheet);
  renderSelectedSheetCellControls(sheet);
  window.requestAnimationFrame(() => el("customSheetGrid").querySelector(`[data-sheet-cell="${selectedSheetCell}"] input`)?.focus());
}

function renderSelectedSheetCellControls(sheet) {
  const reference = clampSheetCellReference(selectedSheetCell, sheet);
  const format = getSheetCellFormat(sheet, reference);
  el("sheetCellReference").textContent = reference;
  el("sheetFormulaInput").value = String(sheet.cells[reference] ?? "");
  el("sheetCellType").value = format.type;
  el("sheetCellAlign").value = format.align;
  el("sheetBoldButton").classList.toggle("is-active", format.bold);
  el("sheetBoldButton").setAttribute("aria-pressed", String(format.bold));
  document.querySelectorAll("[data-sheet-fill]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sheetFill === format.fill);
  });
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
  node.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
    startY = event.clientY;
  }, { passive: true });
  node.addEventListener("pointerup", (event) => {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) < 58 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (page === "list" && dx < 0 && state.projects.items.length) {
      projectSlideOpening = !projectDetailOpen;
      projectDetailOpen = true;
      projectSwipeSuppressClick = true;
      renderProjects();
      window.setTimeout(() => {
        projectSwipeSuppressClick = false;
      }, 260);
    }
    if (page === "detail") {
      closeProjectDetail();
    }
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
  if (["title", "nextAction", "dueDate", "status"].includes(field)) syncProjectToTask(project);
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

function syncProjectToTask(project) {
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
    const monthNumber = Number(selectedFinanceMonth.split("-")[1]);
    title.textContent = `${YEAR}년 ${monthNumber}월 자금 체크`;
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
  const rows = state.finance.months[key] || [];
  const monthPanel = document.createElement("section");
  monthPanel.className = "finance-month-card";
  const monthNumber = Number(key.split("-")[1]);
  monthPanel.innerHTML = `
    <h4>
      <span>2026년 ${monthNumber}월 자금 체크</span>
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
  const keys = financeMonthKeys();
  const index = keys.indexOf(selectedFinanceMonth);
  const nextIndex = Math.max(0, Math.min(keys.length - 1, index + delta));
  if (nextIndex === index) return;
  selectedFinanceMonth = keys[nextIndex];
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
  const [removed] = rows.splice(index, 1);
  if (removed?.id) removeFinanceLinkedTask(removed.id, Boolean(options.fixed));
  if (!rows.length) rows.push(emptyMoneyItem(options.fixed ? "지출" : "지출"));
  saveState();
  renderNotes();
}

function updateMoneyItem(rows, index, field, value, options = {}) {
  rows[index][field] = value;
  if (options.monthKey) syncMoneyItemToTask(rows[index], options.monthKey);
  if (options.fixed) syncFixedMoneyItemToTasks(rows[index]);
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

function syncMoneyItemToTask(item, key, linkId = item.id, fixed = false) {
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

function syncFixedMoneyItemToTasks(item) {
  removeFinanceLinkedTask(item.id, true);
  if (!item.title?.trim() || !Number(item.dueDay)) return;
  Object.keys(createFinanceMonths()).forEach((key) => {
    if (isFixedMoneyActiveForMonth(item, key)) syncMoneyItemToTask(item, key, `${item.id}-${key}`, true);
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
      if (completedKey && completedKey < currentKey) return false;
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
  link.download = `beyond-planner-${YEAR}.json`;
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

async function setup() {
  setupSelectors();
  setupTabs();
  selectedDate = todayInPlanner();
  currentDayPanel = "main";
  daySwipeKey = "";
  showView("day");
  await hydrateServerState();
  renderAll();
  positionDaySwipe("main", true);
  window.setTimeout(() => positionDaySwipe("main", true), 180);
  window.setInterval(pullServerStateIfNewer, 15000);
  window.addEventListener("focus", pullServerStateIfNewer);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pullServerStateIfNewer();
  });
}

setup();
