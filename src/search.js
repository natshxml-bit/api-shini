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
        // 🔥 TRIK SAKTI: Kita saring/hapus parameter yang nilainya kosong
        // Biar API Shinigami nggak error/nge-reset ke page 1
        const cleanQuery = {};
        for (const key in req.query) {
            if (req.query[key] !== '' && req.query[key] !== null) {
                cleanQuery[key] = req.query[key];
            }
        }

        // Ubah jadi format URL (contoh: page=2&genre=action)
        const queryString = new URLSearchParams(cleanQuery).toString();
        
        // Tembak ke API list Shinigami
        const targetUrl = `${BASE_API}/manga/list?${queryString}`;
        console.log("Manggil API:", targetUrl); // Biar gampang ngecek log di Vercel nanti
        
        const response = await axios.get(targetUrl, { headers: shinigamiHeaders });
        
        res.json(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Gagal ngambil data pencarian/filter" });
    }
});

module.exports = router;
