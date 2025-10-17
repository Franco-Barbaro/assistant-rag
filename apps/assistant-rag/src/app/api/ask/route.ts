import { supabaseAdmin } from "@/server/supabase";
import { embed, openai } from "@/server/ai";

export const runtime = "nodejs";

/* ---------------- Tipos ---------------- */
type Row = {
  content_md: string;
  title: string | null;
  source_url: string;
  similarity: number;
};

type Citation = { n: number; title?: string | null; url: string; similarity: number };

/* ---------------- Utils ---------------- */
const NO_ANSWER_ES =
  'No tengo evidencia suficiente para responder con certeza.';
const NO_ANSWER_EN =
  "I don't have enough evidence to answer confidently.";

const MIN_SIM = Number(process.env.RAG_MIN_SIM ?? 0.58); // configurable
const TOP_K_DEFAULT = Number(process.env.RAG_TOP_K ?? 8);

/** Extrae palabras clave simples de la pregunta (min 2 chars, sin stopchars) */
function extractKeywords(q: string): string[] {
  const words = (q || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  // Prioriza tokens “técnicos” (números/códigos tipo 404, 500, http, status, etc.)
  const uniq = Array.from(new Set(words));
  // limita para no pasarse en checks
  return uniq.slice(0, 12);
}

/** ¿Algún chunk contiene alguna keyword de la pregunta? */
function hasKeywordHit(ctxs: Row[], q: string): boolean {
  const kws = extractKeywords(q);
  if (!kws.length) return true; // si no se puede extraer nada, no bloqueamos
  const hay = ctxs.some((c) => {
    const text = c.content_md.toLowerCase();
    return kws.some((w) => text.includes(w));
  });
  return hay;
}

/** Dedupe de citas por URL, manteniendo el primer índice (y por tanto el orden) */
function buildCitations(ctxs: Row[]): Citation[] {
  const uniq = new Map<string, Citation>();
  for (const c of ctxs) {
    if (!uniq.has(c.source_url)) {
      uniq.set(c.source_url, {
        n: uniq.size + 1,
        title: c.title ?? undefined,
        url: c.source_url,
        similarity: c.similarity,
      });
    }
  }
  return Array.from(uniq.values());
}

function buildPrompt(
  q: string,
  ctxs: Row[],
  lang: "es" | "en" = "es"
): { system: string; user: string } {
  const system =
    lang === "es"
      ? `Eres un asistente que SOLO responde usando la evidencia proporcionada. Si no hay evidencia suficiente, di exactamente: "No tengo evidencia suficiente para responder con certeza." Cita siempre las fuentes como [#n] y enuméralas al final.`
      : `You only answer using the provided evidence. If evidence is insufficient, say exactly: "I don't have enough evidence to answer confidently." Always cite sources as [#n] and list them at the end.`;

  const blocks = ctxs
    .map(
      (c, i) =>
        `[#${i + 1}] ${c.title ?? c.source_url}\n${c.content_md}`.trim()
    )
    .join("\n\n");

  const user =
    (lang === "es" ? "Pregunta" : "Question") +
    `: ${q}\n\nContexto:\n${blocks}\n\nFormato: párrafo breve + lista de citas [#].`;

  return { system, user };
}

/* ---------------- Handler ---------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const q: string = body.q;
    const collection: string = body.collection;
    const k: number = Number(body.k ?? TOP_K_DEFAULT);
    const lang: "es" | "en" = body.lang === "en" ? "en" : "es";

    if (!q || !collection) {
      return new Response(
        JSON.stringify({ ok: false, error: "Faltan q y collection" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const sb = supabaseAdmin();

    // 1) ID de la colección
    const { data: col, error: eCol } = await sb
      .from("collections")
      .select("id")
      .eq("slug", collection)
      .single();
    if (eCol || !col) {
      return new Response(
        JSON.stringify({ ok: false, error: "Colección no existe" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    // 2) Embedding de la pregunta
    const qEmb = await embed(q);

    // 3) Recuperación top-k
    const { data: rows, error: eRpc } = await sb.rpc("match_chunks", {
      query_embedding: qEmb as unknown as number[],
      match_count: k,
      collection_uuid: col.id,
    });
    if (eRpc) throw eRpc;

    const ctxs: Row[] = (rows ?? []) as any;

    // 4) Guardrails: similitud mínima + keyword hit
    const noAnswerMsg = lang === "es" ? NO_ANSWER_ES : NO_ANSWER_EN;

    // Ordenados por similitud desde el RPC; tomamos el top1 para el umbral
    const top1Sim = ctxs[0]?.similarity ?? 0;
    const keywordOK = hasKeywordHit(ctxs, q);

    if (!ctxs.length || top1Sim < MIN_SIM || !keywordOK) {
      return new Response(
        JSON.stringify({
          ok: true,
          answer: noAnswerMsg,
          citations: [],
          retrieved: ctxs.length,
          debug: { top1: top1Sim, threshold: MIN_SIM, keywordOK },
        }),
        { headers: { "content-type": "application/json" } }
      );
    }

    // 5) Construcción de prompt y llamada a OpenAI
    const { system, user } = buildPrompt(q, ctxs, lang);
    const chat = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: Number(process.env.RAG_MAX_TOKENS ?? 800),
    });

    const answer = chat.choices[0]?.message?.content?.trim() || "";

    // 6) Citas deduplicadas
    const citations = buildCitations(ctxs);

    return new Response(
      JSON.stringify({ ok: true, answer, citations }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    console.error("ASK ERROR:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err?.message || err) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
