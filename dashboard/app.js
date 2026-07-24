const STORAGE_KEY = "franklinClassicPlanner2026.v1";
const LAST_DISPLAY_CACHE_KEY = "beyondWorkLastDisplayState.v1";
const STATE_META_KEY = "beyondWorkPlannerStateMeta.v1";
const INSTALLATION_KEY = "beyondWorkInstallationId";
const LOCK_CONFIG_KEY = "beyondWorkLockConfig.v1";
const BIOMETRIC_KEY = "beyondWorkBiometricCredential.v1";
const PRIVACY_CONFIG_KEY = "beyondWorkPrivacyConfig.v1";
const AUTH_USERS_KEY = "beyondWorkAuthUsers.v1";
const AUTH_SESSION_KEY = "beyondWorkAuthSession.v1";
const ONBOARDING_COLLAPSED_KEY = "beyondWorkOnboardingCollapsed.v1";
const DAILY_OPENING_SEEN_KEY = "beyondWorkDailyOpeningSeen.v1";
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_PRIVACY_TIMEOUT_SECONDS = 180;
requirePlannerAuth();
if (new URLSearchParams(window.location.search).get("reset") === "1") {
  localStorage.removeItem(plannerStorageKey());
  localStorage.removeItem(plannerStateMetaKey());
  localStorage.removeItem(LAST_DISPLAY_CACHE_KEY);
  history.replaceState(null, "", window.location.pathname);
}
const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const weekdayLabelsKo = ["日", "月", "火", "水", "木", "金", "土"];
const weekdayLabelsEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayNamesKo = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
const weekdayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdays = weekdayLabelsKo;
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
const solarCalendarEventRules = [
  { month: 1, day: 1, label: "신정", type: "holiday", substitute: false },
  { month: 3, day: 1, label: "삼일절", type: "national", substitute: true },
  { month: 5, day: 1, label: "노동절", type: "holiday", substitute: false },
  { month: 5, day: 5, label: "어린이날", type: "holiday", substitute: true },
  { month: 6, day: 6, label: "현충일", type: "holiday", substitute: false },
  { month: 7, day: 17, label: "제헌절", type: "national", substitute: false },
  { month: 8, day: 15, label: "광복절", type: "national", substitute: true },
  { month: 10, day: 3, label: "개천절", type: "national", substitute: true },
  { month: 10, day: 9, label: "한글날", type: "national", substitute: true },
  { month: 12, day: 25, label: "성탄절", type: "holiday", substitute: true },
];
const koreanHolidayYearCache = new Map();
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
  ["yearly", "매년/기념일"],
];
const repeatWeekOptions = [
  ["every", "매주"],
  ["1", "첫째주"],
  ["2", "둘째주"],
  ["3", "셋째주"],
  ["4", "넷째주"],
  ["5", "다섯째주"],
];
const repeatFrequencySortOrder = { yearly: 0, monthly: 1, weekly: 2, daily: 3 };
const repeatCarryOptions = [
  ["auto", "기본이월"],
  ["carry", "이월함"],
  ["none", "이월안함"],
];
const REPEAT_PRIORITY_MIN_ROWS = 0;
const DAILY_EMPTY_TASK_MIN = 3;
const DAILY_EMPTY_TASK_MAX = 5;
const taskPriorityOptions = ["선택", "A", "B", "C", "취소", "연기"];
const moneyTypes = ["수입", "지출", "이자", "카드대금", "용돈", "기타"];
const moneyCategories = ["", "카드대금", "적금/이자", "할부금", "렌탈", "관리비", "세금", "보험", "인건비", "생활비", "사업비", "기타"];
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
const defaultRoles = ["Me", "Family", "Work", "Growth", "Service", "Health", "People"];
const isMacEnvironment = /Mac|iPhone|iPad/.test(navigator.platform || "") || /Macintosh|iPhone|iPad/.test(navigator.userAgent || "");
const timeSlots = Array.from({ length: 23 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});
const hourlyTimeSlots = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
const personaTypes = {
  ceo: "CEO/대표",
  entrepreneur: "개인사업자/프리랜서",
  owner: "자영업자/매장 운영자",
  employee: "직장인/팀원",
  manager: "관리자/팀장",
  student: "학생",
  growth: "Self Growth",
  secondLife: "Next Chapter",
  other: "기타",
};

