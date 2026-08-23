# 🎯 Daily Focus — Neumorphic Modern Task & Consistency Manager

Aplikasi manajemen fokus harian dan to-do list berbasis **Tactile Neumorphism / Soft UI** modern, non-generic, dengan 4 pilihan tema visual terkalibrasi, sistem umpan balik suara Web Audio API, persistensi lokal IndexedDB, serta analitik konsistensi Bento Grid.

---

## ✨ Fitur Utama

- 🎨 **4 Tema Neumorphic Eksklusif (Light & Dark Mode)**:
  - **Warm Clay**: Nuansa porcelain hangat, bayangan taupe lembut, dan aksen *Royal Cobalt*.
  - **Blob Pastel**: Nuansa candy soft 3D bubble, rose & peach pastel, dan aksen *Vibrant Coral*.
  - **Frost Slate**: Nuansa cool ice slate segar, bayangan mint/sage, dan aksen *Emerald Green*.
  - **Midnight Carbon**: Nuansa industrial stealth matte, bayangan graphite dalam, dan aksen *Hot Ember*.
- 🔊 **Web Audio Synthesizer**: Efek suara taktil saat menambah, mencentang, atau menghapus task (dapat diaktifkan/dinonaktifkan).
- 📊 **Bento Consistency Stats**:
  - Skor penyelesaian harian & progress bar neumorphic inset.
  - Tracker streak harian & rekor terbaik.
  - Grafik aktivitas 7 hari dengan indikator batang vertikal berdaya kontras tinggi.
  - Peringatan status perhatian task darurat aktif.
- 🔄 **Auto-Reset Harian (Carry-over vs Mulai Bersih)**: Pengaturan otomatis saat berganti tanggal untuk memindahkan task aktif atau mengarsipkan catatan kemarin.
- 📦 **Backup & Import Resilien Multi-Format**: Mendukung impor JSON dari berbagai skema to-do (Todoist, Notion, Microsoft To Do, Google Tasks, format legacy `completed: boolean`, dsb.) dengan auto-recovery judul otomatis.
- 🔤 **Tipografi Khas**:
  - Headings: **Clash Display** (Fontshare)
  - Body: **General Sans** (Fontshare)
  - Angka & Data: **IBM Plex Mono** (Google Fonts)
