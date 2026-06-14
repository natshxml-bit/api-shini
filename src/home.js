// File: src/home.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

const BASE_URL = 'https://www.manhwaindo.my';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': BASE_URL,
    'Connection': 'keep-alive'
};

// Helper buat ngambil gambar dari elemen
function getThumb($, el) {
    const $el = $(el);

    // Coba ambil dari noscript dulu (real image URL)
    const noscript = $el.find('noscript').html();
    if (noscript) {
        const match = noscript.match(/src=["']([^"']+)["']/);
        if (match) return match[1];
    }

    // Coba dari img tag
    const img = $el.find('img');
    const dataSrc = img.attr('data-src');
    const src = img.attr('src');

    // Kalau src-nya SVG placeholder, ambil data-src
    if (src && src.includes('svg+xml')) {
        return dataSrc || '';
    }

    return dataSrc || src || '';
}

// Helper buat ngambil slug dari URL
function getSlug(url) {
    if (!url) return '';
    const parts = url.split('/series/');
    if (parts.length > 1) {
        return parts[1].replace(/\/$/, '');
    }
    return '';
}

// Helper buat ekstrak rating dari width percentage
function getRating($, el) {
    const rtb = $(el).find('.rtb span');
    if (rtb.length) {
        const style = rtb.attr('style') || '';
        const match = style.match(/width:(\d+(?:\.\d+)?)%/);
        if (match) {
            return match[1];
        }
    }
    const numscore = $(el).find('.numscore').text().trim();
    return numscore || '0';
}

router.get('/', async (req, res) => {
    try {
        console.log("🔥 Mengambil data Home dari ManhwaIndo...");

        const response = await axios.get(BASE_URL, { 
            headers, 
            timeout: 15000,
            maxRedirects: 5
        });

        const $ = cheerio.load(response.data);

        const top_daily = [];
        const project_update = [];
        const latest_update = [];

        // ============================================
        // 1. Scraping Popular Today (Slider)
        // ============================================
        $('.hothome .bs, .popularslider .bs, .popconslide .bs').each((i, el) => {
            const bsx = $(el).find('.bsx');
            const a = bsx.find('a').first();
            const title = bsx.find('.tt').text().trim() || a.attr('title') || '';
            const link = a.attr('href') || '';
            const limit = bsx.find('.limit');

            top_daily.push({
                title: title,
                slug: getSlug(link),
                thumb: getThumb($, limit),
                type: bsx.find('.typename').text().trim() || 'Manhwa',
                rating: getRating($, bsx),
                latest_chapter: bsx.find('.epxs').text().trim() || ''
            });
        });

        // ============================================
        // 2. Scraping Project Update & Latest Update
        // ============================================
        $('.postbody .bixbox').each((i, box) => {
            const boxTitle = $(box).find('.releases h2, .releases h3').text().trim().toLowerCase();

            if (boxTitle.includes('project update') || boxTitle.includes('latest update')) {

                $(box).find('.listupd .utao').each((idx, el) => {
                    const uta = $(el).find('.uta');
                    const luf = uta.find('.luf');
                    const a = luf.find('a.series').first();
                    const title = a.find('h4').text().trim() || a.text().trim() || '';
                    const link = a.attr('href') || '';

                    // Ambil thumbnail dari .imgu
                    const imgu = uta.find('.imgu');

                    // Ambil 3 chapter terakhir
                    const chapter_list = [];
                    luf.find('ul li').each((j, li) => {
                        const chA = $(li).find('a').first();
                        const chText = chA.text().trim(); 
                        const chTime = $(li).find('span').text().trim(); 

                        let chSlug = '';
                        const chLink = chA.attr('href') || '';
                        if (chLink) {
                            const parts = chLink.split('/').filter(p => p !== '');
                            chSlug = parts[parts.length - 1] || '';
                        }

                        if (chText) {
                            chapter_list.push({
                                chapter_title: chText,
                                slug: chSlug,
                                time_ago: chTime
                            });
                        }
                    });

                    const mainLatestChapter = chapter_list[0]?.chapter_title || 'Ch. ?';
                    const ulClass = luf.find('ul').attr('class') || 'Manhwa';

                    const itemData = {
                        title: title,
                        slug: getSlug(link),
                        thumb: getThumb($, imgu),
                        type: ulClass.trim(),
                        rating: '0',
                        latest_chapter: mainLatestChapter,
                        recent_chapters: chapter_list 
                    };

                    if (boxTitle.includes('project update')) {
                        project_update.push(itemData);
                    } else if (boxTitle.includes('latest update')) {
                        latest_update.push(itemData);
                    }
                });
            }
        });

        // ============================================
        // Validasi & Response
        // ============================================
        if (top_daily.length === 0 && project_update.length === 0 && latest_update.length === 0) {
            return res.status(500).json({ 
                status: 'error',
                error: 'Gagal mengekstrak elemen HTML. Struktur website mungkin berubah.' 
            });
        }

        res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=240');

        res.json({
            status: 'success',
            source: BASE_URL,
            scraped_at: new Date().toISOString(),
            data: {
                top_daily: top_daily,
                project_update: project_update,
                recommended_manhwa: latest_update
            }
        });

    } catch (error) {
        console.error('Error Home Proxy:', error.message);
        res.status(500).json({ 
            status: 'error',
            error: 'Gagal terhubung ke ManhwaIndo',
            detail: error.message 
        });
    }
});

module.exports = router;
