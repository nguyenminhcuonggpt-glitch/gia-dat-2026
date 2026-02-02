const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "Thiếu env Supabase" }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }

  const body = await req.json();
  const event = String(body.event || "").trim();
  const deviceId = String(body.deviceId || "").trim();

  if (!event || !deviceId) {
    return new Response(JSON.stringify({ ok: false, error: "Thiếu event/deviceId" }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const ip =
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for") ||
    null;

  const record = {
    event,
    device_id: deviceId,
    ip,
    user_agent: req.headers.get("user-agent") || null,
    path: body.path || null,
    payload: body.payload ?? null
  };

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/usage_logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(record)
  });

  if (!resp.ok) {
    const err = await resp.text();
    return new Response(JSON.stringify({ ok: false, error: err }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { "Content-Type": "application/json" }
  });
};