const defaultProfileFields = {
  personaType: "",
  personaTypesSecondary: [],
  personaCustom: "",
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

const defaultAppSettings = {
  language: "ko",
  schedule: {
    startTime: "08:00",
    endTime: "19:30",
  },
  sections: {
    menu: {
      week: true,
      month: true,
      projects: true,
      notes: true,
      sheets: true,
      year: true,
    },
    day: { dailyPulseVisible: true },
    week: { carryForwardCompass: true },
    month: { showCalendarAnnotations: true },
    projects: { slideDetail: true },
    money: { showAmounts: true },
    sheets: { titleHeaders: true },
    backup: {
      format: "json+xls",
      email: { frequency: "off", recipient: "", lastSentAt: "" },
    },
  },
};

const languageLabels = {
  en: {
    day: "Today",
    week: "Week",
    month: "Month",
    projects: "Projects",
    notes: "Money",
    sheets: "Sheets",
    year: "Year",
    foundation: "Settings",
  },
  ko: {
    day: "오늘",
    week: "주간",
    month: "월간",
    projects: "프로젝트",
    notes: "Money",
    sheets: "시트",
    year: "연간",
    foundation: "설정",
  },
};

const commonUiLabels = {
  en: {
    searchToggle: "Ask",
    run: "Go",
    searchEyebrow: "Search",
    quickSearch: "Quick Search",
    searchPlaceholder: "Search or ask",
    topCarryover: "Carryover",
    topSearchCount: "Search",
    loginNeeded: "Login required",
  },
  ko: {
    searchToggle: "검색/질문",
    run: "실행",
    searchEyebrow: "검색",
    quickSearch: "빠른 검색",
    searchPlaceholder: "검색 또는 질문",
    topCarryover: "이월",
    topSearchCount: "검색",
    loginNeeded: "로그인 필요",
  },
};

const settingsLanguageLabels = {
  en: {
    titleEyebrow: "Settings",
    title: "My Setup",
    shortcuts: { year: "Year Calendar", day: "Today View", search: "Ask" },
    tabs: { user: "About Me", app: "App Options" },
    appTitle: "Section Options",
    primaryLanguage: "Language",
    appItems: [
      ["Today · Top Tasks", "Keep the daily task list compact, carry unfinished items forward, and read time hints such as 2:00 or (14:00).", "DB saved"],
      ["Main Menu", "Choose which sections appear in the main menu. Today and Settings always stay visible.", ""],
      ["Today · Schedule", "Choose 30 min or 1 hour blocks. Set the visible start and end time for your day.", ""],
      ["Week", "Weekly Focus, role actions, Sunday-start weeks, and carry-forward items.", "Sun start"],
      ["Month · Year", "Sunday-start calendars, Korean holidays, lunar notes, anniversaries, and year navigation.", "YYYY. MM. DD."],
      ["Money", "Show or hide amounts when Money items appear in Today or Week.", ""],
      ["Projects", "Project list, slide-in detail page, next action, and project money simulation.", "Slide detail"],
      ["Sheets", "Numbers-style custom sheets, title rows/columns, templates, resizing, and CSV export.", "Templates"],
      ["Ask · AI", "Ask questions, get section coaching, and use your profile, goals, tasks, and schedule as context.", "Allowed accounts"],
      ["Email Backup", "Email the same Excel backup generated by Export. File export and import stay in the top controls.", ""],
    ],
    steps: [
      ["My Why", "Write the simple reason and rule that guide your choices."],
      ["What Matters", "Pick the things that deserve your time first."],
      ["Roles & Goals", "Name your key roles and the results you want from each one."],
      ["About Me", "Tell the planner who you are, what you do, and what rhythm works for you."],
    ],
    benefit: "Start with the basic fields AI coaching actually uses. Add deeper details later when you want more precise priority and schedule guidance.",
    profileMap: ["Basics", "Direction", "Rhythm", "Health"],
    profileStages: [
      ["Basics", "Minimum coaching context", "These five answers are enough for the planner to adjust daily tasks, schedule suggestions, and coaching tone."],
      ["Detail 1", "Work Direction", "Clarify your role, responsibilities, and the rules you want to keep when making decisions."],
      ["Detail 2", "Execution Rhythm", "Tell the planner when you focus well and when you tend to delay, so schedule advice stays realistic."],
      ["Detail 3", "Health & Recovery", "Optional information that helps prevent overload and supports sustainable planning."],
    ],
    profileLabels: {
      personaType: "Closest Type",
      personaTypesSecondary: "Other Type",
      personaCustom: "Current Work",
      age: "Life Stage",
      job: "Title / Role",
      roles: "People / Duties I Carry",
      goals: "What I Want to Change This Year",
      decisionPrinciples: "Rules I Keep",
      currentChallenges: "Main Issue This Month",
      strengths: "How Work Goes Well",
      risks: "When I Delay",
      energyWindow: "Best Energy",
      coachingStyle: "Preferred Coaching Style",
      healthStatus: "Body Status",
      medications: "Care / Medication",
      exerciseLimits: "Exercise Limits",
      activityLevel: "Activity Level",
      exerciseGoal: "Movement Goal",
      recoveryPattern: "Sleep / Recovery",
    },
    placeholders: {
      mission: "What do I stand for? What rule should guide my choices?",
      value: "What matters",
      personaCustom: "e.g. I handle real estate development and operations",
      age: "e.g. 40s, 52",
      job: "e.g. CEO, manager, trainer",
      roles: "e.g. company, family, investment, health, team management",
      goals: "e.g. stabilize cash flow, recover health, finish delayed projects",
      decisionPrinciples: "e.g. no overpromising, check cash first, protect family time",
      currentChallenges: "e.g. delayed schedule, money checks, low energy",
      strengths: "e.g. faster alone, clearer with numbers, stronger after meetings",
      risks: "e.g. delay big tasks, cannot refuse requests, work late at night",
      energyWindow: "e.g. 9-11 AM, after 10 PM",
      coachingStyle: "e.g. short and direct, warm, numbers first",
      healthStatus: "e.g. back pain, blood pressure, fatigue",
      medications: "Medicine, checkups, care routines",
      exerciseLimits: "Health cautions, movements to avoid, medication/checkup notes",
      activityLevel: "e.g. mostly sitting, walk twice a week",
      exerciseGoal: "e.g. walk 20 min daily, rebuild strength",
      recoveryPattern: "e.g. 6 hours sleep, tired after lunch",
    },
    roleLabels: ["Role", "Goal", "Recharge"],
  },
  ko: {
    titleEyebrow: "설정",
    title: "나에게 맞추기",
    shortcuts: { year: "연간 달력", day: "오늘 화면", search: "검색/질문" },
    tabs: { user: "사용자 설정", app: "앱 설정" },
    appTitle: "섹션별 설정",
    primaryLanguage: "언어",
    appItems: [
      ["오늘 · 우선업무", "우선업무를 촘촘하게 유지하고, 미완료 이월과 10:00 같은 시간 표기를 자동 반영합니다.", "DB 저장"],
      ["메인 메뉴", "필요한 섹션만 메인 메뉴에 보이게 합니다. 오늘과 설정은 항상 표시됩니다.", ""],
      ["오늘 · 시간별 일정", "30분/1시간 단위와 하루에 보일 시작시간, 종료시간을 설정합니다.", ""],
      ["주간", "위클리 포커스, 역할별 핵심행동, 日 시작 주간, 이월 항목을 관리합니다.", "日 시작"],
      ["월간 · 연간", "日 시작 달력, 한국 공휴일, 음력 표시, 기념일, 연도 이동을 관리합니다.", "년. 월. 일."],
      ["Money", "오늘/주간에 Money 항목이 보일 때 금액 표시 여부를 정합니다.", ""],
      ["프로젝트", "프로젝트 목록, 세부 페이지, 다음 행동, 프로젝트 자금 시뮬레이션을 관리합니다.", "슬라이드 상세"],
      ["시트", "Numbers 스타일 커스텀 시트, 제목행/열, 템플릿, 크기 조정, CSV 내보내기를 관리합니다.", "템플릿"],
      ["검색 · AI", "입력한 목표, 업무, 일정, 사용자 정보를 바탕으로 질문과 섹션별 코칭을 제공합니다.", "허용 계정"],
      ["메일 백업", "상단 내보내기와 같은 Excel 백업을 메일로 받을 주기만 정합니다. 가져오기는 상단 버튼에서 처리합니다.", ""],
    ],
    steps: [
      ["나의 기준", "선택을 이끌어 줄 간단한 이유와 원칙을 적습니다."],
      ["중요한 것", "내 시간을 먼저 받을 가치가 있는 것을 고릅니다."],
      ["역할과 목표", "내 주요 역할과 각 역할에서 원하는 결과를 정리합니다."],
      ["나의 정보", "내가 누구인지, 어떤 일을 하는지, 어떤 리듬이 맞는지 알려주세요."],
    ],
    benefit: "AI 코칭에 바로 필요한 기본 정보만 먼저 적습니다. 세부 입력은 필요할 때 조금씩 채우면 일정 제안과 우선순위 판단이 더 정확해집니다.",
    profileMap: ["기본 입력", "일의 방향", "실행 리듬", "건강·회복"],
    profileStages: [
      ["기본 입력", "AI 코칭의 최소 정보", "이 다섯 가지만 입력해도 오늘의 업무, 일정, 코칭 문장이 사용자 상황에 맞게 조정됩니다."],
      ["세부 입력 1", "일의 방향", "어떤 역할을 맡고 있고, 결정할 때 무엇을 지켜야 하는지 정리합니다."],
      ["세부 입력 2", "실행 리듬", "언제 집중하고, 어떤 상황에서 미루는지 알면 일정 배치가 현실적이 됩니다."],
      ["세부 입력 3", "건강과 회복", "몸 상태와 회복 리듬은 일정 과부하를 막는 선택 정보입니다."],
    ],
    profileLabels: {
      personaType: "가장 가까운 모습",
      personaTypesSecondary: "다른 모습",
      personaCustom: "지금 하는 일",
      age: "연령대",
      job: "직함/현재 역할",
      roles: "챙겨야 할 사람/일",
      goals: "올해 바꾸고 싶은 것",
      decisionPrinciples: "꼭 지킬 것",
      currentChallenges: "이번 달 가장 신경 쓰이는 일",
      strengths: "일이 잘 풀리는 방식",
      risks: "자주 미루는 상황",
      energyWindow: "집중이 잘 되는 시간",
      coachingStyle: "원하는 코칭 방식",
      healthStatus: "몸 상태",
      medications: "관리/투약",
      exerciseLimits: "주의할 점",
      activityLevel: "활동량",
      exerciseGoal: "운동 목표",
      recoveryPattern: "수면/회복",
    },
    placeholders: {
      mission: "나는 무엇을 기준으로 선택할 것인가? 오늘과 미래를 이끄는 원칙을 적어보세요.",
      value: "중요한 가치",
      personaCustom: "예: 부동산 개발과 운영을 챙깁니다",
      age: "예: 40대, 52세",
      job: "예: 대표, 매니저, 트레이너",
      roles: "예: 회사 운영, 가족, 투자, 건강, 팀 관리",
      goals: "예: 현금흐름 안정, 건강 회복, 미뤄둔 프로젝트 끝내기",
      decisionPrinciples: "예: 무리한 약속 금지, 현금 먼저 확인, 가족시간 지키기",
      currentChallenges: "예: 일정이 밀림, 자금 확인, 체력 저하, 가족시간 부족",
      strengths: "예: 혼자 정리할 때, 숫자로 볼 때, 사람을 만나면 빨라짐",
      risks: "예: 일이 너무 크면 미룸, 부탁을 거절 못함, 밤에 몰아서 함",
      energyWindow: "예: 오전 9-11시, 밤 10시 이후",
      coachingStyle: "예: 짧고 단호하게, 따뜻하게, 숫자로",
      healthStatus: "예: 허리 통증, 혈압 관리, 피로감",
      medications: "복용약, 검진, 관리 루틴",
      exerciseLimits: "피해야 할 운동, 관리 중인 건강 이슈, 검진/투약 메모",
      activityLevel: "예: 앉아 있는 시간이 많음, 주 2회 걷기",
      exerciseGoal: "예: 매일 20분 걷기, 근력 회복",
      recoveryPattern: "예: 6시간 수면, 점심 이후 피곤함",
    },
    roleLabels: ["역할", "목표", "회복"],
  },
};

let selectedDate = todayInPlanner();
let selectedFinanceMonth = monthKey(selectedDate);
let activeMoneyDraftId = "";
let hasInitialDeviceCache = hasCachedPlannerState();
let state = loadState();
let searchQuery = "";
let aiSearch = { query: "", answer: "", loading: false, error: "" };
let activeCoachSection = "";
let activeCoachTab = "coach";
let saveStatus = { ready: false, environment: "db", message: "저장 확인 중", saving: false };
let accountSaveReady = false;
let accountSaveTimer = 0;
let passiveRefreshTimer = 0;
let lastServerUpdatedAt = "";
let daySwipeKey = "";
let dayPanelProgrammaticScrollUntil = 0;
let plannerMode = localStorage.getItem("beyondWorkMode") || "";
let settingsTab = "user";
const installationId = getInstallationId();
const dayPanelOrder = ["week", "main", "memo"];
let currentDayPanel = "main";
let dateSlideTimer = 0;
let dailyCalendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
let dailyCalendarSwipeSuppressClick = false;
let dailyCalendarPickerOpen = false;
let weekCalendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
let weekCalendarSwipeSuppressClick = false;
let plannerCalendarMode = "";
let plannerCalendarViewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
let plannerCalendarYearOpen = false;
let plannerCalendarTriggerId = "";
let activePostponeCalendar = null;
let monthCalendarSwipeSuppressClick = false;
let monthDateTap = { key: "", at: 0 };
let mobileDayFocusResetTimer = 0;
let dailyFieldEditingUntil = 0;
let dailyTextEditingActive = false;
let activeInputEditingUntil = 0;
let activeTextEditingUntil = 0;
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
let repeatManagerMode = "list";
let repeatEditingIndex = -1;
let repeatEditingDraft = null;
let pendingUndoAction = null;
let undoNoticeTimer = 0;
let backupEmailCheckTimer = 0;

function el(id) {
  return document.getElementById(id);
}

function confirmDelete(message = "삭제할까요? 이 작업은 되돌리기 어렵습니다.") {
  return window.confirm(message);
}

function clonePlannerState(source = state) {
  return JSON.parse(JSON.stringify(source));
}

function captureUndo(label = "작업") {
  pendingUndoAction = {
    label,
    state: clonePlannerState(state),
    selectedDate: iso(selectedDate),
    selectedFinanceMonth,
    selectedSheetId,
    selectedSheetCell,
    activeView: document.querySelector(".view.active")?.id?.replace("view-", "") || "day",
  };
}

function getUndoNoticeNode() {
  let node = el("undoNotice");
  if (node) return node;
  node = document.createElement("div");
  node.id = "undoNotice";
  node.className = "undo-notice";
  node.hidden = true;
  node.innerHTML = `
    <span class="undo-notice-text"></span>
    <button class="undo-notice-action" type="button">되돌리기</button>
    <button class="undo-notice-close" type="button" aria-label="닫기">×</button>
  `;
  node.querySelector(".undo-notice-action").addEventListener("click", restoreUndoAction);
  node.querySelector(".undo-notice-close").addEventListener("click", hideUndoNotice);
  document.body.appendChild(node);
  return node;
}

function showUndoNotice(message = "작업을 완료했습니다.") {
  if (!pendingUndoAction) return;
  const node = getUndoNoticeNode();
  node.querySelector(".undo-notice-text").textContent = message;
  node.hidden = false;
  node.classList.add("is-visible");
  window.clearTimeout(undoNoticeTimer);
  undoNoticeTimer = window.setTimeout(hideUndoNotice, 9000);
}

function hideUndoNotice() {
  const node = el("undoNotice");
  if (!node) return;
  node.classList.remove("is-visible");
  window.clearTimeout(undoNoticeTimer);
  undoNoticeTimer = window.setTimeout(() => {
    node.hidden = true;
  }, 180);
}

function restoreUndoAction() {
  if (!pendingUndoAction) return;
  const snapshot = pendingUndoAction;
  pendingUndoAction = null;
  state = migrateState(snapshot.state);
  selectedDate = parseDate(snapshot.selectedDate || iso(todayInPlanner()));
  selectedFinanceMonth = snapshot.selectedFinanceMonth || monthKey(selectedDate);
  selectedSheetId = snapshot.selectedSheetId || state.customSheets?.activeId || "";
  selectedSheetCell = snapshot.selectedSheetCell || "A1";
  saveState({ fastSave: true });
  if (snapshot.activeView) showView(snapshot.activeView);
  renderAll();
  hideUndoNotice();
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

function getWeekdayLabels() {
  return getAppLanguage() === "ko" ? weekdayLabelsKo : weekdayLabelsEn;
}

function getWeekdayLabel(dayIndex) {
  return getWeekdayLabels()[Number(dayIndex)] || "";
}

function getWeekdayName(dayIndex) {
  return (getAppLanguage() === "ko" ? weekdayNamesKo : weekdayNamesEn)[Number(dayIndex)] || "";
}

function getWeekdayIndices() {
  return weekdayLabelsKo.map((_, index) => index);
}

function formatDate(date) {
  return `${date.getFullYear()}. ${pad(date.getMonth() + 1)}. ${pad(date.getDate())}. (${getWeekdayLabel(date.getDay())})`;
}

function formatYearMonth(date) {
  return `${date.getFullYear()}. ${pad(date.getMonth() + 1)}.`;
}

function formatDailyTitleDate(date) {
  return formatDate(date);
}

function formatShortDate(date) {
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}(${getWeekdayLabel(date.getDay())})`;
}

function formatCompassDate(date) {
  return formatDate(date);
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

function plannerStateMetaKey() {
  const session = getAuthSession();
  const account = session?.email ? encodeURIComponent(session.email) : "anonymous";
  return `${STATE_META_KEY}.${account}`;
}

function hasCachedPlannerState() {
  return Boolean(loadCachedPlannerState());
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

function getTaskOrder(task = {}) {
  const order = Number(task.order);
  return Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER;
}

function hasTaskOrder(task = {}) {
  return Number.isFinite(Number(task.order));
}

function assignTaskOrder(day, task) {
  day.taskOrderCounter = Math.max(1, Number(day.taskOrderCounter || 1));
  const maxOrder = priorities
    .flatMap(([priority]) => day.tasks?.[priority] || [])
    .reduce((max, item) => Math.max(max, Number(item?.order) || 0), 0);
  day.taskOrderCounter = Math.max(day.taskOrderCounter, maxOrder + 1);
  task.order = day.taskOrderCounter++;
  return task.order;
}

function ensureTaskOrder(day, task) {
  if (!task || hasTaskOrder(task)) return;
  assignTaskOrder(day, task);
}

function normalizeDayTasks(day) {
  if (!day) return;
  day.tasks ||= { A: emptyTasks(DAILY_EMPTY_TASK_MIN), B: [], C: [] };
  day.taskOrderCounter = Math.max(1, Number(day.taskOrderCounter || 1));
  priorities.forEach(([priority]) => {
    day.tasks[priority] ||= [];
    day.tasks[priority].forEach((task) => {
      normalizeTask(task);
      if (isActiveTaskSlot(task) && !hasTaskOrder(task)) assignTaskOrder(day, task);
    });
  });
  compactEmptyDailyTaskSlots(day);
}

function compactEmptyDailyTaskSlots(day) {
  if (!day?.tasks) return;
  const emptyRefs = priorities.flatMap(([priority]) =>
    (day.tasks[priority] || []).map((task, index) => ({ priority, task, index })).filter(({ task }) => !isActiveTaskSlot(task)),
  );
  if (emptyRefs.length > DAILY_EMPTY_TASK_MAX) {
    emptyRefs
      .slice(DAILY_EMPTY_TASK_MAX)
      .sort((a, b) => b.index - a.index)
      .forEach(({ priority, task }) => {
        const list = day.tasks[priority] || [];
        const index = list.indexOf(task);
        if (index >= 0) list.splice(index, 1);
      });
  }
  let emptyCount = priorities.reduce((sum, [priority]) => sum + (day.tasks[priority] || []).filter((task) => !isActiveTaskSlot(task)).length, 0);
  while (emptyCount < DAILY_EMPTY_TASK_MIN) {
    day.tasks.A.push({ id: newTaskId(), text: "", status: "미완료", done: false, delegate: "", priorityUnset: true });
    emptyCount += 1;
  }
}

function loadState() {
  const cached = loadCachedPlannerState();
  if (cached) return cached;
  return loadEmptyState();
}

function loadCachedPlannerState() {
  try {
    const accountCache = JSON.parse(localStorage.getItem(plannerStorageKey()) || "null");
    if (accountCache && typeof accountCache === "object") return migrateState(accountCache);
  } catch {
    // Fall through to the display cache.
  }
  try {
    const cached = JSON.parse(localStorage.getItem(LAST_DISPLAY_CACHE_KEY) || "null");
    const sessionEmail = getAuthSession()?.email || "";
    if (cached?.state && (!cached.accountEmail || cached.accountEmail === sessionEmail)) {
      return migrateState(cached.state);
    }
  } catch {
    // Fall back to a blank planner if the temporary display cache is unreadable.
  }
  return null;
}

function persistDisplayCache() {
  try {
    localStorage.setItem(LAST_DISPLAY_CACHE_KEY, JSON.stringify({
      accountEmail: getAuthSession()?.email || "",
      updatedAt: new Date().toISOString(),
      state,
    }));
  } catch {
    // Display cache is only a startup preview; DB saving remains authoritative.
  }
}

function migrateState(nextState) {
  nextState.appSettings = normalizeAppSettings(nextState.appSettings);
  nextState.finance ||= createFinanceState();
  normalizeFinanceState(nextState.finance);
  nextState.projects ||= createProjectState();
  normalizeProjectState(nextState.projects);
  nextState.customSheets ||= createCustomSheetsState();
  normalizeCustomSheetsState(nextState.customSheets);
  nextState.notes ||= { projects: Array.from({ length: 8 }, () => ""), references: Array.from({ length: 8 }, () => ""), freeform: "" };
  nextState.profile = { ...defaultProfileFields, ...(nextState.profile || {}) };
  if (!Array.isArray(nextState.profile.personaTypesSecondary)) nextState.profile.personaTypesSecondary = [];
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
    week.compass ||= [];
    week.compass = week.compass.filter((item) => item.role !== "일");
    week.compass.forEach((item) => {
      if (Array.isArray(item.actions)) item.actions = item.actions.slice(0, 2);
    });
  });
  Object.values(nextState.days || {}).forEach((day) => {
    day.memo ||= "";
    day.appointmentMerges ||= {};
    day.autoTaskScheduleLinks ||= {};
    day.scheduleUnit = normalizeScheduleUnit(day.scheduleUnit || "");
    ensureAppointmentSlots(day, day.scheduleUnit);
    normalizeAppointmentMerges(day);
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
      headers: ["Goal", "Area", "Metric", "Now", "Target", "Progress", "Next Action", "Check Date"],
      types: ["general", "general", "general", "number", "number", "number", "general", "date"],
      widths: [210, 130, 130, 92, 92, 92, 240, 118],
      samples: [
        ["Main Goal", "Work", "Done Count", "", "", "", "First action today", ""],
        ["Growth Goal", "Growth", "Study Time", "", "", "", "", ""],
      ],
    },
    client: {
      columns: 8,
      headers: ["구분", "이름/회사", "연락처", "관계", "최근 접촉", "다음 연락", "관심/이슈", "메모"],
      types: ["general", "general", "general", "general", "date", "date", "general", "general"],
      widths: [86, 170, 150, 110, 118, 118, 220, 220],
      samples: [
        ["Client", "Name", "", "Key", "", "", "Need", "Next contact note"],
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
    showAmounts: true,
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
    startDate: "",
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
  finance.showAmounts = finance.showAmounts !== false;
  financeMonthKeys().forEach((key) => {
    finance.months[key] ||= Array.from({ length: 5 }, () => emptyMoneyItem());
    while (finance.months[key].length < 5) finance.months[key].push(emptyMoneyItem());
  });
  while (finance.fixed.length < 6) finance.fixed.push(emptyMoneyItem("지출"));
  Object.keys(finance.months).forEach((key) => {
    finance.months[key] = finance.months[key].map((item) => normalizeMoneyItem(item));
  });
  finance.fixed = finance.fixed.map((item) => normalizeMoneyItem(item, "지출"));
  normalizeFixedMoneyStartDates(finance.fixed);
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
    category: normalizeMoneyCategory(item?.category, item),
    status: moneyStatuses.includes(item?.status) ? item.status : "예정",
    memo: item?.memo || "",
    taskDate: item?.taskDate || "",
    startDate: item?.startDate || "",
    repeatEndMode: item?.repeatEndMode === "date" ? "date" : "none",
    repeatEndDate: item?.repeatEndDate || "",
  };
}

function normalizeMoneyCategory(category = "", item = {}) {
  if (moneyCategories.includes(category)) return category;
  return inferMoneyCategory(item);
}

function inferMoneyCategory(item = {}) {
  const source = `${item.title || ""} ${item.memo || ""} ${item.type || ""}`.toLowerCase();
  if (!source.trim()) return "";
  if (/카드|체크|신용|대금|롯데|삼성|현대|국민|신한|비씨|bc|우리카드|하나카드/.test(source)) return "카드대금";
  if (/적금|예금|이자|대출|원리금|상환/.test(source)) return "적금/이자";
  if (/할부|분납/.test(source)) return "할부금";
  if (/렌탈|리스|구독|임대료/.test(source)) return "렌탈";
  if (/관리비|전기|수도|가스|수선|공과금|통신|인터넷/.test(source)) return "관리비";
  if (/세금|부가세|종소세|소득세|재산세|취득세|원천세|4대보험/.test(source)) return "세금";
  if (/보험/.test(source)) return "보험";
  if (/급여|인건비|임금|상여|퇴직/.test(source)) return "인건비";
  if (/식비|생활|마트|교통|용돈/.test(source)) return "생활비";
  if (/사업|거래처|재료|용역|광고|마케팅|사무|비품/.test(source)) return "사업비";
  return "";
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
  Object.values(state.days || {}).forEach((day) => {
    normalizeAppointmentMerges(day);
    normalizeDayTasks(day);
  });
  localStorage.setItem(plannerStorageKey(), JSON.stringify(state));
  persistDisplayCache();
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
  if (isAnyPlannerInputEditing()) {
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
      // Supabase DB is the source of truth. Browser storage is only a temporary display cache,
      // but a dirty/newer browser state must first be pushed to DB instead of being overwritten.
      const localMeta = getStateMeta();
      const localUpdatedAt = localMeta.updatedAt || "";
      const serverHasContent = hasPlannerContent(payload.state);
      const localHasContent = hasPlannerContent(state);
      const localDirtyIsFresh = Boolean(localMeta.dirty && localUpdatedAt && Date.now() - timestampMs(localUpdatedAt) < 10 * 60 * 1000);
      lastServerUpdatedAt = payload.updatedAt || "";
      const serverIsNewer = !localUpdatedAt || !localDirtyIsFresh || isTimestampNewer(payload.updatedAt, localUpdatedAt) || (serverHasContent && !localHasContent);
      const localIsNewer = localDirtyIsFresh && localHasContent && isTimestampNewer(localUpdatedAt, payload.updatedAt);
      if (serverIsNewer) {
        setBootMessage("오늘의 화면을 최신 기준으로 맞추는 중");
        storeStateFromServer(payload, "저장됨");
      } else if (localMeta.dirty || localIsNewer) {
        saveStatus.message = "최신 변경 저장 중";
        scheduleAccountSave(120);
      } else {
        storeStateFromServer(payload, "저장됨");
      }
    } else {
      // A missing DB row means a new account state. Never auto-upload leftover device/browser cache.
      state = loadEmptyState();
      selectedSheetId = state.customSheets.activeId;
      localStorage.setItem(plannerStorageKey(), JSON.stringify(state));
      persistDisplayCache();
      saveStateMeta({ updatedAt: "", lastSavedAt: "", dirty: false, accountEmail: getAuthSession()?.email || "" });
      saveStatus.message = "새 플래너 준비됨";
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
    appSettings: normalizeAppSettings(),
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

function normalizeAppSettings(settings = {}) {
  const schedule = settings.schedule || {};
  const startTime = normalizeTimeValue(schedule.startTime, defaultAppSettings.schedule.startTime);
  const endTime = normalizeTimeValue(schedule.endTime, defaultAppSettings.schedule.endTime);
  const backupEmail = settings.sections?.backup?.email || settings.backupEmail || {};
  return {
    ...defaultAppSettings,
    ...settings,
    language: normalizeLanguage(settings.language),
    schedule: {
      ...defaultAppSettings.schedule,
      ...schedule,
      startTime,
      endTime: timeToMinutes(endTime) > timeToMinutes(startTime) ? endTime : defaultAppSettings.schedule.endTime,
    },
    sections: {
      ...defaultAppSettings.sections,
      ...(settings.sections || {}),
      menu: {
        ...defaultAppSettings.sections.menu,
        ...(settings.sections?.menu || {}),
      },
      money: {
        ...defaultAppSettings.sections.money,
        ...(settings.sections?.money || {}),
        showAmounts: settings.sections?.money?.showAmounts ?? settings.finance?.showAmounts ?? true,
      },
      backup: {
        ...defaultAppSettings.sections.backup,
        ...(settings.sections?.backup || {}),
        email: {
          ...defaultAppSettings.sections.backup.email,
          ...backupEmail,
          frequency: normalizeBackupEmailFrequency(backupEmail.frequency),
          recipient: String(backupEmail.recipient || "").trim(),
          lastSentAt: String(backupEmail.lastSentAt || ""),
        },
      },
    },
  };
}

function normalizeBackupEmailFrequency(value) {
  return ["off", "weekly", "monthly"].includes(value) ? value : "off";
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
    const hasSession = Boolean(getAuthSession()?.accessToken);
    saveStatus.saving = hasSession;
    saveStatus.message = hasSession ? "저장 연결 확인 중" : "로그인이 필요합니다";
    renderSidebarAfterDailyInput();
    if (hasSession) {
      window.clearTimeout(accountSaveTimer);
      accountSaveTimer = window.setTimeout(async () => {
        await hydrateServerState();
        if (accountSaveReady && getStateMeta().dirty) {
          persistStateToServer();
        } else {
          saveStatus.saving = false;
          renderSidebarAfterDailyInput();
        }
      }, Math.max(delay, 900));
    }
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

function flushPlannerSave(reason = "즉시 저장") {
  window.clearTimeout(accountSaveTimer);
  const meta = getStateMeta();
  if (!meta.dirty && !saveStatus.saving) {
    saveStatus.message = "저장됨";
    renderSidebarAfterDailyInput();
    return;
  }
  saveStatus.saving = true;
  saveStatus.message = reason;
  renderSidebarAfterDailyInput();
  persistStateToServer();
}

async function persistStateToServer(options = {}) {
  if (!accountSaveReady) {
    saveStatus.saving = false;
    saveStatus.message = getAuthSession()?.accessToken ? "저장 대기" : "로그인이 필요합니다";
    renderSidebarAfterDailyInput();
    return;
  }
  const session = await ensureFreshAuthSession();
  if (!session?.accessToken) {
    accountSaveReady = false;
    saveStatus.saving = false;
    saveStatus.message = "다시 로그인 필요";
    renderSidebarAfterDailyInput();
    logoutPlanner();
    return;
  }
  if (!hasPlannerContent(state)) {
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
  if (isAnyPlannerInputEditing()) {
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
    const accountMeta = JSON.parse(localStorage.getItem(plannerStateMetaKey()) || "null");
    if (accountMeta && typeof accountMeta === "object") return accountMeta;
  } catch {
    // Fall through to the one-time legacy meta migration.
  }
  try {
    const legacyMeta = JSON.parse(localStorage.getItem(STATE_META_KEY) || "{}");
    const sessionEmail = getAuthSession()?.email || "";
    if (legacyMeta?.accountEmail && legacyMeta.accountEmail === sessionEmail) return legacyMeta;
    return {};
  } catch {
    return {};
  }
}

function saveStateMeta(meta) {
  localStorage.setItem(plannerStateMetaKey(), JSON.stringify({ ...getStateMeta(), ...meta }));
  localStorage.removeItem(STATE_META_KEY);
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
  persistDisplayCache();
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
    if (isAnyPlannerInputEditing()) {
      queuePassiveServerPull();
      return;
    }
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

function plannerContentScore(source = state) {
  if (!source || typeof source !== "object") return 0;
  const hasText = (value) => String(value || "").trim().length > 0;
  const countValues = (values = []) => values.reduce((total, value) => total + (hasText(value) ? 1 : 0), 0);
  let score = 0;
  score += hasText(source.foundation?.mission) ? 1 : 0;
  score += countValues(source.foundation?.values || []);
  (source.foundation?.roles || []).forEach((role) => {
    score += countValues([role.goal, role.renewal]);
  });
  score += countValues(source.year?.goals || []);
  score += countValues(source.year?.future || []);
  Object.values(source.months || {}).forEach((month) => {
    score += countValues([month.focus, ...(month.projects || [])]);
  });
  Object.values(source.weeks || {}).forEach((week) => {
    (week.priorities || []).forEach((item) => {
      score += hasText(item.text) || item.done ? 1 : 0;
    });
    (week.compass || []).forEach((item) => {
      score += countValues([item.goal, item.action, ...(item.actions || [])]);
    });
  });
  Object.values(source.days || {}).forEach((day) => {
    Object.values(day.tasks || {}).flat().forEach((task) => {
      score += hasText(task.text) || task.done || task.status !== "미완료" || hasText(task.delegate) ? 1 : 0;
    });
    score += countValues(Object.values(day.appointments || {}));
    score += Object.keys(day.appointmentMerges || {}).length;
    score += countValues(["memo", "record", "wins", "carry", "lesson"].map((field) => day[field]));
  });
  score += (source.repeats?.priorityTasks || []).filter((rule) => hasText(rule.text)).length;
  Object.values(source.profile || {}).forEach((value) => {
    score += Array.isArray(value) ? countValues(value) : hasText(value) ? 1 : 0;
  });
  score += countValues([...(source.notes?.projects || []), ...(source.notes?.references || []), source.notes?.freeform]);
  (source.finance?.fixed || []).forEach((item) => {
    score += countValues([item.title, item.amount, item.dueDay, item.category, item.memo, item.taskDate, item.repeatEndDate]) ? 1 : 0;
  });
  Object.values(source.finance?.months || {}).flat().forEach((item) => {
    score += countValues([item.title, item.amount, item.dueDay, item.category, item.memo, item.taskDate]) ? 1 : 0;
  });
  score += countValues([source.finance?.issueMemo, source.finance?.decisionMemo]);
  (source.customSheets?.items || []).forEach((sheet) => {
    score += countValues(Object.values(sheet.cells || {}));
  });
  score += (source.calendar?.events || []).filter((event) => hasText(event.title)).length;
  (source.projects?.items || []).forEach((project) => {
    score += projectHasUserContent(project) ? 1 : 0;
  });
  return score;
}

function isDangerousPlannerImport(incomingState) {
  const currentScore = plannerContentScore(state);
  const incomingScore = plannerContentScore(incomingState);
  if (currentScore < 5) return false;
  if (incomingScore === 0) return true;
  return currentScore - incomingScore >= 10 && incomingScore < currentScore * 0.2;
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
  const moneyHasContent = (item) => ["title", "amount", "dueDay", "category", "memo", "taskDate", "repeatEndDate"].some((field) => String(item?.[field] || "").trim());
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
    compass: createWeeklyCompass(key, state),
  };
  state.weeks[key].priorities ||= createWeeklyPriorities(key, state);
  carryWeeklyPrioritiesIntoWeek(key, state.weeks[key], state);
  while (state.weeks[key].priorities.length < 5) state.weeks[key].priorities.push({ text: "", done: false });
  state.weeks[key].compass ||= [];
  carryWeeklyCompassIntoWeek(key, state.weeks[key], state);
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
    tasks: { A: emptyTasks(DAILY_EMPTY_TASK_MIN), B: [], C: [] },
    appointments: Object.fromEntries(getScheduleSlotsForUnit(scheduleUnit).map((slot) => [slot, ""])),
    appointmentMerges: {},
    autoTaskScheduleLinks: {},
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
  state.days[key].autoTaskScheduleLinks ||= {};
  state.days[key].deletedRepeatIds ||= [];
  ensureAppointmentSlots(state.days[key]);
  normalizeAppointmentMerges(state.days[key]);
  normalizeDayTasks(state.days[key]);
  applyRepeatingPriorityTasks(key);
  return state.days[key];
}

function normalizeScheduleUnit(value) {
  return value === "60" ? "60" : "30";
}

function normalizeTimeValue(value, fallback = "08:00") {
  const match = String(value || "").match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match) return fallback;
  const hour = Math.max(0, Math.min(23, Number(match[1])));
  const minute = Number(match[2]) >= 30 ? 30 : 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeToMinutes(value) {
  const [hour, minute] = normalizeTimeValue(value, "00:00").split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(minutes) {
  const clamped = Math.max(0, Math.min(24 * 60, Number(minutes) || 0));
  const hour = Math.floor(clamped / 60);
  const minute = clamped % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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

function getScheduleSettingsRange() {
  state.appSettings = normalizeAppSettings(state.appSettings);
  const start = normalizeTimeValue(state.appSettings.schedule.startTime, defaultAppSettings.schedule.startTime);
  let end = normalizeTimeValue(state.appSettings.schedule.endTime, defaultAppSettings.schedule.endTime);
  if (timeToMinutes(end) <= timeToMinutes(start)) end = defaultAppSettings.schedule.endTime;
  return { start, end };
}

function generateScheduleSlots(unit = "30", range = getScheduleSettingsRange()) {
  const step = normalizeScheduleUnit(unit) === "60" ? 60 : 30;
  const start = timeToMinutes(range.start);
  const end = timeToMinutes(range.end);
  const slots = [];
  for (let minutes = start; minutes < end; minutes += step) {
    slots.push(minutesToTime(minutes));
  }
  return slots.length ? slots : (normalizeScheduleUnit(unit) === "60" ? hourlyTimeSlots : timeSlots);
}

function getScheduleSlotsForUnit(unit = "30") {
  return generateScheduleSlots(unit);
}

function getScheduleSlotsForDay(day = ensureDay()) {
  const unit = day.scheduleUnit || getEffectiveScheduleUnit(iso(selectedDate));
  const range = getScheduleRangeForDay(day, unit);
  return generateScheduleSlots(unit, range);
}

function ensureAppointmentSlots(day, unit = day?.scheduleUnit || "30") {
  if (!day) return;
  day.appointments ||= {};
  getScheduleSlotsForDay(day).forEach((slot) => {
    if (day.appointments[slot] === undefined) day.appointments[slot] = "";
  });
}

function getScheduleRangeForDay(day = ensureDay(), unit = day?.scheduleUnit || "30") {
  const base = getScheduleSettingsRange();
  const step = normalizeScheduleUnit(unit) === "60" ? 60 : 30;
  let start = timeToMinutes(base.start);
  let end = timeToMinutes(base.end);
  collectDayScheduleTimes(day).forEach((slot) => {
    const minutes = timeToMinutes(slot);
    if (!Number.isFinite(minutes)) return;
    start = Math.min(start, floorToStep(minutes, step));
    end = Math.max(end, floorToStep(minutes, step) + step);
  });
  end = Math.min(24 * 60, Math.max(end, start + step));
  return { start: minutesToTime(start), end: minutesToTime(end) };
}

function collectDayScheduleTimes(day = ensureDay()) {
  const times = new Set();
  Object.entries(day?.appointments || {}).forEach(([slot, value]) => {
    if (String(value || "").trim() && /^([01]\d|2[0-3]):[0-5]\d$/.test(slot)) times.add(slot);
  });
  getTaskRefs(day).forEach(({ task }) => {
    if (shouldRemoveTaskScheduleLink(task)) return;
    const hint = extractTaskTimeHint(task.text);
    if (hint?.slot) times.add(hint.slot);
  });
  return times;
}

function floorToStep(minutes, step = 30) {
  return Math.max(0, Math.floor(minutes / step) * step);
}

function normalizeAppointmentMerges(day) {
  if (!day) return;
  day.appointmentMerges ||= {};
  day.appointments ||= {};
  const slots = getScheduleSlotsForDay(day);
  const normalized = {};
  Object.entries(day.appointmentMerges || {}).forEach(([slot, span]) => {
    const index = slots.indexOf(slot);
    const nextSpan = Math.max(1, Math.floor(Number(span) || 1));
    if (index < 0 || nextSpan <= 1) return;
    normalized[slot] = Math.min(nextSpan, slots.length - index);
  });
  day.appointmentMerges = normalized;
  Object.entries(day.appointmentMerges).forEach(([startSlot, span]) => {
    const startIndex = slots.indexOf(startSlot);
    if (startIndex < 0) return;
    const covered = slots.slice(startIndex + 1, startIndex + span);
    const texts = [day.appointments[startSlot], ...covered.map((slot) => day.appointments[slot])]
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    if (texts.length) day.appointments[startSlot] = [...new Set(texts)].join(" ");
    covered.forEach((slot) => {
      if (day.appointments[slot]) day.appointments[slot] = "";
    });
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
  const carried = previous.filter((item) => item?.text && !item.done).map((item) => ({ text: item.text, done: false, carryoverFromWeek: previousKey }));
  while (carried.length < 5) carried.push({ text: "", done: false });
  return carried;
}

function carryWeeklyPrioritiesIntoWeek(key, week, sourceState = state) {
  if (!week || !key) return;
  const previousKey = previousWeekKey(key);
  const previous = previousKey ? sourceState?.weeks?.[previousKey]?.priorities || [] : [];
  removeCheckedWeeklyPriorityCarryovers(key, week, previousKey, previous);
  const carriedTexts = previous
    .filter((item) => item?.text && !item.done)
    .map((item) => String(item.text).trim())
    .filter(Boolean);
  if (!carriedTexts.length) return;
  week.priorities ||= [];
  while (week.priorities.length < 5) week.priorities.push({ text: "", done: false });
  const existingTexts = new Set(week.priorities.map((item) => String(item?.text || "").trim()).filter(Boolean));
  carriedTexts.forEach((text) => {
    if (existingTexts.has(text)) return;
    const empty = week.priorities.find((item) => !String(item?.text || "").trim());
    const target = empty || { text: "", done: false };
    target.text = text;
    target.done = false;
    target.carryoverFromWeek = previousKey;
    if (!empty) week.priorities.push(target);
    existingTexts.add(text);
  });
}

function removeCheckedWeeklyPriorityCarryovers(key, week, previousKey, previous = []) {
  if (!week?.priorities?.length || !previousKey) return false;
  const checkedTexts = new Set(previous
    .filter((item) => item?.text && item.done)
    .map((item) => String(item.text).trim())
    .filter(Boolean));
  if (!checkedTexts.size) return false;
  let changed = false;
  week.priorities = week.priorities.map((item) => {
    const text = String(item?.text || "").trim();
    const isCarried = !item?.carryoverFromWeek || item.carryoverFromWeek === previousKey;
    if (text && checkedTexts.has(text) && !item.done && isCarried) {
      changed = true;
      return { text: "", done: false };
    }
    return item;
  });
  if (changed) compactWeeklyPriorities(week);
  return changed;
}

function compactWeeklyPriorities(week) {
  if (!week?.priorities) return;
  const filled = week.priorities.filter((item) => String(item?.text || "").trim() || item?.done);
  week.priorities = filled;
  while (week.priorities.length < 5) week.priorities.push({ text: "", done: false });
}

function removeWeeklyPriorityCarryoversAfterWeek(sourceWeekKey, text) {
  const normalizedText = String(text || "").trim();
  if (!sourceWeekKey || !normalizedText) return false;
  let changed = false;
  Object.keys(state.weeks || {}).sort().forEach((key) => {
    if (key <= sourceWeekKey) return;
    const week = state.weeks[key];
    if (!week?.priorities?.length) return;
    const before = JSON.stringify(week.priorities);
    week.priorities = week.priorities.map((item) => {
      const itemText = String(item?.text || "").trim();
      const isCarried = !item?.carryoverFromWeek || item.carryoverFromWeek >= sourceWeekKey;
      if (itemText === normalizedText && !item.done && isCarried) return { text: "", done: false };
      return item;
    });
    compactWeeklyPriorities(week);
    if (JSON.stringify(week.priorities) !== before) changed = true;
  });
  return changed;
}

function createWeeklyCompass(key, sourceState = state) {
  const roles = compassRoleNames();
  const week = { compass: roles.map((role) => ({ role, goal: "", action: "", actions: ["", ""] })) };
  carryWeeklyCompassIntoWeek(key, week, sourceState);
  return week.compass;
}

function carryWeeklyCompassIntoWeek(key, week, sourceState = state) {
  if (!week || !key) return;
  const previousKey = previousWeekKey(key);
  const previousCompass = previousKey ? sourceState?.weeks?.[previousKey]?.compass || [] : [];
  if (!previousCompass.length) return;
  const roles = compassRoleNames();
  week.compass ||= [];
  roles.forEach((role, index) => {
    const current = week.compass.find((item) => item.role === role) || week.compass[index] || { role, goal: "", action: "", actions: ["", ""] };
    const previous = previousCompass.find((item) => item.role === role) || previousCompass[index] || {};
    normalizeCompassItem(current);
    normalizeCompassItem(previous);
    current.role = role;
    if (!String(current.goal || "").trim() && String(previous.goal || "").trim()) current.goal = previous.goal;
    current.actions = current.actions.slice(0, 2).map((value, actionIndex) => {
      const currentValue = String(value || "").trim();
      const previousValue = String(previous.actions?.[actionIndex] || "").trim();
      return currentValue || previousValue || "";
    });
    current.action = current.actions[0] || "";
    week.compass[index] = current;
  });
}

function previousWeekKey(key) {
  if (!key) return "";
  const date = parseDate(key);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() - 7);
  return iso(date);
}

function compassRoleNames() {
  return getAppLanguage() === "ko"
    ? ["개인", "가족", "성장", "공헌"]
    : ["Personal", "Family", "Growth", "Contribution"];
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
    weeklyMode: "every",
    weekOfMonth: "every",
    weekday: baseDate.getDay(),
    weekdays: getWeekdayIndices(),
    monthday: baseDate.getDate(),
    month: baseDate.getMonth() + 1,
    startDate: iso(baseDate),
    endMode: "none",
    endDate: "",
    carryMode: "auto",
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
  rule.weekOfMonth = ["every", "1", "2", "3", "4", "5"].includes(String(rule.weekOfMonth)) ? String(rule.weekOfMonth) : "every";
  rule.weeklyMode = rule.weeklyMode === "nth" || rule.weekOfMonth !== "every" ? "nth" : "every";
  if (rule.weeklyMode === "every") rule.weekOfMonth = "every";
  rule.weekday = clampNumber(rule.weekday, 0, 6, baseDate.getDay());
  rule.weekdays = Array.isArray(rule.weekdays) ? rule.weekdays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) : [];
  if (!rule.weekdays.length) rule.weekdays = rule.frequency === "daily" ? getWeekdayIndices() : [rule.weekday];
  rule.weekdays = [...new Set(rule.weekdays)].sort((a, b) => a - b);
  rule.monthday = clampNumber(rule.monthday, 1, 31, baseDate.getDate());
  rule.month = clampNumber(rule.month, 1, 12, baseDate.getMonth() + 1);
  rule.startDate = isValidIsoDate(rule.startDate) ? rule.startDate : iso(baseDate);
  rule.endMode = rule.endMode === "date" ? "date" : "none";
  rule.endDate = isValidIsoDate(rule.endDate) ? rule.endDate : "";
  if (rule.endMode !== "date") rule.endDate = "";
  rule.carryMode = ["auto", "carry", "none"].includes(rule.carryMode) ? rule.carryMode : "auto";
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
  el("dailyCalendarPrevYear").onclick = () => shiftDailyCalendarYear(-1);
  el("dailyCalendarNextYear").onclick = () => shiftDailyCalendarYear(1);
  el("dailyCalendarMonthTitle").onclick = toggleDailyCalendarPicker;
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
  el("weekCalendarPrevYear").onclick = () => shiftWeekCalendarYear(-1);
  el("weekCalendarNextYear").onclick = () => shiftWeekCalendarYear(1);
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
  el("exportButton").onclick = exportPlannerWorkbook;
  el("importButton").onclick = () => el("importFile").click();
  el("topPrintButton").onclick = () => window.print();
  el("saveNowButton").onclick = () => flushPlannerSave("지금 저장 중");
  el("topExportButton").onclick = exportPlannerWorkbook;
  el("topImportButton").onclick = () => el("importFile").click();
  el("lockNowButton").onclick = () => lockPlanner("수동 잠금");
  el("logoutButton").onclick = logoutPlanner;
  el("accountPasswordButton").onclick = updateAccountPassword;
  if (el("openRepeatManagerButton")) el("openRepeatManagerButton").onclick = openRepeatManager;
  el("closeRepeatManagerButton").onclick = closeRepeatManager;
  el("repeatManagerDialog").addEventListener("click", (event) => {
    if (event.target.id === "repeatManagerDialog") closeRepeatManager();
  });
  document.querySelectorAll("[data-day-panel-jump]").forEach((button) => {
    button.onclick = () => scrollDayPanel(button.dataset.dayPanelJump);
  });
  document.querySelectorAll("[data-settings-tab]").forEach((button) => {
    button.onclick = () => setSettingsTab(button.dataset.settingsTab || "user");
  });
  document.querySelectorAll("[data-section-ai]").forEach((button) => {
    button.setAttribute("aria-label", "AI 코칭");
    button.setAttribute("title", "AI 코칭");
    if (!button.querySelector(".compass-spark-icon")) {
      button.innerHTML = `<span class="compass-spark-icon" aria-hidden="true"></span><span class="visually-hidden">AI 코칭</span>`;
    }
    button.onclick = () => openSectionCoach(button.dataset.sectionAi || "day");
  });
  el("dailyPulseToggle")?.addEventListener("click", toggleDailyPulseDetails);
  setupPulsePanelSwipe();
  if (el("quickLogoutButton")) el("quickLogoutButton").onclick = logoutPlanner;
  if (el("settingsLogoutButton")) el("settingsLogoutButton").onclick = logoutPlanner;
  if (el("settingsExportButton")) el("settingsExportButton").onclick = exportPlannerWorkbook;
  if (el("settingsImportButton")) el("settingsImportButton").onclick = () => el("importFile").click();
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
    activeCoachSection = "";
    activeCoachTab = "coach";
    showView("coach");
    renderAll();
  };
  el("modeToggle").onclick = () => {
    togglePlannerMode();
  };
  el("refreshCoach").onclick = () => renderCoach();
  document.querySelectorAll("[data-coach-tab]").forEach((button) => {
    button.onclick = () => {
      activeCoachTab = button.dataset.coachTab === "coach" ? "coach" : "guide";
      renderCoach();
    };
  });
  el("aiTaskSuggest").onclick = () => openSectionCoach("tasks");
  el("aiCompassSuggest").onclick = () => openSectionCoach("week");
  el("aiScheduleSuggest").onclick = () => openSectionCoach("schedule");
  el("scheduleUnit30").onclick = () => setScheduleUnitFromDate("30");
  el("scheduleUnit60").onclick = () => setScheduleUnitFromDate("60");
  el("scheduleStartTime").onchange = updateScheduleRangeSetting;
  el("scheduleEndTime").onchange = updateScheduleRangeSetting;
  el("backupEmailFrequency").onchange = updateBackupEmailSettings;
  el("backupEmailRecipient").onchange = updateBackupEmailSettings;
  el("sendBackupEmailButton").onclick = () => sendBackupEmailNow();
  el("financeAmountVisibilityToggle").onchange = () => {
    state.finance ||= createFinanceState();
    normalizeFinanceState(state.finance);
    state.finance.showAmounts = el("financeAmountVisibilityToggle").checked;
    relinkAllMoneyTasks();
    saveState();
    renderAll();
  };
  el("aiMemoSuggest").onclick = () => openSectionCoach("memo");
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
  document.querySelector("[data-onboarding-toggle]")?.addEventListener("click", toggleOnboardingPanel);
  el("importFile").onchange = importPlanner;
  el("plannerSearch").oninput = (event) => {
    updateSearch(event.target.value);
  };
  el("searchPageInput").oninput = (event) => {
    updateSearch(event.target.value);
  };
  el("searchPageInput").onkeydown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    runPageSearch();
  };
  el("searchPageSubmit").onclick = runPageSearch;
  el("headerSearch").onkeydown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    runHeaderSearch();
  };
  setupQuickStrip();
  setupDailyCalendarDismissal();
  setupGlobalSundayDatePicker();
  setupTopViews();
  setupDailyDateSwipe();
  setupWeekDateSwipe();
  setupWeekBodySwipe();
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
    if (document.hidden) {
      flushPlannerSave("백그라운드 전 저장");
      return;
    }
    queuePassiveServerPull();
  });
  window.addEventListener("pagehide", () => flushPlannerSave("앱 닫기 전 저장"));
  window.addEventListener("beforeunload", (event) => {
    if (!getStateMeta().dirty) return;
    flushPlannerSave("나가기 전 저장");
    event.preventDefault();
    event.returnValue = "";
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

function runPageSearch() {
  const input = el("searchPageInput");
  if (!input) return;
  updateSearch(input.value);
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
    const fixedMobileHeight = window.matchMedia?.("(max-width: 640px)")?.matches;
    document.documentElement.style.setProperty("--daily-title-height", fixedMobileHeight ? "58px" : `${Math.ceil(dailyTitle.getBoundingClientRect().height)}px`);
    document.documentElement.style.setProperty("--daily-pulse-height", fixedMobileHeight ? "48px" : "44px");
  }
}

function updateSearch(value) {
  searchQuery = value.trim();
  if (el("plannerSearch").value !== value) el("plannerSearch").value = value;
  if (el("headerSearch").value !== value) el("headerSearch").value = value;
  if (el("searchPageInput").value !== value) el("searchPageInput").value = value;
  renderSearch();
  if (searchQuery) showView("search");
}

function closeSearch() {
  searchQuery = "";
  aiSearch = { query: "", answer: "", loading: false, error: "" };
  el("plannerSearch").value = "";
  el("headerSearch").value = "";
  el("searchPageInput").value = "";
  closeToDailyPage();
}

function closeCoach() {
  activeCoachSection = "";
  activeCoachTab = "coach";
  closeToDailyPage();
}

function openSectionCoach(section = "day") {
  activeCoachSection = section;
  activeCoachTab = "coach";
  showView("coach");
  renderAll();
}

function closeToDailyPage() {
  showView("day");
  renderAll();
  positionDaySwipe(currentDayPanel || "main");
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
  currentDayPanel = "main";
  daySwipeKey = "";
  if (animate) {
    animateDateTitle(delta, next);
    return;
  }
  selectedDate = next;
  renderAll();
}

function toggleDailyCalendar() {
  if (isPlannerCalendarOpen("daily")) {
    closePlannerCalendar(true);
    return;
  }
  openPlannerCalendar("daily", parseDate(iso(selectedDate)));
}

function closeDailyCalendar(restoreFocus = false) {
  const popover = el("dailyCalendarPopover");
  if (isPlannerCalendarOpen("daily")) {
    closePlannerCalendar(restoreFocus);
    return;
  }
  if (!popover || popover.hidden) return;
  closeDailyCalendarPicker();
  popover.hidden = true;
  el("dailyCalendarToggle")?.setAttribute("aria-expanded", "false");
  if (restoreFocus) el("dailyCalendarToggle")?.focus();
}

function shiftDailyCalendarMonth(delta) {
  if (isPlannerCalendarOpen("daily")) {
    shiftPlannerCalendarMonth(delta);
    return;
  }
  const next = new Date(dailyCalendarMonth.getFullYear(), dailyCalendarMonth.getMonth() + delta, 1);
  dailyCalendarMonth = next;
  renderDailyCalendar();
}

function shiftDailyCalendarYear(delta) {
  if (isPlannerCalendarOpen("daily")) {
    shiftPlannerCalendarYear(delta);
    return;
  }
  const next = new Date(dailyCalendarMonth.getFullYear() + delta, dailyCalendarMonth.getMonth(), 1);
  dailyCalendarMonth = next;
  renderDailyCalendar();
}

function toggleDailyCalendarPicker() {
  dailyCalendarPickerOpen = !dailyCalendarPickerOpen;
  renderDailyCalendar();
}

function closeDailyCalendarPicker() {
  dailyCalendarPickerOpen = false;
  const picker = el("dailyCalendarPicker");
  const title = el("dailyCalendarMonthTitle");
  if (picker) picker.hidden = true;
  title?.setAttribute("aria-expanded", "false");
}

function isDailyCalendarOpen() {
  const popover = el("dailyCalendarPopover");
  return isPlannerCalendarOpen("daily") || Boolean(popover && !popover.hidden);
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

function openDailyPageForDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
  closeDailyCalendar();
  closeWeekCalendar();
  closeMonthPicker();
  selectedDate = new Date(date);
  showView("day");
  renderAll();
}

function toggleWeekCalendar() {
  if (isPlannerCalendarOpen("week")) {
    closePlannerCalendar(true);
    return;
  }
  openPlannerCalendar("week", parseDate(iso(selectedDate)));
}

function closeWeekCalendar(restoreFocus = false) {
  const popover = el("weekCalendarPopover");
  if (isPlannerCalendarOpen("week")) {
    closePlannerCalendar(restoreFocus);
    return;
  }
  if (!popover || popover.hidden) return;
  popover.hidden = true;
  el("weekCalendarToggle")?.setAttribute("aria-expanded", "false");
  if (restoreFocus) el("weekCalendarToggle")?.focus();
}

function shiftWeekCalendarMonth(delta) {
  if (isPlannerCalendarOpen("week")) {
    shiftPlannerCalendarMonth(delta);
    return;
  }
  const next = new Date(weekCalendarMonth.getFullYear(), weekCalendarMonth.getMonth() + delta, 1);
  weekCalendarMonth = next;
  renderWeekCalendar();
}

function shiftWeekCalendarYear(delta) {
  if (isPlannerCalendarOpen("week")) {
    shiftPlannerCalendarYear(delta);
    return;
  }
  const next = new Date(weekCalendarMonth.getFullYear() + delta, weekCalendarMonth.getMonth(), 1);
  weekCalendarMonth = next;
  renderWeekCalendar();
}

function isWeekCalendarOpen() {
  const popover = el("weekCalendarPopover");
  return isPlannerCalendarOpen("week") || Boolean(popover && !popover.hidden);
}

function selectWeekCalendarDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
  selectedDate = new Date(date);
  closeWeekCalendar();
  showView("week");
  renderAll();
}

function ensurePlannerCalendarSheet() {
  let backdrop = el("plannerCalendarBackdrop");
  let sheet = el("plannerCalendarSheet");
  if (backdrop && sheet) return { backdrop, sheet };

  backdrop = document.createElement("div");
  backdrop.id = "plannerCalendarBackdrop";
  backdrop.className = "planner-calendar-backdrop";
  backdrop.hidden = true;

  sheet = document.createElement("section");
  sheet.id = "plannerCalendarSheet";
  sheet.className = "planner-calendar-sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-label", "날짜 선택");
  sheet.hidden = true;
  sheet.innerHTML = `
    <div class="calendar-grabber" aria-hidden="true"></div>
    <div class="calendar-topline">
      <div>
        <strong id="plannerCalendarHeading">날짜 선택</strong>
        <span id="plannerCalendarSelectedLabel"></span>
      </div>
      <button type="button" id="plannerCalendarClose">닫기</button>
    </div>
    <div class="calendar-header">
      <button type="button" id="plannerCalendarPrevYear" class="calendar-year-step" aria-label="이전 연도">«</button>
      <button type="button" id="plannerCalendarPrevMonth" aria-label="이전 달">‹</button>
      <div class="calendar-year-control" id="plannerCalendarYearControl">
        <button type="button" id="plannerCalendarMonthTitle" aria-expanded="false">2026년</button>
        <div class="calendar-year-wheel" id="plannerCalendarYearGrid" role="listbox" aria-label="연도 선택" hidden></div>
      </div>
      <button type="button" id="plannerCalendarNextMonth" aria-label="다음 달">›</button>
      <button type="button" id="plannerCalendarNextYear" class="calendar-year-step" aria-label="다음 연도">»</button>
    </div>
    <div class="calendar-month-grid" id="plannerCalendarMonthGrid" aria-label="월 선택"></div>
    <div class="calendar-weekdays" id="plannerCalendarWeekdays" aria-hidden="true"></div>
    <div class="calendar-day-grid" id="plannerCalendarDayGrid" role="grid" aria-label="날짜"></div>
    <div class="calendar-footer">
      <button type="button" id="plannerCalendarToday">오늘로 이동</button>
    </div>
  `;
  document.body.append(backdrop, sheet);

  backdrop.onclick = () => closePlannerCalendar();
  sheet.querySelector("#plannerCalendarClose").onclick = () => closePlannerCalendar(true);
  sheet.querySelector("#plannerCalendarPrevYear").onclick = () => shiftPlannerCalendarYear(-1);
  sheet.querySelector("#plannerCalendarNextYear").onclick = () => shiftPlannerCalendarYear(1);
  sheet.querySelector("#plannerCalendarPrevMonth").onclick = () => shiftPlannerCalendarMonth(-1);
  sheet.querySelector("#plannerCalendarNextMonth").onclick = () => shiftPlannerCalendarMonth(1);
  sheet.querySelector("#plannerCalendarMonthTitle").onclick = () => {
    plannerCalendarYearOpen = !plannerCalendarYearOpen;
    renderPlannerCalendarSheet();
  };
  sheet.querySelector("#plannerCalendarToday").onclick = () => selectPlannerCalendarDate(todayInPlanner());
  bindPlannerCalendarSwipe(sheet);
  return { backdrop, sheet };
}

function isPlannerCalendarOpen(mode = "") {
  const sheet = el("plannerCalendarSheet");
  return Boolean(sheet && !sheet.hidden && (!mode || plannerCalendarMode === mode));
}

function openPlannerCalendar(mode, viewDate = selectedDate) {
  const { backdrop, sheet } = ensurePlannerCalendarSheet();
  closeDailyCalendarPicker();
  closePostponeDatePicker();
  plannerCalendarMode = mode;
  plannerCalendarTriggerId = mode === "week" ? "weekCalendarToggle" : "dailyCalendarToggle";
  plannerCalendarYearOpen = false;
  plannerCalendarViewDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  sheet.hidden = false;
  backdrop.hidden = false;
  sheet.setAttribute("aria-label", mode === "week" ? "주간 날짜 선택" : "일간 날짜 선택");
  el(plannerCalendarTriggerId)?.setAttribute("aria-expanded", "true");
  renderPlannerCalendarSheet();
  window.requestAnimationFrame(() => {
    sheet.classList.add("is-open");
    backdrop.classList.add("is-open");
  });
}

function closePlannerCalendar(restoreFocus = false) {
  const sheet = el("plannerCalendarSheet");
  const backdrop = el("plannerCalendarBackdrop");
  if (!sheet || sheet.hidden) return;
  const triggerId = plannerCalendarTriggerId;
  sheet.classList.remove("is-open");
  backdrop?.classList.remove("is-open");
  el(triggerId)?.setAttribute("aria-expanded", "false");
  window.setTimeout(() => {
    sheet.hidden = true;
    if (backdrop) backdrop.hidden = true;
    plannerCalendarMode = "";
    plannerCalendarTriggerId = "";
    plannerCalendarYearOpen = false;
    if (restoreFocus && triggerId) el(triggerId)?.focus();
  }, 170);
}

function shiftPlannerCalendarMonth(delta) {
  plannerCalendarViewDate = new Date(
    plannerCalendarViewDate.getFullYear(),
    plannerCalendarViewDate.getMonth() + delta,
    1,
  );
  plannerCalendarYearOpen = false;
  renderPlannerCalendarSheet();
}

function shiftPlannerCalendarYear(delta) {
  plannerCalendarViewDate = new Date(
    plannerCalendarViewDate.getFullYear() + delta,
    plannerCalendarViewDate.getMonth(),
    1,
  );
  renderPlannerCalendarSheet();
}

function renderPlannerCalendarSheet() {
  const sheet = el("plannerCalendarSheet");
  if (!sheet || sheet.hidden) return;
  const heading = sheet.querySelector("#plannerCalendarHeading");
  const selectedLabel = sheet.querySelector("#plannerCalendarSelectedLabel");
  const monthTitle = sheet.querySelector("#plannerCalendarMonthTitle");
  const yearControl = sheet.querySelector("#plannerCalendarYearControl");
  const yearGrid = sheet.querySelector("#plannerCalendarYearGrid");
  const monthGrid = sheet.querySelector("#plannerCalendarMonthGrid");
  const weekdayGrid = sheet.querySelector("#plannerCalendarWeekdays");
  const dayGrid = sheet.querySelector("#plannerCalendarDayGrid");
  const todayButton = sheet.querySelector("#plannerCalendarToday");
  const year = plannerCalendarViewDate.getFullYear();
  const month = plannerCalendarViewDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const selectedKey = iso(selectedDate);
  const todayKey = iso(todayInPlanner());
  const selectedWeekStart = startOfWeek(selectedDate);
  const selectedWeekEnd = new Date(selectedWeekStart);
  selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6);

  heading.textContent = plannerCalendarMode === "week" ? "주간 선택" : "날짜 선택";
  selectedLabel.textContent = plannerCalendarMode === "week"
    ? `현재 주간 ${formatShortDate(selectedWeekStart)} ~ ${formatShortDate(selectedWeekEnd)}`
    : formatDate(selectedDate);
  monthTitle.textContent = `${year}년`;
  monthTitle.setAttribute("aria-expanded", String(plannerCalendarYearOpen));
  yearControl.classList.toggle("is-wheel-open", plannerCalendarYearOpen);
  yearGrid.hidden = !plannerCalendarYearOpen;
  todayButton.textContent = "오늘로 이동";

  monthGrid.innerHTML = Array.from({ length: 12 }, (_, index) => `
    <button type="button" class="${index === month ? "is-selected" : ""}" data-planner-calendar-month="${index}">
      ${index + 1}월
    </button>
  `).join("");
  monthGrid.querySelectorAll("[data-planner-calendar-month]").forEach((button) => {
    button.onclick = () => {
      plannerCalendarViewDate = new Date(year, Number(button.dataset.plannerCalendarMonth), 1);
      plannerCalendarYearOpen = false;
      renderPlannerCalendarSheet();
    };
  });

  yearGrid.innerHTML = Array.from({ length: 21 }, (_, index) => {
    const value = year - 10 + index;
    return `<button type="button" role="option" aria-selected="${value === year}" class="${value === year ? "is-selected" : ""}" data-planner-calendar-year="${value}">${value}</button>`;
  }).join("");
  yearGrid.querySelectorAll("[data-planner-calendar-year]").forEach((button) => {
    button.onclick = () => {
      plannerCalendarViewDate = new Date(Number(button.dataset.plannerCalendarYear), month, 1);
      plannerCalendarYearOpen = false;
      renderPlannerCalendarSheet();
    };
  });
  if (plannerCalendarYearOpen) {
    window.requestAnimationFrame(() => yearGrid.querySelector(".is-selected")?.scrollIntoView({ block: "center" }));
  }

  weekdayGrid.innerHTML = getWeekdayLabels()
    .map((weekday, index) => `<span class="${index === 0 ? "is-sunday" : ""} ${index === 6 ? "is-saturday" : ""}">${escapeHtml(weekday)}</span>`)
    .join("");
  dayGrid.innerHTML = "";
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const key = iso(date);
    const hasPlans = Boolean(state.days[key] && dayHasContent(state.days[key]));
    const annotation = getCalendarAnnotation(date);
    const isSelectedWeek = plannerCalendarMode === "week" && date >= selectedWeekStart && date <= selectedWeekEnd;
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      date.getMonth() !== month ? "is-outside" : "",
      key === selectedKey ? "is-selected" : "",
      key === todayKey ? "is-today" : "",
      isSelectedWeek ? "is-selected-week" : "",
      hasPlans ? "has-plans" : "",
      annotation.hasHoliday ? "has-holiday" : "",
      annotation.lunarLabel ? "has-lunar" : "",
    ].filter(Boolean).join(" ");
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-selected", String(plannerCalendarMode === "week" ? isSelectedWeek : key === selectedKey));
    button.setAttribute("aria-label", calendarAriaLabel(date, annotation.events, annotation.lunarLabel, hasPlans));
    button.innerHTML = `
      <span class="daily-calendar-date-number">${date.getDate()}</span>
      ${renderCalendarAnnotationMarkup(annotation.events, annotation.lunarLabel, { compact: true })}
      ${hasPlans ? '<i aria-hidden="true"></i>' : ""}
    `;
    button.onclick = () => selectPlannerCalendarDate(date);
    dayGrid.appendChild(button);
  }
}

function selectPlannerCalendarDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
  const mode = plannerCalendarMode;
  closePlannerCalendar();
  if (mode === "week") {
    selectedDate = new Date(date);
    showView("week");
    renderAll();
    return;
  }
  selectDailyCalendarDate(new Date(date));
}

function bindPlannerCalendarSwipe(sheet) {
  let startX = 0;
  let startY = 0;
  sheet.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    startX = event.clientX;
    startY = event.clientY;
  }, { passive: true });
  sheet.addEventListener("pointerup", (event) => {
    if (!startX) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    startX = 0;
    startY = 0;
    if (Math.abs(dx) < 54 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    event.preventDefault();
    shiftPlannerCalendarMonth(dx < 0 ? 1 : -1);
  });
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
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  grid.innerHTML = `
    <div class="month-picker-year-row">
      <button type="button" data-month-year-delta="-1" aria-label="이전 연도">‹</button>
      <strong>${currentYear}</strong>
      <button type="button" data-month-year-delta="1" aria-label="다음 연도">›</button>
    </div>
    <div class="month-picker-months">
      ${monthNames.map((name, index) => `
        <button type="button" data-month-index="${index}" class="${index === currentMonth ? "is-active" : ""}">
          ${name}
        </button>
      `).join("")}
    </div>
  `;
  grid.querySelectorAll("[data-month-year-delta]").forEach((button) => {
    button.onclick = () => shiftMonthYear(Number(button.dataset.monthYearDelta));
  });
  grid.querySelectorAll("[data-month-index]").forEach((button) => {
    button.onclick = () => selectMonth(Number(button.dataset.monthIndex));
  });
}

function shiftMonthYear(delta) {
  if (!Number.isFinite(delta) || !delta) return;
  const next = new Date(selectedDate);
  next.setFullYear(selectedDate.getFullYear() + delta);
  selectedDate = next;
  renderAll();
  renderMonthPicker();
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
  if (options.compact) {
    return [
      ...visibleEvents.map((event) => `<small class="calendar-event event-${event.type}">${escapeHtml(event.label)}</small>`),
      lunarLabel ? `<em class="lunar-mark">음 ${escapeHtml(lunarLabel)}</em>` : "",
    ].join("");
  }
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

  const titleButton = el("dailyCalendarMonthTitle");
  if (titleButton) {
    titleButton.textContent = formatYearMonth(new Date(year, month, 1));
    titleButton.setAttribute("aria-expanded", String(dailyCalendarPickerOpen));
  }
  el("dailyCalendarPrevMonth").disabled = false;
  el("dailyCalendarNextMonth").disabled = false;
  renderDailyCalendarPicker(year, month);
  grid.innerHTML = "";

  getWeekdayLabels().forEach((weekday, index) => {
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

function renderDailyCalendarPicker(year, month) {
  const picker = el("dailyCalendarPicker");
  const monthGrid = el("dailyCalendarMonthGrid");
  const yearWheel = el("dailyCalendarYearWheel");
  if (!picker || !monthGrid || !yearWheel) return;
  picker.hidden = !dailyCalendarPickerOpen;
  yearWheel.hidden = !dailyCalendarPickerOpen;
  if (!dailyCalendarPickerOpen) {
    monthGrid.innerHTML = "";
    yearWheel.innerHTML = "";
    return;
  }
  monthGrid.innerHTML = "";
  Array.from({ length: 12 }, (_, index) => index).forEach((monthIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = monthIndex === month ? "is-active" : "";
    button.textContent = `${monthIndex + 1}월`;
    button.onclick = () => {
      dailyCalendarMonth = new Date(year, monthIndex, 1);
      dailyCalendarPickerOpen = false;
      renderDailyCalendar();
    };
    monthGrid.appendChild(button);
  });

  yearWheel.innerHTML = "";
  for (let nextYear = year - 6; nextYear <= year + 6; nextYear += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = nextYear === year ? "is-active" : "";
    button.textContent = String(nextYear);
    button.onclick = () => {
      dailyCalendarMonth = new Date(nextYear, month, 1);
      dailyCalendarPickerOpen = false;
      renderDailyCalendar();
    };
    yearWheel.appendChild(button);
  }
  window.requestAnimationFrame(() => {
    yearWheel.querySelector(".is-active")?.scrollIntoView({ block: "center", inline: "nearest" });
  });
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

  el("weekCalendarMonthTitle").textContent = formatYearMonth(new Date(year, month, 1));
  el("weekCalendarPrevMonth").disabled = false;
  el("weekCalendarNextMonth").disabled = false;
  grid.innerHTML = "";

  getWeekdayLabels().forEach((weekday, index) => {
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

function closePostponeDatePicker() {
  if (!activePostponeCalendar) return;
  activePostponeCalendar.cleanup?.();
  activePostponeCalendar.node?.remove();
  activePostponeCalendar = null;
}

function openPostponeDatePicker(anchor, initialValue, onSelect) {
  openSundayDatePicker(anchor, initialValue, onSelect, { label: "연기 날짜 선택" });
}

function openSundayDatePicker(anchor, initialValue, onSelect, options = {}) {
  if (!anchor) return;
  closePostponeDatePicker();
  const parsed = parseDate(initialValue);
  const initialDate = Number.isNaN(parsed.getTime()) ? new Date(selectedDate) : parsed;
  let pickerMonth = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  const popover = document.createElement("section");
  popover.className = "daily-calendar-popover sunday-date-popover";
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-label", options.label || "날짜 선택");
  document.body.appendChild(popover);

  const render = () => {
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStart.getDay());
    const todayKey = iso(todayInPlanner());
	    const selectedKey = iso(initialDate);
	    popover.innerHTML = `
	      <div class="daily-calendar-toolbar">
	        <button class="daily-calendar-nav daily-calendar-year-nav" data-postpone-prev-year type="button" aria-label="이전 연도">«</button>
	        <button class="daily-calendar-nav" data-postpone-prev type="button" aria-label="이전 달">‹</button>
	        <strong>${escapeHtml(formatYearMonth(new Date(year, month, 1)))}</strong>
	        <button class="daily-calendar-nav" data-postpone-next type="button" aria-label="다음 달">›</button>
	        <button class="daily-calendar-nav daily-calendar-year-nav" data-postpone-next-year type="button" aria-label="다음 연도">»</button>
	        <button class="icon-close daily-calendar-close" data-postpone-close type="button" aria-label="달력 닫기">×</button>
	      </div>
	      <div class="daily-calendar-grid" role="grid" aria-label="연기 날짜"></div>
	    `;
    const grid = popover.querySelector(".daily-calendar-grid");
    getWeekdayLabels().forEach((weekday, index) => {
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
      const annotation = getCalendarAnnotation(date);
      const button = document.createElement("button");
      button.type = "button";
      button.className = [
        "daily-calendar-day",
        date.getMonth() !== month ? "is-outside" : "",
        key === selectedKey ? "is-selected" : "",
        key === todayKey ? "is-today" : "",
        annotation.hasHoliday ? "has-holiday" : "",
        annotation.lunarLabel ? "has-lunar" : "",
      ].filter(Boolean).join(" ");
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", calendarAriaLabel(date, annotation.events, annotation.lunarLabel, false));
      button.setAttribute("aria-selected", String(key === selectedKey));
      button.innerHTML = `
        <span class="daily-calendar-date-number">${date.getDate()}</span>
        ${renderCalendarAnnotationMarkup(annotation.events, annotation.lunarLabel, { compact: true })}
      `;
      button.onclick = () => {
        onSelect?.(key);
        closePostponeDatePicker();
      };
      grid.appendChild(button);
    }
	    popover.querySelector("[data-postpone-prev]").onclick = () => {
	      pickerMonth = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1);
	      render();
	    };
	    popover.querySelector("[data-postpone-next]").onclick = () => {
	      pickerMonth = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1);
	      render();
	    };
	    popover.querySelector("[data-postpone-prev-year]").onclick = () => {
	      pickerMonth = new Date(pickerMonth.getFullYear() - 1, pickerMonth.getMonth(), 1);
	      render();
	    };
	    popover.querySelector("[data-postpone-next-year]").onclick = () => {
	      pickerMonth = new Date(pickerMonth.getFullYear() + 1, pickerMonth.getMonth(), 1);
	      render();
	    };
    popover.querySelector("[data-postpone-close]").onclick = closePostponeDatePicker;
  };

  const position = () => {
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(300, window.innerWidth - 16);
    const left = Math.max(8, Math.min(window.scrollX + rect.left, window.scrollX + window.innerWidth - width - 8));
    popover.style.left = `${left}px`;
    popover.style.top = `${window.scrollY + rect.bottom + 8}px`;
  };
  render();
  position();
  const handleOutside = (event) => {
    if (popover.contains(event.target) || anchor.contains(event.target)) return;
    closePostponeDatePicker();
  };
  const handleKeydown = (event) => {
    if (event.key === "Escape") closePostponeDatePicker();
  };
  const handleResize = () => position();
  setTimeout(() => document.addEventListener("pointerdown", handleOutside), 0);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", handleResize);
  activePostponeCalendar = {
    node: popover,
    cleanup: () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("resize", handleResize);
    },
  };
}

function setupGlobalSundayDatePicker() {
  const openForInput = (input, event) => {
    if (!input || input.disabled || input.readOnly) return false;
    event.preventDefault();
    event.stopPropagation();
    input.focus({ preventScroll: true });
    openSundayDatePicker(
      input,
      input.value || iso(selectedDate),
      (dateKey) => {
        input.value = dateKey;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      },
      { label: input.getAttribute("aria-label") || "날짜 선택" },
    );
    return true;
  };
  document.addEventListener("pointerdown", (event) => {
    const input = event.target.closest?.("input[type='date']");
    if (input) openForInput(input, event);
  }, { capture: true });
  document.addEventListener("keydown", (event) => {
    const input = event.target.closest?.("input[type='date']");
    if (!input || !["Enter", " ", "ArrowDown"].includes(event.key)) return;
    openForInput(input, event);
  }, { capture: true });
}

function setupDailyCalendarDismissal() {
  document.addEventListener("pointerdown", (event) => {
    const plannerSheet = el("plannerCalendarSheet");
    if (plannerSheet && !plannerSheet.hidden) {
      if (event.target.closest("#plannerCalendarSheet") || event.target.closest("#dailyCalendarToggle") || event.target.closest("#weekCalendarToggle")) return;
      closePlannerCalendar();
      return;
    }
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
      closePlannerCalendar(true);
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
    currentDayPanel = "main";
    daySwipeKey = "";
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
    if (!hasEmptySlot) {
      const task = { text: "", status: "미완료", done: false, delegate: "", priorityUnset: true };
      assignTaskOrder(day, task);
      day.tasks.A.push(task);
    }
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
  if (action === "schedule") {
    showView("day");
    scrollDayPanel("main");
    setMobileDayFocusMode("schedule");
    renderAll();
    window.requestAnimationFrame(() => document.querySelector(".day-schedule-panel input[type='text']")?.focus());
    return;
  }
  if (action === "review") {
    showView("day");
    scrollDayPanel("memo");
    renderAll();
    window.requestAnimationFrame(() => document.querySelector("[data-day-field='wins']")?.focus());
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

function setupWeekBodySwipe() {
  const node = el("weekDays");
  if (!node) return;
  let startX = 0;
  let startY = 0;
  let wheelLock = false;
  node.addEventListener("pointerdown", (event) => {
    if (event.target.closest("input, textarea, select, button, [contenteditable='true']")) return;
    startX = event.clientX;
    startY = event.clientY;
  }, { passive: true });
  node.addEventListener("pointerup", (event) => {
    if (!startY) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    startX = 0;
    startY = 0;
    if (Math.abs(dy) < 82 || Math.abs(dy) < Math.abs(dx) * 1.35) return;
    event.preventDefault();
    shiftWeek(dy < 0 ? 1 : -1);
  });
  node.addEventListener("wheel", (event) => {
    if (!document.querySelector("#view-week.active") || wheelLock) return;
    if (Math.abs(event.deltaY) < 56 || Math.abs(event.deltaY) < Math.abs(event.deltaX) * 1.25) return;
    event.preventDefault();
    wheelLock = true;
    shiftWeek(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLock = false;
    }, 420);
  }, { passive: false });
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
  let startTime = 0;
  let startPanel = currentDayPanel;
  let startScrollLeft = 0;
  let horizontalSwipeActive = false;
  let lastTouchSwipeAt = 0;
  let wheelLock = false;
  let scrollTimer = 0;
  const clearPointerStart = () => {
    startX = 0;
    startY = 0;
    startTime = 0;
    horizontalSwipeActive = false;
  };

  node.addEventListener("pointerdown", (event) => {
    if (!isPagedDaySwipe()) return;
    if (Date.now() - lastTouchSwipeAt < 420) return;
    if (isMobileDayFocusActive()) return;
    const mobileEdgeSwipe = isMobilePhoneFocusLayout() && isDaySwipeEdgeStart(event.clientX);
    if (isMobilePhoneFocusLayout() && !mobileEdgeSwipe) return;
    if (!mobileEdgeSwipe && isDaySwipeBlockedTarget(event.target)) return;
    startX = event.clientX;
    startY = event.clientY;
    startTime = Date.now();
    startPanel = closestDayPanel();
    startScrollLeft = node.scrollLeft;
  }, { capture: true });

  node.addEventListener("pointermove", (event) => {
    if (!startX || horizontalSwipeActive) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 22 && Math.abs(dx) > Math.abs(dy) * 1.45) {
      horizontalSwipeActive = true;
      event.preventDefault();
    }
  }, { capture: true, passive: false });

  node.addEventListener("pointerup", (event) => {
    if (!startX) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const elapsed = Date.now() - startTime;
    clearPointerStart();
    if (!isPagedDaySwipe() || isMobileDayFocusActive()) return;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const distanceThreshold = Math.min(104, Math.max(58, node.clientWidth * 0.16));
    const fastSwipe = elapsed < 260 && absX > 54;
    const movedScroll = Math.abs(node.scrollLeft - startScrollLeft);
    if ((absX < distanceThreshold && !fastSwipe) || absX < absY * 1.35 || movedScroll > node.clientWidth * 0.72) {
      settleDayPanelScroll();
      return;
    }
    event.preventDefault();
    stepDayPanel(dx < 0 ? 1 : -1, startPanel);
  }, { capture: true });

  node.addEventListener("pointercancel", clearPointerStart, { capture: true, passive: true });

  node.addEventListener("touchstart", (event) => {
    if (!isPagedDaySwipe()) return;
    if (isMobileDayFocusActive()) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    const mobileEdgeSwipe = isMobilePhoneFocusLayout() && isDaySwipeEdgeStart(touch.clientX);
    if (isMobilePhoneFocusLayout() && !mobileEdgeSwipe) return;
    if (!mobileEdgeSwipe && isDaySwipeBlockedTarget(event.target)) return;
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
    startPanel = closestDayPanel();
    startScrollLeft = node.scrollLeft;
  }, { capture: true, passive: true });

  node.addEventListener("touchmove", (event) => {
    if (!startX || horizontalSwipeActive) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) > 22 && Math.abs(dx) > Math.abs(dy) * 1.45) {
      horizontalSwipeActive = true;
      event.preventDefault();
    }
  }, { capture: true, passive: false });

  node.addEventListener("touchend", (event) => {
    if (!startX) return;
    const touch = event.changedTouches?.[0];
    if (!touch) {
      clearPointerStart();
      return;
    }
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const elapsed = Date.now() - startTime;
    const fromPanel = startPanel;
    const scrollLeftAtStart = startScrollLeft;
    clearPointerStart();
    if (!isPagedDaySwipe() || isMobileDayFocusActive()) return;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const distanceThreshold = Math.min(104, Math.max(58, node.clientWidth * 0.16));
    const fastSwipe = elapsed < 260 && absX > 54;
    const movedScroll = Math.abs(node.scrollLeft - scrollLeftAtStart);
    if ((absX < distanceThreshold && !fastSwipe) || absX < absY * 1.35 || movedScroll > node.clientWidth * 0.72) {
      settleDayPanelScroll();
      return;
    }
    event.preventDefault();
    lastTouchSwipeAt = Date.now();
    stepDayPanel(dx < 0 ? 1 : -1, fromPanel);
  }, { capture: true, passive: false });

  node.addEventListener("touchcancel", clearPointerStart, { capture: true, passive: true });

  node.addEventListener("wheel", (event) => {
    if (!isPagedDaySwipe() || wheelLock) return;
    if (isMobileDayFocusActive()) return;
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
    if (isMobileDayFocusActive()) {
      window.clearTimeout(scrollTimer);
      currentDayPanel = "main";
      return;
    }
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      if (isMobileDayFocusActive()) return;
      settleDayPanelScroll();
    }, 90);
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

function isMobilePhoneFocusLayout() {
  return isSmartphoneDevice() && isSmartphoneLayout();
}

function isMobileDayFocusActive() {
  const panel = document.querySelector(".day-main-panel");
  const classActive = Boolean(panel?.classList.contains("is-focus-tasks") || panel?.classList.contains("is-focus-schedule"));
  return isMobilePhoneFocusLayout() && (mobileDayFocusMode !== "split" || classActive);
}

function isDaySwipeEdgeStart(clientX) {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const edgeSize = Math.min(46, Math.max(32, width * 0.11));
  return clientX <= edgeSize || clientX >= width - edgeSize;
}

function markDailyFieldEditing(duration = 900) {
  dailyFieldEditingUntil = Date.now() + duration;
}

function isDailyFieldEditingRecent() {
  return Date.now() < dailyFieldEditingUntil;
}

function markPlannerInputEditing(duration = 1200) {
  activeInputEditingUntil = Date.now() + duration;
}

function markPlannerTextEditing(duration = 1200) {
  activeTextEditingUntil = Date.now() + duration;
  markPlannerInputEditing(duration);
}

function isEditablePlannerTarget(target = document.activeElement) {
  return Boolean(target?.matches?.("input, textarea, select, [contenteditable='true']"));
}

function isTextEntryPlannerTarget(target = document.activeElement) {
  return Boolean(target?.matches?.("input:not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit']), textarea, [contenteditable='true']"));
}

function isAnyPlannerInputEditing() {
  return dailyTextEditingActive || isDailyFieldEditingRecent() || Date.now() < activeInputEditingUntil || isEditablePlannerTarget();
}

function isAnyPlannerTextEditing() {
  return dailyTextEditingActive || isDailyFieldEditingRecent() || Date.now() < activeTextEditingUntil || isTextEntryPlannerTarget();
}

function setupGlobalInputEditingGuard() {
  const mark = (target, duration = 2500) => {
    if (isTextEntryPlannerTarget(target)) markPlannerTextEditing(duration);
    else markPlannerInputEditing(duration);
  };
  document.addEventListener("focusin", (event) => {
    if (isEditablePlannerTarget(event.target)) mark(event.target, 10 * 60 * 1000);
  }, true);
  document.addEventListener("input", (event) => {
    if (isEditablePlannerTarget(event.target)) mark(event.target);
  }, true);
  document.addEventListener("compositionstart", (event) => {
    if (isEditablePlannerTarget(event.target)) mark(event.target, 10 * 60 * 1000);
  }, true);
  document.addEventListener("compositionend", (event) => {
    if (isEditablePlannerTarget(event.target)) mark(event.target);
  }, true);
  document.addEventListener("keydown", (event) => {
    if (isEditablePlannerTarget(event.target)) mark(event.target, 10 * 60 * 1000);
  }, true);
  document.addEventListener("focusout", (event) => {
    if (isEditablePlannerTarget(event.target)) mark(event.target, 500);
  }, true);
}

function isEditingDailyField() {
  const active = document.activeElement;
  return dailyTextEditingActive || isDailyFieldEditingRecent() || Boolean(
    active?.matches?.("input, select, textarea") &&
    active.closest(".day-task-panel, .day-schedule-panel")
  );
}

function resetMobileDayFocusToSplit(options = {}) {
  if (!isMobilePhoneFocusLayout() || mobileDayFocusMode === "split") return;
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
  setupPressFocusGesture(taskPanel, "tasks");
  setupPressFocusGesture(schedulePanel, "schedule");
  setupSplitEditGate(taskPanel, "tasks");
  setupSplitEditGate(schedulePanel, "schedule");
  setupMobileFocusOpenButtons(panel);
  setupMobileFocusCloseButtons(panel);
  applyMobileDayFocusMode();
}

function isEditableDayControl(target) {
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function setupSplitEditGate(node, mode) {
  let suppressClick = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTarget = null;
  const clearTouchStart = () => {
    touchStartX = 0;
    touchStartY = 0;
    touchStartTarget = null;
  };
  node.addEventListener("touchstart", (event) => {
    if (!isMobilePhoneFocusLayout() || mobileDayFocusMode !== "split" || !isFocusHeaderTarget(event.target)) return;
    if (isFocusTapBlockedTarget(event.target)) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTarget = event.target;
  }, { capture: true, passive: true });
  node.addEventListener("touchend", (event) => {
    if (!touchStartTarget) return;
    const touch = event.changedTouches?.[0];
    if (!touch) {
      clearTouchStart();
      return;
    }
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const moved = Math.abs(dx) > 14 || Math.abs(dy) > 14;
    const horizontalSwipe = Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.35;
    const target = touchStartTarget;
    clearTouchStart();
    if (horizontalSwipe || moved) return;
    if (!isMobilePhoneFocusLayout() || mobileDayFocusMode !== "split" || !isFocusHeaderTarget(target) || isFocusTapBlockedTarget(target)) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = true;
    setMobileDayFocusMode(mode);
  }, { capture: true, passive: false });
  node.addEventListener("touchcancel", clearTouchStart, { capture: true, passive: true });
  node.addEventListener("click", (event) => {
    if (suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
      return;
    }
    if (!isMobilePhoneFocusLayout() || mobileDayFocusMode !== "split") return;
    if (!isFocusHeaderTarget(event.target)) return;
    if (isFocusTapBlockedTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    setMobileDayFocusMode(mode);
  }, { capture: true });
}

function isFocusTapBlockedTarget(target) {
  return Boolean(target?.closest?.("button, a, select, textarea, summary, [data-section-ai], [data-mobile-focus-close], [contenteditable='true']"));
}

function isFocusHeaderTarget(target) {
  return Boolean(target?.closest?.(".day-task-panel > .panel-title-row, .day-schedule-panel > .panel-title-row"));
}

function setupMobileFocusOpenButtons(panel) {
  if (!document.body.dataset.mobileFocusOpenBound) {
    document.body.dataset.mobileFocusOpenBound = "true";
    document.addEventListener("click", (event) => {
      const button = event.target?.closest?.("[data-mobile-focus-open]");
      if (!button) return;
      const mode = button.dataset.mobileFocusOpen;
      if (!["tasks", "schedule"].includes(mode)) return;
      event.preventDefault();
      event.stopPropagation();
      if (isMobilePhoneFocusLayout()) setMobileDayFocusMode(mode);
    }, true);
  }
  panel.querySelectorAll("[data-mobile-focus-open]").forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const mode = button.dataset.mobileFocusOpen;
      if (["tasks", "schedule"].includes(mode)) setMobileDayFocusMode(mode);
    };
  });
}

function setupMobileFocusCloseButtons(panel) {
  if (!document.body.dataset.mobileFocusCloseBound) {
    document.body.dataset.mobileFocusCloseBound = "true";
    document.addEventListener("click", (event) => {
      const button = event.target?.closest?.("[data-mobile-focus-close]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      resetMobileDayFocusToSplit({ blur: true });
    }, true);
  }
  panel.querySelectorAll("[data-mobile-focus-close]").forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      resetMobileDayFocusToSplit({ blur: true });
    };
  });
}

function setupPressFocusGesture(node, mode) {
  if (!node) return;
  let startX = 0;
  let startY = 0;
  let longPressTimer = 0;
  let lastTapAt = 0;
  let longPressFired = false;
  const clearLongPress = () => {
    window.clearTimeout(longPressTimer);
    longPressTimer = 0;
  };
  const toggle = () => {
    if (!isMobilePhoneFocusLayout() || mobileDayFocusMode === mode) return;
    setMobileDayFocusMode(mode);
  };
  node.addEventListener("pointerdown", (event) => {
    if (!isMobilePhoneFocusLayout() || !isFocusHeaderTarget(event.target) || isSwipeInteractiveTarget(event.target)) return;
    startX = event.clientX;
    startY = event.clientY;
    longPressFired = false;
    clearLongPress();
    longPressTimer = window.setTimeout(() => {
      longPressTimer = 0;
      longPressFired = true;
      toggle();
    }, 520);
  }, { passive: true });
  node.addEventListener("pointermove", (event) => {
    if (!longPressTimer) return;
    if (Math.abs(event.clientX - startX) > 12 || Math.abs(event.clientY - startY) > 12) clearLongPress();
  }, { passive: true });
  node.addEventListener("pointerup", (event) => {
    clearLongPress();
    if (longPressFired) {
      longPressFired = false;
      lastTapAt = 0;
      return;
    }
    if (!isMobilePhoneFocusLayout() || !isFocusHeaderTarget(event.target) || isSwipeInteractiveTarget(event.target)) return;
    const moved = Math.abs(event.clientX - startX) > 12 || Math.abs(event.clientY - startY) > 12;
    if (moved) return;
    const now = Date.now();
    if (now - lastTapAt < 320) {
      lastTapAt = 0;
      toggle();
      return;
    }
    lastTapAt = now;
  }, { passive: true });
  node.addEventListener("pointercancel", clearLongPress, { passive: true });
  node.addEventListener("contextmenu", (event) => {
    if (!isMobilePhoneFocusLayout() || !isFocusHeaderTarget(event.target) || isSwipeInteractiveTarget(event.target)) return;
    event.preventDefault();
  });
}

function setMobileDayFocusMode(mode) {
  if (!["split", "tasks", "schedule"].includes(mode)) return;
  mobileDayFocusMode = mode;
  applyMobileDayFocusMode();
}

function applyMobileDayFocusMode() {
  const panel = document.querySelector(".day-main-panel");
  if (!panel) return;
  const activeMode = isMobilePhoneFocusLayout() ? mobileDayFocusMode : "split";
  const swipe = el("daySwipe");
  panel.classList.toggle("is-focus-tasks", activeMode === "tasks");
  panel.classList.toggle("is-focus-schedule", activeMode === "schedule");
  swipe?.classList.toggle("is-mobile-focus-active", activeMode !== "split");
  if (activeMode !== "split") scrollDayPanel("main", "auto");
}

function isSwipeInteractiveTarget(target) {
  return Boolean(target.closest("input, textarea, select, button, summary, [contenteditable='true']"));
}

function isDaySwipeBlockedTarget(target) {
  if (!target) return false;
  if (target.closest("button, select, summary, textarea, [contenteditable='true']")) return true;
  const input = target.closest("input");
  if (!input) return false;
  if (input.closest(".day-main-panel") && isMobilePhoneFocusLayout() && mobileDayFocusMode === "split") return false;
  return Boolean(input.closest(".day-main-panel"));
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
  if (isMobileDayFocusActive()) resetMobileDayFocusToSplit({ blur: true });
  const index = dayPanelOrder.indexOf(fromPanel);
  const nextIndex = Math.max(0, Math.min(dayPanelOrder.length - 1, index + delta));
  scrollDayPanel(dayPanelOrder[nextIndex], "smooth");
}

function settleDayPanelScroll() {
  if (Date.now() < dayPanelProgrammaticScrollUntil) return;
  const closest = closestDayPanel();
  const currentIndex = dayPanelOrder.indexOf(currentDayPanel);
  const closestIndex = dayPanelOrder.indexOf(closest);
  if (currentIndex < 0 || closestIndex < 0) {
    currentDayPanel = closest;
    updateDayGuideState();
    return;
  }
  const jump = closestIndex - currentIndex;
  if (Math.abs(jump) > 1) {
    scrollDayPanel(dayPanelOrder[currentIndex + Math.sign(jump)], "smooth");
    return;
  }
  currentDayPanel = closest;
  updateDayGuideState();
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
  const language = getAppLanguage();
  const isKorean = language === "ko";
  const common = commonUiLabels[language] || commonUiLabels.en;
  const activeYear = selectedDate.getFullYear();
  const yearStart = new Date(`${activeYear}-01-01T00:00:00`);
  const yearEnd = new Date(`${activeYear}-12-31T00:00:00`);
  const totalDays = daysBetween(yearStart, yearEnd) + 1;
  const elapsed = Math.max(0, Math.min(totalDays, daysBetween(yearStart, selectedDate) + 1));
  setText("#selectedDatePanelLabel", isKorean ? "선택 날짜" : "Selected");
  setText("#yearProgressPanelLabel", isKorean ? "연간 진행" : "Year Progress");
  setText("#carryoverPanelLabel", isKorean ? "열린 이월" : "Open Carryover");
  setText("#searchPanelLabel", isKorean ? "검색 결과" : "Search Results");
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
  el("searchHint").textContent = searchQuery ? `${searchQuery}` : (isKorean ? "검색어를 입력하세요" : "Enter a search term");
  if (el("plannerSearch").value !== searchQuery) el("plannerSearch").value = searchQuery;
  if (el("headerSearch").value !== searchQuery) el("headerSearch").value = searchQuery;
  if (el("searchPageInput").value !== searchQuery) el("searchPageInput").value = searchQuery;
  el("topYearProgress").textContent = `${isKorean ? "연간" : "Year"} ${Math.round((elapsed / totalDays) * 100)}%`;
  el("topCarryover").textContent = `${common.topCarryover} ${getCarryoverTasks(selectedDate).length}`;
  el("topSearchCount").textContent = `${common.topSearchCount} ${results.length}`;
  const saveStatusNode = el("topSaveStatus");
  if (saveStatusNode) {
    saveStatusNode.textContent = saveStatus.saving ? "저장 중" : saveStatus.message;
    saveStatusNode.title = saveStatusNode.textContent || "저장 상태";
    saveStatusNode.setAttribute("aria-label", `저장 상태: ${saveStatusNode.textContent || "확인 중"}`);
    const statusText = saveStatusNode.textContent || "";
    saveStatusNode.dataset.saveState = saveStatus.saving ? "saving" : /실패|오류|필요|로그인/.test(statusText) ? "alert" : /대기|확인/.test(statusText) ? "waiting" : "saved";
    saveStatusNode.classList.toggle("is-warning", saveStatusNode.dataset.saveState === "alert" || saveStatusNode.dataset.saveState === "waiting");
  }
  const auth = getAuthSession();
  el("topAccountStatus").textContent = auth ? `${auth.email} · ${formatTierName(auth.tier)}` : common.loginNeeded;
  const todayButton = el("dailyTodayButton");
  todayButton.hidden = false;
  todayButton.classList.toggle("is-current-day", iso(selectedDate) === iso(todayInPlanner()));
  todayButton.setAttribute("aria-label", iso(selectedDate) === iso(todayInPlanner()) ? "오늘 날짜입니다" : "오늘 날짜로 이동");
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
  renderAppSettings();
  const values = el("valuesList");
  values.innerHTML = "";
  const settingsLabels = settingsLanguageLabels[getAppLanguage()] || settingsLanguageLabels.en;
  state.foundation.values.forEach((value, index) => {
    const row = document.createElement("div");
    row.className = "value-item";
    row.innerHTML = `<span class="row-label">${escapeHtml(getAppLanguage() === "ko" ? `가치 ${index + 1}` : `Value ${index + 1}`)}</span><input type="text" value="${escapeAttr(value)}" placeholder="${escapeAttr(settingsLabels.placeholders?.value || "What matters")}" />`;
    row.querySelector("input").oninput = (event) => {
      state.foundation.values[index] = event.target.value;
      saveState();
    };
    values.appendChild(row);
  });

  const roles = el("roleGoalTable");
  roles.innerHTML = "";
  const roleLabels = (settingsLanguageLabels[getAppLanguage()] || settingsLanguageLabels.en).roleLabels;
  state.foundation.roles.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "role-row";
    row.innerHTML = `
      <label><span class="row-label">${escapeHtml(roleLabels[0])}</span><input type="text" value="${escapeAttr(item.role)}" /></label>
      <label><span class="row-label">${escapeHtml(roleLabels[1])}</span><input type="text" value="${escapeAttr(item.goal)}" /></label>
      <label><span class="row-label">${escapeHtml(roleLabels[2])}</span><input type="text" value="${escapeAttr(item.renewal)}" /></label>
    `;
    const inputs = row.querySelectorAll("input");
    inputs[0].oninput = (event) => updateRole(index, "role", event.target.value);
    inputs[1].oninput = (event) => updateRole(index, "goal", event.target.value);
    inputs[2].oninput = (event) => updateRole(index, "renewal", event.target.value);
    roles.appendChild(row);
  });
}

function renderAppSettings() {
  state.appSettings = normalizeAppSettings(state.appSettings);
  bindLanguageSetting();
  const range = getScheduleSettingsRange();
  const startInput = el("scheduleStartTime");
  const endInput = el("scheduleEndTime");
  const rangeLabel = el("scheduleRangeLabel");
  if (startInput) startInput.value = range.start;
  if (endInput) endInput.value = range.end;
  if (rangeLabel) rangeLabel.textContent = `${range.start} ~ ${range.end}`;
  const amountToggle = el("financeAmountVisibilityToggle");
  if (amountToggle) amountToggle.checked = moneyAmountsVisible();
  renderBackupEmailSettings();
  bindMenuVisibilityControls();
  applyMenuVisibility();
  renderScheduleUnitControls(ensureDay());
}

function normalizeLanguage(value = defaultAppSettings.language) {
  return ["en", "ko"].includes(value) ? value : defaultAppSettings.language;
}

function getAppLanguage() {
  state.appSettings = normalizeAppSettings(state.appSettings);
  return normalizeLanguage(state.appSettings.language);
}

function bindLanguageSetting() {
  const select = el("languageSelect");
  if (!select) return;
  select.value = getAppLanguage();
  select.onchange = () => {
    state.appSettings = normalizeAppSettings(state.appSettings);
    state.appSettings.language = normalizeLanguage(select.value);
    saveState({ fastSave: true });
    applyLanguagePreference();
  };
  applyLanguagePreference();
}

function applyLanguagePreference() {
  const language = getAppLanguage();
  const labels = languageLabels[language] || languageLabels.en;
  document.documentElement.lang = language === "ko" ? "ko" : "en";
  document.querySelectorAll("[data-view], [data-top-view]").forEach((item) => {
    const view = item.dataset.view || item.dataset.topView || "";
    if (!view || view === "foundation") return;
    if (labels[view]) item.textContent = labels[view];
  });
  document.querySelectorAll("[data-menu-visibility]").forEach((checkbox) => {
    const label = checkbox.closest("label")?.querySelector("span");
    const view = checkbox.dataset.menuVisibility;
    if (label && labels[view]) label.textContent = labels[view];
  });
  const common = commonUiLabels[language] || commonUiLabels.en;
  setText("#topSearchToggle", common.searchToggle);
  setText("#topSearchSubmit", common.run);
  setText("#searchPageSubmit", common.run);
  setText("#view-search .page-title .eyebrow", common.searchEyebrow);
  setText("#topSearchPopover > span", common.quickSearch);
  setText(".side-search label", common.quickSearch);
  setAttr("#headerSearch", "placeholder", common.searchPlaceholder);
  setAttr("#plannerSearch", "placeholder", common.searchPlaceholder);
  setAttr("#searchPageInput", "placeholder", language === "ko" ? "검색어 또는 질문을 입력하세요. 예: 소풍간 날이 언제이지?" : "Type a search term or question. Example: When was the picnic?");
  applySettingsLanguagePreference(language);
}

function applySettingsLanguagePreference(language = getAppLanguage()) {
  const labels = settingsLanguageLabels[language] || settingsLanguageLabels.en;
  setText("#view-foundation .page-title .eyebrow", labels.titleEyebrow);
  setText("#view-foundation .page-title h2", labels.title);
  setText(".settings-primary-actions .settings-select > span", labels.primaryLanguage);
  setText("[data-settings-view='year']", labels.shortcuts.year);
  setText("[data-settings-view='day']", labels.shortcuts.day);
  setText("[data-settings-view='search']", labels.shortcuts.search);
  setText("[data-settings-tab='user']", labels.tabs.user);
  setText("[data-settings-tab='app']", labels.tabs.app);
  setText("#settingsAppPanel > h3", labels.appTitle);
  document.querySelectorAll("#settingsAppPanel .planner-option-item").forEach((item, index) => {
    const [title, description, pill] = labels.appItems[index] || [];
    if (title) setNodeText(item.querySelector("strong"), title);
    const small = item.querySelector("small");
    if (small && description) {
      const range = small.querySelector("#scheduleRangeLabel")?.outerHTML || "";
      small.innerHTML = `${escapeHtml(description)}${range ? ` ${range}` : ""}`;
    }
    const status = item.querySelector(".setting-status-pill");
    if (status && pill !== undefined) status.textContent = pill;
  });
  document.querySelectorAll("[data-settings-panel='user'] .settings-step-heading").forEach((heading, index) => {
    const [title, description] = labels.steps[index] || [];
    if (title) setNodeText(heading.querySelector("h3"), title);
    if (description) setNodeText(heading.querySelector("p"), description);
  });
  setText(".profile-benefit-note", labels.benefit);
  document.querySelectorAll(".profile-interview-map span").forEach((item, index) => {
    const label = labels.profileMap?.[index];
    if (!label) return;
    const number = item.querySelector("strong")?.textContent || `${index + 1}`;
    item.innerHTML = `<strong>${escapeHtml(number)}</strong> ${escapeHtml(label)}`;
  });
  document.querySelectorAll(".profile-stage-title, .profile-stage summary").forEach((heading, index) => {
    const [step, title, description] = labels.profileStages?.[index] || [];
    if (step) setNodeText(heading.querySelector("span"), step);
    if (title) setNodeText(heading.querySelector("strong"), title);
    if (description) setNodeText(heading.querySelector("small"), description);
  });
  const placeholders = labels.placeholders || {};
  const missionField = document.querySelector('[data-store="foundation.mission"]');
  if (missionField && placeholders.mission) missionField.placeholder = placeholders.mission;
  document.querySelectorAll("#valuesList input").forEach((input) => {
    if (placeholders.value) input.placeholder = placeholders.value;
  });
  Object.entries(labels.profileLabels).forEach(([key, text]) => {
    if (key === "personaTypesSecondary") {
      setText(`[data-profile-multi="${key}"] > .row-label`, text);
      return;
    }
    const field = document.querySelector(`[data-profile-field="${key}"]`);
    const label = field?.closest("label")?.querySelector(".row-label");
    if (label) label.textContent = text;
    if (field && placeholders[key]) field.placeholder = placeholders[key];
  });
}

function setText(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
  return node;
}

function setAttr(selector, name, value) {
  const node = document.querySelector(selector);
  if (node) node.setAttribute(name, value);
  return node;
}

function setNodeText(node, text) {
  if (node) node.textContent = text;
}

function bindMenuVisibilityControls() {
  const menu = getMenuVisibilitySettings();
  document.querySelectorAll("[data-menu-visibility]").forEach((checkbox) => {
    const view = checkbox.dataset.menuVisibility;
    checkbox.checked = menu[view] !== false;
    checkbox.onchange = () => {
      state.appSettings = normalizeAppSettings(state.appSettings);
      state.appSettings.sections.menu[view] = checkbox.checked;
      saveState({ fastSave: true });
      applyMenuVisibility();
    };
  });
}

function getMenuVisibilitySettings() {
  state.appSettings = normalizeAppSettings(state.appSettings);
  return state.appSettings.sections.menu || defaultAppSettings.sections.menu;
}

function isMainMenuViewVisible(view) {
  if (view === "day" || view === "foundation") return true;
  return getMenuVisibilitySettings()[view] !== false;
}

function applyMenuVisibility() {
  document.querySelectorAll("[data-view], [data-top-view]").forEach((item) => {
    const view = item.dataset.view || item.dataset.topView || "";
    if (!view) return;
    const visible = isMainMenuViewVisible(view);
    item.hidden = !visible;
    item.setAttribute("aria-hidden", String(!visible));
    item.tabIndex = visible ? 0 : -1;
  });
}

function updateScheduleRangeSetting() {
  state.appSettings = normalizeAppSettings(state.appSettings);
  const start = normalizeTimeValue(el("scheduleStartTime")?.value, defaultAppSettings.schedule.startTime);
  const end = normalizeTimeValue(el("scheduleEndTime")?.value, defaultAppSettings.schedule.endTime);
  if (timeToMinutes(end) <= timeToMinutes(start)) {
    alert("종료시간은 시작시간보다 늦어야 합니다.");
    renderAppSettings();
    return;
  }
  state.appSettings.schedule.startTime = start;
  state.appSettings.schedule.endTime = end;
  Object.values(state.days || {}).forEach((day) => ensureAppointmentSlots(day, day.scheduleUnit));
  saveState();
  renderAll();
}

function getBackupEmailSettings() {
  state.appSettings = normalizeAppSettings(state.appSettings);
  return state.appSettings.sections.backup.email;
}

function updateBackupEmailSettings() {
  state.appSettings = normalizeAppSettings(state.appSettings);
  const email = state.appSettings.sections.backup.email;
  email.frequency = normalizeBackupEmailFrequency(el("backupEmailFrequency")?.value || "off");
  email.recipient = String(el("backupEmailRecipient")?.value || "").trim();
  saveState({ fastSave: true });
  renderBackupEmailSettings();
}

function renderBackupEmailSettings(message = "") {
  const email = getBackupEmailSettings();
  const sessionEmail = getAuthSession()?.email || "";
  const frequency = el("backupEmailFrequency");
  const recipient = el("backupEmailRecipient");
  const status = el("backupEmailStatus");
  if (frequency) frequency.value = email.frequency || "off";
  if (recipient && document.activeElement !== recipient) recipient.value = email.recipient || sessionEmail || "";
  if (!status) return;
  if (message) {
    status.textContent = message;
    return;
  }
  if (email.frequency === "off") {
    status.textContent = "메일 백업 예약은 꺼져 있습니다. 파일 내보내기/가져오기는 설정 상단 버튼을 사용합니다.";
  } else if (email.lastSentAt) {
    status.textContent = `최근 발송: ${new Date(email.lastSentAt).toLocaleString("ko-KR")} · 앱 실행 시 주기를 확인합니다.`;
  } else {
    status.textContent = "아직 발송 기록이 없습니다. 앱 실행 시 주기를 확인합니다.";
  }
}

async function sendBackupEmailNow(options = {}) {
  const silent = Boolean(options.silent);
  state.appSettings = normalizeAppSettings(state.appSettings);
  const email = state.appSettings.sections.backup.email;
  const recipient = String(options.recipient || el("backupEmailRecipient")?.value || email.recipient || getAuthSession()?.email || "").trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    if (!silent) alert("백업을 받을 이메일 주소를 입력하세요.");
    renderBackupEmailSettings("백업을 받을 이메일 주소가 필요합니다.");
    return false;
  }
  const session = await ensureFreshAuthSession();
  if (!session?.accessToken) {
    if (!silent) alert("메일 백업을 보내려면 로그인이 필요합니다.");
    renderBackupEmailSettings("로그인 세션이 필요합니다.");
    return false;
  }
  const file = createPlannerWorkbookFile();
  renderBackupEmailSettings("백업 메일을 준비하는 중입니다.");
  try {
    const response = await fetch("/api/email-backup", {
      method: "POST",
      headers: authStateHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        recipient,
        filename: file.filename,
        contentType: file.contentType,
        content: file.content,
        exportedAt: new Date().toISOString(),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || payload.hint || "메일 백업 발송 실패");
    email.recipient = recipient;
    email.lastSentAt = new Date().toISOString();
    saveState({ fastSave: true });
    renderBackupEmailSettings("백업 메일을 발송했습니다.");
    if (!silent) alert("백업 메일을 발송했습니다.");
    return true;
  } catch (error) {
    const message = error?.message || "메일 백업을 보낼 수 없습니다.";
    renderBackupEmailSettings(message);
    if (!silent) alert(message);
    return false;
  }
}

function checkScheduledBackupEmail() {
  window.clearTimeout(backupEmailCheckTimer);
  backupEmailCheckTimer = window.setTimeout(() => {
    const email = getBackupEmailSettings();
    if (email.frequency === "off") return;
    const recipient = email.recipient || getAuthSession()?.email || "";
    if (!recipient) return;
    const sessionKey = `beyondWorkBackupEmailAttempt.${email.frequency}.${iso(todayInPlanner())}`;
    if (sessionStorage.getItem(sessionKey)) return;
    if (!isBackupEmailDue(email)) return;
    sessionStorage.setItem(sessionKey, "1");
    sendBackupEmailNow({ silent: true, recipient });
  }, 1800);
}

function isBackupEmailDue(email) {
  const last = timestampMs(email.lastSentAt);
  if (!last) return true;
  const days = (Date.now() - last) / 86400000;
  return email.frequency === "weekly" ? days >= 7 : email.frequency === "monthly" ? days >= 28 : false;
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
  if (title) title.textContent = `${activeYear} Year Plan`;
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
        count ? (getAppLanguage() === "ko" ? `${count}개 업무` : `${count} tasks`) : "",
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
  const isKorean = getAppLanguage() === "ko";
  renderEditableList(el("yearGoals"), state.year.goals, isKorean ? "연간 목표" : "Year Goal", () => saveState());
  renderEditableList(el("futureLog"), state.year.future, isKorean ? "나중에 볼 일" : "Later / Waiting", () => saveState());
}

function getCalendarEvents(key) {
  const date = parseDate(key);
  const fixedEvents = Number.isNaN(date.getTime()) ? [] : getGeneratedKoreanCalendarEvents(key);
  const datedEvents = koreanCalendarEvents[key] || [];
  const customEvents = (state.calendar?.events || [])
    .filter((event) => event.date === key && event.title?.trim())
    .map((event) => ({ label: event.title.trim(), type: "anniversary", id: event.id }));
  return dedupeCalendarEvents([...fixedEvents, ...datedEvents, ...customEvents]);
}

function dedupeCalendarEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    const key = `${event.type || ""}:${event.label || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getGeneratedKoreanCalendarEvents(dateKey) {
  const date = parseDate(dateKey);
  if (Number.isNaN(date.getTime())) return [];
  const year = date.getFullYear();
  const eventsByDate = getKoreanHolidayEventsForYear(year);
  return eventsByDate.get(dateKey) || [];
}

function getKoreanHolidayEventsForYear(year) {
  if (koreanHolidayYearCache.has(year)) return koreanHolidayYearCache.get(year);
  const eventsByDate = new Map();
  const substituteCandidates = [];
  const addEvent = (date, event) => {
    const key = iso(date);
    const list = eventsByDate.get(key) || [];
    list.push({ label: event.label, type: event.type });
    eventsByDate.set(key, dedupeCalendarEvents(list));
    if (event.substitute) {
      substituteCandidates.push({
        date: new Date(date),
        label: event.label,
        type: event.type,
        mode: event.substituteMode || "weekendOrOverlap",
      });
    }
  };

  solarCalendarEventRules.forEach((rule) => {
    addEvent(new Date(year, rule.month - 1, rule.day), rule);
  });

  for (let month = 0; month < 12; month += 1) {
    const lastDate = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= lastDate; day += 1) {
      const date = new Date(year, month, day);
      getKoreanLunarHolidayEvents(date).forEach((event) => addEvent(date, event));
    }
  }

  const occupied = new Set(eventsByDate.keys());
  substituteCandidates
    .filter((candidate) => isSubstituteHolidayRequired(candidate, eventsByDate))
    .sort((a, b) => a.date - b.date)
    .forEach(({ date, label, type }) => {
      let substitute = new Date(date);
      do {
        substitute.setDate(substitute.getDate() + 1);
      } while (substitute.getFullYear() === year && (substitute.getDay() === 0 || substitute.getDay() === 6 || occupied.has(iso(substitute))));
      if (substitute.getFullYear() === year) {
        const key = iso(substitute);
        const list = eventsByDate.get(key) || [];
        const substituteLabel = label === "부처님오신날" ? "부처님 대체" : `${label} 대체`;
        list.push({ label: substituteLabel, type: type === "national" ? "holiday" : type });
        eventsByDate.set(key, dedupeCalendarEvents(list));
        occupied.add(key);
      }
    });

  koreanHolidayYearCache.set(year, eventsByDate);
  return eventsByDate;
}

function isSubstituteHolidayRequired(candidate, eventsByDate) {
  const day = candidate.date.getDay();
  const overlapsHoliday = (eventsByDate.get(iso(candidate.date)) || []).length > 1;
  if (overlapsHoliday) return true;
  if (candidate.mode === "sundayOrOverlap") return day === 0;
  return day === 0 || day === 6;
}

function getKoreanLunarHolidayEvents(date) {
  const { month, day } = getLunarDateParts(date);
  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);
  const tomorrowLunar = getLunarDateParts(tomorrow);
  const events = [];
  if (tomorrowLunar.month === 1 && tomorrowLunar.day === 1) {
    events.push({ label: "설 연휴", type: "holiday", substitute: true, substituteMode: "sundayOrOverlap" });
  }
  if (month === 1 && day === 1) events.push({ label: "설날", type: "holiday", substitute: true, substituteMode: "sundayOrOverlap" });
  if (month === 1 && day === 2) events.push({ label: "설 연휴", type: "holiday", substitute: true, substituteMode: "sundayOrOverlap" });
  if (month === 4 && day === 8) events.push({ label: "부처님오신날", type: "holiday", substitute: true, substituteMode: "weekendOrOverlap" });
  if (month === 8 && day === 14) events.push({ label: "추석 연휴", type: "holiday", substitute: true, substituteMode: "sundayOrOverlap" });
  if (month === 8 && day === 15) events.push({ label: "추석", type: "holiday", substitute: true, substituteMode: "sundayOrOverlap" });
  if (month === 8 && day === 16) events.push({ label: "추석 연휴", type: "holiday", substitute: true, substituteMode: "sundayOrOverlap" });
  return events;
}

function getLunarDateParts(date) {
  try {
    const parts = lunarDateFormatter.formatToParts(date);
    const monthPart = parts.find((part) => part.type === "month");
    const dayPart = parts.find((part) => part.type === "day");
    const month = Number(String(monthPart?.value || "").replace(/\D/g, ""));
    const day = Number(String(dayPart?.value || "").replace(/\D/g, ""));
    return { month, day };
  } catch {
    return { month: 0, day: 0 };
  }
}

function getLunarDecadeLabel(date) {
  const { month, day } = getLunarDateParts(date);
  if (!month || ![1, 10, 20, 30].includes(day)) return "";
  return `${month}/${day}`;
}

function renderMonth() {
  const current = ensureMonth();
  el("monthTitle").textContent = `${formatYearMonth(selectedDate)} Month Plan`;
  if (!el("monthPickerPopover")?.hidden) renderMonthPicker();
  document.querySelector("[data-month-field='focus']").value = current.focus || "";
  document.querySelector("[data-month-field='focus']").oninput = (event) => {
    current.focus = event.target.value;
    saveState();
  };
  renderEditableList(el("monthProjects"), current.projects, "Month Project", () => saveState());
  renderAnniversaryList();
  renderMonthCalendar();
}

function renderMonthCalendar() {
  const node = el("monthCalendar");
  node.innerHTML = "";
  getWeekdayLabels().forEach((day) => {
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
      ${count ? `<span class="count-pill">${getAppLanguage() === "ko" ? `${count}개 업무` : `${count} tasks`}</span>` : ""}
    `;
    cell.title = calendarAriaLabel(date, annotation.events, annotation.lunarLabel, Boolean(count));
    cell.onclick = () => {
      if (monthCalendarSwipeSuppressClick) return;
      monthDateTap = { key: "", at: 0 };
      openDailyPageForDate(date);
    };
    cell.ondblclick = () => {
      if (monthCalendarSwipeSuppressClick) return;
      openDailyPageForDate(date);
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

function prepareAnniversaryFromRepeatRule(rule = {}) {
  const baseYear = selectedDate.getFullYear();
  const month = clampNumber(rule.month, 1, 12, selectedDate.getMonth() + 1);
  const day = clampNumber(rule.monthday, 1, daysInMonth(baseYear, month - 1), selectedDate.getDate());
  showView("year");
  renderAll();
  const dateInput = el("anniversaryDate");
  const titleInput = el("anniversaryTitle");
  if (dateInput) dateInput.value = `${baseYear}-${pad(month)}-${pad(day)}`;
  if (titleInput) {
    titleInput.value = rule.text?.trim() || "";
    titleInput.focus();
  }
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
  const isKorean = getAppLanguage() === "ko";
  el("weekTitle").textContent = `${isKorean ? "주간 계획" : "Week Plan"} (${weekRange})`;
  el("weekCalendarToggle").setAttribute("aria-label", isKorean ? `주간 계획 ${weekRange}, 달력에서 주 선택` : `Week Plan ${weekRange}, choose a week from calendar`);

  const days = el("weekDays");
  days.innerHTML = "";
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const key = iso(date);
    ensureDay(key);
    const tasks = getDayTasks(key).filter((task) => task.text);
    const annotation = getCalendarAnnotation(date);
    const card = document.createElement("div");
    card.className = `week-day ${annotation.hasHoliday ? "has-holiday" : ""} ${annotation.lunarLabel ? "has-lunar" : ""}`.trim();
    card.innerHTML = `
      <strong>${formatDate(date)}</strong>
      <div class="week-day-marks">${renderCalendarAnnotationMarkup(annotation.events, annotation.lunarLabel)}</div>
      <small>${tasks.length ? tasks.slice(0, 3).map((task) => `${task.priority}. ${task.text}`).join("<br>") : isKorean ? "일간 페이지에 업무를 입력하세요." : "Add tasks on the daily page."}</small>
    `;
    card.onclick = () => {
      selectedDate = date;
      showView("day");
      renderAll();
    };
    days.appendChild(card);
  }
  if (!el("weekCalendarPopover").hidden) renderWeekCalendar();
  if (isPlannerCalendarOpen("week")) renderPlannerCalendarSheet();
}

function renderDay() {
  const day = ensureDay();
  const editing = isAnyPlannerTextEditing();
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
  if (!editing) {
    renderDayCompass();
    renderTaskBoard(day);
    syncVisibleTaskTimeHints(day, carryovers);
    renderRepeatPriorityList();
  }
  renderScheduleUnitControls(day);
  if (!editing) renderAppointments(day);
  renderCoach();
  document.querySelectorAll("[data-day-field]").forEach((field) => {
    field.value = day[field.dataset.dayField] || "";
    field.oninput = () => {
      day[field.dataset.dayField] = field.value;
      saveState();
    };
  });
  if (!el("dailyCalendarPopover").hidden) renderDailyCalendar();
  if (isPlannerCalendarOpen("daily")) renderPlannerCalendarSheet();
  positionDaySwipe();
}

function renderScheduleUnitControls(day = ensureDay()) {
  const unit = normalizeScheduleUnit(day.scheduleUnit || getEffectiveScheduleUnit(iso(selectedDate)));
  el("scheduleUnit30")?.classList.toggle("is-active", unit === "30");
  el("scheduleUnit60")?.classList.toggle("is-active", unit === "60");
  el("scheduleUnit30")?.setAttribute("aria-pressed", String(unit === "30"));
  el("scheduleUnit60")?.setAttribute("aria-pressed", String(unit === "60"));
  const range = el("scheduleRangeLabel");
  if (range) range.textContent = getScheduleRangeLabel(day);
}

function getScheduleRangeLabel(day = ensureDay()) {
  const slots = getScheduleSlotsForDay(day);
  if (!slots.length) return "시작시간 ~ 종료시간";
  const start = slots[0];
  const end = getAppointmentEndLabel(slots.length - 1, 1, slots);
  return `${start} ~ ${end}`;
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
  const coachLabel = coach.severity === "alert" ? "주의" : coach.severity === "warm" ? "조정" : "안정";
  const nextText = nextAppointment.text === "비어 있음" ? "없음" : nextAppointment.text;
  const execution = buildDailyExecutionSignal(day, tasks, carryovers, completion);
  const intelligence = buildDailyIntelligence(buildPlannerContext(selectedKey));
  const pattern = buildPatternSignal(selectedDate);
  const alignment = buildGoalProjectAlignmentSignal(tasks);
  const review = buildDailyReviewSignal(day);
  const tickerItems = `
    <span class="pulse-ticker-item pulse-primary" role="listitem"><b>오늘</b> ${completion.done}/${completion.total} <small>${completionRate}% · 남은 ${openTasks}</small></span>
    <span class="pulse-ticker-item" role="listitem"><b>다음</b> ${escapeHtml(nextAppointment.time)} <small>${escapeHtml(nextText)}</small></span>
    <span class="pulse-ticker-item pulse-${intelligence.severity}" role="listitem"><b>설계</b> ${escapeHtml(intelligence.blueprint.value)} <small>${escapeHtml(intelligence.blueprint.detail)}</small></span>
    <span class="pulse-ticker-item pulse-${intelligence.timeDebt.severity}" role="listitem"><b>부채</b> ${escapeHtml(intelligence.timeDebt.value)} <small>${escapeHtml(intelligence.timeDebt.detail)}</small></span>
    <span class="pulse-ticker-item pulse-${intelligence.riskRadar.severity}" role="listitem"><b>리스크</b> ${escapeHtml(intelligence.riskRadar.value)} <small>${escapeHtml(intelligence.riskRadar.detail)}</small></span>
    <span class="pulse-ticker-item" role="listitem"><b>이월</b> ${carryoverOpen.length}<small>${carryoverOpen.length ? "정리" : "없음"}</small></span>
    <span class="pulse-ticker-item" role="listitem"><b>실행</b> ${escapeHtml(execution.value)} <small>${escapeHtml(execution.detail)}</small></span>
    <span class="pulse-ticker-item" role="listitem"><b>패턴</b> ${escapeHtml(pattern.value)} <small>${escapeHtml(pattern.detail)}</small></span>
    <span class="pulse-ticker-item" role="listitem"><b>연결</b> ${escapeHtml(alignment.value)} <small>${escapeHtml(alignment.detail)}</small></span>
    <span class="pulse-ticker-item" role="listitem"><b>회고</b> ${escapeHtml(review.value)} <small>${escapeHtml(review.detail)}</small></span>
    <span class="pulse-ticker-item pulse-${coach.severity}" role="listitem"><b>AI</b> ${escapeHtml(coachLabel)} <small>${escapeHtml(coach.title)}</small></span>
  `;
  node.innerHTML = `
    <div class="pulse-ticker" role="list" aria-label="오늘 실행 요약 전광판">
      <div class="pulse-ticker-track">
        <div class="pulse-ticker-group">${tickerItems}</div>
        <div class="pulse-ticker-group" aria-hidden="true">${tickerItems}</div>
      </div>
    </div>
  `;
  renderDailyPulseDetails([
    ["오늘 실행", `${completion.done}/${completion.total}`, `${completionRate}% 완료 · 남은 업무 ${openTasks}`],
    ["다음 일정", nextAppointment.time, nextText],
    ["AI 하루 설계", intelligence.blueprint.value, intelligence.blueprint.detail],
    ["시간 부채", intelligence.timeDebt.value, intelligence.timeDebt.detail],
    ["리스크 레이더", intelligence.riskRadar.value, intelligence.riskRadar.detail],
    ["역할 밸런스", intelligence.roleBalance.value, intelligence.roleBalance.detail],
    ["이월 관리", `${carryoverOpen.length}건`, carryoverOpen.length ? "오늘 판단이 필요합니다." : "열린 이월 업무가 없습니다."],
    ["실행 추천", execution.value, execution.detail],
    ["패턴 분석", pattern.value, pattern.detail],
    ["목표 연결", alignment.value, alignment.detail],
    ["하루 회고", review.value, review.detail],
    ["AI 신호", coachLabel, coach.title],
  ]);
}

function buildDailyExecutionSignal(day, tasks, carryovers, completion) {
  const context = buildPlannerContext();
  const openA = context.openTasks.filter((task) => task.priority === "A");
  const scheduledTexts = context.appointmentEntries.map((entry) => entry.text).join(" ");
  const unscheduledA = openA.find((task) => task.text && !scheduledTexts.includes(task.text.slice(0, 8)));
  if (unscheduledA) return { value: "A고정", detail: `${unscheduledA.text.slice(0, 16)} 시간 배치` };
  if (carryovers.length >= 3) return { value: "이월정리", detail: `${carryovers.length}건 판단` };
  if (!context.appointmentEntries.length && context.openTasks.length) return { value: "시간배치", detail: "중요업무 1개 배치" };
  if (completion.total && completion.done === completion.total) return { value: "마감", detail: "기록/회고 정리" };
  return { value: "유지", detail: "현재 흐름 유지" };
}

function buildPatternSignal(date = selectedDate) {
  const trend = getRecentTaskTrend(date);
  const weekdayStats = getRecentWeekdayCompletionStats(date);
  if (!trend.total) return { value: "대기", detail: "기록 축적 필요" };
  const best = weekdayStats.find((item) => item.total >= 1);
  if (best) return { value: `${trend.completionRate}%`, detail: `${getWeekdayName(best.day)} 완료율 ${best.rate}%` };
  return { value: `${trend.completionRate}%`, detail: `최근 7일 ${trend.done}/${trend.total}` };
}

function getRecentWeekdayCompletionStats(anchorDate) {
  const stats = getWeekdayIndices().map((day) => ({ day, total: 0, done: 0, rate: 0 }));
  for (let offset = 0; offset < 28; offset += 1) {
    const date = new Date(anchorDate);
    date.setDate(anchorDate.getDate() - offset);
    const tasks = getDayTasks(iso(date)).filter((task) => task.text?.trim());
    const stat = stats[date.getDay()];
    stat.total += tasks.length;
    stat.done += tasks.filter((task) => shouldStrikeTask(task)).length;
  }
  stats.forEach((item) => {
    item.rate = item.total ? Math.round((item.done / item.total) * 100) : 0;
  });
  return stats.sort((a, b) => b.rate - a.rate || b.total - a.total);
}

function buildGoalProjectAlignmentSignal(tasks = []) {
  const yearGoals = (state.year?.goals || []).filter(Boolean);
  const monthProjects = (ensureMonth().projects || []).filter(Boolean);
  const activeProjects = (state.projects?.items || []).filter((project) => project.status !== "완료");
  const taskText = tasks.map((task) => task.text || "").join(" ");
  const goalHit = yearGoals.find((goal) => tokenOverlap(taskText, goal));
  const projectHit = [...monthProjects, ...activeProjects.map((project) => `${project.name} ${project.nextAction} ${project.goal}`)].find((project) => tokenOverlap(taskText, project));
  if (goalHit && projectHit) return { value: "목표+프로젝트", detail: "오늘 업무와 연결됨" };
  if (goalHit) return { value: "목표", detail: goalHit.slice(0, 18) };
  if (projectHit) return { value: "프로젝트", detail: projectHit.slice(0, 18) };
  if (yearGoals.length || monthProjects.length || activeProjects.length) return { value: "미연결", detail: "A업무와 목표 연결 필요" };
  return { value: "설정필요", detail: "목표/프로젝트 입력" };
}

function buildDailyReviewSignal(day = ensureDay()) {
  const wins = String(day.wins || "").trim();
  const carry = String(day.carry || "").trim();
  const lesson = String(day.lesson || "").trim();
  const count = [wins, carry, lesson].filter(Boolean).length;
  if (count >= 3) return { value: "완료", detail: "성과·이월·개선 기록" };
  if (wins) return { value: `${count}/3`, detail: `성과 기록: ${wins.slice(0, 16)}` };
  if (carry) return { value: `${count}/3`, detail: `내일 첫 행동: ${carry.slice(0, 16)}` };
  if (lesson) return { value: `${count}/3`, detail: `개선점: ${lesson.slice(0, 16)}` };
  return { value: "대기", detail: "마감 전 3줄 회고" };
}

function buildDailyIntelligence(context = buildPlannerContext()) {
  const unscheduledA = getUnscheduledPriorityTasks(context, "A");
  const highImpactTask = unscheduledA[0] || context.openTasks.find((task) => task.priority === "A") || context.openTasks[0] || null;
  const preferredSlot = pickIntelligenceFocusSlot(context);
  const timeDebt = buildTimeDebtSignal(context, unscheduledA);
  const riskRadar = buildRiskRadarSignal(context);
  const roleBalance = buildRoleBalanceSignal(context);
  const priorityShield = buildPriorityShieldSignal(context, unscheduledA);
  const severity = [timeDebt, riskRadar, priorityShield].some((item) => item.severity === "alert")
    ? "alert"
    : [timeDebt, riskRadar, roleBalance, priorityShield].some((item) => item.severity === "warm")
      ? "warm"
      : "calm";
  const blueprint = {
    value: highImpactTask ? `${preferredSlot} 고정` : "정리",
    detail: highImpactTask ? `${stripTaskTimeText(highImpactTask.text).slice(0, 22)}` : "목표 1개를 업무로 내리기",
    task: highImpactTask,
    slot: preferredSlot,
    severity,
  };
  const suggestions = [
    highImpactTask ? `${preferredSlot}에 '${stripTaskTimeText(highImpactTask.text).slice(0, 20)}' 실행 블록 만들기` : "오늘의 핵심 결과 1개를 우선업무로 만들기",
    ...priorityShield.suggestions,
    ...timeDebt.suggestions,
    ...riskRadar.suggestions,
    ...roleBalance.suggestions,
  ].filter(Boolean);
  return {
    severity,
    blueprint,
    timeDebt,
    riskRadar,
    roleBalance,
    priorityShield,
    suggestions: [...new Set(suggestions)].slice(0, 6),
    summary: `설계 ${blueprint.value} · 시간부채 ${timeDebt.value} · 리스크 ${riskRadar.value} · 밸런스 ${roleBalance.value}`,
  };
}

function getUnscheduledPriorityTasks(context, priority = "A") {
  const scheduledTexts = context.appointmentEntries.map((entry) => normalizeSearchText(entry.text)).join(" ");
  return context.openTasks.filter((task) => {
    if (task.priority !== priority || !task.text?.trim()) return false;
    const taskText = normalizeSearchText(stripTaskTimeText(task.text));
    const compact = taskText.slice(0, Math.min(8, taskText.length));
    return compact && !scheduledTexts.includes(compact);
  });
}

function pickIntelligenceFocusSlot(context) {
  const hints = [state.profile?.energyWindow, context.energyWindow].filter(Boolean).join(" ");
  const preferred = /오후/.test(hints)
    ? ["13:30", "14:00", "15:00", "16:00"]
    : /저녁|밤/.test(hints)
      ? ["17:00", "18:00", "19:00"]
      : ["09:00", "09:30", "10:00", "08:30"];
  return preferred.find((slot) => context.freeSlots.includes(slot)) || context.freeSlots.find((slot) => slot >= "09:00") || context.freeSlots[0] || "09:00";
}

function buildTimeDebtSignal(context, unscheduledA = getUnscheduledPriorityTasks(context, "A")) {
  const oldCarryovers = context.carryovers.filter((task) => task.date && dayDistance(parseDate(task.date), context.date) >= 2);
  const unscheduledCount = unscheduledA.length;
  if (oldCarryovers.length >= 2 || unscheduledCount >= 2) {
    return {
      value: `${oldCarryovers.length + unscheduledCount}건`,
      detail: oldCarryovers.length ? `${oldCarryovers[0].text.slice(0, 16)} 재판단` : "A업무 시간 배정 필요",
      severity: "alert",
      suggestions: [
        oldCarryovers[0] ? `시간 부채 정리: '${oldCarryovers[0].text.slice(0, 18)}'을 완료·연기·위임 중 하나로 결정하기` : "",
        unscheduledA[0] ? `A업무 보호: '${stripTaskTimeText(unscheduledA[0].text).slice(0, 18)}'을 시간표에 배치하기` : "",
      ],
    };
  }
  if (context.carryovers.length || unscheduledCount) {
    return {
      value: `${context.carryovers.length + unscheduledCount}건`,
      detail: context.carryovers.length ? "오늘 안에 정리 가능" : "A업무 1개 시간 배치",
      severity: "warm",
      suggestions: [unscheduledA[0] ? `${stripTaskTimeText(unscheduledA[0].text).slice(0, 18)} 시간 배정하기` : "이월 업무 1개만 먼저 정리하기"],
    };
  }
  return { value: "낮음", detail: "업무와 시간 흐름 안정", severity: "calm", suggestions: [] };
}

function buildRiskRadarSignal(context) {
  const moneyRisks = getUpcomingMoneyRisks(context.date, 7);
  const projectRisks = getUpcomingProjectRisks(context.date, 7);
  const denseSchedule = context.appointmentEntries.length >= 5;
  const riskCount = moneyRisks.length + projectRisks.length + (denseSchedule ? 1 : 0);
  if (riskCount >= 3) {
    return {
      value: `${riskCount}개`,
      detail: moneyRisks[0]?.title || projectRisks[0]?.title || "일정 과밀",
      severity: "alert",
      suggestions: [
        moneyRisks[0] ? `Money 리스크: ${moneyRisks[0].title.slice(0, 18)} 확인하기` : "",
        projectRisks[0] ? `프로젝트 리스크: ${projectRisks[0].title.slice(0, 18)} 다음 행동 지정하기` : "",
        denseSchedule ? "일정 과밀: 회의 사이 10분 완충시간 만들기" : "",
      ],
    };
  }
  if (riskCount) {
    return {
      value: `${riskCount}개`,
      detail: moneyRisks[0]?.title || projectRisks[0]?.title || "일정 점검",
      severity: "warm",
      suggestions: [moneyRisks[0] ? `${moneyRisks[0].date.slice(5)} Money 확인` : projectRisks[0] ? `${projectRisks[0].date.slice(5)} 프로젝트 마감 점검` : "일정 완충시간 확보"],
    };
  }
  return { value: "안정", detail: "7일 내 큰 신호 없음", severity: "calm", suggestions: [] };
}

function buildRoleBalanceSignal(context) {
  const text = context.openTasks.map((task) => `${task.text} ${task.priority || ""}`).join(" ");
  const buckets = [
    ["money", "Money", /자금|대금|입금|지출|수입|세금|송금|카드|이자|money/i],
    ["project", "프로젝트", /프로젝트|공사|현장|미팅|계약|개발|관리|보고/i],
    ["health", "건강", /건강|운동|병원|검진|걷기|수면|회복|기도|예배/i],
    ["growth", "성장", /독서|공부|학습|정리|회고|목표|훈련/i],
  ];
  const hits = buckets
    .map(([key, label, pattern]) => ({ key, label, count: (text.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`)) || []).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
  if (!context.openTasks.length) return { value: "대기", detail: "업무 입력 후 분석", severity: "calm", suggestions: [] };
  if (!hits.length) return { value: "미분류", detail: "태그 연결 약함", severity: "warm", suggestions: ["업무 하나를 목표·Money·프로젝트 중 하나와 연결하기"] };
  const top = hits[0];
  const severity = top.count >= Math.max(4, context.openTasks.length * 0.55) ? "warm" : "calm";
  return {
    value: top.label,
    detail: hits.slice(0, 3).map((item) => `${item.label} ${item.count}`).join(" · "),
    severity,
    suggestions: severity === "warm" ? [`${top.label}에 치우친 하루입니다. 건강·회고·관계 중 1개 균형 행동을 넣기`] : [],
  };
}

