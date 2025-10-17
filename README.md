# 🤖 Assistant RAG – Web Knowledge Assistant (Next.js + Supabase + OpenAI)

Un asistente IA con **RAG (Retrieval-Augmented Generation)** capaz de **leer contenido web**, convertirlo en conocimiento estructurado y responder preguntas con **citas verificables**.  
Ideal para **documentación técnica**, **portfolios inteligentes** o **asistentes internos**.

---

## 🛡️ Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=nextdotjs)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=000)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-0EA5E9?style=for-the-badge&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)

---

## 🚀 Características principales

| Función | Descripción |
|---------|-------------|
| 🔍 **Ingesta Web** | Convierte páginas HTML → Markdown → Chunks semánticos |
| 🧠 **Vector DB (RAG)** | Búsqueda semántica con Supabase + pgvector |
| 💬 **Respuestas con citas** | Referencias claras con fuentes `[ # ]` |
| 🛑 **Anti-alucinación** | Si no hay evidencia → *"No tengo evidencia suficiente…"*
| ⚙️ **API Ready** | Endpoints: `/api/ingest`, `/api/ask`, `/api/ping` |
| 🎨 **UI lista** | Next.js + Tailwind, lista para personalizar |

---

## 🧱 Arquitectura del Proyecto (Monorepo-ready)

apps/assistant-rag
├─ src/app/api/ingest/route.ts # Ingesta: URL → Embeddings
├─ src/app/api/ask/route.ts # RAG: Recupera contexto + Chat
├─ src/server/ai.ts # Cliente OpenAI (chat + embed)
├─ src/server/supabase.ts # Cliente Supabase
├─ src/server/ingest/utils.ts # Limpieza, Turndown, chunkMarkdown
└─ src/app/page.tsx # UI principal (Home)

yaml
Copiar código

---

## 🛠️ Requisitos Previos

- **Node.js 18+**
- **pnpm**
- **Cuenta Supabase** con extensión `pgvector`
- **OpenAI API Key**

---

## ⚙️ Variables de entorno (`apps/assistant-rag/.env.local`)

```env
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
🧪 Cómo usar la API
1️⃣ Ingestar una URL
bash
Copiar código
POST /api/ingest
{
  "collection": "demo",
  "inputs": ["https://developer.mozilla.org/en-US/docs/Web/HTTP/Status"]
}
2️⃣ Realizar una Pregunta (RAG)
bash
Copiar código
POST /api/ask
{
  "collection": "demo",
  "q": "¿Qué es un HTTP 404?",
  "lang": "es"
}
🖥️ Instalación Local
bash
Copiar código
pnpm install
pnpm dev  # Inicia en localhost:3010 o 3000
🚀 Despliegue en Vercel
bash
Copiar código
vercel
vercel --prod
🧭 Roadmap / Mejoras Futuras
 Autenticación con Supabase Auth

 Panel de Colecciones / Dashboard

 UI estilo ChatGPT con historial

 Soporte múltiples idiomas

👨‍💻 Autor
Franco Bárbaro
📍 Developer & AI Enthusiast
🔗 GitHub: @Franco-Barbaro
