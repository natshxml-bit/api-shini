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
            if (req.query[key] !== '' && req.query[key] !== null && req.query[key] !== undefined) {
                cleanQuery[key] = req.query[key];
            }
        }

        // 🔥 FIX 1: Mapping parameter 'order' ke 'sort' (API Shinigami pakai 'sort', bukan 'order')
        if (cleanQuery.order) {
            // API Shinigami pakai 'sort' untuk pengurutan
            // popular = default, latest = updated_at, title = title
            cleanQuery.sort = cleanQuery.order;
            delete cleanQuery.order;
        }

        // 🔥 FIX 2: Mapping status string ke angka yang API Shinigami ngerti
        if (cleanQuery.status === 'ongoing') {
            cleanQuery.status = '1';
        } else if (cleanQuery.status === 'completed') {
            cleanQuery.status = '2';
        }

        // 🔥 FIX 3: Pastikan page selalu ada dan valid
        if (!cleanQuery.page || cleanQuery.page < 1) {
            cleanQuery.page = '1';
        }

        // Ubah jadi format URL (contoh: page=2&genre=action&sort=title)
        const queryString = new URLSearchParams(cleanQuery).toString();
        
        // Tembak ke API list Shinigami
        const targetUrl = `${BASE_API}/manga/list?${queryString}`;
        console.log("[SHINIGAMI API] Manggil:", targetUrl); // Log lebih informatif
        console.log("[SHINIGAMI API] Parameter bersih:", cleanQuery);
        
        const response = await axios.get(targetUrl, { 
            headers: shinigamiHeaders,
            timeout: 10000 // Timeout 10 detik biar nggak hanging
        });
        
        // Log response info untuk debugging
        console.log("[SHINIGAMI API] Response status:", response.status);
        console.log("[SHINIGAMI API] Data count:", 
            Array.isArray(response.data) ? response.data.length : 
            response.data?.data?.length || response.data?.results?.length || 'unknown'
        );
        
        res.json(response.data);
    } catch (error) {
        console.error("[SHINIGAMI API] ERROR:", error.message);
        if (error.response) {
            console.error("[SHINIGAMI API] Status:", error.response.status);
            console.error("[SHINIGAMI API] Data:", error.response.data);
        }
        res.status(500).json({ 
            error: "Gagal ngambil data pencarian/filter",
            message: error.message 
        });
    }
});

module.exports = router;
