import { createHash } from "node:crypto";
import { isIP } from "node:net";

export const INTERVIEW_RATE_LIMIT = 18;
export const INTERVIEW_RATE_WINDOW_SECONDS = 600;
// One atomic operation; the first accepted request starts the fixed window.
// Denied requests neither increment the counter nor extend its expiry.
const rateScript = `local count = tonumber(redis.call('GET', KEYS[1]) or '0')
local ttl = redis.call('TTL', KEYS[1])
if count > 0 and ttl < 0 then return redis.error_reply('Invalid limiter expiry') end
if count >= tonumber(ARGV[1]) then return {0, ttl} end
count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]); ttl = tonumber(ARGV[2]) end
return {1, ttl}`;

export function interviewClientIp(request, env) {
  // Only trust Vercel's ingress, never arbitrary forwarded chains or fallback headers.
  const ip = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (env.VERCEL !== "1" || !ip || !isIP(ip) || ip.includes("%"))
    throw new Error("Client address unavailable");
  return isIP(ip) === 6 ? new URL(`http://[${ip}]/`).hostname : ip;
}

// Upstash-compatible Redis REST. No workflow or credentials are logged.
// Atomic compare-and-set reserves each billable operation across function instances.
export const SESSION_TTL_SECONDS = 1800;
const casScript = `local old = redis.call('GET', KEYS[1])
if (ARGV[1] == '' and not old) or old == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3]); return 1
end
return 0`;

export function createInterviewStore(env, fetcher = fetch) {
  const environment = env.VERCEL_ENV ?? (env.VERCEL === "1" ? null : "development");
  if (!["production", "preview", "development"].includes(environment))
    throw new Error("State environment unavailable");
  const namespace = `bimcode:audit:m3:${environment}`;
  const url = new URL(env.AUDIT_STATE_REDIS_REST_URL || "invalid:");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !env.AUDIT_STATE_REDIS_REST_TOKEN?.trim()
  )
    throw new Error("State store unavailable");
  const command = async (args) => {
    const response = await fetcher(url, {
      method: "POST",
      redirect: "error",
      headers: {
        Authorization: `Bearer ${env.AUDIT_STATE_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error("State store unavailable");
    const body = await response.json();
    if (body.error || !Object.hasOwn(body, "result"))
      throw new Error("State store unavailable");
    return body.result;
  };
  const key = (id) => `${namespace}:${id}`;
  return {
    consumeInterviewRequest: async (ip) => {
      const digest = createHash("sha256").update(ip).digest("hex");
      const result = await command([
        "EVAL", rateScript, "1", `${namespace}:rate:interview:${digest}`,
        String(INTERVIEW_RATE_LIMIT), String(INTERVIEW_RATE_WINDOW_SECONDS),
      ]);
      if (!Array.isArray(result) || result.length !== 2 ||
          ![0, 1].includes(result[0]) || !Number.isInteger(result[1]) ||
          result[1] < 0 || result[1] > INTERVIEW_RATE_WINDOW_SECONDS)
        throw new Error("Rate limit unavailable");
      return { allowed: result[0] === 1, retryAfter: Math.max(1, result[1]) };
    },
    get: async (id) => {
      const raw = await command(["GET", key(id)]);
      return raw === null ? null : JSON.parse(raw);
    },
    cas: async (id, old, next) => {
      const ttl = Math.max(1, Math.ceil((next.expiresAt - Date.now()) / 1000));
      return (
        (await command([
          "EVAL",
          casScript,
          "1",
          key(id),
          old ? JSON.stringify(old) : "",
          JSON.stringify(next),
          String(Math.min(ttl, SESSION_TTL_SECONDS)),
        ])) === 1
      );
    },
  };
}
