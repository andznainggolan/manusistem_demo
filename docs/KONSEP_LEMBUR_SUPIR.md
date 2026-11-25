# Konsep Lembur Supir (Thelorry, perusahaan fleet management)

Status: **usulan untuk demo produk**. Angka upah adalah contoh fiktif. Rujukan hukum di bagian 2 ditulis dari ingatan peraturan yang berlaku dan **wajib diverifikasi oleh legal atau HR Thelorry** sebelum dipakai sebagai kebijakan nyata.

Data pendukung: `seeds/demo/logistics/thelorry/` (struktur organisasi, karyawan, kebijakan lembur). Perhitungan dan kalkulator ada di workbook Excel `Thelorry_Data_dan_Konsep_Lembur.xlsx`.

---

## 1. Kenapa lembur supir berbeda

| Hal | Dampak ke lembur |
|---|---|
| Jam kerja supir adalah **jam tugas**, bukan hanya jam mengemudi | Lembur dihitung dari seluruh waktu yang dipakai perusahaan (mengemudi, menunggu muat, bongkar, antre) di luar jadwal shift |
| Menunggu muat/bongkar dan antrean | Tetap jam kerja bila supir harus siaga di lokasi atas perintah perusahaan |
| Trip antar kota (linehaul) dan shift malam | Lembur sering melewati batas harian dan memicu aturan keselamatan |
| Ada batas hukum waktu kerja pengemudi | Lembur supir lebih ketat daripada pekerja kantor |
| Komponen penghasilan supir beragam (uang makan, uang jalan, premi trip) | Hanya upah tetap yang menjadi dasar upah lembur |

## 2. Dasar aturan (perlu diverifikasi legal)

| Topik | Ketentuan | Rujukan |
|---|---|---|
| Batas lembur | Paling lama **4 jam per hari** dan **18 jam per minggu** (tidak termasuk hari istirahat mingguan dan libur resmi) | PP 35/2021 |
| Persyaratan | Ada **persetujuan pekerja** dan **perintah lembur tertulis** (boleh digital); upah lembur wajib dibayar | PP 35/2021 |
| Makan dan minum | Lembur **3 jam atau lebih**: wajib makan dan minum (minimal 1.400 kkal), tidak bisa diganti uang | PP 35/2021 |
| Upah sejam | **1/173 x upah sebulan** (upah pokok + tunjangan tetap) | PP 35/2021 |
| Tarif hari kerja | Jam ke-1 = **1,5 x** upah sejam; jam berikutnya = **2 x** | PP 35/2021 |
| Tarif hari istirahat/libur, pola 5 hari kerja | Jam ke-1 sampai 8 = **2 x**; jam ke-9 = **3 x**; jam ke-10 dan seterusnya = **4 x** | PP 35/2021 |
| Waktu kerja pengemudi angkutan umum | Pada umumnya 8 jam sehari; paling lama 12 jam sehari termasuk istirahat 1 jam; istirahat paling sedikit 30 menit setelah mengemudi 4 jam berturut-turut | UU 22/2009 (LLAJ) Pasal 90 |
| Jabatan tertentu | Pengambil keputusan atau penentu kebijakan yang jam kerjanya tidak dibatasi tidak mendapat upah lembur | PP 35/2021 |
| Pekerja upah satuan/borongan (per trip atau ritase) | Upah sebulan untuk dasar lembur memakai rata-rata upah 12 bulan terakhir | Kepmenakertrans 102/2004 (verifikasi masih berlaku) |

**Akibat bagi supir:** jadwal normal 8 jam kerja dan batas 12 jam termasuk istirahat 1 jam berarti lembur efektif paling banyak **3 jam per hari** (12 jam - 1 jam istirahat - 8 jam kerja). Batas 3 jam ini lebih ketat daripada batas hukum umum 4 jam, jadi dipakai sebagai batas harian di aplikasi.

## 3. Kebijakan Thelorry (usulan)

