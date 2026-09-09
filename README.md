# Generator Daftar Pustaka (APA Style)

Aplikasi sederhana berbasis HTML, CSS, dan JavaScript untuk menyusun daftar pustaka bergaya APA. Tersedia tiga cara mengisi data: ketik manual, cari lewat nomor DOI, atau unggah berkas PDF dan biarkan aplikasinya mencari DOI-nya sendiri.

Semua data disimpan di `localStorage` browser, tidak ada server atau database.

## Fitur

- **Input manual** isi penulis, tahun, judul, dan detail lain untuk buku atau jurnal ilmiah.
- **Cari via DOI** tempel nomor DOI atau tautan `doi.org`, lalu klik *Cari & isi otomatis*. Aplikasi akan mengambil metadata (penulis, tahun, judul, nama jurnal/penerbit) dari [CrossRef API](https://api.crossref.org).
- **Unggah PDF** seret (drag-and-drop) atau klik untuk memilih berkas PDF. Aplikasi memindai 3 halaman pertama, mencari pola nomor DOI di dalamnya, lalu otomatis menjalankan pencarian DOI yang sama seperti di atas.
- **Kartu referensi** setiap entri tersimpan tampil sebagai kartu dengan label tipe sumber (Buku/Jurnal) dan tombol **Salin** untuk menyalin teks sitasinya langsung.
- **Hapus semua** membersihkan seluruh daftar pustaka yang tersimpan di browser, lengkap dengan konfirmasi supaya menghindari tidak sengaja terhapus.