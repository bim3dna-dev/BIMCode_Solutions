// Upstash-compatible Redis REST. No workflow or credentials are logged.
// Atomic compare-and-set reserves each billable operation across function instances.
export const SESSION_TTL_SECONDS = 1800;
const casScript = `local old = redis.call('GET', KEYS[1])
if (ARGV[1] == '' and not old) or old == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3]); return 1
end
return 0`;

export function createInterviewStore(env, fetcher = fetch) {
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
  const key = (id) => `bimcode:audit:m3:${id}`;
  return {
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
