"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw, Link as LinkIcon, MessageSquare, Database } from "lucide-react";

interface IngestResult {
  ok: boolean;
  indexed?: number;
  debug?: Array<{ url: string; htmlLen: number; mdLen: number; chunks: number }>;
  error?: string;
}

interface AskCitation { n: number; title?: string; url: string; similarity?: number }
interface AskResult {
  ok: boolean;
  answer?: string;
  citations?: AskCitation[];
  error?: string;
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-glass ${className}`}>{children}</div>
);

const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-medium text-white shadow-sm transition active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 ${props.className ?? ""}`}
  >
    {children}
  </button>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-fuchsia-400/60 ${props.className ?? ""}`}
  />
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1 block text-sm font-medium text-white/80">{children}</label>
);

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-white/10 p-2 text-white/90"><Icon size={18} /></div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
      </div>
    </div>
  );
}

function Citations({ items }: { items?: AskCitation[] }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2">
      {items.map((c) => (
        <li key={c.n} className="flex items-center gap-2 text-sm text-white/80">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold">#{c.n}</span>
          <a href={c.url} target="_blank" className="underline decoration-fuchsia-400/60 decoration-2 underline-offset-4 hover:text-white">
            {c.title || c.url}
          </a>
          {typeof c.similarity === "number" && (
            <span className="text-white/50">· sim {c.similarity.toFixed(2)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function ProPage() {
  const [tab, setTab] = useState<"ingest" | "chat">("ingest");

  // ingest
  const [collection, setCollection] = useState("demo");
  const [url, setUrl] = useState("https://developer.mozilla.org/en-US/docs/Web/HTTP/Status");
  const [ingLoading, setIngLoading] = useState(false);
  const [ingResult, setIngResult] = useState<IngestResult | null>(null);

  // chat
  const [q, setQ] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<AskCitation[]>([]);

  const doIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngLoading(true);
    setIngResult(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collection, inputs: [url] }),
      });
      const json = (await res.json()) as IngestResult;
      setIngResult(json);
    } catch (err: any) {
      setIngResult({ ok: false, error: String(err) });
    } finally {
      setIngLoading(false);
    }
  };

  const doAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setChatLoading(true);
    setAnswer("");
    setCitations([]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q, collection, k: 8, lang: "es" }),
      });
      const json = (await res.json()) as AskResult;
      setAnswer(json.answer ?? "");
      setCitations(json.citations ?? []);
    } catch (err: any) {
      setAnswer(String(err));
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-ink via-ink-2 to-ink-3">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-8rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-[-8rem] top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"
        >
          <div>
            <h1 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              Assistant RAG — Demo Pro
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Ingesta contenido, pregunta con contexto y cita fuentes. Construido con Next.js, Tailwind y Framer Motion.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => window.location.reload()} className="bg-white/10 hover:bg-white/20 hover:from-white/10 hover:to-white/20">
              <RefreshCw size={16} /> Reiniciar sesión
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Card>
          <div className="flex items-center gap-2 border-b border-white/10 px-4 pt-2">
            {[
              { id: "ingest" as const, label: "Ingestar", Icon: Database },
              { id: "chat" as const, label: "Chat", Icon: MessageSquare },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative -mb-px inline-flex items-center gap-2 border-b px-4 py-3 text-sm transition ${
                  tab === id ? "border-fuchsia-400 text-white" : "border-transparent text-white/70 hover:text-white"
                }`}
              >
                <Icon size={16} /> {label}
                {tab === id && (
                  <motion.span layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-fuchsia-400 to-indigo-400" />
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            <AnimatePresence mode="wait">
              {tab === "ingest" ? (
                <motion.div
                  key="ingest"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-6 md:grid-cols-2"
                >
                  <div className="space-y-4">
                    <SectionTitle icon={Database} title="Ingestar URL" subtitle="Convierte HTML a chunks con embeddings" />
                    <form onSubmit={doIngest} className="space-y-4">
                      <div>
                        <Label>Colección</Label>
                        <Input value={collection} onChange={(e) => setCollection(e.target.value)} placeholder="demo" />
                      </div>
                      <div>
                        <Label>URL</Label>
                        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button disabled={ingLoading} type="submit">
                          {ingLoading && <Loader2 className="animate-spin" size={16} />} Ingestar
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle icon={LinkIcon} title="Resultado" subtitle="Estado y métricas rápidas" />
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      {!ingResult && <p className="text-sm text-white/60">Envía una URL para ver el resultado…</p>}
                      {ingResult && (
                        <div className="space-y-2 text-sm">
                          <p className={`font-medium ${ingResult.ok ? "text-emerald-300" : "text-rose-300"}`}>
                            {ingResult.ok ? "Éxito" : "Error"}
                          </p>
                          {typeof ingResult.indexed === "number" && (
                            <p className="text-white/80">Chunks indexados: <span className="font-semibold">{ingResult.indexed}</span></p>
                          )}
                          {ingResult.error && <p className="text-rose-300">{ingResult.error}</p>}
                          {ingResult.debug && (
                            <div className="mt-2">
                              <p className="text-white/70">Debug:</p>
                              <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed text-white/80">
                                {JSON.stringify(ingResult.debug, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-6 md:grid-cols-2"
                >
                  <div className="space-y-4">
                    <SectionTitle icon={MessageSquare} title="Pregunta al corpus" subtitle="RAG con citas" />
                    <form onSubmit={doAsk} className="space-y-4">
                      <div>
                        <Label>Colección</Label>
                        <Input value={collection} onChange={(e) => setCollection(e.target.value)} />
                      </div>
                      <div>
                        <Label>Pregunta</Label>
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Qué es un HTTP 404?" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button disabled={chatLoading || !q} type="submit">
                          {chatLoading && <Loader2 className="animate-spin" size={16} />} Preguntar
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle icon={MessageSquare} title="Respuesta" subtitle="Con fuentes y similitud" />
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      {!answer && <p className="text-sm text-white/60">Escribe tu pregunta y envíala…</p>}
                      {answer && (
                        <div className="space-y-3">
                          <p className="whitespace-pre-wrap text-white/90">{answer}</p>
                          <Citations items={citations} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-between text-xs text-white/50">
          <span>© {new Date().getFullYear()} Assistant RAG</span>
          <span>Next.js · Tailwind · Framer Motion</span>
        </div>
      </div>
    </div>
  );
}
