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
        const [project, top, manhwa] = await Promise.all([
            axios.get(`${BASE_API}/manga/list?type=project&page=1&page_size=10&is_update=true&sort=latest`, { headers: shinigamiHeaders }),
            axios.get(`${BASE_API}/manga/top?filter=daily&page=1&page_size=10`, { headers: shinigamiHeaders }),
            axios.get(`${BASE_API}/manga/list?format=manhwa&page=1&page_size=10&is_recommended=true&sort=latest`, { headers: shinigamiHeaders })
        ]);

        res.json({
            status: "success",
            data: {
                project_update: project.data.data,
                top_daily: top.data.data,
                recommended_manhwa: manhwa.data.data
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Gagal ngambil data Homepage" });
    }
});

module.exports = router;
