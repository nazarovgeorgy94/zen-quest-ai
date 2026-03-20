import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Ты — Antifraud Assistant, эксперт по антифрод-системам. Отвечай на русском языке.

Используй ТОЛЬКО предоставленный контекст из базы знаний для ответов. Если контекст не содержит информации по запросу, скажи об этом честно.

Форматируй ответы в HTML:
- Используй <h3> для заголовков разделов
- Используй <p> для параграфов
- Используй <strong> для выделения важных терминов
- Используй <br/> для переноса строк в списках (• маркеры)
- Ссылайся на источники через <span class="citation-tag">N</span> где N — номер источника

Будь конкретным, приводи цифры и метрики из контекста. Не придумывай данные.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, history } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Step 1: Text search for relevant chunks
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: chunks, error: searchError } = await supabase.rpc("search_knowledge_chunks", {
      query_text: query,
      match_count: 5,
    });

    if (searchError) {
      console.error("Search error:", searchError);
    }

    // Step 3: Build context from retrieved chunks
    const context = (chunks || [])
      .map((c: any, i: number) => `[Источник ${i + 1}: ${c.title} (${c.source_type}, similarity: ${c.similarity.toFixed(2)})]
${c.content}`)
      .join("\n\n---\n\n");

    const sources = (chunks || []).map((c: any, i: number) => ({
      id: i + 1,
      title: c.title,
      relevance: Math.round(c.similarity * 100),
      lastUpdated: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }),
      type: c.source_type,
    }));

    // Step 4: Call LLM with context
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history || []).slice(-6), // last 3 exchanges for context
      {
        role: "user",
        content: `Контекст из базы знаний:\n\n${context || "Релевантная информация не найдена."}\n\n---\n\nВопрос пользователя: ${query}`,
      },
    ];

    const chatResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!chatResponse.ok) {
      const status = chatResponse.status;
      const errText = await chatResponse.text();
      console.error("Chat API error:", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Chat API error: ${status}`);
    }

    // Return sources as a header, then stream the response
    const encoder = new TextEncoder();
    const sourcesEvent = `data: ${JSON.stringify({ type: "sources", sources })}\n\n`;

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(sourcesEvent));

        const reader = chatResponse.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (e) {
          console.error("Stream error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
