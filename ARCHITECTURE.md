# Arsitektur & Siklus Hidup Data — Daily Focus

Dokumen ini mendefinisikan prinsip arsitektur, state machine harian, strategi retensi data jangka panjang, serta sistem integritas data aplikasi **Daily Focus**. Dokumen ini dirancang sebagai referensi teknis permanen untuk memastikan aplikasi tetap cepat, andal, dan bebas dari regresi saat dipakai bertahun-tahun.

---

## 1. Siklus Hidup Data (Data Lifecycle)

```
[Day 1: First Use]
  ├── Inisialisasi firstActiveDate = today, streak = 0
  └── Dashboard menampilkan status awal yang jujur ("Belum digunakan"), bukan 0% palsu.
          │
[Day 2 – Day 7: Histori Parsial]
  ├── Rolling window [today - 6 ... today]
  ├── Hari sebelum firstActiveDate -> isBeforeFirstUse: true (Kapsul dashed / dimmed)
  └── Hari setelah firstActiveDate tanpa aktivitas -> 0% (Tidak ada task diselesaikan)
          │
[Day 8 – Day 90: Granular Daily Logs]
  ├── Setiap hari dicatat sebagai entri DailyMetric granular { date, completedCount, totalCount, completionRate }
  └── Task checklist harian (isRecurring: true) tetap muncul setiap hari dengan centang ter-reset ke pending
          │
[Day 90+: Agregasi Bulanan & Retensi Storage]
  ├── Log harian mentah > 90 hari diringkas otomatis menjadi MonthlyMetricSummary
  └── Log harian lama dipangkas untuk mencegah storage IndexedDB membengkak tak terbatas
```

### 1.1 Hari ke-1 (First Use)
- Saat pertama kali dibuka, aplikasi mencatat `firstActiveDate: YYYY-MM-DD` dan `lastActiveDate: YYYY-MM-DD` di pengaturan.
- Jika daftar task masih kosong, UI menampilkan `EmptyOnboardingState`.
- Grafik statistik 7 hari mengenali bahwa hari-hari sebelum `firstActiveDate` berstatus `isBeforeFirstUse: true`, sehingga tidak menampilkan grafik 0% yang menyesatkan.

### 1.2 Hari ke-2 sampai ke-7 (Histori Parsial)
- Grafik "Aktivitas 7 Hari" menyusun rentang 7 hari kalender lokal `[today - 6 ... today]`.
- Slot hari yang jatuh **sebelum `firstActiveDate`** dirender sebagai kapsul bergaris putus-putus (*dashed border*) dengan tooltip *"Belum digunakan"*.
- Slot hari yang jatuh **pada/setelah `firstActiveDate`** tetapi tidak memiliki task selesai dirender sebagai 0%.

### 1.3 Hari ke-8 dan Seterusnya (Rolling Window)
- Query statistik harian selalu bersifat rolling calendar window berdasarkan tanggal lokal device, bukan berdasarkan urutan `LIMIT` query.

### 1.4 Strategi Retensi Jangka Panjang (Mencegah Bloat)
- **Granular Log (90 Hari)**: Record harian `DailyMetric` disimpan secara granular selama 90 hari terakhir untuk grafik mingguan & bulanan.
- **Agregasi Bulanan (`MonthlyMetricSummary`)**:
  Setiap inisialisasi aplikasi, fungsi `dbClient.runDataRetentionPrune()` memeriksa apakah terdapat `DailyMetric` lebih tua dari 90 hari. Jika ada, data tersebut diagregasikan per bulan (`YYYY-MM`):
  - `totalCompleted`: Total task yang diselesaikan pada bulan tersebut.
  - `totalTasks`: Total seluruh task yang direncanakan.
  - `avgCompletionRate`: Rata-rata persentase penyelesaian.
  - `daysTracked`: Jumlah hari aktif.
  - `perfectDays`: Jumlah hari dengan penyelesaian 100%.
- Setelah diringkas ke object store `monthly_summaries`, entri harian mentah lama dihapus dari database.

---

## 2. State Machine Harian & Aturan Streak

### 2.1 Kalkulasi Streak Deterministic (`calculateStreakUpdate`)
Streak dihitung secara ketat melalui fungsi murni `calculateStreakUpdate()` pada modul `lib/streak-utils.ts`:

| Kondisi Hari Kemarin | Status Task Kemarin | Dampak Streak |
| :--- | :--- | :--- |
| **Minimal 1 task aktif** | **100% Selesai (`done`)** | **Streak +1** (atau menjadi 1 jika hari tidak berurutan) |
| **Minimal 1 task aktif** | **< 100% Selesai (Ada pending)** | **Streak Reset ke 0** |
| **0 task (Daftar kosong)** | **Tidak ada task aktif** | **Netral (Streak dipertahankan)** |

