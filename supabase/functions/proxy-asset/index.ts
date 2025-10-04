import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isAllowed(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "kenney.nl" && u.pathname.startsWith("/content/");
  } catch (_) {
    return false;
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let target = url.searchParams.get("url");

    if (!target && req.method !== "GET") {
      // Allow POST with JSON { url }
      try {
        const body = await req.json();
        target = body?.url;
      } catch (_) {/* ignore */}
    }

    if (!target || typeof target !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'url' query parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isAllowed(target)) {
      return new Response(JSON.stringify({ error: "URL not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(target, { method: "GET" });

    if (!upstream.ok || !upstream.body) {
      const msg = await upstream.text().catch(() => "");
      console.error("Upstream fetch failed", upstream.status, msg);
      return new Response(JSON.stringify({ error: `Upstream error ${upstream.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const contentLength = upstream.headers.get("content-length") ?? undefined;
    const headers: Record<string, string> = { ...corsHeaders, "Content-Type": contentType };
    if (contentLength) headers["Content-Length"] = contentLength;

    return new Response(upstream.body, { headers });
  } catch (e) {
    console.error("proxy-asset error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});