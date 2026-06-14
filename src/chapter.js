// File: src/chapter.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

const BASE_URL = 'https://www.manhwaindo.my/';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Referer': BASE_URL
};

// Lensa Sniper buat narik data JSON dari dalem script
function extractTsReader(html) {
    const searchKey = 'ts_reader.run(';
    const startIdx = html.indexOf(searchKey);
    
    if (startIdx === -1) return null;

    const jsonStartIdx = startIdx + searchKey.length;
    let bracketCount = 0;
    let endIdx = jsonStartIdx;
    let inString = false;
    let escapeNext = false;

    for (let i = jsonStartIdx; i < html.length; i++) {
        const char = html[i];
        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }

        if (!inString) {
            if (char === '{') bracketCount++;
            else if (char === '}') bracketCount--;

            if (bracketCount === 0) {
                endIdx = i + 1;
                break;
            }
        }
    }

    try {
        const jsonStr = html.substring(jsonStartIdx, endIdx);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Gagal parse JSON ts_reader");
        return null;
    }
}

// Helper buat ekstrak slug dari URL penuh
// Contoh: https://www.manhwaindo.my/daytime-in-the-bunker-chapter-20/ -> daytime-in-the-bunker-chapter-20
function getChapterSlugFromUrl(url) {
    if (!url || url.includes('#')) return null;
    const parts = url.split('/').filter(p => p !== '');
    return parts[parts.length - 1];
}

router.get('/:slug', async (req, res) => {
    const slug = req.params.slug;
    const targetUrl = `${BASE_URL}${slug}/`;

    try {
        console.log(`🖼️ Mengambil chapter dari: ${targetUrl}`);
        const response = await axios.get(targetUrl, { headers, timeout: 10000 });
        const html = response.data;
        
        // Coba bongkar data dari ts_reader.run
        const readerData = extractTsReader(html);

        if (!readerData || !readerData.sources || readerData.sources.length === 0) {
            return res.status(404).json({ error: "Gagal menemukan data gambar chapter. Mungkin website sedang diproteksi." });
        }

        // Ambil array images dari source pertama (default)
        const rawImages = readerData.sources[0].images;
        
        // Kadang di Mangastream link gambarnya di-escape, jadi kita bersihin
        const images = rawImages.map(img => img.replace(/\\\//g, '/'));

        // Ambil link navigasi (prev/next) dari objek JSON
        const prevUrl = readerData.prevUrl;
        const nextUrl = readerData.nextUrl;

        const prevSlug = getChapterSlugFromUrl(prevUrl);
        const nextSlug = getChapterSlugFromUrl(nextUrl);

        // Cari tahu chapter ke berapa dari <title> HTML
        const $ = cheerio.load(html);
        const titleText = $('title').text();
        const chMatch = titleText.match(/Chapter\s+(\d+(?:\.\d+)?)/i);
        const currentChapterNumber = chMatch ? parseFloat(chMatch[1]) : 0;

        // Cache 1 jam aja biar cepet di-load sama user
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

        res.json({
            status: "success",
            data: {
                chapter_number: currentChapterNumber,
                images: images,
                prev_chapter_id: prevSlug,
                next_chapter_id: nextSlug
            }
        });

    } catch (error) {
        console.error(`Error mengambil chapter ${slug}:`, error.message);
        res.status(500).json({ error: "Gagal mengambil data chapter dari ManhwaIndo" });
    }
});

module.exports = router;
