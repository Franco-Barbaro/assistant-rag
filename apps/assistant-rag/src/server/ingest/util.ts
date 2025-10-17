import Turndown from "turndown";
import { JSDOM } from "jsdom";

export async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return await res.text();
}

export function htmlToMarkdown(html: string) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  doc.querySelectorAll("script, style, noscript, iframe, nav, footer, header, form").forEach((el: Element) => el.remove());
  const t = new Turndown({ codeBlockStyle: "fenced" });
  return t.turndown(doc.body?.innerHTML || "");
}

/** Chunking por párrafos con solapamiento por líneas (robusto si no hay headings) */
export function chunkMarkdown(md: string, targetTokens = 1000, overlapLines = 50) {
  const paras = md.split(/\n{2,}/);
  const chunks: string[] = [];
  let buf: string[] = [];
  let tokens = 0;
  const est = (s: string) => Math.ceil(s.length / 4);

  for (const p of paras) {
    const t = est(p);
    if (tokens + t > targetTokens && buf.length) {
      const chunk = buf.join("\n\n");
      chunks.push(chunk);
      const tail = chunk.split(/\n/).slice(-overlapLines).join("\n");
      buf = [tail, p];
      tokens = est(tail) + t;
    } else {
      buf.push(p);
      tokens += t;
    }
  }
  if (buf.length) chunks.push(buf.join("\n\n"));
  if (!chunks.length && md.trim().length) chunks.push(md.slice(0, Math.min(md.length, targetTokens * 4)));
  return chunks;
}