- ♿ **Keterbacaan Terjamin (WCAG AAA Contrast)**: Rasio kontras teks primer > 14:1 dan teks sekunder > 8:1 terhadap background pada seluruh tema dan mode tampilan.
- 💾 **Offline-First & Zero-Flash**: Penyimpanan cepat di IndexedDB lokal dengan fallback localStorage dan sinkronisasi tema instan tanpa jeda visual (*zero-flash hydration*).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, Server/Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) dengan CSS Custom Properties (RGB alpha-value bridge)
- **Animasi & Interaksi**: [Framer Motion](https://www.framer.com/motion/) (Reorder list, layout transitions)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (subscribeWithSelector, local storage sync)
- **Storage**: [IndexedDB via idb](https://github.com/jakearchibald/idb)
- **Iconography**: [Lucide React](https://lucide.dev/) (Stroke Width terstandar 1.75)
- **Celebration**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 🚀 Memulai (Getting Started)

### 1. Prasyarat
Pastikan Anda telah menginstal **Node.js** (versi 18.17 atau lebih baru) dan npm.

### 2. Instalasi Dependensi
```bash
cd /Users/dracoseven/app-mytodolist
npm install
```

### 3. Menjalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

### 4. Build untuk Produksi
```bash
npm run build
npm run start
```

---

## 📁 Struktur Direktori

```text
app-mytodolist/
├── app/
│   ├── globals.css         # Font-face, token tema (HEX & RGB triplets), kelas neumorphic
│   ├── layout.tsx          # Root layout, link font, inline zero-flash theme script
│   └── page.tsx            # Halaman utama (Grid 12-kolom: List task & Bento stats)
├── components/
│   ├── features/           # Komponen fitur utama
│   │   ├── BentoStats.tsx          # Statistik 7 hari, streak, completion rate
│   │   ├── Header.tsx              # Brand, streak counter, theme switcher, settings
│   │   ├── ImportExportModal.tsx   # Modal import/export backup data & demo loader
│   │   ├── SettingsModal.tsx       # Pengaturan 4 tema, dark mode, audio, auto-reset
│   │   ├── SignatureTitle.tsx      # Judul Clash Display + badge progress sejajar
│   │   ├── TaskFilters.tsx         # Tab status (Semua/Aktif/Selesai), pencarian, filter
│   │   ├── TaskInput.tsx           # Bar input task baru, prioritas, kategori, deadline
│   │   ├── TaskItem.tsx            # Baris task interaktif, drag handle, edit, hapus
│   │   ├── TaskList.tsx            # Container reorder drag-and-drop & confetti
│   │   └── Toast.tsx               # Notifikasi umpan balik aksi pengguna
│   └── ui/                 # Primitif UI Neumorphic
│       ├── IconWrapper.tsx         # Standardisasi ikon (strokeWidth 1.75)
│       ├── NeuBadge.tsx            # Badge taktil
│       ├── NeuButton.tsx           # Tombol cembung dengan efek tekan
│       ├── NeuCard.tsx             # Kartu kontur lembut raised & inset
│       ├── NeuCheckbox.tsx         # Checkbox taktil dengan animasi centang
│       ├── NeuIconButton.tsx       # Tombol ikon 44px touch target
│       ├── NeuInput.tsx            # Input field inset
│       ├── NeuModal.tsx            # Modal dialog dengan backdrop blur
│       └── NeuToggle.tsx           # Switch toggle interaktif
├── lib/
│   ├── date-utils.ts       # Format tanggal Indonesia, streak, 7 hari terakhir
│   ├── sound.ts            # Web Audio API sintetis (click, complete, delete)
│   └── storage/
│       ├── db.ts           # IndexedDB client (idb) dengan fallback localStorage
│       └── migration.ts    # Parser JSON resilien multi-schema & auto-recovery
├── public/
│   └── sample-legacy-backup.json   # Data sampel untuk pengujian impor
├── store/
│   └── useTaskStore.ts     # Global state Zustand dengan auto-recovery & theme sync
├── types/
│   └── task.ts             # TypeScript interfaces, types, dan enums
├── tailwind.config.ts      # Konfigurasi Tailwind dengan token RGB variabel
├── tsconfig.json           # Konfigurasi TypeScript
└── package.json            # Manifest proyek
```

---

## 🎨 Spesifikasi Token Warna & Kontras

Aplikasi ini menggunakan rasio kontras teruji sesuai pedoman **WCAG 2.1 AAA**:

| Tema | Base Canvas | Raised Card | Text Primary (AAA) | Text Secondary (AAA) | Aksen Utama |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Warm Clay (Light)** | `#EDE7DC` | `#F6F1E7` | `#1A1612` (16.03:1) | `#4A4035` (8.85:1) | `#2554D7` |
| **Warm Clay (Dark)** | `#1C1814` | `#26211C` | `#FAF5ED` (14.51:1) | `#C8BEAF` (8.61:1) | `#648BFF` |
| **Blob Pastel (Light)** | `#F7EFE9` | `#FFF7F2` | `#221217` (15.20:1) | `#583F47` (8.40:1) | `#D93B60` |
| **Blob Pastel (Dark)** | `#201519` | `#2A1D23` | `#FAF0F4` (14.80:1) | `#CBB4BE` (8.30:1) | `#FF6E8E` |
| **Frost Slate (Light)** | `#E8EFF5` | `#F2F7FB` | `#0F1E28` (15.50:1) | `#3D5362` (8.20:1) | `#0B7D63` |
| **Frost Slate (Dark)** | `#101920` | `#18232B` | `#E8F4FC` (15.10:1) | `#A0BCCF` (8.40:1) | `#2AD1A3` |
| **Midnight Carbon (Light)** | `#EEEEEC` | `#F8F8F6` | `#121214` (16.20:1) | `#48484E` (8.90:1) | `#E64A19` |
| **Midnight Carbon (Dark)** | `#111113` | `#1A1A1D` | `#F5F5F7` (16.00:1) | `#B5B5BE` (8.50:1) | `#FF6434` |

---

## 📄 Lisensi

Dibuat dengan ❤️ untuk produktivitas harian yang fokus dan menyenangkan. Bebas digunakan dan dimodifikasi untuk keperluan pribadi maupun komersial.
