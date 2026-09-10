# ExamFluent

**Ishonch bilan gapir, natija bilan tasdiqla.**

CEFR (A1–C2) va IELTS mantig'iga asoslangan AI ingliz tili platformasi.

---

## Mundarija

1. [Nima tayyor](#1-nima-tayyor)
2. [Loyiha strukturasi](#2-loyiha-strukturasi)
3. [Supabase sozlash](#3-supabase-sozlash-15-daqiqa)
4. [Gemini API kalitini olish](#4-gemini-api-kalitini-olish-3-daqiqa)
5. [.env.local faylini to'ldirish](#5-envlocal-faylini-toldirish)
6. [Ishga tushirish](#6-ishga-tushirish)
7. [Google orqali kirishni yoqish](#7-google-orqali-kirishni-yoqish-ixtiyoriy)
8. [Vercel'ga deploy qilish](#8-vercelga-deploy-qilish)
9. [Bepul limitlar](#9-bepul-limitlar--nimaga-etadi)
10. [Tez-tez uchraydigan xatolar](#10-tez-tez-uchraydigan-xatolar)

---

## 1. Nima tayyor

| Funksiya | Holat | Izoh |
|---|---|---|
| Ro'yxatdan o'tish / kirish | ✅ | Email + parol, Google (sozlash kerak) |
| CEFR daraja aniqlash testi | ✅ | 20 savol, **adaptiv**, 42 savolli baza |
| AI suhbatdosh | ✅ | Oqimli javob + xatolar tahlili |
| IELTS Reading | ✅ | AI matn yaratadi, server baholaydi |
| IELTS Listening | ✅ | Brauzer ovozi bilan o'qiladi |
| IELTS Writing | ✅ | 4 rasmiy mezon bo'yicha band score |
| Talaffuz mashqi | ✅ | Mikrofon + so'zma-so'z tahlil |
| So'z kartochkalari | ✅ | SM-2 intervalli takrorlash |
| Streak va progress | ✅ | Grafiklar, XP, ketma-ket kunlar |
| Interfeys tili | ✅ | O'zbek + Rus (+ ingliz zaxirada) |

---

## 2. Loyiha strukturasi

```
ExamFluent/
├── src/
│   ├── app/                          ← Sahifalar va API (Next.js App Router)
│   │   ├── page.tsx                  ← Landing sahifa
│   │   ├── layout.tsx                ← Umumiy ramka + til konteksti
│   │   ├── globals.css               ← Dizayn tizimi (tugma, karta, input)
│   │   │
│   │   ├── (auth)/                   ← Qavs = URL'ga ta'sir qilmaydi
│   │   │   ├── login/                ← /login
│   │   │   └── signup/               ← /signup
│   │   │
│   │   ├── (app)/                    ← Faqat kirgan foydalanuvchi uchun
│   │   │   ├── layout.tsx            ← Yon menyu (AppShell)
│   │   │   ├── dashboard/            ← Statistika va grafiklar
│   │   │   ├── placement/            ← Daraja aniqlash testi
│   │   │   ├── chat/                 ← AI suhbatdosh
│   │   │   ├── practice/[skill]/     ← IELTS mashqlari
│   │   │   ├── vocab/                ← So'z kartochkalari
│   │   │   ├── pronunciation/        ← Talaffuz
│   │   │   └── settings/             ← Sozlamalar
│   │   │
│   │   ├── auth/callback/            ← Google/email tasdiqlash qaytishi
│   │   └── api/                      ← Server funksiyalari
│   │       ├── chat/message/         ← Oqimli AI javob
│   │       ├── placement/next/       ← Adaptiv savol berish + baholash
│   │       ├── practice/generate/    ← Mashq yaratish
│   │       ├── practice/evaluate/    ← Band score qo'yish
│   │       ├── vocab/                ← Kartochka yaratish/takrorlash
│   │       ├── pronunciation/        ← Talaffuz natijasi
│   │       └── profile/              ← Sozlamalarni saqlash
│   │
│   ├── components/                   ← Qayta ishlatiladigan qismlar
│   │   ├── ui/                       ← Logo, LevelBadge, LanguageSwitcher
│   │   ├── layout/AppShell.tsx       ← Yon menyu va pastki panel
│   │   ├── auth/AuthForm.tsx
│   │   ├── placement/
│   │   ├── chat/
│   │   ├── practice/
│   │   ├── vocab/
│   │   ├── pronunciation/
│   │   └── settings/
│   │
│   ├── lib/                          ← "Miya" — mantiq shu yerda
│   │   ├── cefr.ts                   ← CEFR ↔ IELTS, AI til qoidalari
│   │   ├── gemini.ts                 ← AI bilan aloqa (stream + JSON)
│   │   ├── crypto.ts                 ← Javob kalitlarini shifrlash
│   │   ├── types.ts                  ← Baza jadvallarining turlari
│   │   ├── supabase/                 ← client / server ulanishlari
│   │   ├── i18n/                     ← Tarjimalar (uz / ru / en)
│   │   ├── prompts/                  ← AI ko'rsatmalari
│   │   ├── placement/                ← Savollar bazasi + adaptiv motor
│   │   ├── practice/                 ← Umumiy turlar
│   │   ├── vocab/sm2.ts              ← Intervalli takrorlash algoritmi
│   │   ├── pronunciation/            ← Jumlalar + solishtirish
│   │   └── hooks/                    ← useSpeech, useSpeechRecognition
│   │
│   └── middleware.ts                 ← Sessiyani yangilash + sahifa qo'riqlash
│
├── supabase/schema.sql               ← BAZA SXEMASI (buni Supabase'da ishga tushirasiz)
├── .env.example                      ← Kalitlar namunasi
└── .env.local                        ← SIZNING kalitlaringiz (GitHub'ga tushmaydi)
```

---

## 3. Supabase sozlash (15 daqiqa)

Supabase — bu bepul PostgreSQL bazasi + ro'yxatdan o'tish tizimi.

### 3.1. Akkaunt va loyiha

1. [supabase.com](https://supabase.com) → **Start your project** → GitHub bilan kiring
2. **New project** bosing
3. To'ldiring:
   - **Name:** `examfluent`
   - **Database Password:** kuchli parol o'ylab toping va **saqlab qo'ying**
   - **Region:** `Central EU (Frankfurt)` — O'zbekistonga eng yaqini
   - **Plan:** Free
4. **Create new project** → 2 daqiqa kuting

### 3.2. Jadvallarni yaratish

1. Chap menyudan **SQL Editor** → **New query**
2. Loyihangizdagi `supabase/schema.sql` faylini oching
3. **Hammasini** nusxalab (Ctrl+A → Ctrl+C), SQL Editor'ga qo'ying
4. **Run** (yoki Ctrl+Enter)
5. `Success. No rows returned` chiqishi kerak

Tekshirish: **Table Editor** bo'limida 8 ta jadval ko'rinadi:
`profiles`, `placement_attempts`, `chat_sessions`, `chat_messages`,
`exercise_attempts`, `vocab_cards`, `pronunciation_attempts`, `daily_activity`

### 3.3. Kalitlarni olish

**Settings** (⚙️) → **API** bo'limida ikkita narsa kerak:

| Supabase'da nomi | `.env.local` dagi nomi |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` kaliti | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

> ⚠️ **`service_role` kalitini OLMANG.** U bu loyihada kerak emas va uni oshkor qilish xavfli.

### 3.4. Email tasdiqlashni o'chirish (sinov uchun)

Sinash paytida har safar pochta tekshirish qiyin:

**Authentication** → **Sign In / Providers** → **Email** → **Confirm email** ni **o'chiring** → Save.

> Saytni odamlarga ochganingizda buni **qayta yoqing**.

---

## 4. Gemini API kalitini olish (3 daqiqa)

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) ga kiring
2. Google akkauntingiz bilan kiring
3. **Create API key** → **Create API key in new project**
4. Kalitni nusxalang (`AIza...` bilan boshlanadi)

> 💳 **Karta talab qilinmaydi.** Bepul tarif (Free tier) avtomatik yoqiladi.

---

## 5. `.env.local` faylini to'ldirish

Loyiha papkasidagi `.env.local` faylini oching va to'ldiring:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-3.6-flash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Bu fayl `.gitignore` da — u **hech qachon GitHub'ga tushmaydi**. Shunday bo'lishi kerak.

---

## 6. Ishga tushirish

```bash
npm run dev
```

Brauzerda oching: **http://localhost:3000**

Sinash tartibi:

1. **Ro'yxatdan o'tish** → email va parol kiriting
2. **Daraja testi** → 20 savol (bir zumda ishlaydi, AI kutilmaydi)
3. **Natija** → CEFR darajangiz + taxminiy IELTS band
4. **AI suhbat** → ingliz tilida yozing, javob harf-harf keladi
5. **IELTS mashq** → Reading yoki Writing sinab ko'ring

Foydali buyruqlar:

```bash
npm run dev        # ishlab chiqish serveri
npm run build      # production build (deploydan oldin tekshirish)
npm run typecheck  # TypeScript xatolarini tekshirish
```

---

## 7. Google orqali kirishni yoqish (ixtiyoriy)

Email bilan kirish allaqachon ishlaydi. Google qo'shish uchun:

### 7.1. Google Cloud'da

1. [console.cloud.google.com](https://console.cloud.google.com) → yangi loyiha yarating
2. **APIs & Services** → **OAuth consent screen** → **External** → to'ldiring
3. **Credentials** → **Create Credentials** → **OAuth client ID**
4. **Application type:** Web application
5. **Authorized redirect URIs** ga qo'shing:
   ```
   https://<SIZNING-PROJECT>.supabase.co/auth/v1/callback
   ```
   (aniq manzilni Supabase → Authentication → Providers → Google bo'limida ko'rasiz)
6. **Client ID** va **Client Secret** ni nusxalang

### 7.2. Supabase'da

**Authentication** → **Sign In / Providers** → **Google** → yoqing → Client ID va Secret'ni qo'ying → **Save**

### 7.3. Redirect manzillarini ruxsat etish

**Authentication** → **URL Configuration**:

- **Site URL:** `http://localhost:3000` (keyin Vercel manzilingizga o'zgartirasiz)
- **Redirect URLs** ga qo'shing:
  ```
  http://localhost:3000/auth/callback
  https://examfluent.vercel.app/auth/callback
  ```

---

## 8. Vercel'ga deploy qilish

### 8.1. GitHub'ga yuklash

1. [github.com/new](https://github.com/new) → repository nomi: `examfluent` → **Private** → Create
2. Terminalda (loyiha papkasida):

```bash
git init
git add .
git commit -m "ExamFluent MVP"
git branch -M main
git remote add origin https://github.com/FOYDALANUVCHI/examfluent.git
git push -u origin main
```

> `FOYDALANUVCHI` o'rniga GitHub username'ingizni yozing.

### 8.2. Vercel'da import qilish

1. [vercel.com](https://vercel.com) → GitHub bilan kiring
2. **Add New** → **Project** → `examfluent` repository'sini **Import**
3. Framework: **Next.js** (o'zi aniqlaydi) — hech narsani o'zgartirmang
4. **Environment Variables** bo'limini oching va **4 ta** o'zgaruvchini qo'shing:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon kaliti |
| `GEMINI_API_KEY` | Gemini kaliti |
| `NEXT_PUBLIC_SITE_URL` | `https://examfluent.vercel.app` |

5. **Deploy** → 2 daqiqa kuting

### 8.3. Deploydan keyin

Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://examfluent.vercel.app`
- **Redirect URLs** ga qo'shing: `https://examfluent.vercel.app/auth/callback`

Endi sayt tayyor. Har safar `git push` qilganingizda Vercel avtomatik yangilaydi.

> Vercel serveri **uxlab qolmaydi** — sayt doim tayyor turadi, hech qanday
> "keep-alive" hiylasi kerak emas.

### 8.4. Keyinchalik: o'z domeningiz

Domen (masalan `examfluent.uz`) sotib olganingizda:
Vercel → loyiha → **Settings** → **Domains** → domeningizni qo'shing va
ko'rsatilgan DNS yozuvlarini domen provayderingizda sozlang. 5 daqiqalik ish.

---

## 9. Bepul limitlar — nimaga yetadi

| Xizmat | Bepul limit | Taxminiy sig'im |
|---|---|---|
| **Vercel** | 100 GB trafik/oy | ~50 000 sahifa ochilishi |
| **Supabase** | 500 MB baza, 50 000 faol foydalanuvchi/oy | ~10 000 o'quvchi |
|  **Gemini 3.6 Flash** | ~1500 so'rov/kun | ~150 faol o'quvchi/kun |

**Limitni tejash uchun ataylab qilingan qarorlar:**

- Daraja testi savollari **statik** (42 ta savol baza ichida) — AI faqat oxirida bir marta chaqiriladi
- Reading/Listening javoblarini **server o'zi** baholaydi, AI emas
- Talaffuz solishtiruvi **brauzerda** bajariladi
- Talaffuz jumlalari statik ro'yxatdan olinadi
- Chatda suhbat tarixi oxirgi 12 xabar bilan cheklangan

> ⚠️ Limitga yaqinlashsangiz, `GEMINI_MODEL=gemini-flash-lite-latest` qilib qo'ying —
> limiti kattaroq. Hech narsa uchun pul to'lash **shart emas**.

---

## 10. Tez-tez uchraydigan xatolar

<details>
<summary><b>"Invalid API key" yoki kirish ishlamayapti</b></summary>

`.env.local` dagi Supabase kalitlarini tekshiring. O'zgartirgandan keyin
serverni **qayta ishga tushiring** (Ctrl+C → `npm run dev`) — Next.js env
o'zgaruvchilarini faqat start paytida o'qiydi.
</details>

<details>
<summary><b>Ro'yxatdan o'tdim, lekin dashboard bo'sh / xato</b></summary>

`schema.sql` ishga tushirilmagan bo'lishi mumkin. Supabase → Table Editor →
`profiles` jadvali bormi tekshiring. Bo'lmasa, 3.2-qadamni takrorlang.
</details>

<details>
<summary><b>AI javob bermayapti: "limit tugadi"</b></summary>

Gemini bepul tarifi daqiqasiga ~15 so'rovga ruxsat beradi. Bir daqiqa kuting.
Doimiy takrorlansa — [aistudio.google.com](https://aistudio.google.com) da
kalitingiz faolligini tekshiring.
</details>

<details>
<summary><b>Sayt dizaynsiz, oddiy matn bo'lib qoldi</b></summary>

Bu CSS yuklanmaganini bildiradi. Eng ko'p uchraydigan sabab: `npm run dev`
ishlab turganda **boshqa terminalda `npm run build`** ishga tushirilgan.
Ikkala buyruq ham `.next` papkasidan foydalanadi va build dev serverning
fayllarini o'chirib yuboradi.

Yechim:

```bash
# 1. Dev serverni to'xtating (Ctrl+C)
# 2. .next papkasini o'chiring
rmdir /s /q .next
# 3. Qayta ishga tushiring
```

Qoida: `npm run build` ni faqat dev server TO'XTATILGAN holda ishga tushiring.
</details>

<details>
<summary><b>Mikrofon ishlamayapti</b></summary>

Web Speech API faqat **Chrome** va **Edge** da ishlaydi (Firefox'da yo'q).
Shuningdek u **HTTPS** talab qiladi — `localhost` va Vercel'da ishlaydi.
</details>

<details>
<summary><b>Listening ovozi chiqmayapti</b></summary>

Brauzerda inglizcha ovoz o'rnatilmagan bo'lishi mumkin.
Windows: Sozlamalar → Vaqt va til → Til → English (United Kingdom) qo'shing.
</details>

---

## Texnologiyalar

Next.js 14 · TypeScript · TailwindCSS · Supabase · Google Gemini · Recharts · Vercel

**Barchasi bepul tarifda ishlaydi.**
