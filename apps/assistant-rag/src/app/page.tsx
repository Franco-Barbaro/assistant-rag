"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  RefreshCw,
  Link as LinkIcon,
  MessageSquare,
  Database,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/* ---------------- Types --------------- */
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

/* ---------------- UI PRIMITIVES --------------- */
const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-7xl px-6 md:px-8">{children}</div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md shadow-glass ${className}`}>
    {children}
  </div>
);

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`py-6 md:py-10 ${className}`}>{children}</section>
);

const Button = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const Primary = (p: any) => (
  <Button
    {...p}
    className={
      "bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 " +
      (p.className ?? "")
    }
  />
);
const Ghost = (p: any) => (
  <Button {...p} className={"bg-white/10 hover:bg-white/15 border border-white/10 " + (p.className ?? "")} />
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
          <a
            href={c.url}
            target="_blank"
            className="underline decoration-fuchsia-400/60 decoration-2 underline-offset-4 hover:text-white"
          >
            {c.title || c.url}
          </a>
          {typeof c.similarity === "number" && <span className="text-white/50">· {c.similarity.toFixed(2)}</span>}
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Toasts (ligeros) --------------- */
type ToastVariant = "success" | "error" | "info";
type Toast = { id: number; title: string; desc?: string; variant?: ToastVariant };
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);
  const push = (t: Omit<Toast, "id">) => {
    const nt = { id: idRef.current++, ...t };
    setToasts((xs) => [...xs, nt]);
    setTimeout(() => dismiss(nt.id), 3500);
  };
  const dismiss = (id: number) => setToasts((xs) => xs.filter((t) => t.id !== id));
  return { toasts, push, dismiss };
}
function ToastViewport({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  const color = (v?: ToastVariant) =>
    v === "success" ? "from-emerald-500/30 to-emerald-600/20 border-emerald-400/30"
    : v === "error" ? "from-rose-500/30 to-rose-600/20 border-rose-400/30"
    : "from-indigo-500/30 to-fuchsia-600/20 border-white/15";
  const Icon = (v?: ToastVariant) => v === "success" ? CheckCircle2 : v === "error" ? XCircle : MessageSquare;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[min(92vw,380px)] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => {
          const Ico = Icon(t.variant);
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10, scale: .98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: .98 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto rounded-xl border bg-gradient-to-br p-4 text-white shadow-lg backdrop-blur-md ${color(t.variant)}`}
            >
              <div className="flex items-start gap-3">
                <Ico size={18} className="mt-0.5" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{t.title}</div>
                  {t.desc && <div className="mt-1 text-xs text-white/80">{t.desc}</div>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="ml-auto rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Barra de progreso --------------- */
function Progress({ value }: { value: number | null }) {
  if (value === null) return null;
  return (
    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 transition-[width] duration-300 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ---------------- ABOUT --------------- */
function AboutSection() {
  return (
    <Section>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "¿Qué es esto?",
            body: (
              <p className="text-sm text-white/80">
                Un asistente <b>RAG</b> para consultar contenido de webs o documentos que ingestas.
                Responde con evidencia y <b>cita fuentes verificables</b>.
              </p>
            ),
          },
          {
            title: "¿Cómo funciona?",
            body: (
              <ol className="list-decimal space-y-1 pl-5 text-sm text-white/80">
                <li><b>Ingesta</b>: HTML/PDF → Markdown.</li>
                <li><b>Chunking</b>: trozos con solapamiento.</li>
                <li><b>Embeddings</b>: vectores (pgvector).</li>
                <li><b>RAG</b>: retrieve + generación con <b>citas</b>.</li>
              </ol>
            ),
          },
          {
            title: "Privacidad y límites",
            body: (
              <ul className="space-y-1 text-sm text-white/80">
                <li>• Solo envío lo necesario.</li>
                <li>• Puede decir “sin evidencia suficiente”.</li>
                <li>• Verifica fuentes; no es consejo legal/médico.</li>
              </ul>
            ),
          },
        ].map((b, i) => (
          <Card key={i} className="p-6 h-full">
            <h3 className="text-lg font-semibold text-white">{b.title}</h3>
            <div className="mt-3">{b.body}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6 bg-gradient-to-r from-fuchsia-500/10 to-indigo-500/10">
        <h4 className="text-xl font-semibold text-white">Cómo probar en 30 segundos</h4>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-white/80">
          <li>En “Ingestar”, pega una URL (MDN HTTP Status).</li>
          <li>Pulsa <b>Ingestar</b> y espera a ver <i>chunks indexados</i>.</li>
          <li>Ve a “Chat” y pregunta “¿Qué es un HTTP 404?”.</li>
          <li>Revisa las <b>citas</b> con enlaces.</li>
        </ol>
      </Card>
    </Section>
  );
}

/* ---------------- PAGE --------------- */
export default function ProPage() {
  const [tab, setTab] = useState<"ingest" | "chat">("ingest");

  // ingest
  const [collection, setCollection] = useState("demo");
  const [url, setUrl] = useState("https://developer.mozilla.org/en-US/docs/Web/HTTP/Status");
  const [ingLoading, setIngLoading] = useState(false);
  const [ingResult, setIngResult] = useState<IngestResult | null>(null);
  const [ingProgress, setIngProgress] = useState<number | null>(null);
  const progTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // chat
  const [q, setQ] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<AskCitation[]>([]);

  // toasts
  const { toasts, push, dismiss } = useToasts();

  useEffect(() => () => { if (progTimer.current) clearInterval(progTimer.current); }, []);

  const startProgress = () => {
    setIngProgress(6);
    progTimer.current = setInterval(() => {
      setIngProgress((v) => {
        if (v === null) return 8;
        // sube rápido al principio y se frena cerca de 85%
        const next = v < 60 ? v + 8 : v < 85 ? v + 3 : 85;
        return next;
      });
    }, 300);
  };
  const endProgress = (ok: boolean) => {
    if (progTimer.current) clearInterval(progTimer.current);
    setIngProgress((v) => Math.max(v ?? 0, 100));
    setTimeout(() => setIngProgress(null), 500);
    push({
      variant: ok ? "success" : "error",
      title: ok ? "Ingesta completada" : "Ingesta fallida",
      desc: ok ? "El contenido se indexó correctamente." : "Revisa la URL o los logs del servidor.",
    });
  };

  const doIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngLoading(true); setIngResult(null);
    startProgress();
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collection, inputs: [url] }),
      });
      const json = (await res.json()) as IngestResult;
      setIngResult(json);
      endProgress(!!json.ok);
    } catch (err: any) {
      setIngResult({ ok: false, error: String(err) });
      endProgress(false);
    } finally {
      setIngLoading(false);
    }
  };

  const doAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setChatLoading(true); setAnswer(""); setCitations([]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ q, collection, k: 8, lang: "es" }),
      });
      const json = (await res.json()) as AskResult;
      setAnswer(json.answer ?? ""); setCitations(json.citations ?? []);
      push({
        variant: json.ok ? "success" : "error",
        title: json.ok ? "Respuesta generada" : "Error al preguntar",
        desc: json.ok ? "He incluido citas a las fuentes." : (json.error || "Intenta de nuevo."),
      });
    } catch (err: any) {
      setAnswer(String(err));
      push({ variant: "error", title: "Error de red", desc: String(err) });
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-[#0b0f1a] via-[#0f1224] to-[#120f1f]">
      {/* glows intensos (como antes) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute right-[-10rem] top-32 h-[32rem] w-[32rem] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute left-[-12rem] bottom-[-6rem] h-[28rem] w-[28rem] rounded-full bg-purple-600/20 blur-3xl" />
      </div>

      <Container>
        {/* HEADER */}
        <Section className="pb-0">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <h1 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                Assistant RAG — Demo Pro
              </h1>
              <p className="max-w-2xl text-sm text-white/70">
                Ingesta contenido, pregunta con contexto y cita fuentes. Construido con Next.js, Tailwind y Framer Motion.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Ghost onClick={() => window.location.reload()}>
                <RefreshCw size={16} /> Reiniciar sesión
              </Ghost>
            </div>
          </div>
        </Section>

        {/* ABOUT */}
        <AboutSection />

        {/* TABS + CONTENT */}
        <Section className="pt-0">
          <Card>
            {/* Tabs header */}
            <div className="flex items-center gap-2 border-b border-white/10 px-4 pt-2">
              {[
                { id: "ingest" as const, label: "Ingestar", Icon: Database },
                { id: "chat" as const, label: "Chat", Icon: MessageSquare },
              ].map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`relative -mb-px inline-flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm transition ${
                      active ? "border-b-2 border-fuchsia-400 text-white" : "text-white/70 hover:text-white"
                    }`}
                    aria-pressed={active}
                  >
                    <Icon size={16} /> {label}
                  </button>
                );
              })}
            </div>

            {/* Tabs content */}
            <div className="p-6">
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
                    <Card className="p-6">
                      <SectionTitle icon={Database} title="Ingestar URL" subtitle="Convierte HTML a chunks con embeddings" />
                      <form onSubmit={doIngest} className="mt-4 space-y-4">
                        <div>
                          <Label>Colección</Label>
                          <Input value={collection} onChange={(e) => setCollection(e.target.value)} placeholder="demo" />
                        </div>
                        <div>
                          <Label>URL</Label>
                          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                        </div>
                        <div className="flex items-center gap-2">
                          <Primary disabled={ingLoading} type="submit">
                            {ingLoading && <Loader2 className="animate-spin" size={16} />} Ingestar
                          </Primary>
                        </div>
                        <Progress value={ingProgress} />
                      </form>
                    </Card>

                    <Card className="p-6">
                      <SectionTitle icon={LinkIcon} title="Resultado" subtitle="Estado y métricas rápidas" />
                      <div className="mt-4">
                        {!ingResult && <p className="text-sm text-white/60">Envía una URL para ver el resultado…</p>}
                        {ingResult && (
                          <div className="space-y-2 text-sm">
                            <p className={`font-medium ${ingResult.ok ? "text-emerald-300" : "text-rose-300"}`}>
                              {ingResult.ok ? "Éxito" : "Error"}
                            </p>
                            {typeof ingResult.indexed === "number" && (
                              <p className="text-white/80">
                                Chunks indexados: <span className="font-semibold">{ingResult.indexed}</span>
                              </p>
                            )}
                            {ingResult.error && <p className="text-rose-300">{ingResult.error}</p>}
                            {ingResult.debug && (
                              <div className="mt-2">
                                <p className="text-white/70">Debug:</p>
                                <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-black/30 p-3 text-[11px] leading-relaxed text-white/80">
                                  {JSON.stringify(ingResult.debug, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
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
                    <Card className="p-6">
                      <SectionTitle icon={MessageSquare} title="Pregunta al corpus" subtitle="RAG con citas" />
                      <form onSubmit={doAsk} className="mt-4 space-y-4">
                        <div>
                          <Label>Colección</Label>
                          <Input value={collection} onChange={(e) => setCollection(e.target.value)} />
                        </div>
                        <div>
                          <Label>Pregunta</Label>
                          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Qué es un HTTP 404?" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Primary disabled={chatLoading || !q} type="submit">
                            {chatLoading && <Loader2 className="animate-spin" size={16} />} Preguntar
                          </Primary>
                        </div>
                      </form>
                    </Card>

                    <Card className="p-6">
                      <SectionTitle icon={MessageSquare} title="Respuesta" subtitle="Con fuentes y similitud" />
                      <div className="mt-4">
                        {!answer && <p className="text-sm text-white/60">Escribe tu pregunta y envíala…</p>}
                        {answer && (
                          <div className="space-y-3">
                            <p className="whitespace-pre-wrap text-white/90">{answer}</p>
                            <Citations items={citations} />
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </Section>

        {/* FOOTER */}
        <Section className="pt-4">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>© {new Date().getFullYear()} Assistant RAG</span>
            <span>Next.js · Tailwind · Framer Motion</span>
          </div>
        </Section>
      </Container>

      {/* TOASTS */}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
