# Rencana Monorepo Manusistem

Status: **konsep, belum disetujui**. Dokumen ini hanya perencanaan. Tidak ada kode, struktur folder, atau konfigurasi deploy yang diubah sebelum rencana disetujui.

Bagian yang berasal dari kondisi repo saat ini ditandai "Kondisi sekarang". Sisanya adalah usulan dan ditandai "Usulan".

---

## 0. Tujuan: dua kelompok yang harus ditampung

| Kelompok | Siapa | Yang didapat | Bagian repo yang melayani |
|---|---|---|---|
| **Product Demo** | Calon klien yang melihat produk | Satu lingkungan demo bersama dengan tiga tenant (`demo-education`, `demo-outsourcing`, `demo-corporate`) berisi data fiktif | `seeds/demo/`, `deploy/demo/`, `verticals/` |
| **Client yang sudah membeli** | Klien berbayar | Satu instance **TEST** dan satu instance **PROD**, terpisah dari klien lain | `deploy/clients/<klien>/`, `verticals/` |

Konsekuensi untuk rancangan:

- Demo bersifat multi-tenant dan boleh direset kapan saja. Klien berbayar tidak: tiap klien punya instance dan database sendiri, sehingga data klien tidak pernah berbagi infrastruktur dengan klien lain atau dengan demo.
- **Tujuan utama: satu update modul sampai ke semua klien.** Karena itu semua klien menjalankan kode dan image yang sama, tidak ada salinan kode (fork) per klien. Lihat bagian 2.6.
- Keduanya memakai **kode dan image yang sama**. Yang membedakan hanya konfigurasi (vertikal yang aktif, fitur, branding, alamat) dan data.
- Klien baru ditambahkan dengan menambah folder `deploy/clients/<klien>/` (konfigurasi TEST dan PROD) tanpa mengubah kode aplikasi.
- Demo dan klien dipisahkan pada level data: demo memuat seed fiktif, klien berisi data nyata (PROD) atau salinan yang sudah dimasking (TEST).

---

## 1. Struktur repo

```
manusistem/
├── packages/platform-core/
├── apps/hcm/
├── apps/erp/
├── modules/payroll/
├── verticals/
│   ├── education/
│   ├── outsourcing/
│   └── corporate/
├── seeds/
│   └── demo/                   data demo per vertikal (fiktif)
│       ├── education/
│       ├── outsourcing/
│       └── corporate/
├── infra/
│   ├── docker/                 image aplikasi (satu image untuk semua)
│   └── templates/              template deployment
└── deploy/
    ├── demo/                   konfigurasi lingkungan demo
    └── clients/
        ├── sos/
        │   ├── test.env        (tanpa secret, secret di vault)
        │   └── prod.env
        └── <client-lain>/
```

### Fungsi tiap folder

| Folder | Fungsi |
|---|---|
| `packages/platform-core/` | Kode bersama semua aplikasi: autentikasi, role dan permission, workflow, struktur organisasi, akses database, komponen UI dasar |
| `apps/hcm/` | Aplikasi HCM (yang sekarang berjalan) |
| `apps/erp/` | Aplikasi ERP, memakai `platform-core` |
| `modules/payroll/` | Modul payroll yang bisa dipasang ke aplikasi mana pun |
| `verticals/<vertikal>/` | Konfigurasi dan perilaku khas satu jenis klien: istilah, struktur default, template dokumen, fitur yang diaktifkan |
| `seeds/demo/<vertikal>/` | Data demo fiktif per vertikal |
| `infra/docker/` | Satu image aplikasi untuk semua lingkungan |
| `infra/templates/` | Template deployment (dipakai ulang untuk demo dan klien) |
| `deploy/demo/` | Konfigurasi lingkungan demo |
| `deploy/clients/<klien>/` | Konfigurasi non-rahasia per klien: `test.env` dan `prod.env` |

### Kondisi sekarang yang menjadi titik awal

- Satu aplikasi Next.js dengan Prisma, bukan monorepo. Paket sekarang bernama `hcm-nextjs`.
- Build di Vercel menjalankan `prisma generate`, `scripts/vercel-migrate.mjs`, lalu `next build`.
- Sebagian besar data modul disimpan sebagai satu baris JSON per modul di tabel `AppState`. Hanya data inti (karyawan, struktur, user) yang punya tabel sendiri.
- Profil demo sekolah sudah ada: `src/lib/demoProfile.js` dan `src/data/schoolSeed.js`, dipilih lewat variabel `NEXT_PUBLIC_DEMO_PROFILE`. Ini calon isi `verticals/education/` dan `seeds/demo/education/`.

