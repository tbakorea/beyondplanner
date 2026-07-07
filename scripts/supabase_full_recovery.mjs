import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const envPath = path.join(root, ".env.local");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(envPath);

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const command = process.argv[2] || "backup";
const args = new Map();
for (let i = 3; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${supabaseUrl}${endpoint}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function listUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const payload = await request(`/auth/v1/admin/users?page=${page}&per_page=100`);
    const batch = payload?.users || [];
    users.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return users;
}

async function backupAll() {
  const rows = await request("/rest/v1/planner_states?select=*", {
    headers: { Accept: "application/json" },
  });
  const users = await listUsers();
  const outDir = path.join(root, "outputs");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `supabase-full-backup-${stamp()}.json`);
  fs.writeFileSync(out, JSON.stringify({ createdAt: new Date().toISOString(), users, planner_states: rows }, null, 2));
  console.log(out);
}

async function restoreRows() {
  const input = args.get("--input");
  if (!input) throw new Error("Use --input backup.json");
  const payload = JSON.parse(fs.readFileSync(path.resolve(input), "utf8"));
  const rows = payload.planner_states || payload.rows || payload;
  if (!Array.isArray(rows)) throw new Error("Backup must contain planner_states array.");
  await request("/rest/v1/planner_states?on_conflict=user_id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows.map((row) => ({
      user_id: row.user_id,
      state: row.state,
      updated_at: row.updated_at || new Date().toISOString(),
    }))),
  });
  console.log(`restored ${rows.length} planner state rows`);
}

async function restoreLocalStateToEmail() {
  const email = args.get("--email");
  const stateFile = args.get("--state");
  if (!email || !stateFile) throw new Error("Use --email user@example.com --state state.json");
  const users = await listUsers();
  const user = users.find((item) => String(item.email || "").toLowerCase() === email.toLowerCase());
  if (!user?.id) throw new Error(`User not found: ${email}`);
  const state = JSON.parse(fs.readFileSync(path.resolve(stateFile), "utf8"));
  const updatedAt = args.get("--updated-at") || new Date().toISOString();
  await request("/rest/v1/planner_states?on_conflict=user_id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([{ user_id: user.id, state, updated_at: updatedAt }]),
  });
  console.log(`restored local state to ${email}`);
}

if (command === "backup") await backupAll();
else if (command === "restore") await restoreRows();
else if (command === "restore-local") await restoreLocalStateToEmail();
else throw new Error(`Unknown command: ${command}`);