function buildPriorityShieldSignal(context, unscheduledA = getUnscheduledPriorityTasks(context, "A")) {
  const aTasks = context.openTasks.filter((task) => task.priority === "A");
  if (aTasks.length >= 4) {
    return {
      value: "과다",
      detail: `A업무 ${aTasks.length}개`,
      severity: "alert",
      suggestions: ["A업무를 2개 이하로 줄이고 나머지는 B 또는 날짜 지정으로 조정하기"],
    };
  }
  if (unscheduledA.length) {
    return {
      value: "미배치",
      detail: `${unscheduledA.length}개 시간표 필요`,
      severity: "warm",
      suggestions: [`${stripTaskTimeText(unscheduledA[0].text).slice(0, 18)}을 시간별 일정에 고정하기`],
    };
  }
  if (aTasks.length) return { value: "보호됨", detail: "A업무 흐름 양호", severity: "calm", suggestions: [] };
  return { value: "없음", detail: "A업무 지정 필요", severity: "warm", suggestions: ["목표와 직접 연결되는 A업무 1개 지정하기"] };
}

function getUpcomingMoneyRisks(anchorDate = selectedDate, days = 7) {
  state.finance ||= createFinanceState();
  normalizeFinanceState(state.finance);
  const start = iso(anchorDate);
  const endDate = new Date(anchorDate);
  endDate.setDate(endDate.getDate() + days);
  const end = iso(endDate);
  const risks = [];
  Object.entries(state.finance.months || {}).forEach(([key, rows]) => {
    rows.forEach((item) => {
      const date = getMoneyItemDate(item, key);
      if (!item.title?.trim() || !date || date < start || date > end || item.status === "완료") return;
      risks.push({ date, title: item.title, amount: item.amount, source: "month" });
    });
  });
  (state.finance.fixed || []).forEach((item) => {
    if (!item.title?.trim() || !Number(item.dueDay)) return;
    fixedMoneyTaskMonthKeys().forEach((key) => {
      const date = getMoneyItemDate(item, key);
      if (!date || date < start || date > end || !isFixedMoneyActiveForMonth(item, key) || item.status === "완료") return;
      risks.push({ date, title: item.title, amount: item.amount, source: "fixed" });
    });
  });
  return risks.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
}