---

## 2. Environments dan Release

### 2.1 Product Demo

**Kebutuhan**
- Satu lingkungan demo multi-tenant dengan tiga tenant: `demo-education`, `demo-outsourcing`, `demo-corporate`.
- Seed data fiktif per vertikal di `seeds/demo/<vertikal>`.
- Mekanisme reset demo (script atau job terjadwal).

**Usulan**
- Satu deployment demo melayani tiga tenant. Tenant ditentukan dari subdomain, misalnya `education.demo.<domain>`, dan tiap tenant menunjuk ke database sendiri.
- Isolasi data (keputusan D1 di bagian 2.4):

  | Opsi | Kelebihan | Kekurangan |
  |---|---|---|
  | Satu database per tenant | Isolasi paling kuat; reset satu tenant tidak menyentuh yang lain; paling cocok dengan model `AppState` sekarang | Perlu daftar koneksi per tenant |
  | Satu database, kolom `tenantId` di semua tabel | Satu koneksi | Seluruh skema dan setiap query berubah; risiko data bocor antar tenant |
  | Satu database, skema Postgres per tenant | Tengah-tengah | Migrasi dijalankan per skema |

  Rekomendasi: **satu database per tenant** (di Neon bisa berupa branch atau project terpisah). Tidak ada perubahan skema, dan demo yang rusak bisa dibuang tanpa dampak.
- Isi `seeds/demo/<vertikal>/` berformat berkas data terversi (JSON) dengan skrip pemuat yang sama untuk ketiganya. Seed education berawal dari `schoolSeed.js`.
- **Reset demo**: skrip `reset-demo <tenant>` yang (1) mengosongkan database tenant, (2) menjalankan migrasi, (3) memuat seed. Dijalankan terjadwal (mis. tiap malam) dan manual sebelum sesi demo. Skrip menolak berjalan bila target bukan lingkungan demo.
- Semua data demo fiktif. Tidak ada nama atau data pribadi asli di `seeds/demo/`.

### 2.2 Client instance (TEST dan PROD per klien)

**Kebutuhan**
- Satu image aplikasi untuk semua lingkungan. Perbedaan hanya lewat environment variable dan konfigurasi di `deploy/clients/<klien>/`.
- Secret tidak boleh di-commit ke repo.
- Rilis berversi dengan alur staging, demo, client TEST, client PROD.
- Mekanisme export/import paket konfigurasi dari TEST ke PROD.
- Script refresh data PROD ke TEST dengan masking data pribadi.
- Migrasi database berversi yang jalan otomatis saat deploy.

#### a. Satu image, konfigurasi lewat environment

- Image dibangun satu kali dari satu commit, lalu dipakai apa adanya di semua lingkungan. Tidak ada build terpisah per klien atau per lingkungan.
- Konsekuensi: konfigurasi yang sekarang dibaca saat build (misalnya `NEXT_PUBLIC_DEMO_PROFILE`) harus dibaca saat runtime. Variabel `NEXT_PUBLIC_*` ikut tertanam saat build di Next.js, jadi perlu dipindah ke konfigurasi runtime (keputusan D3).
- `deploy/clients/<klien>/test.env` dan `prod.env` berisi hanya nilai non-rahasia: nama klien, vertikal, fitur yang aktif, alamat, batas dan ambang.

#### b. Secret

- Tidak pernah ada di repo, termasuk di `*.env`. File `*.env` hanya memuat nama secret yang harus tersedia, bukan nilainya.
- Contoh secret: `DATABASE_URL`, `DIRECT_URL`, kredensial SMTP, kunci enkripsi.
- Nilai disimpan di secret manager (vault) dan disuntikkan saat deploy. Pemeriksaan otomatis di CI menolak commit yang mengandung pola kredensial.
- Daftar secret wajib per lingkungan ditulis di manifest (hanya nama). Deploy gagal bila ada secret yang belum terisi.
- Catatan: kredensial database dan SMTP pernah berada di `.env` lokal dan dibagikan lewat chat selama pengembangan demo. Sebelum klien nyata masuk, semuanya perlu diganti baru dan dipindah ke vault.

#### c. Rilis berversi

