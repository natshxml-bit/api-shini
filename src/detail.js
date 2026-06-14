// File: src/detail.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

const BASE_URL = 'https://www.manhwaindo.my/series/';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Referer': 'https://www.manhwaindo.my/'
};

// Helper: Ekstrak gambar (anti-lazyload)
function getThumb($, el) {
    const noscript = $(el).find('noscript').html();
    if (noscript) {
        const match = noscript.match(/src=["']([^"']+)["']/);
        if (match) return match[1];
    }
    const img = $(el).find('img');
    return img.attr('data-src') || img.attr('src') || '';
}

router.get('/:slug', async (req, res) => {
    const slug = req.params.slug;
    const targetUrl = `${BASE_URL}${slug}/`;
    
    try {
        console.log(`📖 Mengambil detail dari: ${targetUrl}`);
        const response = await axios.get(targetUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);

        // 1. Ambil Info Utama
        const infoBox = $('.main-info');
        const title = infoBox.find('h1.entry-title').text().trim();
        const altTitle = infoBox.find('span.alternative').text().trim();
        const thumb = getThumb($, infoBox.find('.thumb'));
        const rating = infoBox.find('.numscore').text().trim() || infoBox.find('.num').text().trim();
        
        // 2. Ambil Metadata (Status, Type, Author, dll)
        let status = 'Unknown', type = 'Manga', author = 'Unknown', artist = 'Unknown', released = 'Unknown', updated = 'Unknown';
        
        infoBox.find('.tsinfo .imptdt').each((i, el) => {
            const text = $(el).text().trim().toLowerCase();
            const val = $(el).find('i').text().trim() || $(el).find('a').text().trim();
            
            if (text.includes('status')) status = val;
            else if (text.includes('type')) type = val;
            else if (text.includes('author')) author = val;
            else if (text.includes('artist')) artist = val;
            else if (text.includes('released')) released = val;
            else if (text.includes('updated')) updated = $(el).find('time').text().trim() || val;
        });

        // 3. Ambil Genre & Sinopsis
        const genres = [];
        $('.mgen a').each((i, el) => genres.push($(el).text().trim()));
        const synopsis = $('.entry-content').text().trim();

        // 4. Ambil Daftar Chapter (YANG PALING PENTING!)
        const chapters = [];
        $('#chapterlist ul li').each((i, el) => {
            const chBox = $(el).find('.eph-num a');
            const chNumText = chBox.find('.chapternum').text().trim() || $(el).attr('data-num');
            const chDate = chBox.find('.chapterdate').text().trim();
            const chLink = chBox.attr('href');
            
            // Ekstrak slug chapter dari URL (contoh: https://.../manga-chapter-10/ -> manga-chapter-10)
            let chSlug = '';
            if (chLink) {
                const parts = chLink.split('/').filter(p => p !== '');
                chSlug = parts[parts.length - 1]; 
            }

            chapters.push({
                chapter_number: chNumText || `Chapter ${$(el).attr('data-num')}`,
                release_date: chDate,
                slug: chSlug
            });
        });

        // Validasi
        if (!title || chapters.length === 0) {
            return res.status(404).json({ error: "Detail manga tidak ditemukan atau tidak ada chapter." });
        }

        const finalData = {
            title,
            alternative_title: altTitle,
            thumb,
            rating,
            status,
            type: type.toUpperCase(),
            author,
            artist,
            release_year: released,
            updated_at: updated,
            genres,
            synopsis,
            total_chapters: chapters.length,
            chapters: chapters // Urutannya udah dari yang terbaru ke terlama otomatis dari sananya
        };

        // Cache hasil scraper biar server lu nggak capek
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        
        res.json({
            status: "success",
            data: { info: finalData, chapters: chapters } // Disamain formatnya biar frontend lu aman
        });

    } catch (error) {
        console.error(`Error mengambil detail ${slug}:`, error.message);
        res.status(500).json({ error: "Gagal mengambil data detail dari ManhwaIndo" });
    }
});

module.exports = router;
