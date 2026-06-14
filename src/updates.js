// File: src/updates.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

const BASE_URL = 'https://www.manhwaindo.my/project-updates';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Referer': 'https://www.manhwaindo.my/'
};

// Helper buat ngambil gambar dari noscript
function getThumb($, el) {
    const noscript = $(el).find('noscript').html();
    if (noscript) {
        const match = noscript.match(/src=["']([^"']+)["']/);
        if (match) return match[1];
    }
    const img = $(el).find('img');
    return img.attr('data-src') || img.attr('src') || '';
}

// Helper slug
function getSlug(url) {
    if (!url) return '';
    const parts = url.split('/series/');
    if (parts.length > 1) {
        return parts[1].replace(/\//g, '');
    }
    return '';
}

router.get('/', async (req, res) => {
    try {
        // Ambil query page (contoh: /api/updates?page=2)
        const page = req.query.page || 1;
        let targetUrl = BASE_URL;
        
        // Kalau pagenya lebih dari 1, kita format URL-nya ala Mangastream
        if (page > 1) {
            targetUrl = `${BASE_URL}/page/${page}/`;
        }

        console.log(`🔥 Mengambil Project Updates dari: ${targetUrl}`);
        const response = await axios.get(targetUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);

        const project_update = [];

        // Looping div update 
        $('.listupd .bs.styletere').each((i, el) => {
            const bsx = $(el).find('.bsx');
            const a = bsx.find('a');
            
            const title = bsx.find('.tt').text().trim() || a.attr('title');
            const link = a.attr('href');
            const thumb = getThumb($, bsx);
            const type = bsx.find('.typename').text().trim() || "Manhwa";
            
            // Ambil info bab terbaru dan tanggal rilisnya
            const latest_chapter = bsx.find('.epxs').text().trim() || "Ch. ?";
            const time_ago = bsx.find('.epxdate').text().trim() || "Baru saja";

            // Di halaman ini nggak dikasih rating, jadi kita set ke 0
            project_update.push({
                title: title,
                slug: getSlug(link),
                thumb: thumb,
                type: type,
                rating: "0",
                latest_chapter: latest_chapter,
                time_ago: time_ago
            });
        });

        // Ambil total halaman untuk pagination dari HTML
        let totalPages = 1;
        $('.pagination a.page-numbers').each((i, el) => {
            const pageNum = parseInt($(el).text().trim());
            if (!isNaN(pageNum) && pageNum > totalPages) {
                totalPages = pageNum;
            }
        });

        if (project_update.length === 0) {
             return res.status(404).json({ error: "Data project update tidak ditemukan. Mungkin halaman kelewat batas." });
        }

        // Cache 1 menit karena ini halaman yang paling sering mantau update terbaru
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        
        // Bungkus data biar cocok dengan format API Tsukinest lu
        res.json({
            status: "success",
            data: project_update,
            pagination: {
                current_page: parseInt(page),
                total_pages: totalPages
            }
        });

    } catch (error) {
        console.error("Error Updates Proxy:", error.message);
        res.status(500).json({ error: "Gagal memuat halaman Project Updates dari ManhwaIndo." });
    }
});

module.exports = router;
