const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Import Rute
const homeRoute = require('./src/home');
const detailRoute = require('./src/detail');
const chapterRoute = require('./src/chapter');
const searchRoute = require('./src/search');
const updatesRoute = require('./src/updates');

app.get('/', (req, res) => {
    res.json({
        Author: "Natshi",
        message: "Gunakan Secara Bijak, Jangan spam!",
        status: "Server Online",
        panduan_penggunaan: {
            "Langkah_1_Home": {
                "endpoint": "GET /api/home",
                "fungsi": "Mengambil data komik trending dan list singkat project update untuk halaman depan."
            },
            "Langkah_2_Detail": {
                "endpoint": "GET /api/detail/:slug",
                "fungsi": "Melihat informasi lengkap komik, sinopsis, genre, dan daftar chapter.",
                "catatan": "Ganti :slug dengan ID atau slug komik yang didapat dari halaman Home."
            },
            "Langkah_3_Chapter": {
                "endpoint": "GET /api/chapter/:chapter_slug",
                "fungsi": "Mengambil data gambar untuk halaman baca komik.",
                "catatan": "Ganti :chapter_slug dengan slug chapter spesifik."
            },
            "Langkah_4_Search_Filter": {
                "endpoint": "GET /api/search",
                "fungsi": "Fitur pencarian judul komik dengan filter yang bisa disesuaikan.",
                "format_query": "?q=judul&page=nomor&type=tipe&status=status&order=urutan&genre=nama_genre",
                "contoh_lengkap": "/api/search?q=one+piece&type=manhwa&order=latest&genre=action&page=1",
                "daftar_parameter": {
                    "q": "Kata kunci pencarian (string), contoh: 'naruto'",
                    "page": "Nomor halaman untuk pagination (integer), default: 1",
                    "type / format": "Tipe komik: 'manga', 'manhwa', atau 'manhua'",
                    "status": "Filter status: 'ongoing', 'completed', atau 'hiatus'",
                    "order / sort": "Urutan tampilan: 'latest'/'update', 'popular', 'a-z'/'title', 'z-a'/'titlereverse', 'added'",
                    "genre": "Filter berdasarkan genre (string), contoh: 'action'. Lihat daftar lengkap di bawah."
                },
                "daftar_genre": [
                    "action", "adventure", "comedy", "crime", "demons", "drama", "ecchi", "fantasy",
                    "game", "gender bender", "gore", "harem", "historical", "horror", "isekai",
                    "josei", "kids", "magic", "martial arts", "mature", "mecha", "medical", "military",
                    "mystery", "police", "psychological", "reincarnation", "romance", "school",
                    "school life", "sci-fi", "seinen", "shoujo", "shounen", "slice of life", "smut",
                    "sports", "super power", "superhero", "supernatural", "survival", "thriller",
                    "tragedy", "vampire", "villainess", "webtoons", "wuxia", "yaoi", "yuri"
                ]
            },
            "Langkah_5_Updates_Pagination": {
                "endpoint": "GET /api/updates",
                "fungsi": "Mengambil daftar lengkap project update dengan fitur Infinity Page / Pagination.",
                "format_query": "?page=nomor_halaman",
                "contoh_lengkap": "/api/updates?page=2"
            }
        },
        endpoints_tersedia: [
            "/api/home",
            "/api/detail/:slug",
            "/api/chapter/:chapter_slug",
            "/api/search",
            "/api/updates"
        ]
    });
});

app.use('/api/home', homeRoute);
app.use('/api/detail', detailRoute);
app.use('/api/chapter', chapterRoute);
app.use('/api/search', searchRoute);
app.use('/api/updates', updatesRoute);

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server Backend Proxy Aktif di http://localhost:${PORT}`);
    });
}

module.exports = app;