function getUpcomingProjectRisks(anchorDate = selectedDate, days = 7) {
  const start = iso(anchorDate);
  const endDate = new Date(anchorDate);
  endDate.setDate(endDate.getDate() + days);
  const end = iso(endDate);
  return (state.projects?.items || [])
    .filter((project) => project.status !== "완료" && project.dueDate && project.dueDate >= start && project.dueDate <= end)
    .map((project) => ({ date: project.dueDate, title: project.title || project.nextAction || "프로젝트", source: "project" }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
}

function dayDistance(fromDate, toDate) {
  if (Number.isNaN(fromDate?.getTime?.()) || Number.isNaN(toDate?.getTime?.())) return 0;
  const oneDay = 24 * 60 * 60 * 1000;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / oneDay));
}

function tokenOverlap(source = "", target = "") {
  const sourceText = normalizeSearchText(source);
  const tokens = normalizeSearchText(target)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
  return tokens.some((token) => sourceText.includes(token));
}

function renderDailyPulseDetails(items) {
  const node = el("dailyPulseDetails");
  if (!node) return;
  node.innerHTML = items.map(([label, value, detail]) => `
    <div class="daily-pulse-detail-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `).join("");
}

function toggleDailyPulseDetails() {
  const node = el("dailyPulseDetails");
  const toggle = el("dailyPulseToggle");
  if (!node || !toggle) return;
  const nextHidden = !node.hidden ? true : false;
  node.hidden = nextHidden;
  toggle.setAttribute("aria-expanded", String(!nextHidden));
}

