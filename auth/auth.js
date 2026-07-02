const AUTH_USERS_KEY = "beyondWorkAuthUsers.v1";
const AUTH_SESSION_KEY = "beyondWorkAuthSession.v1";
const tiers = ["ceo", "director", "manager", "staff"];

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const message = document.getElementById("authMessage");
const authPage = document.body.dataset.authPage || "tabs";

migrateLegacyTiers();
if (getSession()) redirectToDashboard();
prefillLoginEmail();
wireAuthLinks();

if (loginTab && signupForm) loginTab.onclick = () => setMode("login");
if (signupTab && loginForm) signupTab.onclick = () => setMode("signup");

if (loginForm) loginForm.onsubmit = async (event) => {
  event.preventDefault();
  showMessage("로그인 확인 중입니다...");
  const email = normalizeEmail(document.getElementById("loginEmail").value);
  const password = document.getElementById("loginPassword").value;
  try {
    const result = await requestAuth("login", { email, password });
    cacheRemoteUser(result.user);
    saveSession(result.user.email, result.user, result.session);
    redirectToDashboard();
  } catch (error) {
    return showMessage(error.message || "로그인할 수 없습니다.");
  }
};

if (signupForm) signupForm.onsubmit = async (event) => {
  event.preventDefault();
  showMessage("회원정보를 저장 중입니다...");
  const name = document.getElementById("signupName").value.trim();
  const email = normalizeEmail(document.getElementById("signupEmail").value);
  const password = document.getElementById("signupPassword").value;
  const passwordConfirm = document.getElementById("signupPasswordConfirm").value;
  const tier = document.getElementById("signupTier").value;
  if (!email) return showMessage("이메일을 입력하세요.");
  if (password.length < 6) return showMessage("비밀번호는 6자리 이상으로 설정하세요.");
  if (password !== passwordConfirm) return showMessage("비밀번호 확인이 일치하지 않습니다.");
  if (!tiers.includes(tier)) return showMessage("등급을 다시 선택하세요.");
  try {
    const result = await requestAuth("signup", { name, email, password, tier });
    cacheRemoteUser(result.user);
    clearSignupPasswordFields();
    redirectToLogin(result.user.email, "created");
    return;
  } catch (error) {
    return showMessage(error.message || "회원가입을 완료할 수 없습니다.");
  }
};

function setMode(mode) {
  if (!loginForm || !signupForm || !loginTab || !signupTab) return;
  const isLogin = mode === "login";
  loginForm.hidden = !isLogin;
  signupForm.hidden = isLogin;
  loginTab.classList.toggle("is-active", isLogin);
  signupTab.classList.toggle("is-active", !isLogin);
  showMessage("");
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
    return session?.email && session.provider === "supabase" && session.accessToken ? session : null;
  } catch {
    return null;
  }
}

function saveSession(email, user, remoteSession = {}) {
  if (!remoteSession?.accessToken) throw new Error("서버 로그인 세션을 확인할 수 없습니다.");
  localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      email,
      tier: normalizeTier(user.tier),
      name: user.name || "",
      provider: "supabase",
      accessToken: remoteSession.accessToken,
      refreshToken: remoteSession?.refreshToken || "",
      expiresAt: remoteSession?.expiresAt || "",
      loginAt: new Date().toISOString(),
    }),
  );
}

function cacheRemoteUser(user = {}) {
  if (!user.email) return;
  const users = getUsers();
  users[user.email] = {
    ...(users[user.email] || {}),
    email: user.email,
    name: user.name || users[user.email]?.name || "",
    tier: normalizeTier(user.tier),
    provider: "supabase",
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function migrateLegacyTiers() {
  const users = getUsers();
  let changed = false;
  Object.values(users).forEach((user) => {
    const normalized = normalizeTier(user.tier);
    if (user.tier !== normalized) {
      user.tier = normalized;
      changed = true;
    }
  });
  if (changed) localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  const session = getSession();
  if (session) {
    const normalized = normalizeTier(session.tier);
    if (session.tier !== normalized) {
      session.tier = normalized;
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    }
  }
}

function normalizeTier(tier = "staff") {
  const legacyMap = { basic: "staff", pro: "manager", executive: "director" };
  const normalized = legacyMap[tier] || tier;
  return tiers.includes(normalized) ? normalized : "staff";
}

function redirectToDashboard() {
  const next = new URLSearchParams(window.location.search).get("next");
  const safeNext = next && !next.startsWith("http") ? next : "../dashboard/index.html";
  window.location.replace(safeNext);
}

function redirectToLogin(email = "", status = "") {
  const params = new URLSearchParams();
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && !next.startsWith("http")) params.set("next", next);
  if (email) params.set("email", email);
  if (status) params.set("status", status);
  const query = params.toString();
  window.location.href = `../login/${query ? `?${query}` : ""}`;
}

function prefillLoginEmail() {
  const email = normalizeEmail(new URLSearchParams(window.location.search).get("email") || "");
  const loginEmail = document.getElementById("loginEmail");
  if (email && loginEmail) loginEmail.value = email;
  if (authPage === "login" && new URLSearchParams(window.location.search).get("status") === "created") {
    showMessage("회원가입이 완료되었습니다. 로그인해 주세요.");
  }
}

function wireAuthLinks() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  const suffix = next && !next.startsWith("http") ? `?next=${encodeURIComponent(next)}` : "";
  const signupLink = document.getElementById("signupLink");
  const loginLink = document.getElementById("loginLink");
  if (signupLink) signupLink.href = `../signup/${suffix}`;
  if (loginLink) loginLink.href = `../login/${suffix}`;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function showMessage(text) {
  if (message) message.textContent = text;
}

async function requestAuth(action, payload) {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    const error = new Error(data.error || "인증 서버에서 요청을 처리하지 못했습니다.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function clearSignupPasswordFields() {
  document.getElementById("signupPassword").value = "";
  document.getElementById("signupPasswordConfirm").value = "";
}
