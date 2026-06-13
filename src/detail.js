const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE_API = 'https://api.shngm.io/v1';
const shinigamiHeaders = {
    'Accept': 'application/json',
    'Origin': 'https://g.shinigami.asia',
    'Referer': 'https://g.shinigami.asia/',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/139.0.0.0 Mobile Safari/537.36'
};

router.get('/:id', async (req, res) => {
    try {
        const mangaId = req.params.id;
        
        // Kita set page_size=200 biar langsung keambil banyak chapter sekaligus
        const chapterListUrl = `${BASE_API}/chapter/${mangaId}/list?page=1&page_size=200&sort_by=chapter_number&sort_order=desc`;
        const detailInfoUrl = `${BASE_API}/manga/detail/${mangaId}`;

        // Sedot Info Komik & Daftar Chapter secara BERSAMAAN!
        const [infoResponse, chapterResponse] = await Promise.all([
            axios.get(detailInfoUrl, { headers: shinigamiHeaders }),
            axios.get(chapterListUrl, { headers: shinigamiHeaders })
        ]);

        // Gabungin datanya ke dalam satu JSON yang rapi
        res.json({
            status: "success",
            data: {
                info: infoResponse.data.data,       // Sinopsis, Judul, Cover, dll
                chapters: chapterResponse.data.data // Array daftar chapter
            }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Gagal ngambil detail manhwa dan chapter" });
    }
});

module.exports = router;
