# Assistant RAG — Web Knowledge Assistant (Next.js + Supabase + OpenAI)

Un asistente IA con **RAG (Retrieval-Augmented Generation)** capaz de leer contenido web, dividirlo en fragmentos, generar embeddings y responder preguntas con **citas verificables**. Ideal para documentación técnica, portfolios inteligentes o asistentes internos.

---

## 🚀 Características principales

| Función | Descripción |
|---------|-------------|
| 🔍 Ingesta Web | Convierte HTML a Markdown automáticamente y lo trocea en chunks |
| 🧠 Embeddings + Vector DB | Usa Supabase + pgvector para búsqueda semántica |
| 💬 Respuestas con citas | Recupera contexto y cita fuentes `[ # ]` |
| 🛑 No alucina | Si no hay evidencia → **"No tengo evidencia suficiente…"** |
| ⚙️ API Ready | Endpoints: `/api/ingest`, `/api/ask`, `/api/ping` |
| 🎨 Frontend listo para UI | Construido en Next.js 15 + Tailwind (App Router) |

---

## 🧱 Estructura del proyecto (Monorepo-ready)

apps/assistant-rag
├─ src/app/api/ingest/route.ts # Ingesta: URL → HTML → Markdown → Chunks → Embeddings
├─ src/app/api/ask/route.ts # RAG: Recupera contexto + OpenAI Chat
├─ src/server/ai.ts # Cliente OpenAI + embed()
├─ src/server/supabase.ts # Cliente Supabase (Service Role)
├─ src/server/ingest/utils.ts # Limpieza DOM + Turndown + chunkMarkdown
└─ src/app/page.tsx # UI básica (Home)

yaml
Copiar código

---

## 🛠️ Requisitos

- Node.js 18+
- pnpm
- Cuenta Supabase (con extensión `pgvector`)
- OpenAI API Key

---

## ⚙️ Variables de entorno (`apps/assistant-rag/.env.local`)

OPENAI_API_KEY=
OPENAI_EMBED_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE=

RAG_MAX_TOKENS=800
RAG_TOP_K=8
RAG_MIN_SIM=0.58
ALLOWED_DOMAINS=localhost

yaml
Copiar código

---

## 🔬 Pruebas API

### Ingesta (ejemplo MDN)
```bash
POST /api/ingest
{
  "collection": "demo",
  "inputs": ["https://developer.mozilla.org/en-US/docs/Web/HTTP/Status"]
}
Preguntar
bash
Copiar código
POST /api/ask
{
  "collection": "demo",
  "q": "¿Qué es un HTTP 404?",
  "lang": "es"
}
Creado con IA, Next.js y pasión por la ingeniería.
Hecho por @Franco Barbaro 👨‍💻
