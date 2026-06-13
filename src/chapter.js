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

router.get('/:id', async (req, res) => {
    try {
        const chapterId = req.params.id;
        const response = await axios.get(`${BASE_API}/chapter/detail/${chapterId}`, { headers: shinigamiHeaders });
        
        const rawData = response.data.data;
        const baseUrl = rawData.base_url;
        const folderPath = rawData.chapter.path;
        
        const imageUrls = rawData.chapter.data.map(fileName => `${baseUrl}${folderPath}${fileName}`);

        res.json({
            status: "success",
            chapter_number: rawData.chapter_number,
            images: imageUrls,
            prev_chapter: rawData.prev_chapter_id,
            next_chapter: rawData.next_chapter_id
        });
    } catch (error) {
        res.status(500).json({ error: "Gagal ngambil gambar chapter" });
    }
});

module.exports = router;
