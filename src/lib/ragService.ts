/**
 * RAG Service — calls edge functions for real AI-powered responses.
 * Falls back to mock knowledge base if the API is unavailable.
 */

import { supabase } from "@/integrations/supabase/client";

interface RAGSource {
  id: number;
  title: string;
  relevance: number;
  lastUpdated: string;
  type: string;
}

interface RAGStreamCallbacks {
  onSources: (sources: RAGSource[]) => void;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function streamRAGResponse(
  query: string,
  history: { role: string; content: string }[],
  callbacks: RAGStreamCallbacks
): Promise<void> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ query, history }),
  });

  if (!resp.ok || !resp.body) {
    const errData = await resp.json().catch(() => ({ error: "Unknown error" }));
    
    if (resp.status === 429) {
      callbacks.onError("Превышен лимит запросов, попробуйте позже");
    } else if (resp.status === 402) {
      callbacks.onError("Недостаточно кредитов для AI-запросов");
    } else {
      callbacks.onError(errData.error || "Ошибка API");
    }
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        callbacks.onDone();
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);

        // Custom sources event from our edge function
        if (parsed.type === "sources") {
          callbacks.onSources(parsed.sources);
          continue;
        }

        // Standard OpenAI-compatible delta
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) callbacks.onDelta(content);
      } catch {
        // Incomplete JSON, put back
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Flush remaining
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === "sources") {
          callbacks.onSources(parsed.sources);
        } else {
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) callbacks.onDelta(content);
        }
      } catch { /* ignore */ }
    }
  }

  callbacks.onDone();
}

/**
 * Check if RAG backend is available by verifying Supabase URL is configured.
 */
export function isRAGAvailable(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
}