```
commit di main -> tag vX.Y.Z -> build image (sekali, digest tetap)
   -> staging -> demo -> client TEST -> client PROD
```

- Image yang sama (digest sama) dipromosikan ke tahap berikutnya. Yang berubah hanya konfigurasi.
- Setiap tahap punya gerbang: tes otomatis di staging, pemeriksaan manual di demo, persetujuan klien di TEST, persetujuan eksplisit sebelum PROD.
- Versi yang berjalan di tiap lingkungan terlihat di halaman admin dan di berkas `/api/version`.
- Rollback = deploy ulang digest sebelumnya. Migrasi yang sudah jalan tidak dibatalkan otomatis (lihat bagian e).

#### d. Paket konfigurasi TEST ke PROD

Paket konfigurasi memindahkan **pengaturan**, bukan **data transaksi**.

| Masuk paket (konfigurasi) | Tidak masuk (data) |
|---|---|
| Struktur organisasi, posisi, grade | Karyawan dan user |
| Alur persetujuan, role dan permission | Payroll yang sudah diproses |
| Komponen payroll, jenis cuti, shift | Kandidat dan dokumennya |
| Jenis dokumen, lookup, template notifikasi | Pengajuan cuti, absensi, log |
| Branding dan tampilan Career Site | |

- Format: berkas JSON dengan `schemaVersion`, versi aplikasi pembuat, dan checksum.
- Import selalu melewati **dry-run** yang menampilkan perbedaan (tambah, ubah, hapus) dan harus disetujui sebelum diterapkan.
- Import bersifat idempotent: item dicocokkan lewat kode yang stabil, bukan nomor urut.
- Saat ini pengaturan modul tersimpan di baris `AppState` per kunci. Mana yang tergolong konfigurasi dan mana data transaksi perlu diklasifikasi satu per satu (keputusan D4).

#### e. Refresh data PROD ke TEST dengan masking

- Alurnya: salin PROD ke database baru (di Neon: branch dari PROD), jalankan masking **pada salinan itu**, lalu jadikan salinan itu TEST. PROD tidak pernah dimasking atau diubah.
- Skrip menolak berjalan bila target bukan lingkungan TEST (pemeriksaan nama lingkungan dan alamat database).
- Aturan masking minimal:

  | Data | Perlakuan |
  |---|---|
  | Nama, tempat dan tanggal lahir, alamat, telepon | Diganti nilai acak yang konsisten |
  | NIK/KTP/NPWP dan nomor identitas lain | Diganti nomor acak berformat sama |
  | Email | Diganti alamat di domain tak terkirim (mis. `@example.test`) |
  | Gaji, tunjangan, data payroll | Diacak dalam rentang yang wajar atau diskalakan |
  | Dokumen terunggah dan lampiran | Dihapus atau diganti berkas contoh |
  | Kata sandi | Direset ke nilai TEST yang diketahui |

- **Pengiriman email di TEST harus dinonaktifkan atau dialihkan ke satu kotak penguji.** Aplikasi mengirim email sungguhan lewat SMTP (konfirmasi lamaran), jadi salinan data yang belum dimasking bisa mengirim email ke orang sungguhan.
- Setelah refresh, skrip membuat laporan: jumlah baris per tabel dan hasil pemeriksaan bahwa tidak ada pola email atau nomor identitas asli yang tersisa.

#### f. Migrasi database berversi otomatis

- Migrasi disimpan di repo, bernomor urut, dan dijalankan otomatis oleh langkah deploy sebelum aplikasi versi baru menerima trafik.
- Sekarang migrasi dijalankan di dalam proses build lewat `scripts/vercel-migrate.mjs`. Dengan satu image untuk banyak lingkungan, langkah ini perlu dipisah dari build dan dijalankan per lingkungan saat deploy (keputusan D5).
- Aturan:
  1. Backup atau snapshot database sebelum migrasi di PROD.
  2. Migrasi harus kompatibel mundur satu versi (tambah dulu, hapus di rilis berikutnya) supaya rollback image tetap aman.
  3. Deploy berhenti dan tidak mengalihkan trafik bila migrasi gagal.
  4. Urutan versi migrasi tercatat di tabel riwayat migrasi.
- Karena sebagian besar data ada di `AppState` (JSON), perubahan bentuk data modul juga butuh langkah migrasi data, bukan hanya perubahan skema.

### 2.3 Ringkasan lingkungan

