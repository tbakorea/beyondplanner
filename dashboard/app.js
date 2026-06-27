const YEAR = 2026;
const STORAGE_KEY = "franklinClassicPlanner2026.v1";
if (new URLSearchParams(window.location.search).get("reset") === "1") {
  localStorage.removeItem(STORAGE_KEY);
  history.replaceState(null, "", window.location.pathname);
}
const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
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
const defaultRoles = ["개인", "가족", "일", "성장", "공헌", "건강", "관계"];
const isMacEnvironment = /Mac|iPhone|iPad/.test(navigator.platform || "") || /Macintosh|iPhone|iPad/.test(navigator.userAgent || "");
const timeSlots = Array.from({ length: 23 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

let state = loadState();
let selectedDate = todayInPlanner();
let searchQuery = "";
let daySwipeKey = "";
let plannerMode = localStorage.getItem("beyondWorkMode") || "";
const dayPanelOrder = ["week", "main", "memo"];
let currentDayPanel = "main";
let dateSlideTimer = 0;

function el(id) {
  return document.getElementById(id);
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
  };
}

function migrateState(nextState) {
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

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  el("dailyTodayButton").onclick = () => {
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
  el("topSearchToggle").onclick = toggleTopSearch;
  el("topSearchSubmit").onclick = runHeaderSearch;
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
  document.querySelectorAll("[data-merge-range]").forEach((button) => {
    button.onclick = () => {
      mergeAppointmentRange(ensureDay(), button.dataset.mergeRange);
    };
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
  setupTopViews();
  setupDailyDateSwipe();
  setupDailyPageSwipe();
  setupDaySwipePager();
  setupWheelDayNavigation();
  applyPlannerMode();
  updateStickyPanelTop();
  window.addEventListener("resize", () => {
    applyPlannerMode();
    updateStickyPanelTop();
    positionDaySwipe("main", true);
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
    window.requestAnimationFrame(() => input.focus());
  }
}

function runHeaderSearch() {
  const input = el("headerSearch");
  const popover = el("topSearchPopover");
  if (!input) return;
  updateSearch(input.value);
  if (popover && input.value.trim()) popover.hidden = true;
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

function shiftDay(delta, animate = true) {
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

function setupDailyDateSwipe() {
  const zone = el("dailyDateSwipeZone");
  if (!zone) return;
  let startX = 0;
  let startY = 0;
  zone.addEventListener("pointerdown", (event) => {
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
    shiftDay(dx < 0 ? 1 : -1);
  });
}

function setupDailyPageSwipe() {
  const zone = document.querySelector("#view-day .daily-title");
  if (!zone) return;
  let startX = 0;
  let startY = 0;
  zone.addEventListener("pointerdown", (event) => {
    if (event.target.closest("#dailyDateSwipeZone")) return;
    startX = event.clientX;
    startY = event.clientY;
  });
  zone.addEventListener("pointerup", (event) => {
    if (event.target.closest("#dailyDateSwipeZone")) return;
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
  const isPhoneMode = window.matchMedia("(max-width: 640px)").matches;
  const isAutoCeo = isPhoneMode;
  const isCeo = plannerMode === "ceo" || isAutoCeo;
  document.body.classList.toggle("mac-mode", isMacEnvironment);
  document.body.classList.toggle("phone-mode", isPhoneMode);
  document.body.classList.toggle("ceo-mode", isCeo);
  document.body.classList.toggle("classic-mode", !isCeo);
  const button = el("modeToggle");
  if (button) button.textContent = isCeo ? "Classic mode" : "CEO mode";
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
  el("topSearchCount").textContent = `검색 ${results.length}`;
  el("dailyTodayButton").hidden = iso(selectedDate) === iso(todayInPlanner());
  updateCoachBubble();
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
      const count = countTasksForDay(iso(date));
      cell.textContent = day;
      if (count) cell.title = `${count} tasks`;
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
  el("dayTitle").textContent = formatDate(selectedDate);
  const allTasks = getDayTasks(iso(selectedDate));
  const done = allTasks.filter((task) => task.text && task.done).length;
  const total = allTasks.filter((task) => task.text).length;
  el("dailyCompletion").textContent = `${done}/${total}`;
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
  positionDaySwipe();
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
      <button class="ai-suggest-close" type="button" aria-label="AI 추천 닫기">×</button>
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
    saveState();
    renderDay();
  };
  list.appendChild(add);
  board.appendChild(list);
}

function getTaskRefs(day) {
  return priorities.flatMap(([priority]) => day.tasks[priority].map((task, index) => ({ task, priority, index })));
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
    saveState();
    renderAll();
  };
  if (prioritySelect) {
    prioritySelect.onchange = () => handlePriorityMenuChange(task, priority, index, prioritySelect.value);
  }
  if (delegateInput) {
    delegateInput.oninput = () => {
      task.delegate = delegateInput.value;
      saveState();
    };
  }
  if (postponeSelect) {
    postponeSelect.onchange = () => {
      task.postponeMode = postponeSelect.value;
      saveState();
      renderAll();
    };
  }
  if (postponeDate) {
    postponeDate.onchange = () => schedulePostponedTask(task, priority, postponeDate.value);
  }
  text.oninput = () => {
    task.text = text.value;
    task.priorityUnset = false;
    saveState();
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
  if (task.status !== "연기" || task.postponeMode !== "date" || !task.postponeDate) return "";
  const date = parseDate(task.postponeDate);
  if (Number.isNaN(date.getTime())) return "";
  return `<span class="postpone-date-label"><b>${date.getMonth() + 1}</b><b>${date.getDate()}</b></span>`;
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
    saveState();
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
  saveState();
  renderAll();
}

function moveTaskPriority(fromPriority, index, toPriority) {
  if (fromPriority === toPriority) return;
  const day = ensureDay();
  const [task] = day.tasks[fromPriority].splice(index, 1);
  if (!task) return;
  day.tasks[toPriority].push(task);
  saveState();
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
  saveState();
  renderAll();
}

function renderCarryoverTask(task) {
  const row = document.createElement("div");
  row.className = `task-row carryover-row priority-${task.priority === "A" ? "a" : "none"}`;
  row.innerHTML = `<button class="task-cycle" type="button" disabled></button><div class="task-status-cell" data-status="${escapeAttr(task.priority)}"><select class="priority-select" disabled><option>${task.priority}</option></select></div><input class="task-text-input" type="text" value="${escapeAttr(task.text)}" />`;
  row.querySelector(".task-text-input").oninput = (event) => {
    updateCarryoverTaskText(task, event.target.value);
  };
  return row;
}

function updateCarryoverTaskText(taskRef, value) {
  const source = state.days[taskRef.date]?.tasks?.[taskRef.priority]?.[taskRef.index];
  if (!source) return;
  source.text = value;
  saveState();
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
  renderEditableList(el("projectIndex"), state.notes.projects, "프로젝트", () => saveState());
  renderEditableList(el("referenceIndex"), state.notes.references, "참고", () => saveState());
  document.querySelector("[data-store='notes.freeform']").value = state.notes.freeform || "";
  document.querySelector("[data-store='notes.freeform']").oninput = (event) => {
    state.notes.freeform = event.target.value;
    saveState();
  };
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
    .filter((task) => task.text && !task.done && ["미완료", "진행중", "연기"].includes(task.status));
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

function showView(name) {
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  document.querySelectorAll("[data-top-view]").forEach((item) => item.classList.toggle("is-active", item.dataset.topView === name));
  document.querySelectorAll(".view").forEach((item) => item.classList.toggle("active", item.id === `view-${name}`));
  if (name === "day") positionDaySwipe();
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
  state.notes.projects.forEach((value, index) => push("notes", `프로젝트 ${index + 1}`, value));
  state.notes.references.forEach((value, index) => push("notes", `참고 ${index + 1}`, value));
  push("notes", "자유 노트", state.notes.freeform);
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

function renderSearch() {
  const node = el("searchResults");
  if (!node) return;
  node.innerHTML = "";
  const results = searchQuery ? collectSearchResults(searchQuery) : [];
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
      state = parsed;
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
  renderNotes();
  renderSearch();
  updateStickyPanelTop();
}

function setup() {
  setupSelectors();
  setupTabs();
  selectedDate = todayInPlanner();
  currentDayPanel = "main";
  daySwipeKey = "";
  showView("day");
  renderAll();
  positionDaySwipe("main", true);
  window.setTimeout(() => positionDaySwipe("main", true), 180);
}

setup();
