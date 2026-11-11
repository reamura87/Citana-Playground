// Vercel Function: jembatan aman antara browser dan penyedia AI.
// Kunci API hanya ada di variabel lingkungan server, tidak pernah dikirim ke browser.
// Penyedia dicoba berurutan sesuai ASISTEN_PROVIDER (mis. "groq,cloudflare,anthropic"):
// bila satu penyedia kehabisan jatah atau error, otomatis pindah ke berikutnya.
import { createClient } from '@supabase/supabase-js'
import { buatSistem } from '../src/asisten/persona.js'
import { rapikan } from '../src/asisten/rapikan.js'
import { ubahAliran } from '../src/asisten/aliran.js'

const URL_SB = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const KUNCI_SB =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const SISTEM = buatSistem()

// Penyedia bawaan. Model bisa diganti lewat variabel lingkungan (cek daftar model terbaru di konsol masing-masing).
const PRESET = {
  anthropic: () =>
    process.env.ANTHROPIC_API_KEY && {
      nama: 'anthropic',
      jenis: 'anthropic',
      url: 'https://api.anthropic.com/v1/messages',
      kunci: process.env.ANTHROPIC_API_KEY,
      model: process.env.ASISTEN_MODEL || 'claude-haiku-5-5',
    },
  groq: () =>
    process.env.GROQ_API_KEY && {
      nama: 'groq',
      jenis: 'openai',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      kunci: process.env.GROQ_API_KEY,
      model: process.env.ASISTEN_MODEL_GROQ || 'qwen/qwen3.8-27b',
    },
  cloudflare: () =>
    process.env.CLOUDFLARE_API_TOKEN &&
    process.env.CLOUDFLARE_ACCOUNT_ID && {
      nama: 'cloudflare',
      jenis: 'openai',
      url: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
      kunci: process.env.CLOUDFLARE_API_TOKEN,
      model: process.env.ASISTEN_MODEL_CLOUDFLARE || '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    },
  // Penyedia lain yang kompatibel dengan format OpenAI (Qwen/DashScope, OpenRouter, dan sebagainya)
  umum: () =>
    process.env.ASISTEN_API_URL &&
    process.env.ASISTEN_API_KEY &&
    process.env.ASISTEN_MODEL_UMUM && {
      nama: 'umum',
      jenis: 'openai',
      url: process.env.ASISTEN_API_URL,
      kunci: process.env.ASISTEN_API_KEY,
      model: process.env.ASISTEN_MODEL_UMUM,
    },
}

function daftarPenyedia() {
  const nama = (process.env.ASISTEN_PROVIDER || 'anthropic').split(',').map((s) => s.trim().toLowerCase())
  return nama.map((n) => PRESET[n]?.()).filter(Boolean)
}

// Parameter tambahan untuk penyedia berformat OpenAI, mis. {"reasoning_effort":"none"} bila model menalar
function parameterEkstra() {
  try {
    return process.env.ASISTEN_EKSTRA ? JSON.parse(process.env.ASISTEN_EKSTRA) : {}
  } catch {
    return {}
  }
}

async function panggil(p, pesan) {
  const anthropic = p.jenis === 'anthropic'
  const headers = anthropic
    ? { 'content-type': 'application/json', 'x-api-key': p.kunci, 'anthropic-version': '2023-06-01' }
    : { 'content-type': 'application/json', authorization: `Bearer ${p.kunci}` }
  const badan = anthropic
    ? { model: p.model, max_tokens: 350, temperature: 0.8, system: SISTEM, messages: pesan, stream: true }
    : {
        model: p.model,
        max_tokens: 350,
        temperature: 0.8,
        stream: true,
        messages: [{ role: 'system', content: SISTEM }, ...pesan],
        ...parameterEkstra(),
      }
  try {
    const res = await fetch(p.url, { method: 'POST', headers, body: JSON.stringify(badan), signal: AbortSignal.timeout(25000) })
    if (!res.ok || !res.body) {
      console.error(`Penyedia ${p.nama} membalas status`, res.status)
      return null
    }
    return res
  } catch (err) {
    console.error(`Gagal menghubungi ${p.nama}:`, err?.name)
    return null
  }
}

function json(status, pesan) {
  return new Response(JSON.stringify({ pesan }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function POST(request) {
  const penyedia = daftarPenyedia()
  if (penyedia.length === 0 || !URL_SB || !KUNCI_SB) {
    console.error('Konfigurasi asisten belum lengkap (penyedia AI, SUPABASE_URL, kunci publik Supabase)')
    return json(503, 'Asisten belum siap. Coba lagi nanti.')
  }

  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json(401, 'Masuk dulu ya supaya bisa ngobrol denganku.')

  let badan
  try {
    badan = await request.json()
  } catch {
    return json(400, 'Permintaan tidak valid.')
  }
  const pesan = rapikan(badan?.pesan)
  if (!pesan) return json(400, 'Pesannya kosong atau tidak valid.')

  // Memverifikasi login sekaligus menghitung kuota, memakai token milik pengguna (tanpa service role)
  const sb = createClient(URL_SB, KUNCI_SB, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: hitung, error } = await sb.rpc('asisten_hitung')
  if (error) {
    const m = error.message ?? ''
    if (/habis/i.test(m)) return json(429, 'Jatah obrolanmu hari ini sudah habis. Lanjut besok ya!')
    if (/istirahat/i.test(m)) return json(503, 'Aku sedang istirahat dulu. Coba lagi nanti ya.')
    return json(401, 'Sesi login tidak valid. Coba masuk lagi.')
  }

  for (const p of penyedia) {
    const hulu = await panggil(p, pesan)
    if (!hulu) continue
    const sisa = Math.max(0, (hitung?.batas ?? 0) - (hitung?.terpakai ?? 0))
    return new Response(ubahAliran(hulu.body, p.jenis), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
        'X-Asisten-Sisa': String(sisa),
        'X-Asisten-Penyedia': p.nama,
      },
    })
  }

  // Semua penyedia gagal (misalnya jatah gratis hari ini habis): kembalikan jatah pengguna
  await sb.rpc('asisten_kembalikan')
  return json(503, 'Aku sedang istirahat dulu karena jatah harianku habis. Coba lagi nanti atau besok ya.')
}