function getNextAppointmentSummary(day) {
  const slots = getScheduleSlotsForDay(day);
  const entries = slots
    .map((slot, index) => ({ slot, index, text: String(day.appointments?.[slot] || "").trim() }))
    .filter((entry) => entry.text);
  if (!entries.length) return { time: "비어 있음", text: "중요업무를 시간별 일정에 배치하세요" };
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
      ? { time: "완료", text: "남은 시간별 일정이 없습니다" }
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
  const collapsed = localStorage.getItem(ONBOARDING_COLLAPSED_KEY) === "1";
  const steps = getOnboardingSteps(day);
  node.hidden = !isToday;
  if (node.hidden) return;
  node.classList.toggle("is-collapsed", collapsed);
  if (collapsed) {
    node.innerHTML = `
      <button class="onboarding-restore" type="button" data-onboarding-toggle>
        <span>${escapeHtml(getAppLanguage() === "ko" ? "오늘 실행흐름" : "Build Today")}</span>
        <b>보이기</b>
      </button>
    `;
    node.querySelector("[data-onboarding-toggle]")?.addEventListener("click", toggleOnboardingPanel);
    return;
  }
  node.innerHTML = `
    <div>
      <p class="eyebrow">${escapeHtml(getAppLanguage() === "ko" ? "시작" : "Start")}</p>
      <h3>${escapeHtml(getAppLanguage() === "ko" ? "오늘 실행흐름 만들기" : "Build Today")}</h3>
      <p>${escapeHtml(getOnboardingSummary(steps))}</p>
      <div class="onboarding-step-list">
        ${steps.map((step) => `
          <button class="${step.done ? "is-done" : ""}" type="button" data-onboarding-action="${escapeAttr(step.action)}">
            <span>${step.done ? "✓" : "·"}</span>
            <b>${escapeHtml(step.title)}</b>
            <small>${escapeHtml(step.caption)}</small>
          </button>
        `).join("")}
      </div>
    </div>
    <div class="onboarding-actions">
      <button type="button" data-onboarding-action="${escapeAttr(steps.find((step) => !step.done)?.action || "task")}">다음 단계</button>
      <button type="button" data-onboarding-toggle>숨기기</button>
    </div>
  `;
  node.querySelectorAll("[data-onboarding-action]").forEach((button) => {
    button.onclick = () => handleOnboardingAction(button.dataset.onboardingAction);
  });
  node.querySelector("[data-onboarding-toggle]")?.addEventListener("click", toggleOnboardingPanel);
}

function toggleOnboardingPanel() {
  const collapsed = localStorage.getItem(ONBOARDING_COLLAPSED_KEY) === "1";
  localStorage.setItem(ONBOARDING_COLLAPSED_KEY, collapsed ? "0" : "1");
  renderOnboarding(ensureDay());
}

function getOnboardingSteps(day = ensureDay()) {
  const week = ensureWeek();
  const isKorean = getAppLanguage() === "ko";
  const hasIdentity = Boolean(state.profile?.personaType || state.profile?.goals || state.foundation?.mission);
  const hasWeek = (week.priorities || []).some((item) => item.text?.trim());
  const hasTasks = getDayTasks(iso(selectedDate)).some((task) => task.text?.trim());
  const hasSchedule = Object.values(day.appointments || {}).some((value) => String(value || "").trim());
  const hasReview = ["wins", "carry", "lesson"].some((field) => String(day[field] || "").trim());
  return isKorean
    ? [
        { action: "foundation", done: hasIdentity, title: "나의 정보", caption: "AI 코칭의 기준" },
        { action: "week", done: hasWeek, title: "주간 초점", caption: "이번 주 핵심" },
        { action: "task", done: hasTasks, title: "우선업무", caption: "오늘 끝낼 일" },
        { action: "schedule", done: hasSchedule, title: "시간별 일정", caption: "언제 할지 배치" },
        { action: "review", done: hasReview, title: "하루 회고", caption: "배운 점 축적" },
      ]
    : [
        { action: "foundation", done: hasIdentity, title: "About Me", caption: "AI's context" },
        { action: "week", done: hasWeek, title: "Week Focus", caption: "This week's key items" },
        { action: "task", done: hasTasks, title: "Top Tasks", caption: "What to finish today" },
        { action: "schedule", done: hasSchedule, title: "Schedule", caption: "When to do it" },
        { action: "review", done: hasReview, title: "Daily Review", caption: "Lessons retained" },
      ];
}

function getOnboardingSummary(steps = []) {
  const remain = steps.filter((step) => !step.done);
  if (getAppLanguage() !== "ko") {
    if (!remain.length) return "Your core workflow is ready. Execute and close the day well.";
    return `${remain.length} steps left to connect goals, week focus, today, and review.`;
  }
  if (!remain.length) return "핵심 흐름이 준비되었습니다. 오늘은 실행과 회고만 남기면 됩니다.";
  return `${remain.length}단계만 채우면 목표, 주간 계획, 오늘 실행, 회고가 하나로 연결됩니다.`;
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
  const highPriorityTasks = openTasks.filter((task) => task.priority === "A");
  const carryovers = getCarryoverTasks(date).filter((task) => !isCarryoverCompletedOn(task, key));
  const appointmentSummary = getNextAppointmentSummary(day);
  const appointments = Object.values(day.appointments || {}).filter((value) => String(value || "").trim());
  const season = getSeasonalContext(date);
  const weekday = getWeekdayName(date.getDay());
  const personaLabel = getPersonaLabel(state.profile);
  const identity = summarizeProfileIdentity(state.profile);
  const topTask = highPriorityTasks[0] || openTasks[0] || null;
  const goals = [state.profile?.goals, state.foundation?.mission, ...(state.year?.goals || [])]
    .filter(Boolean)
    .join(" ")
    .trim();
  const profileSeed = [
    personaLabel,
    identity,
    state.profile?.goals,
    state.profile?.currentChallenges,
    state.profile?.energyWindow,
    state.profile?.healthStatus,
  ].filter(Boolean).join("|");
  const hash = hashString(`${key}:${weekday}:${tasks.length}:${carryovers.length}:${appointments.length}:${goals.slice(0, 80)}:${profileSeed}:${topTask?.text || ""}`);
  const praise = buildDailyOpeningPraise({ hash, personaLabel, carryovers, appointments, openTasks, goals });
  const challenge = dailyChallengeText(openTasks, carryovers, appointments, goals, hash, { topTask, appointmentSummary, personaLabel });
  const firstMove = buildDailyFirstMove({ topTask, appointmentSummary, carryovers, openTasks, goals, hash });
  return {
    title: `${formatCompactOpeningDate(date)} ${season.label} 코칭`,
    message: `${praise} ${season.shortTone} ${firstMove} ${challenge}`,
    signals: [
      `${weekday} 리듬: ${getWeekdayOpeningSignal(date, hash)}`,
      personaLabel ? `사용자 유형: ${personaLabel} 관점으로 오늘의 선택을 좁힙니다.` : "사용자 정보를 채우면 내일의 코칭이 더 정확해집니다.",
      appointments.length
        ? `다음 일정: ${appointmentSummary.time} ${appointmentSummary.text}`
        : "시간별 일정이 비어 있습니다. 중요한 일 하나를 실제 시간에 고정하세요.",
      carryovers.length
        ? `이월 ${carryovers.length}개: 탓할 짐이 아니라 오늘 결정할 재료입니다.`
        : "이월 부담이 낮습니다. 오늘은 새 추진력을 만들기 좋습니다.",
      topTask?.text ? `첫 실행 후보: ${stripTaskTimeText(topTask.text).slice(0, 42)}` : season.signal,
    ],
  };
}

function formatCompactOpeningDate(date) {
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}(${getWeekdayLabel(date.getDay())})`;
}

function buildDailyOpeningPraise({ hash, personaLabel, carryovers, appointments, openTasks, goals }) {
  if (carryovers.length >= 5) return "많이 밀린 날일수록 대표님의 판단력은 더 선명해야 합니다.";
  if (appointments.length >= 4) return "일정이 많은 날에도 하루의 주도권은 첫 선택에서 시작됩니다.";
  if (openTasks.length && goals) return `${personaLabel ? `${personaLabel}로서 ` : ""}목표와 오늘의 실행을 연결하려는 태도는 이미 좋은 출발입니다.`;
  return pickByHash(
    [
      "오늘을 기록으로 시작한 것만으로도 이미 방향을 붙든 것입니다.",
      "어제의 무게가 남아 있어도 오늘의 첫 선택은 새로울 수 있습니다.",
      "일을 적는 손은 작아 보여도 방향을 정하는 힘은 큽니다.",
      "바쁜 형편 속에서도 계획을 여는 태도는 충분히 칭찬받을 일입니다.",
    ],
    hash,
  );
}

function buildDailyFirstMove({ topTask, appointmentSummary, carryovers, openTasks, goals, hash }) {
  if (topTask?.text) return `첫 승부는 '${stripTaskTimeText(topTask.text).slice(0, 28)}'에서 시작하세요.`;
  if (appointmentSummary?.time && appointmentSummary.time !== "비어 있음") return `${appointmentSummary.time} 일정을 기준으로 오전의 여백을 지키세요.`;
  if (carryovers.length) return "먼저 이월된 일 중 버릴 것과 살릴 것을 나누세요.";
  if (openTasks.length) return "가장 작은 업무 하나를 끝내며 흐름을 여세요.";
  if (goals) return "목표와 닿은 행동 하나를 오늘 목록에 올리세요.";
  return pickByHash(["첫 20분을 단단히 여세요.", "작게 시작하고 분명히 끝내세요.", "오늘의 한 칸을 정직하게 채우세요."], hash + 11);
}

function getWeekdayOpeningSignal(date, hash) {
  const day = date.getDay();
  const weekdayMessages = {
    0: ["이번 주를 조용히 설계하기 좋습니다.", "회복과 준비를 같이 잡으면 한 주가 가벼워집니다."],
    1: ["시작이 완벽하지 않아도 방향만 선명하면 됩니다.", "새 일을 늘리기보다 이번 주 첫 결과를 정하세요."],
    2: ["月曜日의 생각을 실행으로 바꾸기 좋은 날입니다.", "오전의 집중 블록 하나가 주중 흐름을 만듭니다."],
    3: ["중간 점검이 성과를 구합니다.", "오늘은 더하기보다 조정이 강한 선택입니다."],
    4: ["마감 전 병목을 발견하기 좋은 날입니다.", "위임·취소·연기를 선명히 할수록 金曜日이 가벼워집니다."],
    5: ["한 주의 끝을 그냥 닫지 말고 결과로 남기세요.", "끝낼 일 하나와 넘길 일 하나를 구분하세요."],
    6: ["정리와 회복이 다음 실행의 연료가 됩니다.", "느린 점검 하나가 다음 주 속도를 만듭니다."],
  };
  return pickByHash(weekdayMessages[day] || weekdayMessages[1], hash + day);
}

function stripTaskTimeText(text = "") {
  return String(text || "")
    .replace(/\((오전|오후)?\s*\d{1,2}(?:(?::|시\s*)[0-5]\d)?\s*(?:분)?\)/g, "")
    .replace(/(^|[^\d])((오전|오후)?\s*\d{1,2}:[0-5]\d)(?!\d)/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
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

function dailyChallengeText(openTasks, carryovers, appointments, goals, hash, context = {}) {
  if (carryovers.length >= 5) return "남길 일과 보낼 일을 분명히 나누세요.";
  if (openTasks.length >= 8) return "A업무 두 개만 남겨도 충분히 강합니다.";
  if (!appointments.length && openTasks.length) return "중요한 일 하나를 시간별 일정에 앉히세요.";
  if (context.topTask?.priority === "A") return "A업무는 생각으로 이기지 말고 시간칸으로 이기세요.";
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
  updateCoachTabState();
  const message = el("coachMessage");
  const suggestions = el("coachSuggestions");
  const guide = el("coachGuide");
  if (!message || !suggestions || !guide) return;
  const analysis = activeCoachSection ? buildSectionCoachAnalysis(activeCoachSection) : buildCoachAnalysis();
  const usage = buildCoachUsageGuide(activeCoachSection || "main");
  guide.innerHTML = `
    <strong>${escapeHtml(usage.title)}</strong>
    <p>${escapeHtml(usage.summary)}</p>
    <ul>
      ${usage.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
    </ul>
    <small>${escapeHtml(usage.tip)}</small>
  `;
  message.className = `coach-card severity-${analysis.severity}`;
  message.innerHTML = `
    <strong>${escapeHtml(analysis.title)}</strong>
    <p>${escapeHtml(analysis.message)}</p>
    ${Array.isArray(analysis.signals) && analysis.signals.length ? `
      <div class="coach-signal-grid" aria-label="AI 분석 신호">
        ${analysis.signals.map(([label, value, detail]) => `
          <span>
            <small>${escapeHtml(label)}</small>
            <b>${escapeHtml(value)}</b>
            <em>${escapeHtml(detail)}</em>
          </span>
        `).join("")}
      </div>
    ` : ""}
    <small>${escapeHtml(analysis.detail)}</small>
  `;
  guide.hidden = activeCoachTab !== "guide";
  message.hidden = activeCoachTab !== "coach";
  suggestions.innerHTML = "";
  analysis.suggestions.forEach((text) => {
    const item = document.createElement("button");
    item.className = "coach-suggestion";
    item.type = "button";
    item.textContent = text;
    item.onclick = () => addSuggestedTask(text);
    suggestions.appendChild(item);
  });
  suggestions.hidden = activeCoachTab !== "coach";
}

function updateCoachTabState() {
  document.querySelectorAll("[data-coach-tab]").forEach((button) => {
    const active = button.dataset.coachTab === activeCoachTab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
}

function buildCoachUsageGuide(section = "main") {
  if (getAppLanguage() === "ko") {
    const koGuides = {
      main: {
        title: "비욘드 워크 전체 사용법",
        summary: "이 아이콘은 전체 플래너 사용 흐름과 오늘의 코칭을 여는 곳입니다.",
        steps: [
          "먼저 오늘 화면에서 우선업무와 시간별 일정을 정리합니다.",
          "주간, 월간, 프로젝트, 머니는 오늘 업무의 근거가 되는 상위 계획으로 사용합니다.",
          "설정의 사용자 정보를 채울수록 코칭은 더 개인화됩니다.",
          "코칭 탭에서는 미완료, 일정 과밀, 빈 시간, 목표 연결성을 기준으로 다음 행동을 제안합니다.",
        ],
        tip: "처음 사용하는 사용자는 오늘 → 주간 → 머니/프로젝트 순서로 익히는 것이 가장 안정적입니다.",
      },
      day: {
        title: "오늘 화면 사용법",
        summary: "오늘 실행할 일과 시간 배치를 한 화면에서 결정합니다.",
        steps: [
          "중요도 A/B/C를 정하고, 완료·진행중·위임·연기를 명확히 표시합니다.",
          "업무 내용에 10:00처럼 시간을 넣으면 해당 시간별 일정에 자동 반영됩니다.",
          "주간과 메모는 좌우 쓸기 또는 배너 양쪽 버튼으로 이동합니다.",
        ],
        tip: "오늘은 많이 적는 것보다 실제 시간표에 올라간 A업무가 있는지가 중요합니다.",
      },
      tasks: {
        title: "우선업무 사용법",
        summary: "오늘 반드시 처리할 일을 고르고 상태를 관리하는 섹션입니다.",
        steps: [
          "A는 반드시 시간별 일정에 배치할 일, B는 중요하지만 유연한 일, C는 여유가 있을 때 처리할 일입니다.",
          "완료, 취소, 연기, 위임 상태는 붉은 선으로 명확히 구분됩니다.",
          "반복업무는 업무 추가 과정에서 설정하고, 필요 시 반복업무 관리 창에서 수정합니다.",
        ],
        tip: "A업무가 3개를 넘으면 실행률이 떨어지므로 우선순위를 다시 줄이는 것이 좋습니다.",
      },
      schedule: {
        title: "시간별 일정 사용법",
        summary: "중요업무를 실제 시간 칸으로 바꾸는 섹션입니다.",
        steps: [
          "30분 또는 1시간 단위는 설정에서 관리합니다.",
          "일정칸에 입력하면 해당 시간대가 강조되고, 필요한 경우 인접 시간과 병합할 수 있습니다.",
          "우선업무에 시간 표현이 있으면 일정에 자동으로 연결됩니다.",
        ],
        tip: "시간표가 비어 있으면 업무는 계획에 머물 가능성이 큽니다. A업무 하나는 반드시 시간칸에 넣으세요.",
      },
      week: {
        title: "주간 사용법",
        summary: "이번 주 주요일정과 역할별 핵심행동을 정리합니다.",
        steps: [
          "금주의 주요일정은 체크 전까지 다음 주로 이월됩니다.",
          "개인, 가족, 일, 성장 등 영역별 핵심행동을 1-2개만 잡습니다.",
          "오늘 화면의 주간 버튼이나 좌우 쓸기로 빠르게 확인합니다.",
        ],
        tip: "주간 계획은 많은 목표보다 오늘로 내려올 수 있는 행동이어야 합니다.",
      },
      memo: {
        title: "메모 사용법",
        summary: "회의, 결정, 배운 점, 내일 넘길 일을 기록하는 섹션입니다.",
        steps: [
          "메모 페이지에는 자유 기록을 남깁니다.",
          "일일 기록에는 오늘의 결정, 진행, 배운 점을 짧게 정리합니다.",
          "검색/질문에서 메모 내용도 함께 검색할 수 있습니다.",
        ],
        tip: "결정과 후속조치를 분리해서 적으면 나중에 검색 가치가 커집니다.",
      },
      foundation: {
        title: "사용자 설정 사용법",
        summary: "AI가 사용자의 일, 목표, 하루 습관, 건강 상태를 이해하는 기준 정보입니다.",
        steps: [
          "가장 가까운 모습, 요즘 하는 일, 연령대만 먼저 입력합니다.",
          "올해 바꾸고 싶은 것과 요즘 신경 쓰이는 일을 보강합니다.",
          "건강·운동 정보는 무리 없는 일정 조정과 코칭에 활용됩니다.",
        ],
        tip: "사용자 정보가 구체적일수록 AI 추천은 일반론에서 벗어납니다.",
      },
      year: {
        title: "연간 계획 사용법",
        summary: "올해 반드시 남길 결과와 큰 방향을 정리합니다.",
        steps: [
          "연간 목표는 3-5개 이내로 압축합니다.",
          "목표마다 이번 달 행동으로 내려올 수 있는 표현을 씁니다.",
          "추상적인 문장은 월간·주간 계획에서 실행 단위로 바꿉니다.",
        ],
        tip: "연간 목표는 오늘 업무를 거절하는 기준으로도 작동해야 합니다.",
      },
      month: {
        title: "월간 계획 사용법",
        summary: "월간 초점, 달력, 기념일, 주요 마감을 관리합니다.",
        steps: [
          "월간 초점은 이번 달 가장 중요한 결과 하나를 적습니다.",
          "기념일과 주요 마감은 일간·주간 달력에 함께 반영됩니다.",
          "월 제목이나 화살표로 월을 이동합니다.",
        ],
        tip: "월간 계획은 주간과 오늘 업무로 내려올 때 의미가 생깁니다.",
      },
      projects: {
        title: "프로젝트 사용법",
        summary: "프로젝트 목록과 세부 실행, 자금 흐름을 연결합니다.",
        steps: [
          "프로젝트 목록에서 항목을 선택하면 세부 페이지가 열립니다.",
          "다음 행동, 담당, 일정, 예산을 기록합니다.",
          "프로젝트 자금 항목은 예상 수입·비용 흐름을 확인하는 데 사용합니다.",
        ],
        tip: "프로젝트는 반드시 다음 행동 하나가 오늘 업무로 내려와야 진행됩니다.",
      },
      finance: {
        title: "머니 사용법",
        summary: "반복지출, 수입, 자금 이슈를 일정과 우선업무에 연결합니다.",
        steps: [
          "반복지출은 시작일과 도래일을 기준으로 우선업무에 올라옵니다.",
          "금액은 설정에서 보이기/감추기를 선택할 수 있습니다.",
          "항목을 클릭하면 머니 섹션에서 세부 내용을 관리합니다.",
        ],
        tip: "머니 항목은 한 달 이내에 실제 확인할 이슈만 우선업무에 올리는 것이 적절합니다.",
      },
      sheets: {
        title: "시트 사용법",
        summary: "반복 양식, 비교표, 체크리스트를 자유롭게 만드는 공간입니다.",
        steps: [
          "목록에서 시트를 선택하면 오른쪽으로 상세 화면이 열립니다.",
          "행·열 제목을 선택하고 경계선을 드래그해 크기를 조정합니다.",
          "필요한 경우 템플릿으로 새 시트를 시작합니다.",
        ],
        tip: "시트는 플래너의 보조 도구입니다. 핵심 업무는 오늘과 프로젝트에 남기는 것이 좋습니다.",
      },
    };
    return koGuides[section] || koGuides.day;
  }
  const guides = {
    main: {
      title: "Beyond Work 전체 사용법",
      summary: "이 아이콘은 전체 플래너의 사용 흐름과 오늘의 코칭을 여는入口입니다.",
      steps: [
        "먼저 Today에서 Top Tasks와 Schedule을 정리합니다.",
        "Weekly, Month, Projects, Money는 오늘 업무의 근거가 되는 상위 계획으로 사용합니다.",
        "설정의 사용자 정보를 채울수록 코칭은 더 개인화됩니다.",
        "코칭 탭에서는 미완료, 일정 과밀, 빈 시간, 목표 연결성을 기준으로 다음 행동을 제안합니다.",
      ],
      tip: "처음 사용하는 사용자는 Today → Weekly → Money/Projects 순서로 익히는 것이 가장 안정적입니다.",
    },
    day: {
      title: "Today 사용법",
      summary: "오늘 실행할 일과 시간 배치를 한 화면에서 결정합니다.",
      steps: [
        "A/B/C 중요도를 정하고, 완료·진행중·위임·연기를 명확히 표시합니다.",
        "업무 내용에 10:00처럼 시간을 넣으면 해당 시간별 일정에 자동 반영됩니다.",
        "Weekly와 Memo는 좌우 스와이프 또는 배너 양쪽 버튼으로 이동합니다.",
      ],
      tip: "오늘은 많이 적는 것보다 실제 시간표에 올라간 A업무가 있는지가 중요합니다.",
    },
    tasks: {
      title: "Top Tasks 사용법",
      summary: "오늘 반드시 처리할 일을 선별하고 상태를 관리하는 섹션입니다.",
      steps: [
        "A는 반드시 시간별 일정에 배치할 일, B는 중요하지만 유연한 일, C는 여유가 있을 때 처리할 일입니다.",
        "완료, 취소, 연기, 위임 상태는 붉은 선으로 명확히 구분됩니다.",
        "반복업무는 업무 추가 과정에서 설정하고, 필요 시 반복업무 관리 창에서 수정합니다.",
      ],
      tip: "A업무가 3개를 넘으면 실제 실행률이 떨어지므로 우선순위를 다시 줄이는 것이 좋습니다.",
    },
    schedule: {
      title: "Schedule 사용법",
      summary: "중요업무를 실제 시간 블록으로 바꾸는 섹션입니다.",
      steps: [
        "30분 또는 1시간 단위는 설정에서 관리합니다.",
        "일정칸에 입력하면 해당 시간대가 강조되고, 필요한 경우 인접 시간과 병합할 수 있습니다.",
        "우선업무에 시간 표현이 있으면 일정에 자동으로 연결됩니다.",
      ],
      tip: "시간표가 비어 있으면 업무는 계획에 머물 가능성이 큽니다. A업무 하나는 반드시 시간칸에 넣으세요.",
    },
    week: {
      title: "Weekly Focus 사용법",
      summary: "이번 주 주요일정과 역할별 핵심행동을 정리합니다.",
      steps: [
        "금주의 주요일정은 체크 전까지 다음 주로 이월됩니다.",
        "개인, 가족, 일, 성장 등 역할별 핵심행동을 1-2개만 잡습니다.",
        "오늘 섹션의 Weekly 버튼이나 좌우 스와이프로 빠르게 확인합니다.",
      ],
      tip: "주간 계획은 많은 목표보다 오늘로 내려올 수 있는 행동이어야 합니다.",
    },
    memo: {
      title: "Memo 사용법",
      summary: "회의, 결정, 배운 점, 내일 넘길 일을 기록하는 섹션입니다.",
      steps: [
        "메모 페이지에는 자유 기록을 남깁니다.",
        "Daily Note에는 오늘의 결정, 진행, 배운 점을 짧게 정리합니다.",
        "검색/질문에서 메모 내용도 함께 검색할 수 있습니다.",
      ],
      tip: "결정과 후속조치를 분리해서 적으면 나중에 검색 가치가 커집니다.",
    },
    foundation: {
      title: "About Me 사용법",
      summary: "AI가 사용자의 정체성, 목표, 리듬을 이해하는 기준 정보입니다.",
      steps: [
        "사용자 유형, 직업, 역할, 목표를 먼저 입력합니다.",
        "현재 과제, 강점, 리스크, 에너지 시간대를 보강합니다.",
        "건강·운동 정보는 무리 없는 일정 조정과 코칭에 활용됩니다.",
      ],
      tip: "사용자 정보가 선명할수록 AI 추천은 일반론에서 벗어납니다.",
    },
    year: {
      title: "Year Plan 사용법",
      summary: "올해 반드시 남길 결과와 큰 방향을 정리합니다.",
      steps: [
        "연간 목표는 3-5개 이내로 압축합니다.",
        "목표마다 이번 달 행동으로 내려올 수 있는 표현을 씁니다.",
        "추상적인 문장은 월간·주간 계획에서 실행 단위로 바꿉니다.",
      ],
      tip: "연간 목표는 오늘 업무를 거절하는 기준으로도 작동해야 합니다.",
    },
    month: {
      title: "Month Plan 사용법",
      summary: "월간 초점, 달력, 기념일, 주요 마감을 관리합니다.",
      steps: [
        "월간 초점은 이번 달 가장 중요한 결과 하나를 적습니다.",
        "기념일과 주요 마감은 일간·주간 달력에 함께 반영됩니다.",
        "월 제목이나 화살표로 월을 이동합니다.",
      ],
      tip: "월간 계획은 주간과 오늘 업무로 내려올 때 의미가 생깁니다.",
    },
    projects: {
      title: "Projects 사용법",
      summary: "프로젝트 목록과 세부 실행, 자금 시뮬레이션을 연결합니다.",
      steps: [
        "프로젝트 목록에서 항목을 선택하면 세부 페이지가 열립니다.",
        "다음 행동, 담당, 일정, 예산을 기록합니다.",
        "프로젝트 자금 항목은 예상 수입·비용 흐름을 확인하는 데 사용합니다.",
      ],
      tip: "프로젝트는 반드시 다음 행동 하나가 오늘 업무로 내려와야 진행됩니다.",
    },
    finance: {
      title: "Money 사용법",
      summary: "반복지출, 수입, 자금 이슈를 일정과 우선업무에 연결합니다.",
      steps: [
        "반복지출은 시작일과 도래일을 기준으로 우선업무에 올라옵니다.",
        "금액은 설정에서 보이기/감추기를 선택할 수 있습니다.",
        "항목을 클릭하면 Money 섹션에서 세부 내용을 관리합니다.",
      ],
      tip: "Money 항목은 한 달 이내에 실제 확인할 이슈만 우선업무에 올리는 것이 적절합니다.",
    },
    sheets: {
      title: "Sheets 사용법",
      summary: "반복 양식, 비교표, 체크리스트를 자유롭게 만드는 공간입니다.",
      steps: [
        "목록에서 시트를 선택하면 오른쪽으로 상세 화면이 열립니다.",
        "행·열 제목을 선택하고 경계선을 드래그해 크기를 조정합니다.",
        "필요한 경우 템플릿으로 새 시트를 시작합니다.",
      ],
      tip: "시트는 플래너의 보조 도구입니다. 핵심 업무는 Today와 Projects에 남기는 것이 좋습니다.",
    },
  };
  return guides[section] || guides.day;
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
  bindProfileMultiFields();
}

function bindProfileMultiFields() {
  document.querySelectorAll("[data-profile-multi]").forEach((group) => {
    const key = group.dataset.profileMulti;
    const values = Array.isArray(state.profile?.[key]) ? state.profile[key] : [];
    group.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
      checkbox.checked = values.includes(checkbox.value);
      checkbox.onchange = () => {
        state.profile ||= {};
        state.profile[key] = Array.from(group.querySelectorAll("input[type='checkbox']:checked")).map((input) => input.value);
        saveState();
        renderCoach();
      };
    });
  });
}

function buildCoachAnalysis() {
  const context = buildPlannerContext();
  const { openTasks, doneTasks, carryovers, appointmentEntries, goals, trend, freeSlots, highPriorityOpen, identitySummary, personaLabel, personaGuidance, coachingStyle, currentChallenges, healthSummary, exerciseLimits } = context;
  const intelligence = buildDailyIntelligence(context);
  let severity = "calm";
  let title = "오늘의 선택을 또렷하게 만들 시간입니다.";
  let message = "역할, 목표, 오늘의 우선업무가 서로 이어지도록 한 가지 중요한 결과를 먼저 고르세요.";
  if (intelligence.severity === "alert") {
    severity = "alert";
    title = "오늘은 실행보다 먼저 구조를 바로잡아야 합니다.";
    message = `${intelligence.riskRadar.value !== "안정" ? `리스크 ${intelligence.riskRadar.value}, ` : ""}시간 부채 ${intelligence.timeDebt.value}가 감지됩니다. ${intelligence.blueprint.value}을 기준으로 A업무를 시간표에 고정하고, 나머지는 연기·위임·취소로 정리하세요.`;
  } else if (carryovers.length >= 4 || openTasks.length >= 8) {
    severity = "alert";
    title = "업무가 과밀합니다. 오늘은 줄이는 결단이 성과입니다.";
    message = `열린 업무 ${openTasks.length}개, 이월 ${carryovers.length}개가 보입니다. A업무 1-2개만 시간별 일정에 고정하고 나머지는 연기·위임·취소로 정리하세요.`;
  } else if (intelligence.severity === "warm") {
    severity = "warm";
    title = "오늘의 실행 설계를 조금 더 선명하게 만들 수 있습니다.";
    message = `${intelligence.summary}. ${intelligence.blueprint.detail}을 먼저 시간칸에 앉히면 오늘의 판단 부담이 줄어듭니다.`;
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
  if (personaGuidance) {
    message += ` ${personaLabel} 관점에서는 ${personaGuidance}`;
  }
  if (healthSummary) {
    message += exerciseLimits
      ? " 건강 정보가 있으므로 오늘 활동은 무리보다 안전한 지속성을 우선으로 잡겠습니다."
      : " 건강 리듬도 함께 보겠습니다. 짧은 신체 활동을 시간별 일정에 넣으면 집중 회복에 도움이 됩니다.";
  }
  if (/단호|직설|강하게/.test(coachingStyle)) {
    message += " 결론은 단순합니다. 덜 중요한 일은 과감히 뒤로 보내고, 가장 중요한 한 칸을 반드시 지키세요.";
  } else if (/격려|따뜻|칭찬/.test(coachingStyle)) {
    message += " 이미 기록하고 조정하려는 태도 자체가 좋은 출발입니다. 오늘은 작아도 끝나는 승리를 만드세요.";
  } else if (/숫자|데이터|분석/.test(coachingStyle)) {
    message += ` 현재 지표는 완료 ${doneTasks.length}개, 열린 업무 ${openTasks.length}개, 일정 ${appointmentEntries.length}개입니다.`;
  }
  const suggestions = [...new Set([...intelligence.suggestions, ...generateTaskSuggestions(context)])].slice(0, 6);
  return {
    severity,
    title,
    message,
    detail: `${identitySummary || personaLabel || "사용자 정보"}${healthSummary ? ` · 건강: ${healthSummary}` : ""} · 최근 7일 완료율 ${trend.completionRate}% · 오늘 일정 ${appointmentEntries.length}개 · 이월 ${carryovers.length}개 · ${intelligence.summary}`,
    suggestions,
    signals: [
      ["AI 하루 설계", intelligence.blueprint.value, intelligence.blueprint.detail],
      ["시간 부채", intelligence.timeDebt.value, intelligence.timeDebt.detail],
      ["CEO 리스크", intelligence.riskRadar.value, intelligence.riskRadar.detail],
      ["역할 밸런스", intelligence.roleBalance.value, intelligence.roleBalance.detail],
    ],
  };
}

function buildSectionCoachAnalysis(section = "day") {
  const context = buildPlannerContext();
  const labels = {
    foundation: "About Me",
    year: "Year Plan",
    month: "Month Plan",
    week: "Week Plan",
    tasks: "Top Tasks",
    schedule: "Schedule",
    memo: "메모 페이지",
    projects: "프로젝트 관리",
    finance: "Money",
    sheets: "커스텀 시트",
    day: "Today",
  };
  const label = labels[section] || labels.day;
  const base = buildCoachAnalysis();
  const data = getSectionCoachData(section, context);
  const suggestions = generateSectionSuggestions(section, context, data);
  return {
    severity: data.severity || base.severity,
    title: `${label} AI 코칭`,
    message: data.message,
    detail: `${data.detail} · ${getSectionUsageGuide(section)} · ${context.personaLabel ? `${context.personaLabel} 유형, ` : ""}사용자 목표, 오늘 업무, 시간별 일정, 최근 완료 흐름을 함께 참고했습니다.`,
    suggestions: suggestions.length ? suggestions : base.suggestions,
    signals: base.signals,
  };
}

function getSectionUsageGuide(section = "day") {
  const guides = {
    foundation: "이 섹션은 AI가 사용자의 방향과 의사결정 기준을 이해하는 기준점입니다.",
    year: "이 섹션은 올해 반드시 남길 결과를 정하고 월간·주간 실행으로 내려보내는 곳입니다.",
    month: "이 섹션은 이번 달의 초점과 기념일, 프로젝트 흐름을 한눈에 조정하는 곳입니다.",
    week: "이 섹션은 이번 주 주요일정을 오늘의 우선업무로 연결하는 다리입니다.",
    tasks: "이 섹션은 오늘 반드시 끝낼 일과 연기·위임·취소할 일을 선명하게 가르는 곳입니다.",
    schedule: "이 섹션은 중요한 업무를 실제 시간 블록에 배치해 실행 가능하게 만드는 곳입니다.",
    memo: "이 섹션은 회의 메모, 결정, 배운 점을 기록해 검색과 회고 자산으로 바꾸는 곳입니다.",
    projects: "이 섹션은 프로젝트 목표, 다음 행동, 자금 시뮬레이션을 연결해 진행을 관리하는 곳입니다.",
    finance: "이 섹션은 월별 수입·지출 이슈를 일정과 우선업무로 연결해 리스크를 줄이는 곳입니다.",
    sheets: "이 섹션은 반복 양식, 비교표, 체크리스트를 자유롭게 설계하는 작업 공간입니다.",
  };
  return guides[section] || "이 섹션은 오늘의 실행 흐름을 점검하고 다음 행동을 정하는 곳입니다.";
}

function getSectionCoachData(section, context) {
  const day = context.day;
  const month = ensureMonth();
  const week = ensureWeek();
  const projects = state.projects?.items || [];
  const sheets = state.customSheets?.items || [];
  const financeRows = Object.values(state.finance?.months || {}).flat().filter((item) => item.title || item.amount);
  const activeMonthRows = (state.finance?.months?.[selectedFinanceMonth] || []).filter((item) => item.title || item.amount);
  const memoLength = `${day.memo || ""} ${day.record || ""} ${day.wins || ""} ${day.carry || ""} ${day.lesson || ""}`.trim().length;
  const sectionData = {
    foundation: {
      severity: state.profile?.goals || state.foundation?.mission ? "calm" : "warm",
      message: state.profile?.goals
        ? "사용자 정보가 코칭의 기준점으로 작동하고 있습니다. 사용자 유형, 목표, 역할, 건강 리듬이 오늘 업무와 연결되는지 주기적으로 갱신하세요."
        : "사용자 정보와 핵심 목표가 부족합니다. AI 코칭의 정확도를 높이려면 사용자 유형, 목표, 현재 과제, 에너지 시간대를 먼저 채우는 것이 좋습니다.",
      detail: `유형 ${context.personaLabel || "미설정"} · 입력 정보 ${Object.values(state.profile || {}).filter(Boolean).length}개 · 방향 ${state.foundation?.mission ? "있음" : "없음"}`,
    },
    year: {
      severity: (state.year?.goals || []).filter(Boolean).length ? "calm" : "warm",
      message: "연간 목표는 오늘의 업무를 걸러내는 필터입니다. 목표가 추상적이면 이번 달 결과와 이번 주 행동으로 쪼개세요.",
      detail: `연간 목표 ${(state.year?.goals || []).filter(Boolean).length}개 · 미래 계획 ${(state.year?.futureLog || []).filter(Boolean).length}개`,
    },
    month: {
      severity: month.focus ? "calm" : "warm",
      message: month.focus ? "월간 초점이 있습니다. 이번 주 우선업무와 오늘 A업무가 같은 방향인지 확인하세요." : "월간 초점이 비어 있습니다. 이번 달 반드시 남길 결과 하나를 먼저 정하면 일정 판단이 쉬워집니다.",
      detail: `월간 초점 ${month.focus ? "있음" : "없음"} · 월간 프로젝트 ${(month.projects || []).filter(Boolean).length}개`,
    },
    week: {
      severity: (week.priorities || []).some((item) => item.text && !item.done) ? "calm" : "warm",
      message: "주간 일정은 오늘의 행동을 미리 이기는 구조입니다. 미완료 주요일정은 오늘 A업무나 시간별 일정 블록으로 내려 보내세요.",
      detail: `Week Focus ${(week.priorities || []).filter((item) => item.text).length}개 · Roles ${(week.compass || []).length}개`,
    },
    tasks: {
      severity: context.openTasks.length >= 8 ? "alert" : context.highPriorityOpen ? "calm" : "warm",
      message: context.highPriorityOpen ? "A업무가 잡혀 있습니다. 가장 중요한 한 가지를 시간별 일정에 먼저 고정하면 실행률이 올라갑니다." : "A업무가 없습니다. 오늘의 결과를 만드는 업무 하나를 A로 지정하세요.",
      detail: `열린 업무 ${context.openTasks.length}개 · 완료 ${context.doneTasks.length}개 · 이월 ${context.carryovers.length}개`,
    },
    schedule: {
      severity: context.appointmentEntries.length ? "calm" : context.openTasks.length ? "warm" : "calm",
      message: context.appointmentEntries.length ? "일정 블록이 있습니다. A업무와 회복 시간을 과밀하지 않게 배치했는지 확인하세요." : "업무는 있는데 시간별 일정이 비어 있습니다. 중요한 업무 하나를 실제 시간칸에 넣어야 실행이 시작됩니다.",
      detail: `일정 ${context.appointmentEntries.length}개 · 빈 시간 ${context.freeSlots.length}칸`,
    },
    memo: {
      severity: memoLength ? "calm" : "warm",
      message: memoLength ? "메모가 실행 기록으로 쌓이고 있습니다. 결정, 후속조치, 배운 점을 분리해서 남기면 검색과 회고 가치가 커집니다." : "메모가 비어 있습니다. 오늘의 결정 1개와 내일 넘길 일 1개만 적어도 회고 품질이 올라갑니다.",
      detail: `메모/기록 ${memoLength}자`,
    },
    projects: {
      severity: projects.length ? "calm" : "warm",
      message: projects.length ? "프로젝트는 다음 행동과 자금 시뮬레이션이 연결될 때 힘이 납니다. 진행 중 프로젝트마다 다음 행동 1개를 오늘 업무로 내려보세요." : "프로젝트 목록이 비어 있습니다. 반복적으로 신경 쓰는 일을 프로젝트로 올려 관리하면 실행 누수가 줄어듭니다.",
      detail: `프로젝트 ${projects.length}개`,
    },
    finance: {
      severity: activeMonthRows.length ? "calm" : "warm",
      message: activeMonthRows.length ? "이번 달 자금 이슈가 기록되어 있습니다. 예정/확인/보류 상태를 오늘 우선업무와 연결해 현금흐름 리스크를 줄이세요." : "이번 달 자금 항목이 비어 있습니다. 카드대금, 이자, 입금 예정부터 기록하면 의사결정 부담이 줄어듭니다.",
      detail: `이번 달 ${activeMonthRows.length}건 · 전체 자금 항목 ${financeRows.length}건`,
    },
    sheets: {
      severity: sheets.length > 1 ? "calm" : "warm",
      message: "커스텀 시트는 반복 양식과 비교표에 적합합니다. 자주 쓰는 기록은 템플릿화하고, 오늘 업무와 연결되는 체크 항목만 남기세요.",
      detail: `시트 ${sheets.length}개 · 현재 시트 ${state.customSheets?.items?.find((sheet) => sheet.id === selectedSheetId)?.name || "없음"}`,
    },
  };
  return sectionData[section] || {
    severity: baseSeverityFromContext(context),
    message: "오늘 실행 흐름을 기준으로 입력된 내용을 분석했습니다. 중요한 일, 시간 배치, 회고 기록이 서로 이어지는지 확인하세요.",
    detail: `업무 ${context.openTasks.length}개 · 일정 ${context.appointmentEntries.length}개`,
  };
}

function baseSeverityFromContext(context) {
  if (context.carryovers.length >= 4 || context.openTasks.length >= 8) return "alert";
  if (context.openTasks.length && !context.appointmentEntries.length) return "warm";
  return "calm";
}

function generateSectionSuggestions(section, context, data) {
  const firstOpen = context.openTasks[0]?.text || "";
  const firstFree = context.freeSlots[0] || "";
  const personaHints = getCombinedPersonaSuggestions(context).slice(0, 2);
  const map = {
    foundation: ["사용자 유형을 먼저 선택하고 역할 설명을 보강하기", "핵심 목표 1개를 30자 안으로 다시 쓰기", "현재 과제와 에너지 시간대를 사용자 정보에 보강하기"],
    year: ["연간 목표 1개를 이번 달 결과로 쪼개기", "미래 계획 중 지금 하지 않을 일을 대기 목록으로 정리하기"],
    month: ["월간 초점과 연결된 이번 주 행동 1개 만들기", "기념일·마감일 중 오늘 준비할 일을 우선업무로 내리기"],
    week: ["미완료 주요일정 1개를 오늘 A업무로 전환하기", "역할별 핵심행동을 2개 이하로 줄이기"],
    tasks: [firstOpen ? `${firstOpen.slice(0, 24)}을 시간별 일정에 고정하기` : "오늘 A업무 1개 추가하기", "취소·연기·위임할 업무를 먼저 정리하기"],
    schedule: [firstFree ? `${firstFree}에 A업무 실행 블록 만들기` : "일정 사이 완충시간 10분 확보하기", "오후 전에 가장 어려운 업무 1개 배치하기"],
    memo: ["오늘의 결정 1개를 메모에 남기기", "내일 첫 행동 1개를 일일 기록에 적기"],
    projects: ["진행 중 프로젝트마다 다음 행동 1개 지정하기", "자금 영향이 큰 프로젝트를 우선 검토하기"],
    finance: ["이번 달 미확인 지출을 확인 상태로 정리하기", "자금 이슈 1개를 오늘 우선업무에 연결하기"],
    sheets: ["현재 시트의 첫 행/첫 열 의미를 명확히 정리하기", "반복 입력되는 표는 템플릿으로 분리하기"],
  };
  return [...new Set([...(personaHints || []), ...(map[section] || []), ...(data.severity === "alert" ? ["오늘 처리할 수 없는 항목은 과감히 연기하기"] : [])])].slice(0, 5);
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
  const personaLabel = getPersonaLabel(state.profile);
  const secondaryPersonaLabels = getSecondaryPersonaLabels(state.profile);
  const personaGuidance = getPersonaGuidance(state.profile?.personaType);
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
    personaType: state.profile?.personaType || "",
    secondaryPersonaTypes: getSecondaryPersonaTypes(state.profile),
    personaLabel,
    secondaryPersonaLabels,
    personaGuidance,
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
    getPersonaLabel(profile),
    getSecondaryPersonaLabels(profile).length && `보조: ${getSecondaryPersonaLabels(profile).slice(0, 3).join(", ")}`,
    profile.job && `${profile.job}`,
    profile.roles && `역할: ${profile.roles.slice(0, 22)}`,
    profile.goals && `목표: ${profile.goals.slice(0, 22)}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

function getPersonaLabel(profile = {}) {
  const type = profile.personaType || "";
  if (type === "other" && profile.personaCustom) return profile.personaCustom.trim();
  return personaTypes[type] || "";
}

function getSecondaryPersonaTypes(profile = {}) {
  return Array.isArray(profile.personaTypesSecondary)
    ? profile.personaTypesSecondary.filter((type) => type && type !== profile.personaType)
    : [];
}

function getSecondaryPersonaLabels(profile = {}) {
  return getSecondaryPersonaTypes(profile).map((type) => personaTypes[type]).filter(Boolean);
}

function getPersonaGuidance(type = "") {
  const guides = {
    ceo: "오늘의 핵심 의사결정, 현금흐름, 위임할 일을 먼저 분리하는 것이 중요합니다.",
    entrepreneur: "매출로 이어지는 실행, 고객 대응, 납기 리스크를 먼저 고정하는 것이 중요합니다.",
    owner: "매장 운영, 고객 흐름, 직원/재고/정산 이슈를 놓치지 않는 것이 중요합니다.",
    employee: "상사·팀과 약속한 결과물, 마감, 협업 커뮤니케이션을 먼저 정리하는 것이 중요합니다.",
    manager: "팀 병목, 위임 상태, 보고·의사결정 대기 항목을 먼저 확인하는 것이 중요합니다.",
    student: "학습 블록, 복습, 시험·과제 마감을 시간별 일정에 넣는 것이 중요합니다.",
    growth: "습관 실행, 회고, 장기 목표와 연결된 작은 행동을 매일 남기는 것이 중요합니다.",
    secondLife: "건강, 관계, 자산, 새 역할 탐색을 무리 없이 지속하는 것이 중요합니다.",
    other: "직접 정의한 역할에 맞춰 목표와 오늘 행동이 연결되는지 확인하는 것이 중요합니다.",
  };
  return guides[type] || "";
}

function getPersonaSuggestions(type = "") {
  const suggestions = {
    ceo: ["오늘 결정해야 할 안건 1개 결론 내기", "현금흐름·리스크 항목 1개 확인하기", "대표가 직접 하지 않아도 되는 일 1개 위임하기"],
    entrepreneur: ["매출 또는 고객 접점 업무 1개 먼저 처리하기", "견적·납기·응답 지연 항목 1개 해소하기", "이번 주 수입으로 이어질 다음 행동 정하기"],
    owner: ["오늘 매장/현장 운영 체크 1개 완료하기", "고객 불편 또는 직원 전달사항 1개 정리하기", "정산·재고·예약 중 리스크 1개 확인하기"],
    employee: ["오늘 보고하거나 공유할 결과물 1개 완성하기", "마감 임박 업무를 시간별 일정에 고정하기", "협업 대기 항목 1개를 먼저 문의하기"],
    manager: ["팀 병목 1개 확인하고 담당자/다음 행동 지정하기", "위임한 업무의 상태를 확인하기", "보고·회의 전 핵심 숫자 1개 정리하기"],
    student: ["가장 어려운 과목 50분 학습 블록 만들기", "오늘 배운 내용 10분 복습하기", "시험·과제 마감에서 역산한 다음 행동 정하기"],
    growth: ["핵심 습관 1개를 체크 가능한 행동으로 만들기", "오늘 회고 질문 1개에 답하기", "장기 목표와 연결된 20분 실행 만들기"],
    secondLife: ["건강 활동 1개와 관계 연락 1개를 일정에 넣기", "자산·서류·생활 정리 항목 1개 처리하기", "새 역할 탐색을 위한 작은 조사 1개 하기"],
  };
  return suggestions[type] || [];
}

function getCombinedPersonaSuggestions(context = buildPlannerContext()) {
  const types = [context.personaType, ...(context.secondaryPersonaTypes || [])].filter(Boolean);
  return [...new Set(types.flatMap((type) => getPersonaSuggestions(type)))];
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
  suggestions.push(...buildDailyIntelligence(context).suggestions);
  suggestions.push(...getCombinedPersonaSuggestions(context));
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
  if (!appointmentEntries.length && openTasks.length) suggestions.push("가장 중요한 업무 1개를 오전 시간별 일정에 고정하기");
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
  const task = { text, status: "미완료", done: false, priorityUnset: false };
  assignTaskOrder(day, task);
  day.tasks[priority].push(task);
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
  node.innerHTML = `<span class="compass-spark-icon" aria-hidden="true"></span>`;
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
  const { openTasks, freeSlots, appointmentEntries, carryovers, energyWindow, exerciseGoal, exerciseLimits, recoveryPattern, personaType, secondaryPersonaTypes } = context;
  const intelligence = buildDailyIntelligence(context);
  const firstA = openTasks.find((task) => task.priority === "A") || openTasks[0];
  const preferredStart = /오후/.test(energyWindow) ? "13:00" : /저녁/.test(energyWindow) ? "16:00" : "09:00";
  const firstFree = freeSlots.find((slot) => slot >= preferredStart) || freeSlots.find((slot) => slot >= "09:00") || freeSlots[0] || "09:00";
  const secondFree = freeSlots.find((slot) => slot > firstFree && slot >= "13:00") || freeSlots.find((slot) => slot > firstFree) || "14:00";
  const suggestions = [];
  if (intelligence.blueprint.task) {
    suggestions.push({ slot: intelligence.blueprint.slot, text: `${stripTaskTimeText(intelligence.blueprint.task.text).slice(0, 28)} 실행 블록` });
  }
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
  [personaType, ...(secondaryPersonaTypes || []).slice(0, 1)]
    .map((type) => getPersonaScheduleSuggestion(type))
    .filter(Boolean)
    .forEach((item) => suggestions.push(item));
  suggestions.push({ slot: "마감 전", text: "완료 체크, 내일 첫 행동, 배운 점 1줄 기록" });
  return [...new Map(suggestions.map((item) => [`${item.slot}:${item.text}`, item])).values()];
}

function getPersonaScheduleSuggestion(type = "") {
  const map = {
    ceo: { slot: "대표 블록", text: "의사결정 30분과 위임 확인 15분을 분리 배치" },
    entrepreneur: { slot: "매출 블록", text: "고객 대응과 견적·납기 확인을 먼저 배치" },
    owner: { slot: "운영 점검", text: "오픈/마감 체크와 직원 전달사항을 고정 배치" },
    employee: { slot: "마감 블록", text: "보고 산출물 작성 시간을 먼저 확보" },
    manager: { slot: "팀 점검", text: "팀 병목 확인과 피드백 시간을 분리 배치" },
    student: { slot: "학습 블록", text: "집중 학습 50분과 복습 10분을 한 세트로 배치" },
    growth: { slot: "습관 블록", text: "핵심 습관을 가장 방해가 적은 시간에 배치" },
    secondLife: { slot: "균형 블록", text: "건강 활동과 관계·자산 점검 시간을 무리 없이 배치" },
  };
  return map[type] || null;
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
  if (rule.frequency === "weekly") {
    if (Number(rule.weekday) !== date.getDay()) return false;
    return rule.weekOfMonth === "every" || getWeekOfMonth(date) === Number(rule.weekOfMonth);
  }
  if (rule.frequency === "monthly") return Number(rule.monthday) === date.getDate();
  if (rule.frequency === "yearly") return false;
  return false;
}

function getWeekOfMonth(date) {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

function daysInMonth(year, zeroBasedMonth) {
  return new Date(year, zeroBasedMonth + 1, 0).getDate();
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
  if (!repeatRuleAllowsCarryover(rule)) return false;
  const carryUntilKey = repeatCarryUntilKey(rule, sourceKey);
  return Boolean(carryUntilKey && currentKey <= carryUntilKey);
}

function repeatRuleAllowsCarryover(rule) {
  normalizeRepeatRule(rule);
  if (rule.carryMode === "carry") return true;
  if (rule.carryMode === "none") return false;
  return rule.frequency !== "daily";
}

function repeatCarryUntilKey(rule, sourceKey) {
  const nextKey = nextRepeatDateAfter(rule, sourceKey);
  if (!nextKey) return "";
  const nextDate = parseDate(nextKey);
  if (Number.isNaN(nextDate.getTime())) return "";
  nextDate.setDate(nextDate.getDate() - 1);
  return iso(nextDate);
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
    const task = {
      text: rule.text.trim(),
      status: "미완료",
      done: false,
      repeatId,
      repeatStartDate: rule.startDate,
      repeatSourceDate: key,
      priorityUnset: false,
    };
    assignTaskOrder(day, task);
    day.tasks[priority].push(task);
  });
}

