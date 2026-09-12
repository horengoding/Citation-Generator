# Generator Daftar Pustaka (APA Style)

Aplikasi sederhana berbasis HTML, CSS, dan JavaScript untuk menyusun daftar pustaka bergaya APA. Tersedia tiga cara mengisi data: ketik manual, cari lewat nomor DOI, atau unggah berkas PDF dan biarkan aplikasinya mencari DOI-nya sendiri.

Semua data disimpan di localStorage browser, tidak ada server atau database.

## Fitur

- **Input manual** isi penulis, tahun, judul, dan detail lain untuk buku atau jurnal ilmiah.
- **Cari via DOI.** Server memanggil [CrossRef API](https://api.crossref.org) untuk mengambil metadata dari nomor DOI, lalu mengisi form manual untuk diperiksa sebelum disimpan.
- **Unggah PDF.** Seret atau pilih berkas PDF; server membaca 3 halaman pertama (pakai `pypdf`), mencari pola DOI, lalu menjalankan pencarian DOI yang sama.
- **Kartu referensi.** Tiap entri tersimpan tampil sebagai kartu dengan label tipe sumber dan tombol **Salin**.
- **Hapus semua.** Membersihkan seluruh daftar pustaka di database, dengan konfirmasi dulu.

## Cara menjalankan

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Lalu buka `http://127.0.0.1:5000` di browser.

Database SQLite (`citations.db`) otomatis dibuat di folder yang sama saat aplikasi pertama kali jalan.