1. **Jadwal normal:** 5 hari kerja, 8 jam kerja per hari (rentang 9 jam dengan istirahat 60 menit). Total 40 jam per minggu.
2. **Definisi jam lembur supir:** (jam keluar - jam masuk tugas) - istirahat - 8 jam jadwal. Jam tunggu muat dan bongkar dihitung kerja.
3. **Batas:** 3 jam per hari, 18 jam per minggu. Pelanggaran ditandai untuk ditinjau, tidak diblokir.
4. **Perintah tertulis:** Dispatcher atau Supervisor Operasi menerbitkan perintah lembur digital sebelum atau saat trip. Supir menyetujui.
5. **Pembulatan:** menit sisa 30 atau lebih dihitung 1 jam penuh, di bawah 30 dibulatkan ke bawah.
6. **Makan lembur:** lembur 3 jam atau lebih mendapat makan dan minum, bukan uang.
7. **Dasar upah lembur:** gaji pokok + tunjangan tetap. **Tidak** termasuk uang makan harian, premi trip, uang jalan, dan bonus.
8. **Hari istirahat dan libur resmi:** tarif 2 x, 3 x, 4 x seperti tabel di atas; maksimum 11 jam kerja.
9. **Kepatuhan keselamatan:** tandai bila ada mengemudi lebih dari 4 jam berturut-turut tanpa istirahat 30 menit, atau total tugas lebih dari 12 jam sehari.
10. **Trip per ritase (supir borongan):** dasar upah sejam memakai rata-rata 12 bulan, dan upah tidak boleh di bawah upah minimum.

## 4. Rumus tarif dan tarif contoh

Upah sejam **W = upah sebulan / 173**.

| Jenis hari | Jam lembur | Pengali |
|---|---|---|
| Hari kerja | 1 | 1,5 x W |
| Hari kerja | 2 dan 3 | 2 x W |
| Hari istirahat/libur (5 hari) | 1 sampai 8 | 2 x W |
| Hari istirahat/libur (5 hari) | 9 | 3 x W |
| Hari istirahat/libur (5 hari) | 10 sampai 11 | 4 x W |

Tarif contoh per kelas upah (dibulatkan Rp 10), dipakai di Overtime Matrix:

| Kelas | Upah sebulan contoh | W (per jam) | Hari kerja jam 1 | Hari kerja jam 2-3 | Libur jam 1-8 | Libur jam 9 | Libur jam 10-11 |
|---|---|---|---|---|---|---|---|
| Kernet / Helper | 5.800.000 | 33.526 | 50.290 | 67.050 | 67.050 | 100.580 | 134.100 |
| Driver Distribusi | 6.800.000 | 39.306 | 58.960 | 78.610 | 78.610 | 117.920 | 157.230 |
| Driver Linehaul | 8.200.000 | 47.399 | 71.100 | 94.800 | 94.800 | 142.200 | 189.600 |
| Driver Linehaul Senior | 9.800.000 | 56.647 | 84.970 | 113.290 | 113.290 | 169.940 | 226.590 |
| Staf Operasi / Mekanik | 7.600.000 | 43.931 | 65.900 | 87.860 | 87.860 | 131.790 | 175.720 |

## 5. Contoh perhitungan

**Kasus 1: Driver Distribusi, hari kerja.** Shift 07:00 sampai 16:00 (istirahat 60 menit). Hari ini pulang 18:20 karena antre bongkar. Jam tugas 11 jam 20 menit - 60 menit = 10 jam 20 menit. Lembur = 2 jam 20 menit, dibulatkan 2 jam (20 menit di bawah 30). Upah = 1 x 58.960 + 1 x 78.610 = **Rp 137.570**.

**Kasus 2: Driver Linehaul, hari kerja, trip malam.** Shift 20:00 sampai 05:00. Selesai 08:10. Lembur 3 jam 10 menit, dibulatkan 3 jam. Upah = 71.100 + 2 x 94.800 = **Rp 260.700**. Lembur 3 jam atau lebih: wajib makan dan minum. Rentang tugas dari 20:00 sampai 08:10 adalah 12 jam 10 menit. Batas hukum adalah 12 jam **termasuk** istirahat 1 jam, jadi kasus ini **ditandai melewati batas harian** (10 menit) untuk ditinjau.