| Lingkungan | Database | Image | Data | Email keluar |
|---|---|---|---|---|
| Staging | Sendiri | Rilis baru | Seed uji | Dimatikan |
| Demo | Satu per tenant | Setelah lolos staging | Seed fiktif, direset berkala | Dimatikan atau ke kotak uji |
| Client TEST | Sendiri per klien | Setelah demo | Salinan PROD yang dimasking | Dimatikan atau dialihkan |
| Client PROD | Sendiri per klien | Setelah persetujuan TEST | Data nyata | Aktif |

### 2.4 Keputusan yang perlu disetujui

| No | Keputusan | Usulan |
|---|---|---|
| D1 | Cara isolasi tenant demo | Satu database per tenant |
| D2 | Secret manager (vault) yang dipakai | Belum ditentukan. Perlu dipilih sebelum klien nyata |
| D3 | Konfigurasi runtime menggantikan variabel `NEXT_PUBLIC_*` yang tertanam saat build | Baca konfigurasi dari endpoint runtime. **Catatan hasil pemeriksaan (Nov 2026):** `IS_SCHOOL` dari `src/lib/demoProfile.js` dipakai di 44 berkas, termasuk ±105 tempat di inisialisasi store. Ini perubahan lintas seluruh aplikasi, bukan penyesuaian kecil. Perlu dikerjakan di cabang terpisah dan dikoordinasikan dengan pekerjaan demo sekolah yang sedang berjalan |
| D4 | Klasifikasi tiap kunci `AppState` menjadi konfigurasi atau data transaksi | Dikerjakan sebelum fitur export/import dibuat |
| D5 | Memindahkan migrasi dari build ke langkah deploy | Ya. **Terblokir oleh D6:** di Vercel tidak ada langkah deploy terpisah dari build (`scripts/vercel-migrate.mjs` berjalan di build dan sengaja tidak menggagalkan build). Pemindahan baru masuk akal setelah tempat menjalankan image ditentukan |
| D6 | Tempat menjalankan image: Vercel, container sendiri, atau lainnya | Belum ditentukan. Satu image Docker mengasumsikan container |
| D7 | Apakah `apps/erp/` dan `modules/payroll/` dipecah sekarang atau nanti | Nanti. Mulai dengan `platform-core` dan `apps/hcm` |
| D8 | Satu versi platform untuk semua modul, atau versi sendiri per modul | Satu versi platform. Modul tetap punya catatan perubahan sendiri |
| D9 | Update ke klien: serentak atau bergelombang | **Sudah diputuskan: rilis kuartalan dengan jendela pilihan (cohort), seperti Oracle HCM Cloud** (lihat 2.6) |
| D10 | Kalender kuartalan: bulan rilis dan jendela A/B, selang TEST ke PROD, masa pengamatan, kriteria lolos gerbang | Belum ditentukan |
| D11 | Batas pemilihan jendela, cohort bawaan bagi yang tidak memilih, dan masa dukungan versi lama | Belum ditentukan. Usulan: bawaan B, tidak boleh melewati kuartal |

### 2.6 Update modul ke semua klien

Tujuan: modul diperbarui satu kali di repo, lalu seluruh klien memperolehnya.

**Syarat agar ini mungkin**
1. **Tidak ada kode per klien.** Perbedaan antar klien hanya boleh berupa konfigurasi, vertikal, flag fitur, dan data. Permintaan khusus klien diselesaikan dengan opsi konfigurasi di `platform-core` atau `verticals/`, bukan dengan menyalin kode. Begitu satu klien punya kode sendiri, ia tidak ikut update.
2. **Satu versi platform.** Modul (payroll, HCM, ERP) dirilis bersama sebagai satu versi, satu image (D8). Versi modul yang berbeda per klien akan membutuhkan matriks kompatibilitas yang rumit.
3. **Konfigurasi klien kompatibel lintas versi.** `test.env`, `prod.env`, dan paket konfigurasi punya `schemaVersion`. Rilis baru harus bisa membaca konfigurasi versi lama atau menyertakan langkah konversinya.
4. **Migrasi data kompatibel mundur satu versi** (bagian 2.2f), supaya klien yang belum ter-update dan klien yang sudah ter-update tidak saling mengganggu.

**Alur sebuah update: rilis kuartalan dengan dua jendela (cohort)**

Model ini meniru cara Oracle HCM Cloud: ada satu rilis per kuartal, dan klien memilih **jendela update**. Contoh untuk kuartal ini: klien memilih update pada **bulan 11** atau **bulan 12**. Pilihan itu adalah cohort klien.

