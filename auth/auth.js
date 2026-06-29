const AUTH_USERS_KEY = "beyondWorkAuthUsers.v1";
const AUTH_SESSION_KEY = "beyondWorkAuthSession.v1";
const tiers = ["ceo", "director", "manager", "staff"];

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const message = document.getElementById("authMessage");

migrateLegacyTiers();
if (getSession()) redirectToDashboard();

loginTab.onclick = () => setMode("login");
signupTab.onclick = () => setMode("signup");

loginForm.onsubmit = async (event) => {
  event.preventDefault();
  const email = normalizeEmail(document.getElementById("loginEmail").value);
  const password = document.getElementById("loginPassword").value;
  const users = getUsers();
  const user = users[email];
  if (!user) return showMessage("가입된 이메일이 없습니다.");
  const passwordHash = await hashPassword(password, user.salt);
  if (passwordHash !== user.passwordHash) return showMessage("비밀번호가 맞지 않습니다.");
  saveSession(email, user);
  redirectToDashboard();
};

signupForm.onsubmit = async (event) => {
  event.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = normalizeEmail(document.getElementById("signupEmail").value);
  const password = document.getElementById("signupPassword").value;
  const tier = document.getElementById("signupTier").value;
  if (!email) return showMessage("이메일을 입력하세요.");
  if (password.length < 6) return showMessage("비밀번호는 6자리 이상으로 설정하세요.");
  if (!tiers.includes(tier)) return showMessage("등급을 다시 선택하세요.");
  const users = getUsers();
  if (users[email]) return showMessage("이미 가입된 이메일입니다.");
  const salt = randomId();
  users[email] = {
    email,
    name,
    tier,
    salt,
    passwordHash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  saveSession(email, users[email]);
  redirectToDashboard();
};

function setMode(mode) {
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
    const users = getUsers();
    return session?.email && users[session.email] ? session : null;
  } catch {
    return null;
  }
}

function saveSession(email, user) {
  localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      email,
      tier: normalizeTier(user.tier),
      loginAt: new Date().toISOString(),
    }),
  );
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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function showMessage(text) {
  message.textContent = text;
}

function randomId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  const source = `${salt}:${password}`;
  if (!crypto?.subtle) return btoa(unescape(encodeURIComponent(source)));
  const data = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