### 2.2 Transisi Tengah Malam Real-Time (Midnight Transition)
- **Precision Timer (`calculateMidnightTimeout`)**: Aplikasi menghitung sisa milidetik menuju `00:00:01` berikutnya dan memasang timer otomatis.
- **Event `visibilitychange`**: Saat tab browser kembali aktif dari background, aplikasi memvalidasi apakah tanggal sistem telah berganti.
- **Proteksi Penundaan (Deferred Reset)**: Jika user sedang aktif mengetik/mengedit judul task (`isEditingTaskId !== null`), proses reset harian ditunda 20 detik agar tidak memutus interaksi user di tengah pengetikan.

### 2.3 Sinkronisasi Multi-Tab & Distributed Lock
- **`BroadcastChannel` (`daily_focus_sync_channel`)**: Setiap mutasi task, toggle status, atau perubahan tema di-broadcast ke seluruh tab browser yang terbuka secara realtime tanpa perlu reload halaman manual.
- **Reset Locking (`acquireDailyResetLock`)**: Menggunakan lock berbasis timestamp di `localStorage` (`daily_focus_reset_lock`). Hanya tab pertama (*leader*) yang mengeksekusi migrasi reset harian ke database; tab lain menerima sinyal `DAILY_RESET_NOTIFY` dan memperbarui state memori secara sinkron.

### 2.4 Integritas Timezone & Tanggal Kalender Lokal
- Semua pembentukan tanggal menggunakan komponen kalender lokal `d.getFullYear()`, `d.getMonth() + 1`, `d.getDate()` dalam format `YYYY-MM-DD`.
- Tidak ada perhitungan tanggal menggunakan pembagian epoch milliseconds `/ 86400000` untuk menghindari bug pergeseran Daylight Saving Time (DST) atau perubahan zona waktu device saat bepergian.

---

## 3. Pengelolaan Task Recurring & One-Time

### 3.1 Model Task
Secara default, aplikasi Daily Focus adalah **Checklist Harian Berulang**.
- **`isRecurring: true` (Checklist Rutin)**:
  - Setiap hari baru, task tetap berada di daftar hari ini dengan `status: 'pending'`, `completedAt: null`, dan `date: today`.
  - Judul, kategori, prioritas, dan urutan tetap dipertahankan.
- **`isOneTime: true` (Task Sekali Saja)**:
  - Jika berstatus `done` kemarin, task diarsipkan ke tanggal kemarin (`date: lastDate`) dan tidak muncul lagi di daftar hari ini.
  - Jika masih `pending`, perilakunya mengikuti pengaturan `autoResetBehavior` (`carry-over` ke hari ini atau `archive`).

### 3.2 Jeda Sementara (`isPaused`)
- Task rutin dapat dijeda (`isPaused: true`) saat user cuti atau task sedang tidak relevan.
- Task yang dijeda tidak dihitung dalam progress bar harian dan tidak memicu streak failure.

### 3.3 Hapus Task Rutin vs Hentikan Pengulangan
Saat user menghapus task rutin, aplikasi menyediakan 2 opsi:
1. **Hentikan Pengulangan (Rekomendasi)**: Mengubah task menjadi nonaktif (`isPaused: true`, `isRecurring: false`). Task tidak muncul lagi mulai besok, namun riwayat penyelesaian puluhan hari sebelumnya tetap utuh di statistik.
2. **Hapus Permanen**: Menghapus record task dari sistem secara menyeluruh (dengan tombol *Undo* 5 detik).

---

## 4. Integritas Data, Auto-Backup & Pemulihan

### 4.1 Dual-Layer Storage
- **Primary**: IndexedDB (`daily-focus-db`, Version 2) dengan object store `tasks`, `settings`, `metrics`, dan `monthly_summaries`.
- **Secondary (Auto-Backup Safety Net)**: Setiap mutasi penting secara otomatis mencadangkan snapshot JSON ke `localStorage` (`daily_focus_auto_backup`).

### 4.2 Error Recovery Boundary
Jika terjadi kegagalan baca database atau error render React, aplikasi menangkap error melalui `ErrorRecoveryBoundary` dan menampilkan UI pemulihan dengan opsi:
1. **Muat Ulang Halaman**.
2. **Pulihkan dari Auto-Backup Terakhir**.
3. **Reset Penyimpanan & Mulai Bersih**.

### 4.3 Versioning & Skema Migrasi
- `schemaVersion: 2` tercatat di settings.
- Saat import file backup lama (versi 1 atau skema legacy tanpa recurring), fungsi `parseAndAnalyzeImport` dan `initializeStore` secara otomatis memigrasikan task menjadi checklist harian aktif (`isRecurring: true`, `isOneTime: false`).