```
Rilis kuartalan (satu versi, satu image)
   -> staging -> demo + klien internal (Cohort 0), sebelum bulan 11
   -> Jendela A (bulan 11):  TEST lebih dulu, lalu PROD   -> masa pengamatan -> gerbang
   -> Jendela B (bulan 12):  TEST lebih dulu, lalu PROD
```

| Cohort | Kapan di-update | Siapa |
|---|---|---|
| 0 | Sebelum jendela A | Demo dan klien internal |
| A | Bulan 1 dari dua jendela kuartal itu (mis. bulan 11) | Klien yang memilih update lebih awal |
| B | Bulan 2 (mis. bulan 12) | Klien yang memilih update lebih akhir |

Aturan:
- **Satu versi per kuartal.** Jendela A dan B menerima versi yang sama. Jendela B hanya menunggu, tidak berisi versi lain. Di antara kuartal hanya ada perbaikan (patch), bukan fitur baru.
- **Cohort A menjadi pengamat bagi B.** Bila di jendela A ada masalah berat atau rollback, versi ditahan dan jendela B tidak berjalan sampai masalah selesai (gerbang antar cohort).
- **Pilihan jendela disimpan di `deploy/clients/<klien>/`** (bidang `cohort`: `A` atau `B`) dan boleh diganti per kuartal sebelum batas pemilihan, mis. beberapa minggu sebelum bulan 11.
- **Dalam satu jendela, TEST di-update lebih dulu, PROD menyusul** setelah masa uji TEST. Selang waktunya ditetapkan di D10.
- Kalender rilis diumumkan jauh hari: tanggal rilis kuartalan, tanggal jendela A dan B, batas pilih jendela, dan tanggal TEST dan PROD per jendela.
- **Tidak boleh melewati kuartal.** Klien yang tidak memilih ditempatkan di cohort bawaan (usulan: B). Klien tidak bisa menunda lewat akhir jendela B karena versi lama berhenti didukung (D11).
- **Perbaikan darurat (hotfix)**, misalnya celah keamanan, boleh melewati jadwal dan dikirim ke semua cohort sekaligus. Ini pengecualian dan butuh persetujuan eksplisit.
- Setiap klien punya jam pemeliharaan sendiri yang ditulis di `deploy/clients/<klien>/`.
- Fitur baru yang belum siap untuk semua klien dikirim dalam keadaan **nonaktif** lewat flag fitur, dan diaktifkan per klien lewat konfigurasi. Kode sampai ke semua klien, perilakunya dinyalakan bertahap.
- Perubahan yang mengubah perilaku lama (breaking change) membutuhkan catatan rilis dan pemberitahuan ke klien sebelum jendela mereka, termasuk pratinjau di TEST.

**Risiko yang perlu disadari**
- Satu bug di modul bersama berdampak ke semua klien. Mitigasinya adalah rilis bertahap per cohort dengan gerbang, tes otomatis di staging, dan rollback cepat (memasang kembali image versi sebelumnya).
- Kecepatan update dibatasi oleh klien yang paling sensitif. Klien yang meminta pembekuan versi memerlukan aturan jelas: berapa lama versi lama masih didukung (D11).
- Kalau semua klien memilih jendela B, jendela A tidak berfungsi sebagai pengamat. Perlu ada klien tetap di cohort A (internal atau yang bersedia).

### 2.7 Urutan pengerjaan yang diusulkan

Setelah rencana disetujui, bertahap dan tiap tahap bisa dihentikan tanpa merusak yang sebelumnya:

1. Rapikan konfigurasi runtime dan pindahkan migrasi dari build (D3, D5). Aplikasi tetap satu paket.
2. Buat tag rilis, image Docker, dan alur staging ke demo.
3. Pisahkan tenant demo dan skrip reset (D1).
4. Buat `deploy/clients/<klien>/` dan integrasi vault (D2).
5. Skrip masking dan refresh PROD ke TEST.
6. Export/import paket konfigurasi (D4).
7. Kalender rilis kuartalan dan penjadwalan cohort: bidang `cohort`, gerbang antar jendela, dan pengumuman jadwal (D10, D11). Bisa dikerjakan setelah tahap 4.
8. Barulah pemecahan menjadi `packages/`, `apps/`, `modules/`, `verticals/` (D7).
