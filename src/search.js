// File: src/search.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE_API = 'https://api.shngm.io/v1';
const shinigamiHeaders = {
    'Accept': 'application/json',
    'Origin': 'https://g.shinigami.asia',
    'Referer': 'https://g.shinigami.asia/',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/139.0.0.0 Mobile'
};

router.get('/', async (req, res) => {
    try {
        // Trik Sakti: Kita tangkep SEMUA parameter yang dikirim frontend (judul, genre, page, dll)
        // Terus kita ubah otomatis jadi format URL
        const queryString = new URLSearchParams(req.query).toString();
        
        // Tembak langsung ke API list Shinigami bawaan query-nya
        const targetUrl = `${BASE_API}/manga/list?${queryString}`;
        
        const response = await axios.get(targetUrl, { headers: shinigamiHeaders });
        
        res.json(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Gagal ngambil data pencarian/filter" });
    }
});

module.exports = router;