**Kasus 3: Driver Linehaul, Sabtu (hari istirahat).** Bekerja 08:00 sampai 19:00 dengan istirahat 60 menit = 10 jam kerja. Jam ke-1 sampai 8 = 8 x 94.800, jam ke-9 = 142.200, jam ke-10 = 189.600. Total = 758.400 + 142.200 + 189.600 = **Rp 1.090.200**.

## 6. Alur persetujuan

`Perintah/Plan lembur (Dispatcher atau supir)` -> `Persetujuan Plan (Supervisor Operasi)` -> `Realisasi (dari catatan absensi atau Time Entries)` -> `Persetujuan Realisasi (Supervisor lalu HR)` -> `Payroll`.

Pada Eligibility Group di aplikasi, Plan selalu butuh persetujuan untuk driver. Realisasi otomatis disetujui hanya untuk Dispatcher, Admin, dan Mekanik karena sudah tercatat di sistem absensi.

## 7. Pemetaan ke aplikasi (sudah disiapkan di data demo)

| Eligibility Group | Departemen | Grade | Matrix |
|---|---|---|---|
| Driver Linehaul Senior | Driver Linehaul (3 depot) | D4 | Driver Linehaul Senior - Hari Kerja |
| Driver Linehaul | Driver Linehaul (3 depot) | D3 | Driver Linehaul - Hari Kerja |
| Driver Distribusi | Driver Distribusi (3 depot) | D1 sampai D2 | Driver Distribusi - Hari Kerja |
| Kernet dan Helper | Kernet dan Helper (3 depot) | T1 | Kernet / Helper - Hari Kerja |
| Dispatcher, Admin dan Mekanik | Dispatch dan Workshop (3 depot) | S1 | Staf Operasi / Mekanik - Hari Kerja |

Kepala Depot, Supervisor, Manajer, dan Direksi **tidak masuk** group mana pun (jabatan manajerial, tidak berhak lembur).

Matrix hari istirahat/libur (5 hari) juga sudah dibuat untuk kelima kelas.

## 8. Celah antara konsep dan aplikasi saat ini

| No | Celah | Usulan pengembangan |
|---|---|---|
| 1 | Satu Eligibility Group hanya bisa menautkan **satu** matrix, jadi tarif hari kerja dan hari libur untuk orang yang sama tidak bisa dipilih otomatis | Tambah matrix kedua (hari istirahat/libur) di group, dipilih berdasarkan kalender |
| 2 | Matrix berupa tarif rupiah tetap per jam, padahal upah lembur menurut hukum bergantung pada upah tiap orang | Hitung per orang dari upah sebulan / 173 dengan pengali per tier |
| 3 | Belum ada pengecekan batas harian 3 jam dan batas mingguan 18 jam | Validasi di realisasi lembur dan tanda peringatan |
| 4 | Belum membedakan jam mengemudi dan jam tunggu | Pencatatan jam mengemudi (dari telematics atau Time Entries) dan peringatan istirahat 30 menit per 4 jam |
| 5 | Belum ada halaman pengajuan lembur (Plan dan Realisasi) dan belum terhubung ke Payroll Run | Halaman ESS dan MSS untuk Plan dan Realisasi, lalu hasilnya masuk komponen lembur payroll |
| 6 | Belum ada kewajiban makan lembur 3 jam atau lebih | Penanda dan pencatatan pemberian makan |

## 9. Hal yang perlu dikonfirmasi ke Thelorry

1. Pola hari kerja driver sebenarnya: 5 atau 6 hari, dan apakah ada hari libur bergilir.
2. Skema upah driver: gaji tetap, per trip (ritase), atau campuran.
3. Komponen uang makan, uang jalan, premi trip, dan apakah sebagian diperlakukan sebagai upah tetap.
4. Apakah ada driver dua orang per unit (supir dan co-driver) untuk trip antar kota.
5. Sumber catatan waktu: aplikasi mobile, absensi lokasi (geofence), atau telematics kendaraan.
6. Jumlah driver dan depot sebenarnya.
