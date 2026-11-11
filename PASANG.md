# Asisten AI "Lumi" untuk Citana Playground

Ekstrak isi folder ini ke root proyekmu (folder yang berisi package.json). Struktur:

  api/asisten.js                  fungsi server (Vercel Function)
  src/asisten/*                   karakter, widget, logika reaksi, system prompt
  src/lib/asisten.js              klien API
  sql/asisten.sql                 tabel kuota (jalankan di Supabase SQL Editor)

Langkah:
1. Jalankan sql/asisten.sql di Supabase SQL Editor.
2. Vercel > Settings > Environment Variables. Pilih penyedia AI dengan ASISTEN_PROVIDER (daftar berurutan,
   dipisah koma; bila satu kehabisan jatah, otomatis pindah ke berikutnya):

     ASISTEN_PROVIDER=groq,cloudflare          # 100% gratis (rekomendasi awal)
     ASISTEN_PROVIDER=groq,cloudflare,anthropic  # gratis dulu, berbayar hanya sebagai cadangan terakhir

   Kunci per penyedia (hanya yang dipakai; JANGAN berawalan VITE_):
     GROQ_API_KEY            console.groq.com   (model bawaan: qwen/qwen3.8-27b, ganti dengan ASISTEN_MODEL_GROQ)
     CLOUDFLARE_API_TOKEN    + CLOUDFLARE_ACCOUNT_ID   (model bawaan: @cf/meta/llama-3.3-70b-instruct-fp8-fast,
                             ganti dengan ASISTEN_MODEL_CLOUDFLARE)
     ANTHROPIC_API_KEY       console.anthropic.com (model bawaan: claude-haiku-5-5, ganti dengan ASISTEN_MODEL)
     Penyedia OpenAI-compatible lain (Qwen/DashScope, OpenRouter, ...): ASISTEN_PROVIDER=umum, lalu isi
       ASISTEN_API_URL (alamat lengkap .../chat/completions), ASISTEN_API_KEY, ASISTEN_MODEL_UMUM
   Opsional: ASISTEN_EKSTRA='{"reasoning_effort":"none"}'  parameter tambahan bila modelnya model penalaran.
   Fungsi juga membaca SUPABASE_URL / SUPABASE_ANON_KEY, atau VITE_SUPABASE_* yang sudah ada.
   Cek nama model di konsol masing-masing; daftar model gratis sering berubah.
   Setelah memilih penyedia gratis, sesuaikan batas harian di SQL, misalnya:
     update game_config set nilai = '80' where kunci = 'asisten_batas_global';
3. vercel.json: ganti rewrite SPA agar tidak menelan /api, dan beri batas waktu:
     "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
     "functions": { "api/asisten.js": { "maxDuration": 30 } }
4. App.jsx, di dalam <BrowserRouter> (bersama Header/Footer), tambahkan:
     import { lazy, Suspense } from 'react'
     const AsistenWidget = lazy(() => import('./asisten/AsistenWidget'))
     ...
     <Suspense fallback={null}><AsistenWidget /></Suspense>
5. Sesuaikan path di src/asisten/halaman.js dengan Route di App.jsx.
6. Pengembangan lokal: "npm run dev" tidak menjalankan folder api. Tambahkan proxy di vite.config.js
   agar memakai fungsi yang sudah di-deploy:
     server: { proxy: { '/api': { target: 'https://DOMAINMU.vercel.app', changeOrigin: true } } }
   (atau jalankan "npx vercel dev").