function renderRepeatPriorityList() {
  const node = el("repeatPriorityList");
  if (!node) return;
  ensureRepeatPriorityRows();
  node.innerHTML = "";
  node.classList.toggle("is-editor-open", repeatManagerMode !== "list");

  const shell = document.createElement("div");
  shell.className = "repeat-manager-layout";

  const editor = renderRepeatRuleEditor();
  if (editor) shell.appendChild(editor);

  const listSection = document.createElement("section");
  listSection.className = "repeat-summary-section";
  listSection.innerHTML = `
    <div class="repeat-summary-head">
      <div>
        <strong>반복업무 목록</strong>
        <small>연간 · 월간 · 주간 · 매일 순으로 정렬됩니다.</small>
      </div>
      <button class="repeat-new-rule" type="button">새 반복업무</button>
    </div>
  `;
  listSection.querySelector(".repeat-new-rule").onclick = () => openRepeatManager("create");

  const list = document.createElement("div");
  list.className = "repeat-summary-list";
  const entries = getSortedRepeatRuleEntries();
  if (!entries.length) {
    list.innerHTML = `
      <div class="repeat-empty-state">
        <strong>아직 반복업무가 없습니다.</strong>
        <span>매일 운동, 매주 회고, 매월 납부처럼 반복되는 일을 한 건씩 추가하세요.</span>
      </div>
    `;
  }
  entries.forEach(({ rule, index }) => {
    const item = document.createElement("article");
    item.className = "repeat-summary-item";
    if (index === repeatEditingIndex && repeatManagerMode === "edit") item.classList.add("is-editing");
    item.innerHTML = `
      <button class="repeat-summary-main" type="button" data-repeat-edit="${index}">
        <span class="repeat-summary-priority">${escapeHtml(rule.priority || "A")}</span>
        <span class="repeat-summary-copy">
          <strong>${escapeHtml(rule.text || "반복 업무")}</strong>
          <small>${escapeHtml(repeatRuleMeta(rule))}</small>
        </span>
      </button>
      <button class="repeat-summary-delete" type="button" data-repeat-delete="${index}" aria-label="반복업무 삭제">×</button>
    `;
    item.querySelector("[data-repeat-edit]").onclick = () => openRepeatManager("edit", index);
    item.querySelector("[data-repeat-delete]").onclick = () => deleteRepeatRule(index);
    list.appendChild(item);
  });
  listSection.appendChild(list);
  shell.appendChild(listSection);
  node.appendChild(shell);
}

function cloneRepeatRule(rule = emptyRepeatRule()) {
  return normalizeRepeatRule(JSON.parse(JSON.stringify(rule || emptyRepeatRule())));
}

