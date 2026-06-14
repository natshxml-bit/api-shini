// File: src/detail.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

const BASE_URL = 'https://www.manhwaindo.my';

// Rotasi User-Agent
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
];

function getRandomUA() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function getHeaders() {
    return {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
    };
}

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

// Helper: Ekstrak rating dari width percentage
function getRating($, el) {
    const rtb = $(el).find('.rtb span');
    if (rtb.length) {
        const style = rtb.attr('style') || '';
        const match = style.match(/width:(\d+(?:\.\d+)?)%/);
        if (match) return match[1];
    }
    const numscore = $(el).find('.numscore').text().trim() || $(el).find('.num').text().trim();
    return numscore || '0';
}

// Fungsi utama scraping dengan retry
async function scrapeDetail(slug) {
    const targetUrl = `${BASE_URL}/series/${slug}/`;
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            console.log(`📖 Attempt ${attempt + 1}: Mengambil detail dari: ${targetUrl}`);

            const response = await axios.get(targetUrl, { 
                headers: getHeaders(), 
                timeout: 15000,
                maxRedirects: 5,
                httpAgent: new (require('http').Agent)({ keepAlive: false }),
                httpsAgent: new (require('https').Agent)({ keepAlive: false }),
            });

            const $ = cheerio.load(response.data);

            // 1. Ambil Info Utama
            const infoBox = $('.main-info');
            const title = infoBox.find('h1.entry-title').text().trim();
            const altTitle = infoBox.find('span.alternative').text().trim();
            const thumb = getThumb($, infoBox.find('.thumb'));
            const rating = getRating($, infoBox);

            // 2. Ambil Metadata
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

            // 4. Ambil Daftar Chapter
            const chapters = [];
            $('#chapterlist ul li').each((i, el) => {
                const chBox = $(el).find('.eph-num a');
                const chNumText = chBox.find('.chapternum').text().trim() || $(el).attr('data-num');
                const chDate = chBox.find('.chapterdate').text().trim();
                const chLink = chBox.attr('href');

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
                throw new Error('Detail manga tidak ditemukan atau tidak ada chapter.');
            }

            return {
                status: 'success',
                source: targetUrl,
                scraped_at: new Date().toISOString(),
                attempt: attempt + 1,
                data: {
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
                    chapters: chapters
                }
            };

        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt + 1} failed:`, error.message);

            if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    }

    throw lastError;
}

router.get('/:slug', async (req, res) => {
    const slug = req.params.slug;

    try {
        const result = await scrapeDetail(slug);

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        res.json(result);

    } catch (error) {
        console.error(`Error mengambil detail ${slug}:`, error.message);

        let statusCode = 500;
        let errorMsg = 'Gagal mengambil data detail dari ManhwaIndo';

        if (error.response) {
            statusCode = error.response.status;
            if (error.response.status === 404) {
                errorMsg = 'Manga tidak ditemukan.';
            } else if (error.response.status === 403) {
                errorMsg = 'ManhwaIndo memblokir akses (403). Website mungkin menggunakan proteksi Cloudflare/WAF.';
            } else if (error.response.status === 429) {
                errorMsg = 'Terlalu banyak request (429). Coba lagi nanti.';
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMsg = 'Request timeout. Server terlalu lambat merespons.';
        }

        res.status(statusCode).json({ 
            status: 'error',
            error: errorMsg,
            detail: error.message,
            code: error.code || null,
            response_status: error.response?.status || null
        });
    }
});

module.exports = router;
