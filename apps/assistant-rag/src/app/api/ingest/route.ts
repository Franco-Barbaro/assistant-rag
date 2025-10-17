import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/server/supabase";
import { fetchHtml, htmlToMarkdown, chunkMarkdown } from "@/server/ingest/utils";
import { embed } from "@/server/ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { collection, inputs } = await req.json();
    if (!collection || !Array.isArray(inputs) || inputs.length === 0) {
      return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
    }

    const sb = supabaseAdmin();

    // upsert colección
    const { data: col, error: eCol } = await sb
      .from("collections")
      .upsert({ slug: collection, name: collection }, { onConflict: "slug" })
      .select("id")
      .single();
    if (eCol || !col) throw eCol || new Error("No se pudo crear/leer colección");

    const collection_id = col.id as string;
    let indexed = 0;
    const debug: Array<{ url: string; htmlLen: number; mdLen: number; chunks: number }> = [];

    for (const url of inputs) {
      const html = await fetchHtml(url);
      const md = htmlToMarkdown(html);
      const parts = chunkMarkdown(md);
      debug.push({ url, htmlLen: html.length, mdLen: md.length, chunks: parts.length });

      if (!parts.length) continue;

      const title = (md.match(/^#\s+(.+)/)?.[1]) || url;
      const checksum = crypto.createHash("sha1").update(md).digest("hex");

      const { data: doc, error: eDoc } = await sb
        .from("documents")
        .upsert(
          { collection_id, source_url: url, title, lang: "es", content_md: md, checksum },
          { onConflict: "collection_id,source_url" }
        )
        .select("id")
        .single();
      if (eDoc || !doc) throw eDoc || new Error("No se pudo upsert documento");

      // limpia previos
      await sb.from("chunks").delete().eq("document_id", doc.id);

      // inserta chunks
      const rows = parts.map((content_md, i) => ({
        document_id: doc.id,
        content_md,
        token_count: Math.ceil(content_md.length / 4),
        position: i,
      }));
      const { data: inserted, error: eIns } = await sb.from("chunks").insert(rows).select("id,content_md");
      if (eIns || !inserted) throw eIns || new Error("No se insertaron chunks");

      // embeddings
      const vecs = await Promise.all(inserted.map(r => embed(r.content_md)));
      const embRows = inserted.map((r, i) => ({ chunk_id: r.id, embedding: vecs[i] as unknown as number[] }));
      const { error: eEmb } = await sb.from("chunk_embeddings").upsert(embRows);
      if (eEmb) throw eEmb;

      indexed += parts.length;
    }

    return NextResponse.json({ ok: true, indexed, debug });
  } catch (e: any) {
    console.error("INGEST ERROR:", e);
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