function renderRepeatRuleEditor() {
  if (repeatManagerMode === "list") return null;
  const isEdit = repeatManagerMode === "edit" && repeatEditingIndex >= 0;
  if (!repeatEditingDraft) {
    repeatEditingDraft = isEdit
      ? cloneRepeatRule(state.repeats?.priorityTasks?.[repeatEditingIndex] || emptyRepeatRule())
      : emptyRepeatRule();
  }
  const rule = normalizeRepeatRule(repeatEditingDraft);
  const panel = document.createElement("section");
  panel.className = "repeat-editor-panel";
  panel.innerHTML = `
    <div class="repeat-editor-title">
      <div>
        <strong>${isEdit ? "반복업무 수정" : "새 반복업무"}</strong>
        <small>${isEdit ? "선택한 한 건만 수정합니다." : "필요한 정보만 입력한 뒤 저장하세요."}</small>
      </div>
      <button class="repeat-editor-close" type="button" aria-label="편집 닫기">×</button>
    </div>
    <div class="repeat-rule-row repeat-editor-row">
      <input class="repeat-active" type="checkbox" ${rule.active ? "checked" : ""} aria-label="반복 사용" />
      <select class="repeat-priority" aria-label="중요도">
        ${["A", "B", "C"].map((priority) => `<option value="${priority}" ${rule.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}
      </select>
      <input class="repeat-text" type="text" value="${escapeAttr(rule.text)}" placeholder="반복 업무" />
      <select class="repeat-frequency" aria-label="반복 주기">
        ${repeatFrequencies.map(([value, label]) => `<option value="${value}" ${rule.frequency === value ? "selected" : ""}>${label}</option>`).join("")}
      </select>
      <select class="repeat-carry-mode" aria-label="미완료 이월 설정">
        ${repeatCarryOptions.map(([value, label]) => `<option value="${value}" ${rule.carryMode === value ? "selected" : ""}>${label}</option>`).join("")}
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
    </div>
    <div class="repeat-editor-actions">
      ${isEdit ? `<button class="repeat-editor-delete" type="button">삭제</button>` : ""}
      <span></span>
      <button class="repeat-editor-cancel" type="button">취소</button>
      <button class="repeat-editor-save" type="button">저장</button>
    </div>
  `;
  bindRepeatEditor(panel, rule, isEdit);
  return panel;
}

function bindRepeatEditor(panel, rule, isEdit) {
  const rerenderEditor = () => {
    repeatEditingDraft = rule;
    renderRepeatPriorityList();
    requestAnimationFrame(() => document.querySelector("#repeatPriorityList .repeat-text")?.focus());
  };
  panel.querySelector(".repeat-editor-close").onclick = () => openRepeatManager("list");
  panel.querySelector(".repeat-editor-cancel").onclick = () => openRepeatManager("list");
  panel.querySelector(".repeat-active").onchange = (event) => {
    rule.active = event.target.checked;
  };
  panel.querySelector(".repeat-priority").onchange = (event) => {
    rule.priority = event.target.value;
  };
  panel.querySelector(".repeat-text").oninput = (event) => {
    rule.text = event.target.value;
  };
  panel.querySelector(".repeat-frequency").onchange = (event) => {
    rule.frequency = event.target.value;
    setRepeatAnchorToSelectedDate(rule);
    rerenderEditor();
  };
  panel.querySelector(".repeat-carry-mode").onchange = (event) => {
    rule.carryMode = event.target.value;
  };
  panel.querySelector(".repeat-weekday")?.addEventListener("change", (event) => {
    rule.weekday = Number(event.target.value);
  });
  panel.querySelector(".repeat-week-of-month")?.addEventListener("change", (event) => {
    rule.weekOfMonth = event.target.value;
    rule.weeklyMode = rule.weekOfMonth === "every" ? "every" : "nth";
  });
  panel.querySelector(".repeat-weekday-toggle")?.addEventListener("click", () => {
    panel.querySelector(".repeat-weekday-popover")?.toggleAttribute("hidden");
  });
  panel.querySelectorAll(".repeat-weekdays input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const selected = Array.from(panel.querySelectorAll(".repeat-weekdays input[type='checkbox']:checked")).map((item) => Number(item.value));
      rule.weekdays = selected.length ? selected : [Number(checkbox.value)];
      if (!selected.length) checkbox.checked = true;
      const toggle = panel.querySelector(".repeat-weekday-toggle");
      if (toggle) toggle.textContent = repeatWeekdaySummary(rule);
    });
  });
  panel.querySelector(".repeat-monthday")?.addEventListener("change", (event) => {
    rule.monthday = Number(event.target.value);
  });
  panel.querySelector(".repeat-month-date")?.addEventListener("change", (event) => {
    const date = parseDate(event.target.value);
    if (Number.isNaN(date.getTime())) return;
    rule.monthday = date.getDate();
  });
  panel.querySelector(".repeat-month")?.addEventListener("change", (event) => {
    rule.month = Number(event.target.value);
  });
  panel.querySelector(".repeat-yearly-anniversary")?.addEventListener("click", () => {
    prepareAnniversaryFromRepeatRule(rule);
    closeRepeatManager();
  });
  panel.querySelector(".repeat-start-date").onchange = (event) => {
    rule.startDate = isValidIsoDate(event.target.value) ? event.target.value : rule.startDate;
  };
  const endMode = panel.querySelector(".repeat-end-mode");
  const endDate = panel.querySelector(".repeat-end-date");
  endMode.onchange = () => {
    rule.endMode = endMode.value === "date" ? "date" : "none";
    if (rule.endMode === "date" && !isValidIsoDate(rule.endDate)) rule.endDate = rule.startDate;
    if (rule.endMode !== "date") rule.endDate = "";
    if (endDate) {
      endDate.disabled = rule.endMode !== "date";
      endDate.value = rule.endDate;
    }
  };
  endDate.onchange = () => {
    rule.endDate = isValidIsoDate(endDate.value) ? endDate.value : "";
    if (rule.endDate) rule.endMode = "date";
  };
  panel.querySelector(".repeat-editor-save").onclick = () => saveRepeatEditor(rule, isEdit);
  panel.querySelector(".repeat-editor-delete")?.addEventListener("click", () => deleteRepeatRule(repeatEditingIndex));
}

function saveRepeatEditor(rule, isEdit) {
  normalizeRepeatRule(rule);
  if (!rule.text.trim()) {
    alert("반복 업무 내용을 입력하세요.");
    document.querySelector("#repeatPriorityList .repeat-text")?.focus();
    return;
  }
  state.repeats ||= { priorityTasks: [] };
  state.repeats.priorityTasks ||= [];
  if (isEdit && repeatEditingIndex >= 0) {
    const target = state.repeats.priorityTasks[repeatEditingIndex];
    if (!target) return;
    captureUndo("반복 우선업무 수정");
    const previousStart = target.startDate;
    Object.assign(target, rule);
    resetFutureRepeatOccurrences(repeatEditingIndex, earliestIsoDate(previousStart, target.startDate, iso(selectedDate || todayInPlanner())));
  } else {
    captureUndo("반복 우선업무 추가");
    const nextRule = cloneRepeatRule(rule);
    state.repeats.priorityTasks.push(nextRule);
    resetFutureRepeatOccurrences(state.repeats.priorityTasks.length - 1, nextRule.startDate);
  }
  saveState();
  repeatManagerMode = "list";
  repeatEditingIndex = -1;
  repeatEditingDraft = null;
  renderRepeatPriorityList();
  renderDay();
}

function deleteRepeatRule(index) {
  const rule = state.repeats?.priorityTasks?.[index];
  if (!rule) return;
  if (!confirmDelete("이 반복 우선업무를 삭제할까요? 이전 기록은 유지되고 오늘 이후 반복만 중단됩니다.")) return;
  captureUndo("반복 우선업무 삭제");
  rule.active = false;
  rule.deletedFrom = iso(selectedDate || todayInPlanner());
  rule.removed = true;
  resetFutureRepeatOccurrences(index, rule.deletedFrom);
  saveState();
  repeatManagerMode = "list";
  repeatEditingIndex = -1;
  repeatEditingDraft = null;
  renderRepeatPriorityList();
  renderDay();
  showUndoNotice("반복 우선업무를 삭제했습니다.");
}

function repeatRuleMeta(rule) {
  return [getRepeatFrequencyLabel(rule.frequency), repeatRuleTargetLabel(rule), repeatRuleDateLabel(rule)]
    .filter(Boolean)
    .join(" · ");
}

function getRepeatFrequencyLabel(value) {
  return repeatFrequencies.find(([key]) => key === value)?.[1] || "반복";
}

function repeatRuleTargetLabel(rule) {
  if (rule.frequency === "daily") return repeatWeekdaySummary(rule);
  if (rule.frequency === "weekly") {
    const weekLabel = repeatWeekOptions.find(([value]) => value === String(rule.weekOfMonth || "every"))?.[1] || "매주";
    return `${weekLabel} ${getWeekdayLabel(Number(rule.weekday))}`;
  }
  if (rule.frequency === "monthly") return `${Number(rule.monthday) || 1}일`;
  if (rule.frequency === "yearly") return `${Number(rule.month) || 1}/${Number(rule.monthday) || 1}`;
  return "";
}

function repeatRuleDateLabel(rule) {
  const start = isValidIsoDate(rule.startDate) ? `시작 ${formatCompactMonthDay(rule.startDate)}` : "";
  const end = rule.endMode === "date" && isValidIsoDate(rule.endDate) ? `종료 ${formatCompactMonthDay(rule.endDate)}` : "종료없음";
  return [start, end].filter(Boolean).join(" · ");
}

function getSortedRepeatRuleEntries() {
  const entries = (state.repeats?.priorityTasks || [])
    .map((rule, index) => ({ rule: normalizeRepeatRule(rule), index }))
    .filter(({ rule }) => !rule.removed && Boolean(rule.text?.trim()));
  return entries.sort((a, b) => {
    const frequencyDelta = (repeatFrequencySortOrder[a.rule.frequency] ?? 9) - (repeatFrequencySortOrder[b.rule.frequency] ?? 9);
    if (frequencyDelta) return frequencyDelta;
    return a.index - b.index;
  });
}

function openRepeatManager(mode = "list", index = -1) {
  if (typeof mode === "object") mode = "list";
  ensureRepeatPriorityRows();
  if (isMobileDayFocusActive()) resetMobileDayFocusToSplit({ blur: true });
  repeatManagerMode = ["list", "create", "edit"].includes(mode) ? mode : "list";
  repeatEditingIndex = repeatManagerMode === "edit" ? Number(index) : -1;
  repeatEditingDraft = repeatManagerMode === "edit"
    ? cloneRepeatRule(state.repeats?.priorityTasks?.[repeatEditingIndex] || emptyRepeatRule())
    : repeatManagerMode === "create"
      ? emptyRepeatRule()
      : null;
  renderRepeatPriorityList();
  const dialog = el("repeatManagerDialog");
  if (dialog) dialog.hidden = false;
  requestAnimationFrame(() => {
    const focusTarget = repeatManagerMode === "list"
      ? document.querySelector("#repeatPriorityList .repeat-new-rule")
      : document.querySelector("#repeatPriorityList .repeat-text");
    focusTarget?.focus();
  });
}

function closeRepeatManager() {
  const dialog = el("repeatManagerDialog");
  if (!dialog || dialog.hidden) return;
  dialog.hidden = true;
  repeatManagerMode = "list";
  repeatEditingIndex = -1;
  repeatEditingDraft = null;
  renderDay();
}


function setRepeatAnchorToSelectedDate(rule) {
  const baseDate = selectedDate || todayInPlanner();
  if (rule.frequency === "daily") rule.weekdays = getWeekdayIndices();
  if (rule.frequency === "weekly") {
    rule.weekday = baseDate.getDay();
    rule.weekOfMonth = "every";
    rule.weeklyMode = "every";
  }
  if (rule.frequency === "monthly") rule.monthday = baseDate.getDate();
  if (rule.frequency === "yearly") {
    rule.month = baseDate.getMonth() + 1;
    rule.monthday = baseDate.getDate();
  }
  normalizeRepeatRule(rule);
}

function renderRepeatTargetControl(rule) {
  if (rule.frequency === "daily") {
    const weekdayLabels = getWeekdayLabels();
    const selected = Array.isArray(rule.weekdays) && rule.weekdays.length ? rule.weekdays : getWeekdayIndices();
    const summary = repeatWeekdaySummary(rule);
    return `
      <div class="repeat-weekday-picker">
        <button class="repeat-weekday-toggle" type="button" aria-label="반복 요일 선택">${escapeHtml(summary || "요일 선택")}</button>
        <div class="repeat-weekday-popover" hidden>
          <div class="repeat-weekdays" aria-label="반복 요일 선택">
            ${weekdayLabels.map((day, dayIndex) => `
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
      <div class="repeat-weekly-controls">
        <select class="repeat-week-of-month" aria-label="반복 주차">
          ${repeatWeekOptions.map(([value, label]) => `<option value="${value}" ${String(rule.weekOfMonth || "every") === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
        <select class="repeat-weekday" aria-label="반복 요일">
          ${getWeekdayLabels().map((day, dayIndex) => `<option value="${dayIndex}" ${Number(rule.weekday) === dayIndex ? "selected" : ""}>${day}</option>`).join("")}
        </select>
      </div>
    `;
  }
  if (rule.frequency === "monthly") {
    const baseDate = selectedDate || todayInPlanner();
    const pickerDate = `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(Math.min(Number(rule.monthday) || baseDate.getDate(), daysInMonth(baseDate.getFullYear(), baseDate.getMonth())))}`;
    return `
      <label class="repeat-month-calendar">
        <span>${Number(rule.monthday) || baseDate.getDate()}일</span>
        <input class="repeat-month-date" type="date" value="${escapeAttr(pickerDate)}" aria-label="매월 반복 날짜 선택" />
      </label>
    `;
  }
  if (rule.frequency === "yearly") {
    return `
      <div class="repeat-yearly-controls">
        <span class="repeat-target-static">연간 기념일에서 관리</span>
        <button class="repeat-yearly-anniversary" type="button">기념일로 만들기</button>
      </div>
    `;
  }
  return `<span class="repeat-target-static">매일</span>`;
}

function repeatWeekdaySummary(rule) {
  const selected = Array.isArray(rule.weekdays) && rule.weekdays.length ? rule.weekdays : getWeekdayIndices();
  return selected.length === 7 ? "매일" : selected.map((dayIndex) => getWeekdayLabel(dayIndex)).filter(Boolean).join(", ");
}

function renderDayCompass() {
  const node = el("dayCompass");
  if (!node) return;
  const title = document.querySelector(".day-compass-title-text");
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const isKorean = getAppLanguage() === "ko";
  if (title) title.textContent = `${isKorean ? "주간 초점" : "Weekly Focus"} (${formatCompassDate(weekStart)} ~ ${formatCompassDate(weekEnd)})`;
  const week = ensureWeek();
  const roleNames = compassRoleNames();
  while (week.compass.length < roleNames.length) {
    week.compass.push({ role: roleNames[week.compass.length], goal: "", action: "" });
  }
  node.innerHTML = "";
  const priorityBlock = document.createElement("section");
  priorityBlock.className = "weekly-priority-block";
  priorityBlock.innerHTML = `<h4>${isKorean ? "금주의 주요일정" : "Week Focus List"}</h4>`;
  week.priorities.forEach((item, index) => {
    item ||= { text: "", done: false };
    week.priorities[index] = item;
    const row = document.createElement("label");
    row.className = `weekly-priority-row ${item.done ? "done" : ""}`;
    row.innerHTML = `
      <input type="checkbox" ${item.done ? "checked" : ""} />
      <input class="weekly-priority-text" type="text" value="${escapeAttr(item.text)}" placeholder="${isKorean ? `주요 일정 ${index + 1}` : `Week item ${index + 1}`}" />
    `;
    const checkbox = row.querySelector("input[type='checkbox']");
    const text = row.querySelector(".weekly-priority-text");
    checkbox.onchange = () => {
      item.done = checkbox.checked;
      if (item.done) removeWeeklyPriorityCarryoversAfterWeek(weekKey(selectedDate), item.text);
      saveState();
      renderDayCompass();
    };
    text.oninput = () => {
      item.text = text.value;
      delete item.carryoverFromWeek;
      saveState();
    };
    priorityBlock.appendChild(row);
  });
  const addPriority = document.createElement("button");
  addPriority.type = "button";
  addPriority.className = "add-row weekly-priority-add";
  addPriority.textContent = "Add Week Item";
  addPriority.onclick = () => {
    week.priorities.push({ text: "", done: false });
    saveState({ fastSave: true });
    renderDayCompass();
    window.requestAnimationFrame(() => {
      const inputs = priorityBlock.querySelectorAll(".weekly-priority-text");
      inputs[inputs.length - 1]?.focus();
    });
  };
  priorityBlock.appendChild(addPriority);
  node.appendChild(priorityBlock);
  week.compass.forEach((item, index) => {
    normalizeCompassItem(item);
    item.role = roleNames[index] || item.role || `Role ${index + 1}`;
    const row = document.createElement("div");
    row.className = "compass-row";
    row.innerHTML = `
      <span class="row-label">${item.role}</span>
      <input type="text" value="${escapeAttr(item.goal)}" placeholder="This week's goal" />
      <div class="compass-actions">
        ${item.actions.slice(0, 2).map((value, actionIndex) => `<input type="text" value="${escapeAttr(value)}" placeholder="Action ${actionIndex + 1}" />`).join("")}
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

function positionDaySwipe(panel = currentDayPanel || "main", force = false) {
  const node = el("daySwipe");
  if (!node || !isPagedDaySwipe()) return;
  const key = `${iso(selectedDate)}:${panel}`;
  const target = node.querySelector(`[data-panel="${panel}"]`);
  const distance = target ? Math.abs(target.offsetLeft - node.scrollLeft) : 0;
  if (!force && daySwipeKey === key && panel === "main" && distance < 6) return;
  daySwipeKey = key;
  currentDayPanel = panel;
  updateDayGuideState();
  window.requestAnimationFrame(() => scrollDayPanel(panel, "auto"));
}

function stabilizeDaySwipePosition(panel = "main") {
  positionDaySwipe(panel, true);
  [80, 220, 520, 980].forEach((delay) => {
    window.setTimeout(() => positionDaySwipe(panel, true), delay);
  });
}

function scrollDayPanel(panel, behavior = "smooth") {
  const node = el("daySwipe");
  if (!node) return;
  if (isMobileDayFocusActive() && panel !== "main") resetMobileDayFocusToSplit({ blur: true });
  const target = node.querySelector(`[data-panel="${panel}"]`);
  if (!target) return;
  dayPanelProgrammaticScrollUntil = Date.now() + (behavior === "smooth" ? 520 : 140);
  currentDayPanel = panel;
  updateDayGuideState();
  const left = target.offsetLeft;
  window.requestAnimationFrame(() => {
    node.scrollTo({ left, behavior });
    if (behavior === "auto") {
      window.setTimeout(() => {
        if (Math.abs(node.scrollLeft - left) > 4) node.scrollTo({ left, behavior: "auto" });
      }, 80);
    }
  });
}

function updateDayGuideState() {
  document.querySelectorAll("[data-day-panel-jump]").forEach((button) => {
    const active = button.dataset.dayPanelJump === currentDayPanel;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function setSettingsTab(tab = "user") {
  settingsTab = tab === "app" ? "app" : "user";
  updateSettingsTabState();
}

function updateSettingsTabState() {
  document.querySelectorAll("[data-settings-tab]").forEach((button) => {
    const active = button.dataset.settingsTab === settingsTab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-settings-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.settingsPanel !== settingsTab;
  });
}

function setupPulsePanelSwipe() {
  const zone = el("dailyPulseZone");
  if (!zone) return;
  let startX = 0;
  let startY = 0;
  let startNav = "";
  zone.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
    startY = event.clientY;
    startNav = event.target.closest(".daily-pulse-nav-left") ? "week" : event.target.closest(".daily-pulse-nav-right") ? "memo" : "";
  });
  zone.addEventListener("pointerup", (event) => {
    if (!startX) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    startX = 0;
    startY = 0;
    const nav = startNav;
    startNav = "";
    if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (nav === "week" && dx < 0) return scrollDayPanel("week");
    if (nav === "memo" && dx > 0) return scrollDayPanel("memo");
    scrollDayPanel(dx > 0 ? "week" : "memo");
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
  const addGroup = document.createElement("div");
  addGroup.className = "task-add-options";
  const add = document.createElement("button");
  add.className = "add-row task-add-primary";
  add.textContent = "일반 업무 추가";
  add.onclick = () => {
    const task = { text: "", status: "미완료", done: false, delegate: "", priorityUnset: true };
    assignTaskOrder(day, task);
    day.tasks.A.push(task);
    saveState({ fastSave: true });
    renderDay();
  };
  const repeat = document.createElement("button");
  repeat.className = "add-row task-add-repeat";
  repeat.type = "button";
  repeat.textContent = "반복 업무 추가";
  repeat.onclick = () => openRepeatManager("create");
  addGroup.append(add, repeat);
  list.appendChild(addGroup);
  board.appendChild(list);
}

function getTaskRefs(day) {
  return priorities
    .flatMap(([priority]) => day.tasks[priority].map((task, index) => ({ task, priority, index })))
    .sort((a, b) => {
      const activeDelta = Number(isActiveTaskSlot(b.task)) - Number(isActiveTaskSlot(a.task));
      if (activeDelta) return activeDelta;
      return getTaskOrder(a.task) - getTaskOrder(b.task) || a.index - b.index;
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
  row.className = `task-row priority-${menuValue === "A" ? "a" : "none"} marker-${marker} ${task.repeatId ? "is-repeat-task" : ""} ${task.status === "위임" ? "is-delegated" : ""} ${isStruck ? "done" : ""}`;
  const statusControl = getTaskStatusControl(task, menuValue);
  const linkTags = getTaskLinkTags(task);
  const inlineTags = task.financeItemId ? linkTags.filter((tag) => tag !== "Money") : linkTags;
  row.innerHTML = `
    <button class="task-cycle" type="button" aria-label="완료 상태 변경">${getTaskMarkerLabel(marker)}</button>
    <div class="task-status-cell" data-status="${escapeAttr(getTaskStatusLabel(task, menuValue))}">${getTaskStatusDisplay(task, menuValue)}${statusControl}</div>
    <div class="task-text-cell">
      <input class="task-text-input" type="text" value="${escapeAttr(task.text)}" placeholder="업무 내용" />
      ${renderTaskLinkTags(inlineTags)}
      ${task.financeItemId ? `<button class="task-money-link" type="button" aria-label="Money 항목으로 이동">Money</button>` : ""}
    </div>
    <button class="task-delete" type="button" aria-label="우선업무 삭제">×</button>
  `;
  const cycle = row.querySelector(".task-cycle");
  const prioritySelect = row.querySelector(".priority-select");
  const delegateInput = row.querySelector(".delegate-input");
  const postponeDateButton = row.querySelector(".postpone-date-button");
  const text = row.querySelector(".task-text-input");
  const moneyLink = row.querySelector(".task-money-link");
  const deleteButton = row.querySelector(".task-delete");
  cycle.onclick = () => {
    const feedback = cycleTaskMarker(task);
    showTaskCycleFeedback(cycle, feedback);
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
  if (postponeDateButton) {
    postponeDateButton.onclick = () => openPostponeDatePicker(
      postponeDateButton,
      task.postponeDate || iso(selectedDate),
      (dateKey) => schedulePostponedTask(task, priority, dateKey),
    );
  }
  bindDailyTaskTextInput(text);
  text.oninput = () => {
    dailyTextEditingActive = true;
    markDailyFieldEditing(10 * 60 * 1000);
    task.text = text.value;
    if (task.text.trim()) ensureTaskOrder(ensureDay(), task);
    if (syncTaskTimeHintToSchedule(task, ensureDay())) renderAppointments(ensureDay());
    saveState({ fastSave: true });
  };
  deleteButton.onclick = () => deleteTask(priority, index);
  if (moneyLink) moneyLink.onclick = () => openMoneyFromFinanceTask(task.financeItemId);
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
    input.blur();
  };
  input.onblur = () => {
    dailyTextEditingActive = false;
    markDailyFieldEditing(0);
    scheduleDailyTaskRelatedRefresh(60);
  };
}

function renderTaskLinkTags(tags = []) {
  if (!tags.length) return "";
  return `<span class="task-link-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</span>`;
}

function getTaskLinkTags(task = {}) {
  const tags = [];
  const text = task.text || "";
  const add = (tag) => {
    if (!tags.includes(tag)) tags.push(tag);
  };
  if (task.financeItemId || /자금|입금|지출|카드|이자|정산|대금|money/i.test(text)) add("Money");
  if (task.projectTaskId || matchesProjectContext(text)) add("프로젝트");
  if (matchesGoalContext(text)) add("목표");
  if (/운동|건강|걷기|수면|회복|투약|검진|스트레칭/.test(text)) add("건강");
  return tags.slice(0, 3);
}

function matchesGoalContext(text = "") {
  const source = normalizeSearchText(text);
  if (!source) return false;
  const goalSources = [state.profile?.goals, state.foundation?.mission, ...(state.year?.goals || [])].filter(Boolean);
  return goalSources.some((goal) => tokenOverlap(source, goal));
}

function matchesProjectContext(text = "") {
  const source = normalizeSearchText(text);
  if (!source) return false;
  const projects = [
    ...(ensureMonth().projects || []),
    ...(state.projects?.items || []).flatMap((project) => [project.name, project.goal, project.nextAction]),
  ].filter(Boolean);
  return projects.some((project) => tokenOverlap(source, project));
}

function getTaskStatusLabel(task, menuValue) {
  if (task.status === "위임") return task.delegate?.trim() || "위임";
  if (task.status === "연기") {
    if (task.postponeDate) return formatCompactMonthDay(task.postponeDate);
    return "미정";
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
  if (task.status === "연기" && task.postponeDate) {
    const date = parseDate(task.postponeDate);
    if (Number.isNaN(date.getTime())) return "";
    return `<span class="postpone-date-label">${date.getMonth() + 1}/${date.getDate()}</span>`;
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
    const label = task.postponeDate ? formatCompactMonthDay(task.postponeDate) : "미정";
    return `<button class="postpone-date-button" type="button" aria-label="연기 날짜 선택">${escapeHtml(label)}</button>`;
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
  if (marker === "delegate") return "↗";
  if (marker === "postpone") return "→";
  return "";
}

function cycleTaskMarker(task) {
  const marker = getTaskMarker(task);
  if (marker === "empty") {
    task.done = true;
    task.status = "완료";
    task.delegate = "";
    task.postponeMode = "";
    task.postponeDate = "";
    return "완료";
  }
  if (marker === "check") {
    task.done = false;
    task.status = "진행중";
    return "진행중";
  }
  if (marker === "dot") {
    task.done = false;
    task.status = "위임";
    task.delegate ||= "";
    return "위임";
  }
  if (marker === "delegate") {
    task.done = false;
    task.status = "연기";
    task.postponeMode ||= "";
    return "연기";
  }
  task.done = false;
  task.status = "미완료";
  task.delegate = "";
  task.postponeMode = "";
  task.postponeDate = "";
  return "해제";
}

function showTaskCycleFeedback(anchor, label = "") {
  if (!anchor || !label) return;
  const rect = anchor.getBoundingClientRect();
  const node = document.createElement("span");
  node.className = "task-cycle-feedback";
  node.textContent = label;
  node.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
  node.style.top = `${Math.round(rect.top)}px`;
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), 980);
}

function getPriorityMenuValue(task, priority) {
  if (task.status === "취소" || task.status === "연기") return task.status;
  if (task.priorityUnset) return "선택";
  return ["A", "B", "C"].includes(priority) ? priority : "선택";
}

function shouldStrikeTask(task) {
  return task.done || ["완료", "위임", "취소", "연기"].includes(task.status);
}

function shouldRemoveTaskScheduleLink(task = {}) {
  return ["위임", "취소", "연기"].includes(task.status);
}

function isTaskCompleted(task = {}) {
  return Boolean(task.done || task.status === "완료");
}

function handlePriorityMenuChange(task, fromPriority, index, value) {
  ensureTaskOrder(ensureDay(), task);
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
  captureUndo("우선업무 삭제");
  if (task.repeatId) {
    day.deletedRepeatIds ||= [];
    if (!day.deletedRepeatIds.includes(task.repeatId)) day.deletedRepeatIds.push(task.repeatId);
  }
  day.tasks[priority].splice(index, 1);
  saveState({ fastSave: true });
  renderAll();
  showUndoNotice("우선업무를 삭제했습니다.");
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
    assignTaskOrder(targetDay, existingTask);
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
    assignTaskOrder(day, targetTask);
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
  const linkTags = getTaskLinkTags(task);
  const inlineTags = task.financeItemId ? linkTags.filter((tag) => tag !== "Money") : linkTags;
  row.className = `task-row carryover-row priority-${menuValue === "A" ? "a" : "none"} marker-${marker} ${task.repeatId ? "is-repeat-task" : ""} ${completedHere ? "done" : ""}`;
  row.innerHTML = `
    <button class="task-cycle" type="button" aria-label="이월업무 완료 상태 변경">${getTaskMarkerLabel(marker)}</button>
    <div class="task-status-cell" data-status="${escapeAttr(getTaskStatusLabel(task, menuValue))}">${getTaskStatusDisplay(task, menuValue)}${statusControl}</div>
    <div class="task-text-cell">
      <input class="task-text-input" type="text" value="${escapeAttr(task.text)}" />
      ${renderTaskLinkTags(inlineTags)}
      ${task.financeItemId ? `<button class="task-money-link" type="button" aria-label="Money 항목으로 이동">Money</button>` : ""}
    </div>
    <button class="task-delete" type="button" aria-label="이월 우선업무 삭제">×</button>
  `;
  const prioritySelect = row.querySelector(".priority-select");
  const delegateInput = row.querySelector(".delegate-input");
  const postponeDateButton = row.querySelector(".postpone-date-button");
  const moneyLink = row.querySelector(".task-money-link");
  const cycle = row.querySelector(".task-cycle");
  cycle.onclick = () => {
    updateCarryoverTaskMarker(task, cycle);
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
  if (postponeDateButton) {
    postponeDateButton.onclick = () => openPostponeDatePicker(
      postponeDateButton,
      task.postponeDate || iso(selectedDate),
      (dateKey) => scheduleCarryoverPostponedTask(task, dateKey),
    );
  }
  const textInput = row.querySelector(".task-text-input");
  bindDailyTaskTextInput(textInput);
  textInput.oninput = (event) => {
    dailyTextEditingActive = true;
    markDailyFieldEditing(10 * 60 * 1000);
    updateCarryoverTaskText(task, event.target.value);
  };
  row.querySelector(".task-delete").onclick = () => deleteCarryoverTask(task);
  if (moneyLink) moneyLink.onclick = () => openMoneyFromFinanceTask(task.financeItemId);
  return row;
}

function deleteCarryoverTask(taskRef) {
  const source = findTaskSource(taskRef);
  if (!source) return;
  if (!confirmDelete("이월된 우선업무를 삭제할까요? 원래 날짜의 기록은 유지되고 오늘 이후 이월에서 제외됩니다.")) return;
  captureUndo("이월 우선업무 삭제");
  if (source.task.repeatId) {
    const selectedKey = iso(selectedDate);
    const day = ensureDay(selectedKey);
    day.deletedRepeatIds ||= [];
    if (!day.deletedRepeatIds.includes(source.task.repeatId)) day.deletedRepeatIds.push(source.task.repeatId);
  }
  source.task.carryoverDeletedFrom = iso(selectedDate);
  saveState({ fastSave: true });
  renderAll();
  showUndoNotice("이월 우선업무를 삭제했습니다.");
}

function updateCarryoverTaskMarker(taskRef, anchor = null) {
  const sourceRef = materializeCarryoverTask(taskRef);
  const source = sourceRef?.task;
  if (!source) return;
  const feedback = cycleTaskMarker(source);
  showTaskCycleFeedback(anchor, feedback);
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

function scheduleCarryoverPostponedTask(taskRef, targetDate) {
  const source = materializeCarryoverTask(taskRef);
  if (!source) return;
  schedulePostponedTask(source.task, source.priority, targetDate);
}

function updateCarryoverTaskText(taskRef, value) {
  const sourceRef = materializeCarryoverTask(taskRef);
  const source = sourceRef?.task;
  if (!source) return;
  source.text = value;
  if (!isFutureCarryoverTask(source) && syncTaskTimeHintToSchedule(source, sourceRef.day || ensureDay())) renderAppointments(ensureDay());
  saveState({ fastSave: true });
}

function extractTaskTimeHint(text = "") {
  const source = String(text || "");
  const wrapped = source.match(/\((오전|오후)?\s*(\d{1,2})(?:(?::|시\s*)([0-5]\d))?\s*(?:분)?\)/);
  const plain = wrapped ? null : source.match(/(^|[^\d])((오전|오후)?\s*(\d{1,2}):([0-5]\d))(?!\d)/);
  const match = wrapped || plain;
  if (!match) return null;
  const meridiem = wrapped ? match[1] : match[3];
  const rawHour = Number(wrapped ? match[2] : match[4]);
  const minute = wrapped ? (match[3] ? Number(match[3]) : 0) : Number(match[5]);
  let hour = rawHour;
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  if (meridiem === "오후" && hour < 12) hour += 12;
  if (meridiem === "오전" && hour === 12) hour = 0;
  const raw = wrapped ? match[0] : match[2];
  return {
    raw,
    rawHour,
    minute,
    hasMeridiem: Boolean(meridiem),
    slot: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    text: source.replace(raw, "").replace(/\s{2,}/g, " ").trim(),
  };
}

function syncTaskTimeHintToSchedule(task, day = ensureDay()) {
  if (!task) return false;
  day.appointments ||= {};
  day.autoTaskScheduleLinks ||= {};
  const slots = getScheduleSlotsForDay(day);
  const hint = extractTaskTimeHint(task.text);
  const linkId = getTaskScheduleLinkId(task);
  const existingLink = day.autoTaskScheduleLinks[linkId] || (task.scheduledSlot && task.scheduledText ? { type: "task", slot: task.scheduledSlot, text: task.scheduledText } : null);
  let changed = false;
  if (shouldRemoveTaskScheduleLink(task)) {
    if (existingLink) changed = clearAutoTaskScheduleLink(day, linkId, existingLink) || changed;
    delete task.scheduledSlot;
    delete task.scheduledText;
    return changed;
  }
  const targetSlot = hint ? resolveTaskTimeHintSlot(hint, slots) : "";
  if (!hint || !targetSlot || !hint.text) {
    if (!isTaskCompleted(task)) {
      if (existingLink) changed = clearAutoTaskScheduleLink(day, linkId, existingLink) || changed;
      delete task.scheduledSlot;
      delete task.scheduledText;
    }
    return changed;
  }
  if (existingLink && (existingLink.slot !== targetSlot || existingLink.text !== hint.text)) {
    changed = clearAutoTaskScheduleLink(day, linkId, existingLink) || changed;
  }
  const current = String(day.appointments[targetSlot] || "").trim();
  const previousText = String(existingLink?.text || task.scheduledText || "").trim();
  if (!current) {
    day.appointments[targetSlot] = hint.text;
    changed = true;
  } else if (previousText && current === previousText) {
    day.appointments[targetSlot] = hint.text;
    changed = true;
  } else if (!current.includes(hint.text)) {
    day.appointments[targetSlot] = `${current} / ${hint.text}`;
    changed = true;
  }
  if (!day.autoTaskScheduleLinks[linkId] || day.autoTaskScheduleLinks[linkId].slot !== targetSlot || day.autoTaskScheduleLinks[linkId].text !== hint.text) {
    day.autoTaskScheduleLinks[linkId] = { type: "task", slot: targetSlot, text: hint.text };
    changed = true;
  }
  task.scheduledSlot = targetSlot;
  task.scheduledText = hint.text;
  return changed;
}

function getTaskScheduleLinkId(task = {}) {
  return `task:${task.id || task.financeItemId || task.projectTaskId || task.repeatId || task.text || "unknown"}`;
}

function syncVisibleTaskTimeHints(day = ensureDay(), carryovers = []) {
  let changed = false;
  const directTaskSlots = new Set();
  const selectedKey = iso(selectedDate);
  getTaskRefs(day).forEach(({ task }) => {
    if (isFutureCarryoverTask(task, selectedKey)) return;
    if (syncTaskTimeHintToSchedule(task, day)) changed = true;
    if (shouldRemoveTaskScheduleLink(task)) return;
    const slot = getTaskTimeHintSlot(task.text, day);
    if (slot) directTaskSlots.add(slot);
  });
  if (shouldSyncCarryoverTimeHints(selectedKey)) {
    carryovers.forEach((task) => {
      if (syncTaskTextTimeHintToSchedule(task.text, day, { blockedSlots: directTaskSlots, linkId: getCarryoverScheduleLinkId(task), inactive: shouldRemoveTaskScheduleLink(task) })) changed = true;
    });
  } else if (clearAutoTaskScheduleLinks(day, (link) => link.type === "carryover")) {
    changed = true;
  }
  if (!shouldSyncCarryoverTimeHints(selectedKey) && clearFutureCarryoverTimeHints(day, carryovers, directTaskSlots)) changed = true;
  if (changed) saveState({ fastSave: true });
}

function syncTaskTextTimeHintToSchedule(text = "", day = ensureDay(), options = {}) {
  day.appointments ||= {};
  day.autoTaskScheduleLinks ||= {};
  const slots = getScheduleSlotsForDay(day);
  const hint = extractTaskTimeHint(text);
  const targetSlot = hint ? resolveTaskTimeHintSlot(hint, slots) : "";
  const linkId = options.linkId || "";
  let changed = false;
  const existingLink = linkId ? day.autoTaskScheduleLinks[linkId] : null;
  if (options.inactive) {
    if (existingLink) changed = clearAutoTaskScheduleLink(day, linkId) || changed;
    return changed;
  }
  if (!hint || !targetSlot || !hint.text) {
    if (existingLink) changed = clearAutoTaskScheduleLink(day, linkId) || changed;
    return changed;
  }
  if (options.blockedSlots?.has(targetSlot)) {
    if (existingLink) changed = clearAutoTaskScheduleLink(day, linkId) || changed;
    return changed;
  }
  if (existingLink && (existingLink.slot !== targetSlot || existingLink.text !== hint.text)) {
    changed = clearAutoTaskScheduleLink(day, linkId) || changed;
  }
  const current = String(day.appointments[targetSlot] || "").trim();
  if (current.includes(hint.text)) {
    // Already reflected in this day's schedule.
  } else if (!current) {
    day.appointments[targetSlot] = hint.text;
    changed = true;
  } else {
    day.appointments[targetSlot] = `${current} / ${hint.text}`;
    changed = true;
  }
  if (linkId && (!existingLink || existingLink.slot !== targetSlot || existingLink.text !== hint.text)) {
    day.autoTaskScheduleLinks[linkId] = { type: "carryover", slot: targetSlot, text: hint.text };
    changed = true;
  }
  return changed;
}

function shouldSyncCarryoverTimeHints(key = iso(selectedDate)) {
  return key <= iso(todayInPlanner());
}

function isFutureCarryoverTask(task = {}, key = iso(selectedDate)) {
  return Boolean((task.carryoverForkFrom || task.carryoverSourceDate) && key > iso(todayInPlanner()));
}

function getCarryoverScheduleLinkId(task = {}) {
  return `carryover:${task.date || ""}:${task.id || `${task.priority || ""}-${task.index ?? ""}`}`;
}

function clearAutoTaskScheduleLinks(day = ensureDay(), predicate = () => true) {
  day.autoTaskScheduleLinks ||= {};
  let changed = false;
  Object.entries({ ...day.autoTaskScheduleLinks }).forEach(([id, link]) => {
    if (!predicate(link, id)) return;
    changed = clearAutoTaskScheduleLink(day, id) || changed;
  });
  return changed;
}

function clearAutoTaskScheduleLink(day = ensureDay(), linkId = "", fallbackLink = null) {
  if (!linkId && !fallbackLink) return false;
  day.autoTaskScheduleLinks ||= {};
  const link = day.autoTaskScheduleLinks[linkId] || fallbackLink;
  if (!link) return false;
  let changed = false;
  if (link.slot && link.text && day.appointments?.[link.slot]) {
    const cleaned = removeSchedulePart(day.appointments[link.slot], link.text);
    if (cleaned !== day.appointments[link.slot]) {
      day.appointments[link.slot] = cleaned;
      changed = true;
    }
  }
  if (linkId) delete day.autoTaskScheduleLinks[linkId];
  return changed || true;
}

function clearFutureCarryoverTimeHints(day = ensureDay(), carryovers = [], blockedSlots = new Set()) {
  day.appointments ||= {};
  let changed = false;
  carryovers.forEach((task) => {
    const hint = extractTaskTimeHint(task.text);
    const targetSlot = hint ? resolveTaskTimeHintSlot(hint, getScheduleSlotsForDay(day)) : "";
    if (!hint?.text || !targetSlot || blockedSlots.has(targetSlot)) return;
    const current = String(day.appointments[targetSlot] || "").trim();
    const cleaned = removeSchedulePart(current, hint.text);
    if (cleaned !== current) {
      day.appointments[targetSlot] = cleaned;
      changed = true;
    }
  });
  return changed;
}

function getTaskTimeHintSlot(text = "", day = ensureDay()) {
  const hint = extractTaskTimeHint(text);
  return hint ? resolveTaskTimeHintSlot(hint, getScheduleSlotsForDay(day)) : "";
}

function resolveTaskTimeHintSlot(hint, slots = []) {
  if (!hint) return "";
  const candidates = [hint.slot];
  if (!hint.hasMeridiem && hint.rawHour >= 1 && hint.rawHour <= 7) {
    candidates.push(`${String(hint.rawHour + 12).padStart(2, "0")}:${String(hint.minute).padStart(2, "0")}`);
  }
  if (hint.minute && !candidates.some((slot) => slots.includes(slot))) {
    candidates.push(`${String((!hint.hasMeridiem && hint.rawHour >= 1 && hint.rawHour <= 7 ? hint.rawHour + 12 : hint.rawHour)).padStart(2, "0")}:00`);
  }
  return candidates.find((slot) => slots.includes(slot)) || "";
}

function removeSchedulePart(value = "", part = "") {
  const current = String(value || "").trim();
  const target = String(part || "").trim();
  if (!current || !target) return current;
  if (current === target) return "";
  return current
    .split(/\s*\/\s*/)
    .filter((item) => item.trim() && item.trim() !== target)
    .join(" / ");
}

function formatCarryoverDate(value) {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function resizeMergedAppointmentField(field) {
  if (!field || field.tagName !== "TEXTAREA") return;
  if (field.closest(".appointment-row.is-merged")) {
    field.style.height = "";
    return;
  }
  field.style.height = "auto";
  const maxHeight = Number.parseFloat(getComputedStyle(field).maxHeight);
  const nextHeight = Number.isFinite(maxHeight) && maxHeight > 0
    ? Math.min(field.scrollHeight, maxHeight)
    : field.scrollHeight;
  field.style.height = `${Math.max(32, nextHeight)}px`;
}

function renderAppointments(day) {
  const node = el("appointmentList");
  node.innerHTML = "";
  let pointerActionHandledAt = 0;
  const runAppointmentAction = (event) => {
    const actionButton = event.target.closest(".appointment-delete, .appointment-merge-button, .split-appointment, [data-row-merge-range]");
    if (!actionButton || !node.contains(actionButton)) return false;
    const row = actionButton.closest(".appointment-row");
    const slot = row?.dataset.appointmentSlot;
    if (!slot) return false;
    event.preventDefault();
    event.stopPropagation();
    if (actionButton.classList.contains("appointment-delete")) {
      deleteAppointmentSlot(day, slot);
      return true;
    }
    if (actionButton.classList.contains("split-appointment")) {
      splitAppointmentSlot(day, slot);
      return true;
    }
    if (actionButton.classList.contains("appointment-merge-button")) {
      mergeAppointmentSlot(day, slot);
      return true;
    }
    if (actionButton.dataset.rowMergeRange) {
      mergeAppointmentRange(day, actionButton.dataset.rowMergeRange);
      return true;
    }
    return false;
  };
  node.onpointerdown = (event) => {
    if (runAppointmentAction(event)) pointerActionHandledAt = Date.now();
  };
  node.onclick = (event) => {
    if (Date.now() - pointerActionHandledAt < 450) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    runAppointmentAction(event);
  };
  ensureAppointmentSlots(day, day.scheduleUnit);
  normalizeAppointmentMerges(day);
  const slots = getScheduleSlotsForDay(day);
  slots.forEach((slot, slotIndex) => {
    if (isCoveredAppointmentSlot(day, slot, slots)) return;
    const span = getAppointmentSpan(day, slot);
    const endSlot = getAppointmentEndLabel(slotIndex, span, slots);
    const row = document.createElement("div");
    const value = day.appointments[slot] || "";
    const isCurrent = isCurrentAppointmentSlot(slotIndex, span, slots);
    const currentTimeLabel = isCurrent ? getCurrentAppointmentTimeLabel(slotIndex, span, slots) : "";
    const currentProgress = span > 1 && isCurrent ? getCurrentAppointmentProgress(slotIndex, span, slots) : 0;
    row.className = `appointment-row ${value ? "is-filled" : ""} ${span > 1 ? "is-merged" : ""} ${isCurrent ? "is-current-time" : ""}`;
    row.dataset.appointmentSlot = slot;
    row.style.setProperty("--slot-span", span);
    if (currentTimeLabel && span > 1) row.style.setProperty("--current-segment-top", `${currentProgress}%`);
    const nextIndex = slotIndex + span;
    const canMerge = nextIndex < slots.length;
    const fieldMarkup = span > 1
      ? `<textarea rows="${Math.max(2, span)}" placeholder="일정">${escapeHtml(value)}</textarea>`
      : `<input type="text" value="${escapeAttr(value)}" placeholder="일정" />`;
    row.innerHTML = `
      <span class="appointment-time ${span > 1 ? "range" : ""}">${span > 1 ? `<b>${slot}</b>${currentTimeLabel ? `<em class="appointment-current-time-number">${currentTimeLabel}</em>` : ""}<b>${endSlot}</b>` : slot}</span>
      ${fieldMarkup}
      <span class="appointment-range-options" aria-label="시간대 빠른 병합">
        <button type="button" data-row-merge-range="all" aria-label="종일 병합"><span>종일</span><b>종</b></button>
        <button type="button" data-row-merge-range="am" aria-label="오전 병합"><span>오전</span><b>오</b></button>
        <button type="button" data-row-merge-range="pm" aria-label="오후 병합"><span>오후</span><b>후</b></button>
      </span>
      ${value ? `<button class="appointment-delete" type="button" title="일정 삭제" aria-label="${escapeAttr(slot)} 일정 삭제">×</button>` : ""}
      ${span > 1 ? `<button class="split-appointment" type="button" title="분리">-</button>` : ""}
      ${canMerge ? `<button class="appointment-merge-button" type="button" title="아래 시간칸과 합치기">+</button>` : ""}
    `;
    const input = row.querySelector("input, textarea");
    resizeMergedAppointmentField(input);
    let valueBeforeEdit = value;
    input.onfocus = () => {
      markDailyFieldEditing(10 * 60 * 1000);
      row.classList.add("is-menu-open");
      valueBeforeEdit = day.appointments[slot] || "";
    };
    input.oninput = (event) => {
      markDailyFieldEditing(10 * 60 * 1000);
      const nextValue = event.target.value;
      if (!nextValue.trim() && valueBeforeEdit.trim()) {
        day.appointments[slot] = nextValue;
        row.classList.remove("is-filled");
        resizeMergedAppointmentField(input);
        return;
      }
      day.appointments[slot] = nextValue;
      saveState();
      row.classList.toggle("is-filled", Boolean(nextValue.trim()));
      resizeMergedAppointmentField(input);
      renderSidebar();
    };
    input.onblur = () => {
      markDailyFieldEditing(0);
      window.setTimeout(() => row.classList.remove("is-menu-open"), 160);
      const nextValue = input.value;
      if (!nextValue.trim() && valueBeforeEdit.trim()) {
        if (!confirmDelete(`${slot} 일정 '${valueBeforeEdit}'을 삭제할까요?`)) {
          input.value = valueBeforeEdit;
          day.appointments[slot] = valueBeforeEdit;
          saveState({ fastSave: true });
          row.classList.add("is-filled");
          renderSidebar();
          return;
        }
        captureUndo("시간별 일정 삭제");
        day.appointments[slot] = "";
        saveState();
        row.classList.remove("is-filled");
        renderSidebar();
        showUndoNotice("시간별 일정을 삭제했습니다.");
        valueBeforeEdit = "";
      }
    };
    const bindAppointmentAction = (button, action) => {
      if (!button) return;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        action();
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    };
    bindAppointmentAction(row.querySelector(".appointment-delete"), () => deleteAppointmentSlot(day, slot));
    bindAppointmentAction(row.querySelector(".split-appointment"), () => splitAppointmentSlot(day, slot));
    bindAppointmentAction(row.querySelector(".appointment-merge-button"), () => mergeAppointmentSlot(day, slot));
    row.querySelectorAll("[data-row-merge-range]").forEach((button) => {
      bindAppointmentAction(button, () => mergeAppointmentRange(day, button.dataset.rowMergeRange));
    });
    node.appendChild(row);
  });
}

function deleteAppointmentSlot(day, slot) {
  if (!day) return;
  const slots = getScheduleSlotsForDay(day);
  const startSlot = findAppointmentMergeStartForSlot(day, slot, slots) || slot;
  const startIndex = slots.indexOf(startSlot);
  if (startIndex < 0) return;
  const span = getAppointmentSpan(day, startSlot);
  const currentText = String(day.appointments?.[startSlot] || day.appointments?.[slot] || "").trim();
  if (!currentText && span <= 1) return;
  if (!confirmDelete(`${startSlot} 일정${span > 1 ? " 구간" : ""}을 삭제할까요?`)) return;
  captureUndo("시간별 일정 삭제");
  day.appointments ||= {};
  day.appointmentMerges ||= {};
  slots.slice(startIndex, Math.min(slots.length, startIndex + span)).forEach((coveredSlot) => {
    day.appointments[coveredSlot] = "";
    delete day.appointmentMerges[coveredSlot];
  });
  saveState();
  renderAppointments(day);
  renderSidebar();
  showUndoNotice("시간별 일정을 삭제했습니다.");
}

function isCurrentAppointmentSlot(slotIndex, span, slots = timeSlots) {
  if (iso(selectedDate) !== iso(todayInPlanner())) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = slotToMinutes(slots[slotIndex] || slots[0] || "00:00");
  const end = start + span * getScheduleSlotIntervalMinutes(slots);
  return currentMinutes >= start && currentMinutes < end;
}

function getCurrentAppointmentTimeLabel(slotIndex, span, slots = timeSlots) {
  if (iso(selectedDate) !== iso(todayInPlanner())) return "";
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = slotToMinutes(slots[slotIndex] || slots[0] || "00:00");
  const end = start + span * getScheduleSlotIntervalMinutes(slots);
  if (currentMinutes < start || currentMinutes >= end) return "";
  return minutesToTimeLabel(Math.max(start, Math.floor(currentMinutes / 30) * 30));
}

function getCurrentAppointmentProgress(slotIndex, span, slots = timeSlots) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = slotToMinutes(slots[slotIndex] || slots[0] || "00:00");
  const duration = span * getScheduleSlotIntervalMinutes(slots);
  if (!duration) return 0;
  return Math.max(16, Math.min(84, ((currentMinutes - start) / duration) * 100));
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

function splitAppointmentSlot(day, slot) {
  const slots = getScheduleSlotsForDay(day);
  const splitSlot = findAppointmentMergeStartForSlot(day, slot, slots) || slot;
  const startIndex = slots.indexOf(splitSlot);
  if (startIndex < 0) return;
  const rawSpan = Math.max(1, Math.floor(Number(day.appointmentMerges?.[splitSlot] || 1)));
  if (rawSpan <= 1) return;
  captureUndo("시간별 일정 분리");
  normalizeAppointmentMerges(day);
  const span = getAppointmentSpan(day, splitSlot);
  if (span <= 1) {
    pendingUndoAction = null;
    return;
  }
  const targetEndIndex = Math.min(slots.length, startIndex + span);
  Object.entries({ ...(day.appointmentMerges || {}) }).forEach(([startSlot, startSpan]) => {
    const mergeStartIndex = slots.indexOf(startSlot);
    if (mergeStartIndex < 0) {
      delete day.appointmentMerges[startSlot];
      return;
    }
    const mergeEndIndex = Math.min(slots.length, mergeStartIndex + Math.max(1, Number(startSpan) || 1));
    const intersects = mergeStartIndex < targetEndIndex && mergeEndIndex > startIndex;
    if (intersects) delete day.appointmentMerges[startSlot];
  });
  slots.slice(startIndex, targetEndIndex).forEach((coveredSlot) => {
    day.appointments[coveredSlot] ||= "";
  });
  saveState();
  renderAppointments(day);
  renderSidebar();
  showUndoNotice("시간별 일정을 분리했습니다.");
}

function findAppointmentMergeStartForSlot(day, slot, slots = getScheduleSlotsForDay(day)) {
  if (!day?.appointmentMerges) return "";
  const index = slots.indexOf(slot);
  if (index < 0) return "";
  if (Number(day.appointmentMerges[slot] || 1) > 1) return slot;
  return Object.entries(day.appointmentMerges).find(([startSlot, span]) => {
    const startIndex = slots.indexOf(startSlot);
    const endIndex = startIndex + Math.max(1, Number(span) || 1);
    return startIndex >= 0 && startIndex <= index && index < endIndex;
  })?.[0] || "";
}

function mergeAppointmentSlot(day, slot) {
  const slots = getScheduleSlotsForDay(day);
  const startIndex = slots.indexOf(slot);
  if (startIndex < 0) return;
  day.appointments ||= {};
  day.appointmentMerges ||= {};
  captureUndo("시간별 일정 병합");
  normalizeAppointmentMerges(day);
  const span = getAppointmentSpan(day, slot);
  const nextIndex = startIndex + span;
  if (nextIndex >= slots.length) {
    pendingUndoAction = null;
    return;
  }
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
  renderSidebar();
  showUndoNotice("시간별 일정을 병합했습니다.");
}

function mergeAppointmentRange(day, range) {
  const slots = getScheduleSlotsForDay(day);
  if (!slots.length) return;
  day.appointments ||= {};
  day.appointmentMerges ||= {};
  const firstStart = slotToMinutes(slots[0]);
  const lastEnd = slotToMinutes(getAppointmentEndLabel(slots.length - 1, 1, slots));
  const noon = 12 * 60;
  let rangeStart = firstStart;
  let rangeEnd = lastEnd;
  if (range === "am") {
    rangeEnd = Math.min(noon, lastEnd);
  } else if (range === "pm") {
    rangeStart = Math.max(noon, firstStart);
  }
  const selected = slots.filter((slot) => {
    const minutes = slotToMinutes(slot);
    return minutes >= rangeStart && minutes < rangeEnd;
  });
  if (!selected.length) return;
  captureUndo("시간별 일정 빠른 병합");
  normalizeAppointmentMerges(day);
  const startIndex = slots.indexOf(selected[0]);
  const span = selected.length;
  const startSlot = slots[startIndex];
  const rangeSlotSet = new Set(selected);
  const overlappedStarts = slots.filter((slot, index) => {
    const itemStart = slotToMinutes(slot);
    const itemEnd = itemStart + getAppointmentSpan(day, slot) * getScheduleSlotIntervalMinutes(slots);
    return itemStart < rangeEnd && itemEnd > rangeStart && Boolean(day.appointments?.[slot] || day.appointmentMerges?.[slot]);
  });
  const mergedText = [...new Set([...selected, ...overlappedStarts])]
    .map((slot) => String(day.appointments?.[slot] || "").trim())
    .filter(Boolean)
    .join(" ");
  [...new Set([...selected, ...overlappedStarts])].forEach((slot) => {
    if (slot !== startSlot || !rangeSlotSet.has(slot)) day.appointments[slot] = "";
    delete day.appointmentMerges[slot];
  });
  if (mergedText) day.appointments[startSlot] = mergedText;
  else day.appointments[startSlot] ||= "";
  day.appointmentMerges[startSlot] = span;
  saveState();
  renderAppointments(day);
  renderSidebar();
  showUndoNotice("시간별 일정을 병합했습니다.");
}

function renderNotes() {
  state.finance ||= createFinanceState();
  normalizeFinanceState(state.finance);
  const amountToggle = document.getElementById("financeAmountVisibilityToggle");
  if (amountToggle) amountToggle.checked = moneyAmountsVisible();
  if (syncMoneyTaskLinks()) saveState({ fastSave: true });
  if (!state.finance.months[selectedFinanceMonth]) selectedFinanceMonth = monthKey(selectedDate);
  sortMoneyRowsByDueDay(state.finance.fixed);
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
    projectAction: "Project Actions",
    meeting: "Meeting Notes",
    goalTracker: "Goal Tracker",
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
  captureUndo("시트 삭제");
  const index = state.customSheets.items.findIndex((item) => item.id === sheet.id);
  state.customSheets.items.splice(index, 1);
  const next = state.customSheets.items[Math.max(0, index - 1)] || state.customSheets.items[0];
  selectedSheetId = next.id;
  selectedSheetCell = "A1";
  state.customSheets.activeId = next.id;
  saveState();
  renderSheets();
  showUndoNotice("시트를 삭제했습니다.");
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
      <label class="project-wide-field"><span class="row-label">목표</span><textarea data-field="goal" rows="1" placeholder="완료 기준과 기대 결과">${escapeHtml(project.goal)}</textarea></label>
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
      <label class="project-wide-field"><span class="row-label">메모</span><textarea data-field="notes" rows="2" placeholder="리스크, 의사결정, 확인할 숫자">${escapeHtml(project.notes)}</textarea></label>
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
  if (!Number.isFinite(Number(task.order))) assignTaskOrder(targetDay, task);
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
    title.textContent = `${yearNumber}. ${pad(monthNumber)}. Money Check`;
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
      <span>${yearNumber}. ${pad(monthNumber)}. Money Check</span>
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
  const showAmounts = moneyAmountsVisible();
  const visibleRows = rows
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => moneyItemHasInput(item) || item.id === activeMoneyDraftId);
  if (!visibleRows.length) {
    const empty = document.createElement("div");
    empty.className = "finance-empty-state";
    empty.textContent = options.fixed ? "등록된 반복 지출이 없습니다. 필요한 항목만 추가하세요." : "이 달의 자금 항목이 없습니다. 추가 버튼으로 기록하세요.";
    node.appendChild(empty);
    return;
  }
  visibleRows.forEach(({ item, index }) => {
    const isFilled = moneyItemHasInput(item);
    const row = document.createElement("div");
    row.className = `finance-row ${options.fixed ? "finance-row-fixed" : ""} ${isFilled ? "finance-row-filled" : "finance-row-draft"} ${showAmounts ? "" : "finance-amount-hidden"} finance-status-${item.status}`;
    row.dataset.financeId = item.id || "";
    row.innerHTML = `
      <select class="finance-type" aria-label="구분">
        ${moneyTypes.map((type) => `<option value="${type}" ${item.type === type ? "selected" : ""}>${type}</option>`).join("")}
      </select>
      <select class="finance-category" aria-label="분류">
        ${moneyCategories.map((category) => `<option value="${category}" ${item.category === category ? "selected" : ""}>${category || "분류"}</option>`).join("")}
      </select>
      <input class="finance-title" type="text" value="${escapeAttr(item.title)}" placeholder="내용" />
      <input class="finance-amount" type="${showAmounts ? "text" : "password"}" inputmode="numeric" value="${escapeAttr(formatMoneyInputValue(item.amount, showAmounts))}" placeholder="${showAmounts ? "금액" : "숨김"}" />
      <input class="finance-due" type="text" inputmode="numeric" value="${escapeAttr(item.dueDay)}" placeholder="일" />
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
    const category = row.querySelector(".finance-category");
    const title = row.querySelector(".finance-title");
    const amount = row.querySelector(".finance-amount");
    const dueDay = row.querySelector(".finance-due");
    const status = row.querySelector(".finance-status");
    const memo = row.querySelector(".finance-memo");
    const repeatEndMode = row.querySelector(".finance-repeat-end-mode");
    const repeatEndDate = row.querySelector(".finance-repeat-end-date");
    type.onchange = () => updateMoneyItemById(rows, item.id, "type", type.value, options);
    category.onchange = () => updateMoneyItemById(rows, item.id, "category", category.value, options);
    bindMoneyCommitInput(title, () => {
      updateMoneyItemById(rows, item.id, "title", title.value, options);
      if (category && !category.value && item.category) category.value = item.category;
    });
    bindMoneyCommitInput(amount, () => {
      const value = sanitizeMoneyInput(amount.value);
      updateMoneyItemById(rows, item.id, "amount", value, options);
      if (showAmounts) amount.value = formatMoneyInputValue(value, true);
    }, { sanitizeLive: (value) => value.replace(/[^\d,.-]/g, "") });
    bindMoneyCommitInput(dueDay, () => {
      const value = sanitizeDueDayInput(dueDay.value);
      dueDay.value = value;
      updateMoneyItemById(rows, item.id, "dueDay", value, options);
    }, { sanitizeLive: (value) => value.replace(/[^\d]/g, "") });
    status.onchange = () => updateMoneyItemById(rows, item.id, "status", status.value, options);
    bindMoneyCommitInput(memo, () => {
      updateMoneyItemById(rows, item.id, "memo", memo.value, options);
      if (category && !category.value && item.category) category.value = item.category;
    });
    if (repeatEndMode) {
      repeatEndMode.onchange = () => {
        updateMoneyItemById(rows, item.id, "repeatEndMode", repeatEndMode.value, options);
        if (repeatEndDate) repeatEndDate.disabled = repeatEndMode.value !== "date";
      };
    }
    if (repeatEndDate) {
      repeatEndDate.onchange = () => updateMoneyItemById(rows, item.id, "repeatEndDate", repeatEndDate.value, options);
    }
    row.querySelector(".finance-delete").onclick = () => removeMoneyRowById(rows, item.id, options);
    node.appendChild(row);
  });
}

function bindMoneyCommitInput(input, onCommit, options = {}) {
  if (!input || typeof onCommit !== "function") return;
  let committedValue = input.value;
  const commit = () => {
    const nextValue = input.value;
    if (nextValue === committedValue) return;
    committedValue = nextValue;
    onCommit();
  };
  input.addEventListener("input", () => {
    if (typeof options.sanitizeLive === "function") {
      const clean = options.sanitizeLive(input.value);
      if (clean !== input.value) input.value = clean;
    }
  });
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    commit();
    input.blur();
  });
  input.addEventListener("blur", commit);
}

function addMoneyRow(rows, options = {}) {
  const item = emptyMoneyItem("지출");
  activeMoneyDraftId = item.id;
  rows.push(item);
  saveState();
  renderNotes();
  window.requestAnimationFrame(() => document.querySelector(`[data-finance-id="${CSS.escape(item.id)}"] .finance-title`)?.focus());
}

function removeMoneyRow(rows, index, options = {}) {
  if (!confirmDelete("이 자금 항목을 삭제할까요? 연결된 우선업무도 함께 정리됩니다.")) return;
  captureUndo("Money 항목 삭제");
  const [removed] = rows.splice(index, 1);
  if (removed?.id) removeFinanceLinkedTask(removed.id, Boolean(options.fixed));
  if (removed?.id === activeMoneyDraftId) activeMoneyDraftId = "";
  saveState();
  renderNotes();
  showUndoNotice("Money 항목을 삭제했습니다.");
}

function removeMoneyRowById(rows, id, options = {}) {
  const index = rows.findIndex((item) => item.id === id);
  if (index < 0) return;
  removeMoneyRow(rows, index, options);
}

function updateMoneyItemById(rows, id, field, value, options = {}) {
  const index = rows.findIndex((item) => item.id === id);
  if (index < 0) return;
  updateMoneyItem(rows, index, field, value, options);
}

function updateMoneyItem(rows, index, field, value, options = {}) {
  const item = rows[index];
  if (!item) return;
  item[field] = value;
  if (field !== "category" && !item.category) {
    item.category = inferMoneyCategory(item);
  }
  if (moneyItemHasInput(item) && item.id === activeMoneyDraftId) activeMoneyDraftId = "";
  if (options.fixed && !item.startDate && moneyItemHasInput(item)) item.startDate = iso(todayInPlanner());
  if (options.fixed && field === "dueDay") sortMoneyRowsByDueDay(rows);
  if (options.monthKey) linkMoneyItemToTask(item, options.monthKey);
  if (options.fixed) linkFixedMoneyItemToTasks(item);
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
  if (!moneyAmountsVisible()) {
    node.textContent = `${monthNumber}월 ${activeOpenRows.length}건 · 금액 숨김 · 연간 미확인 ${yearlyOpenRows.length}`;
    return;
  }
  node.textContent = `${monthNumber}월 ${activeOpenRows.length}건 · 수입 ${formatMoneyAmount(incomeTotal)} · 지출 ${formatMoneyAmount(expenseTotal)} · 연간 미확인 ${yearlyOpenRows.length}`;
}

function moneyAmountsVisible() {
  return state.finance?.showAmounts !== false;
}

function sortMoneyRowsByDueDay(rows = []) {
  const filled = rows.filter((item) => moneyItemHasInput(item));
  const empty = rows.filter((item) => !moneyItemHasInput(item));
  filled.sort((a, b) => {
    const aDay = Number(a.dueDay) || 99;
    const bDay = Number(b.dueDay) || 99;
    return aDay - bDay || String(a.title || "").localeCompare(String(b.title || ""), "ko");
  });
  rows.splice(0, rows.length, ...filled, ...empty);
  return rows;
}

function moneyItemHasInput(item = {}) {
  return Boolean(item.title?.trim() || item.amount || item.dueDay || item.memo?.trim());
}

function sanitizeMoneyInput(value = "") {
  const source = String(value || "").replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (!source || source === "-" || source === "." || source === "-.") return source;
  return source;
}

function sanitizeDueDayInput(value = "") {
  const source = String(value || "").replace(/[^\d]/g, "");
  if (!source) return "";
  const day = Math.min(31, Math.max(1, Number(source)));
  return Number.isFinite(day) ? String(day) : "";
}

function formatMoneyInputValue(value = "", visible = true) {
  if (!visible) return value || "";
  const source = String(value || "").replace(/,/g, "");
  if (!source || source === "-" || source === "." || source === "-.") return source;
  const number = Number(source);
  if (!Number.isFinite(number)) return value;
  return number.toLocaleString("ko-KR");
}

function normalizeFixedMoneyStartDates(rows = []) {
  const today = iso(todayInPlanner());
  rows.forEach((item) => {
    if (!item.startDate && moneyItemHasInput(item)) item.startDate = today;
  });
}

function fixedMoneyTaskWindow() {
  const start = todayInPlanner();
  const end = addMonthsClamped(start, 1);
  return { start: iso(start), end: iso(end) };
}

function addMonthsClamped(date, months) {
  const source = new Date(date);
  source.setHours(0, 0, 0, 0);
  const targetYear = source.getFullYear();
  const targetMonth = source.getMonth() + months;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(targetYear, targetMonth, Math.min(source.getDate(), lastDay));
}

function fixedMoneyTaskMonthKeys() {
  const window = fixedMoneyTaskWindow();
  const start = parseDate(window.start);
  const end = parseDate(window.end);
  const keys = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= endMonth) {
    keys.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1, 1);
  }
  return keys;
}

function relinkAllMoneyTasks() {
  state.finance ||= createFinanceState();
  normalizeFinanceState(state.finance);
  Object.entries(state.finance.months || {}).forEach(([key, rows]) => {
    rows.forEach((item) => linkMoneyItemToTask(item, key));
  });
  state.finance.fixed.forEach((item) => linkFixedMoneyItemToTasks(item));
}

function ensureMoneyTasksReflected() {
  return syncMoneyTaskLinks();
}

function syncMoneyTaskLinks() {
  state.finance ||= createFinanceState();
  normalizeFinanceState(state.finance);
  const expectedLinks = buildExpectedMoneyTaskLinks();
  let changed = removeStaleMoneyTasks(expectedLinks);
  expectedLinks.forEach((link) => {
    if (hasFinanceLinkedTaskAt(link.id, link.date)) return;
    linkMoneyItemToTask(link.item, link.monthKey, link.id, link.fixed);
    changed = true;
  });
  return changed;
}

function buildExpectedMoneyTaskLinks() {
  const links = new Map();
  Object.entries(state.finance.months || {}).forEach(([key, rows]) => {
    rows.forEach((item) => {
      const targetDate = getMoneyItemDate(item, key);
      if (!item.title?.trim() || !targetDate) return;
      links.set(item.id, { id: item.id, item, monthKey: key, date: targetDate, fixed: false });
    });
  });
  (state.finance.fixed || []).forEach((item) => {
    if (!item.title?.trim() || !Number(item.dueDay)) return;
    fixedMoneyTaskMonthKeys().forEach((key) => {
      if (!isFixedMoneyActiveForMonth(item, key)) return;
      const targetDate = getMoneyItemDate(item, key);
      const id = `${item.id}-${key}`;
      links.set(id, { id, item, monthKey: key, date: targetDate, fixed: true });
    });
  });
  return links;
}

function removeStaleMoneyTasks(expectedLinks) {
  let changed = false;
  Object.entries(state.days || {}).forEach(([dayKey, day]) => {
    priorities.forEach(([priority]) => {
      const tasks = day.tasks?.[priority] || [];
      const filtered = tasks.filter((task) => {
        if (!task.financeItemId) {
          const keepLegacy = shouldKeepLegacyFixedMoneyTask(task, dayKey);
          if (!keepLegacy) changed = true;
          return keepLegacy;
        }
        const expected = expectedLinks.get(task.financeItemId);
        const keep = Boolean(expected && expected.date === dayKey);
        if (!keep) changed = true;
        return keep;
      });
      if (filtered.length !== tasks.length) day.tasks[priority] = filtered;
    });
  });
  return changed;
}

function shouldKeepLegacyFixedMoneyTask(task = {}, dayKey = "") {
  const title = getLegacyFixedMoneyTaskTitle(task.text);
  if (!title) return true;
  return (state.finance?.fixed || []).some((item) => {
    if (!item.title?.trim()) return false;
    if (!sameMoneyTitle(item.title, title)) return false;
    const key = monthKey(parseDate(dayKey));
    return isFixedMoneyActiveForMonth(item, key) && getMoneyItemDate(item, key) === dayKey;
  });
}

function getLegacyFixedMoneyTaskTitle(text = "") {
  const value = String(text || "").trim();
  const match = value.match(/^자금\s*확인\s*\(매월\)\s*:\s*(.+)$/);
  if (!match) return "";
  return normalizeMoneyTitle(match[1].replace(/\s+[0-9,.-]+원?$/, ""));
}

function sameMoneyTitle(a = "", b = "") {
  return normalizeMoneyTitle(a) === normalizeMoneyTitle(b);
}

function normalizeMoneyTitle(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[0-9,.-]+원?$/g, "")
    .trim();
}

function hasFinanceLinkedTask(linkId = "") {
  if (!linkId) return false;
  return Object.values(state.days || {}).some((day) =>
    priorities.some(([priority]) => (day.tasks?.[priority] || []).some((task) => task.financeItemId === linkId)),
  );
}

function hasFinanceLinkedTaskAt(linkId = "", dayKey = "") {
  if (!linkId || !dayKey) return false;
  const day = state.days?.[dayKey];
  if (!day) return false;
  return priorities.some(([priority]) => (day.tasks?.[priority] || []).some((task) => task.financeItemId === linkId));
}

function openMoneyFromFinanceTask(financeItemId = "") {
  if (!financeItemId) return;
  state.finance ||= createFinanceState();
  normalizeFinanceState(state.finance);
  let targetMonth = "";
  Object.entries(state.finance.months || {}).some(([key, rows]) => {
    if (!rows.some((item) => item.id === financeItemId)) return false;
    targetMonth = key;
    return true;
  });
  if (!targetMonth) {
    const fixedItem = (state.finance.fixed || []).find((item) => financeItemId.startsWith(`${item.id}-`));
    if (fixedItem) targetMonth = financeItemId.slice(fixedItem.id.length + 1);
  }
  if (targetMonth) selectedFinanceMonth = targetMonth;
  showView("notes");
  renderAll();
  window.requestAnimationFrame(() => document.getElementById("view-notes")?.scrollIntoView({ block: "start" }));
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
  if (!Number.isFinite(Number(task.order))) assignTaskOrder(targetDay, task);
  if (!existing && !targetDay.tasks[targetPriority].includes(task)) targetDay.tasks[targetPriority].push(task);
  item.taskDate = targetDate;
}

function linkFixedMoneyItemToTasks(item) {
  removeFinanceLinkedTask(item.id, true);
  if (!item.title?.trim() || !Number(item.dueDay)) return;
  fixedMoneyTaskMonthKeys().forEach((key) => {
    if (isFixedMoneyActiveForMonth(item, key)) linkMoneyItemToTask(item, key, `${item.id}-${key}`, true);
  });
}

function isFixedMoneyActiveForMonth(item, key) {
  const targetDate = getMoneyItemDate(item, key);
  if (!targetDate) return false;
  const window = fixedMoneyTaskWindow();
  if (targetDate < window.start || targetDate > window.end) return false;
  if (item.startDate && targetDate < item.startDate) return false;
  if (item.repeatEndMode !== "date" || !item.repeatEndDate) return true;
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
  const amount = moneyAmountsVisible() && item.amount ? ` ${formatMoneyInputValue(item.amount, true)}` : "";
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
  return priorities
    .flatMap(([priority]) => day.tasks[priority].map((task, index) => ({ ...task, priority, date: key, index })))
    .sort((a, b) => {
      const activeDelta = Number(isActiveTaskSlot(b)) - Number(isActiveTaskSlot(a));
      if (activeDelta) return activeDelta;
      return getTaskOrder(a) - getTaskOrder(b) || a.index - b.index;
    });
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
      if (task.status === "연기" && task.postponeDate) return false;
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
  if (name === "day") positionDaySwipe(previousView === "day" ? currentDayPanel : "main", previousView !== "day");
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
  const labels = getSearchResultLabels();
  const push = (type, label, text, date = "") => {
    if (matchesSearchText(`${label} ${text} ${date}`, terms)) results.push({ type, label, text, date });
  };
  push("foundation", labels.myWhy, state.foundation.mission);
  state.foundation.values.forEach((value, index) => push("foundation", `${labels.value} ${index + 1}`, value));
  state.foundation.roles.forEach((role) => {
    push("foundation", `${labels.role} ${role.role}`, role.goal);
    push("foundation", `${labels.recharge} ${role.role}`, role.renewal);
  });
  state.year.goals.forEach((value, index) => push("year", `${labels.yearGoal} ${index + 1}`, value));
  state.year.future.forEach((value, index) => push("year", `${labels.futureList} ${index + 1}`, value));
  Object.entries(state.months).forEach(([key, month]) => {
    push("month", `${key} ${labels.monthFocus}`, month.focus, `${key}-01`);
    month.projects.forEach((value, index) => push("month", `${key} ${labels.project} ${index + 1}`, value, `${key}-01`));
  });
  Object.entries(state.weeks).forEach(([key, week]) => {
    week.priorities?.forEach((item, index) => push("week", `${key} ${labels.weekFocus} ${index + 1}`, item.text, key));
    week.compass.forEach((item) => {
      normalizeCompassItem(item);
      push("week", `${key} ${item.role}`, item.goal, key);
      item.actions.forEach((action, index) => push("week", `${key} ${item.role} ${labels.action} ${index + 1}`, action, key));
    });
  });
  state.repeats?.priorityTasks?.forEach((rule, index) => {
    push("notes", `${labels.repeatingTask} ${index + 1}`, rule.text);
  });
  Object.entries(state.days).forEach(([key, day]) => {
    getDayTasks(key).forEach((task) => push("day", `${key} ${task.priority}`, task.text, key));
    Object.entries(day.appointments).forEach(([slot, text]) => push("day", `${key} ${slot}`, text, key));
    ["memo", "record", "wins", "carry", "lesson"].forEach((field) => push("day", `${key} ${labels.dayFields[field] || field}`, day[field], key));
  });
  Object.entries(state.finance?.months || {}).forEach(([key, rows]) => {
    rows.forEach((item, index) => push("notes", `${key} 자금 ${index + 1} ${item.type} ${item.category || ""} ${item.status}`, `${item.title} ${item.amount} ${item.dueDay} ${item.category || ""} ${item.memo}`, `${key}-01`));
  });
  state.finance?.fixed?.forEach((item, index) => push("notes", `반복 지출 ${index + 1} ${item.type} ${item.category || ""} ${item.status}`, `${item.title} ${item.amount} ${item.dueDay} ${item.category || ""} ${item.memo}`));
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

function getSearchResultLabels() {
  if (getAppLanguage() === "ko") {
    return {
      myWhy: "나의 기준",
      value: "가치",
      role: "역할",
      recharge: "회복",
      yearGoal: "연간 목표",
      futureList: "대기 목록",
      monthFocus: "월간 초점",
      project: "프로젝트",
      weekFocus: "금주의 주요일정",
      action: "핵심행동",
      repeatingTask: "반복 우선업무",
      dayFields: {
        memo: "메모",
        record: "일일 기록",
        wins: "완료/성과",
        carry: "내일로 넘길 일",
        lesson: "개선할 점",
      },
    };
  }
  return {
    myWhy: "My Why",
    value: "Value",
    role: "Role",
    recharge: "Recharge",
    yearGoal: "Year Goal",
    futureList: "Future List",
    monthFocus: "Month Focus",
    project: "Project",
    weekFocus: "Week Focus",
    action: "Action",
    repeatingTask: "Repeating Task",
    dayFields: {
      memo: "Memo",
      record: "Daily Record",
      wins: "Wins",
      carry: "Carry Forward",
      lesson: "Lesson",
    },
  };
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
    const session = getAuthSession();
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
      body: JSON.stringify({ question, context: buildPlannerAiContext() }),
    });
    const payload = await response.json().catch(() => ({}));
    const detail = payload.detail ? ` (${String(payload.detail).slice(0, 180)})` : "";
    const hint = payload.hint ? ` · ${payload.hint}` : "";
    if (!response.ok) throw new Error(`${payload.error || "AI 답변을 받아오지 못했습니다."}${detail}${hint}`);
    aiSearch = { query: question, answer: payload.answer || "AI 답변이 비어 있습니다.", loading: false, error: "" };
  } catch (error) {
    aiSearch = {
      query: question,
      answer: "",
      loading: false,
      error: `${error.message || "AI 연결 오류"} · 배포 환경에서는 OPENAI_API_KEY와 /api/ask 설정을 확인하세요.`,
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
      wins: day.wins || "",
      carry: day.carry || "",
      lesson: day.lesson || "",
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
  downloadTextFile(
    JSON.stringify(createPlannerBackupEnvelope(), null, 2),
    `beyond-work-backup-${iso(todayInPlanner())}.beyondwork.json`,
    "application/json"
  );
}

function createPlannerBackupEnvelope() {
  return {
    format: "beyond-work-planner-backup",
    version: 2,
    exportedAt: new Date().toISOString(),
    account: getAuthSession()?.email || "",
    selectedDate: iso(selectedDate),
    state,
  };
}

function createPlannerWorkbookFile() {
  const generatedAt = new Date().toLocaleString("ko-KR");
  const tables = buildPlannerWorkbookTables();
  const backupJson = JSON.stringify(createPlannerBackupEnvelope());
  const restoreSection = `
    <section class="restore-data">
      <h2>Restore Data</h2>
      <table>
        <tbody>
          <tr><td>BEYOND_WORK_BACKUP_JSON</td><td>${escapeHtml(backupJson)}</td></tr>
        </tbody>
      </table>
    </section>
  `;
  const sections = tables.map((table) => `
    <h2>${escapeHtml(table.title)}</h2>
    <table>
      <thead><tr>${table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${table.rows.length ? table.rows.map((row) => `<tr>${table.headers.map((_, index) => `<td>${escapeHtml(row[index] ?? "")}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${table.headers.length}">기록 없음</td></tr>`}
      </tbody>
    </table>
  `).join("");
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; color: #263238; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { margin: 24px 0 8px; font-size: 16px; color: #28483c; }
    p { margin: 0 0 16px; color: #66736d; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
    th, td { border: 1px solid #d9d4c8; padding: 8px; vertical-align: top; mso-number-format:"\\@"; }
    th { background: #eef2ec; font-weight: 800; }
    .restore-data { display: none; mso-hide: all; }
  </style>
</head>
<body>
  <h1>Beyond Work Export Report</h1>
  <p>생성: ${escapeHtml(generatedAt)} · 이 Excel 파일은 설정에서 다시 가져와 복원할 수 있습니다.</p>
  ${restoreSection}
  ${sections}
</body>
</html>`;
  return {
    content: html,
    filename: `beyond-work-excel-${iso(todayInPlanner())}.xls`,
    contentType: "application/vnd.ms-excel",
  };
}

function exportPlannerWorkbook() {
  const file = createPlannerWorkbookFile();
  downloadTextFile(file.content, file.filename, file.contentType);
}

function buildPlannerWorkbookTables() {
  const taskRows = [];
  Object.keys(state.days || {}).sort().forEach((key) => {
    getDayTasks(key).filter((task) => task.text || task.done || task.status !== "미완료").forEach((task) => {
      taskRows.push([key, task.priority, task.status || "", task.done ? "완료" : "", task.text || "", task.delegate || ""]);
    });
  });
  const appointmentRows = [];
  Object.keys(state.days || {}).sort().forEach((key) => {
    const day = state.days[key];
    getScheduleSlotsForDay(day).forEach((slot) => {
      const text = String(day.appointments?.[slot] || "").trim();
      if (text) appointmentRows.push([key, slot, getAppointmentEndLabel(getScheduleSlotsForDay(day).indexOf(slot), getAppointmentSpan(day, slot), getScheduleSlotsForDay(day)), text]);
    });
  });
  const weekRows = [];
  Object.keys(state.weeks || {}).sort().forEach((key) => {
    const week = state.weeks[key];
    (week.priorities || []).forEach((item, index) => {
      if (item.text || item.done) weekRows.push([key, `Week Focus ${index + 1}`, item.done ? "완료" : "", item.text || ""]);
    });
    (week.compass || []).forEach((item) => {
      if (item.goal) weekRows.push([key, item.role, "목표", item.goal]);
      (item.actions || []).forEach((action, index) => {
        if (action) weekRows.push([key, item.role, `Action ${index + 1}`, action]);
      });
    });
  });
  const moneyRows = [];
  (state.finance?.fixed || []).forEach((item) => moneyRows.push(["반복", item.dueDay || "", item.type || "", item.category || "", item.status || "", item.title || "", item.amount || "", item.memo || ""]));
  Object.entries(state.finance?.months || {}).sort().forEach(([key, rows]) => {
    rows.forEach((item) => moneyRows.push([key, item.dueDay || "", item.type || "", item.category || "", item.status || "", item.title || "", item.amount || "", item.memo || ""]));
  });
  const projectRows = (state.projects?.items || []).map((project) => [
    project.status || "", project.title || "", project.owner || "", project.startDate || "", project.endDate || "", project.goal || "", project.nextAction || "", project.budget || "", project.actual || "", project.notes || "",
  ]);
  const profileRows = Object.entries(state.profile || {}).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : value || ""]);
  return [
    { title: "About Me", headers: ["Field", "Text"], rows: profileRows },
    { title: "Top Tasks", headers: ["Date", "Priority", "Status", "Done", "Task", "Delegate"], rows: taskRows },
    { title: "Schedule", headers: ["Date", "Start", "End", "Text"], rows: appointmentRows },
    { title: "Weekly Focus", headers: ["Week", "Group", "Item", "Text"], rows: weekRows },
    { title: "Money", headers: ["월/반복", "일", "구분", "분류", "상태", "내용", "금액", "메모"], rows: moneyRows },
    { title: "Projects", headers: ["Status", "Project", "Owner", "Start", "End", "Goal", "Next Action", "Budget", "Actual", "Memo"], rows: projectRows },
  ];
}

function downloadTextFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parsePlannerImportPayload(rawText) {
  const text = String(rawText || "").trim();
  if (!text) throw new Error("빈 파일입니다.");
  if (text.startsWith("PK")) {
    throw new Error("현재 가져오기는 앱에서 내보낸 Excel(.xls) 백업 파일을 사용해야 합니다. 일반 .xlsx 파일은 지원하지 않습니다.");
  }
  if (text.startsWith("<")) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    const cells = Array.from(doc.querySelectorAll("td, th"));
    const marker = cells.find((cell) => cell.textContent.trim() === "BEYOND_WORK_BACKUP_JSON");
    const dataCell = marker?.nextElementSibling || marker?.parentElement?.children?.[1];
    if (!dataCell) throw new Error("복원 데이터가 없는 Excel 파일입니다.");
    return JSON.parse(dataCell.textContent || "{}");
  }
  return JSON.parse(text);
}

function importPlanner(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = parsePlannerImportPayload(reader.result);
      const importedState = parsed?.format === "beyond-work-planner-backup" ? parsed.state : parsed;
      if (!importedState?.foundation || !importedState?.year || !importedState?.days) throw new Error("Invalid planner file");
      if (!hasPlannerContent(importedState)) {
        window.alert("가져오기 파일에 저장할 플래너 내용이 없습니다. 현재 데이터는 유지됩니다.");
        return;
      }
      if (isDangerousPlannerImport(importedState)) {
        window.alert("현재 플래너보다 내용이 현저히 적은 파일입니다. 데이터 보호를 위해 가져오기를 중단했습니다.");
        return;
      }
      const currentAccount = getAuthSession()?.email || "";
      const importedAccount = parsed?.account || "";
      if (currentAccount && importedAccount && currentAccount !== importedAccount) {
        const proceed = window.confirm(`이 백업은 ${importedAccount} 계정에서 만든 파일입니다. 현재 계정 ${currentAccount}에 가져올까요?`);
        if (!proceed) return;
      }
      if (!window.confirm("이 파일의 내용으로 플래너를 가져올까요? 현재 저장된 내용은 보호 규칙을 통과한 경우에만 바뀝니다.")) return;
      state = migrateState(importedState);
      selectedSheetId = state.customSheets.activeId;
      saveState();
      renderAll();
    } catch (error) {
      alert(error?.message || "가져오기 파일을 읽을 수 없습니다.");
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
  if (syncMoneyTaskLinks()) saveState({ fastSave: true });
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
  updateSettingsTabState();
  updateStickyPanelTop();
  checkScheduledBackupEmail();
}

function setBootMessage(message) {
  const node = el("bootMessage");
  if (node) node.textContent = message;
}

function buildBootValuePhrases(note = {}) {
  const isKo = getAppLanguage() === "ko";
  const day = ensureDay(iso(todayInPlanner()));
  const tasks = getDayTasks(iso(todayInPlanner())).filter((task) => task.text?.trim());
  const appointmentCount = Object.values(day.appointments || {}).filter((value) => String(value || "").trim()).length;
  if (!isKo) {
    return [
      "Turn priorities into real time blocks.",
      appointmentCount ? "See tasks, schedule, and decisions in one flow." : "Bring one important task into your calendar.",
      tasks.length ? "The more you record, the sharper coaching becomes." : "Start with one task. The system learns from action.",
    ];
  }
  return [
    "중요한 일을 시간표에 연결합니다.",
    appointmentCount ? "업무, 일정, 결정 흐름을 한 화면에서 정리합니다." : "가장 중요한 일 하나를 실제 시간에 앉힙니다.",
    tasks.length ? "기록이 쌓일수록 코칭은 더 정확해집니다." : "첫 업무 하나가 오늘의 실행 흐름을 만듭니다.",
  ];
}

function renderBootCoaching() {
  const message = el("bootCoachingMessage");
  const signals = el("bootCoachingSignals");
  const dayline = el("bootDayline");
  const valueStrip = el("bootValueStrip");
  if (!message || !signals) return;
  const note = buildDailyOpeningNote(iso(todayInPlanner()));
  if (dayline) dayline.textContent = note.title;
  if (valueStrip) {
    valueStrip.innerHTML = buildBootValuePhrases(note).map((phrase) => `<span>${escapeHtml(phrase)}</span>`).join("");
  }
  message.textContent = note.message;
  signals.innerHTML = note.signals.slice(0, 2).map((signal) => `<li>${escapeHtml(signal)}</li>`).join("");
  localStorage.setItem(DAILY_OPENING_SEEN_KEY, iso(todayInPlanner()));
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
  setupGlobalInputEditingGuard();
  setupSelectors();
  setupTabs();
  selectedDate = todayInPlanner();
  currentDayPanel = "main";
  daySwipeKey = "";
  showView("day");
  setBootMessage(hasInitialDeviceCache ? "마지막 실행 흐름을 펼치는 중" : "오늘의 첫 장면을 구성하는 중");
  renderAll();
  renderBootCoaching();
  if (hasInitialDeviceCache) hideBootScreen(820);
  await hydrateServerState();
  renderAll();
  renderBootCoaching();
  setBootMessage("오늘의 우선순위를 화면에 앉히는 중");
  hideBootScreen(hasInitialDeviceCache ? 820 : 220);
  window.setTimeout(maybeShowDailyOpeningMessage, hasInitialDeviceCache ? 420 : 620);
  stabilizeDaySwipePosition("main");
  window.setInterval(pullServerStateIfNewer, 15000);
  window.addEventListener("focus", pullServerStateIfNewer);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pullServerStateIfNewer();
  });
}

setup();
