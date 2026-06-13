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
        // Gabungin semua query dari frontend
        const query = req.query;
        
        // Setup parameter yang mirip banget sama web asli biar disukai sama API-nya
        const params = new URLSearchParams({
            page: query.page || '1',
            page_size: '24', // Wajib diset biar konsisten
            genre_include_mode: 'or',
            genre_exclude_mode: 'or',
            ...query // Timpa dengan parameter asli dari frontend (genre, status, order, dll)
        });

        // Hapus key yang nilainya kosong/undefined biar nggak dikirim
        for (let [key, value] of Array.from(params.entries())) {
            if (!value || value === 'undefined' || value === 'null' || value === '') {
                params.delete(key);
            }
        }

        const targetUrl = `${BASE_API}/manga/list?${params.toString()}`;
        console.log("Fetching URL:", targetUrl);
        
        const response = await axios.get(targetUrl, { headers: shinigamiHeaders });
        
        res.json(response.data);
    } catch (error) {
        console.error("Backend Error:", error.message);
        res.status(500).json({ error: "Gagal ngambil data pencarian/filter" });
    }
});

module.exports = router;
