// File: src/home.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

const BASE_URL = 'https://www.manhwaindo.my';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Referer': BASE_URL
};

// Helper buat ngambil gambar 
function getThumb($, el) {
    const noscript = $(el).find('noscript').html();
    if (noscript) {
        const match = noscript.match(/src=["']([^"']+)["']/);
        if (match) return match[1];
    }
    const img = $(el).find('img');
    return img.attr('data-src') || img.attr('src') || '';
}

// Helper buat ngambil slug dari URL
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
        console.log("🔥 Mengambil data Home dari ManhwaIndo...");
        const response = await axios.get(BASE_URL, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);

        const top_daily = [];
        const project_update = [];
        const latest_update = [];

        // 1. Scraping Popular Today (Slider)
        $('.hothome .bs').each((i, el) => {
            const bsx = $(el).find('.bsx');
            const a = bsx.find('a');
            const title = bsx.find('.tt').text().trim() || a.attr('title');
            const link = a.attr('href');
            
            top_daily.push({
                title: title,
                slug: getSlug(link),
                thumb: getThumb($, bsx),
                type: bsx.find('.typename').text().trim() || "Manhwa",
                rating: bsx.find('.numscore').text().trim() || "0",
                latest_chapter: bsx.find('.epxs').text().trim()
            });
        });

        // 2. Scraping Project Update & Latest Update
        $('.postbody .bixbox').each((i, box) => {
            // Cek judul bixbox-nya (Project Update atau Latest Update)
            const boxTitle = $(box).find('.releases h2').text().trim().toLowerCase();
            
            if (boxTitle.includes('project update') || boxTitle.includes('latest update')) {
                
                $(box).find('.listupd .utao').each((idx, el) => {
                    const luf = $(el).find('.luf');
                    const a = luf.find('a.series');
                    const title = a.find('h4').text().trim() || a.text().trim();
                    const link = a.attr('href');
                    
                    // Ambil 3 chapter terakhir
                    const chapter_list = [];
                    luf.find('ul li').each((j, li) => {
                        const chA = $(li).find('a');
                        const chText = chA.text().trim(); 
                        const chTime = $(li).find('span').text().trim(); 
                        
                        let chSlug = '';
                        const chLink = chA.attr('href');
                        if (chLink) {
                            const parts = chLink.split('/').filter(p => p !== '');
                            chSlug = parts[parts.length - 1];
                        }

                        if (chText) {
                            chapter_list.push({
                                chapter_title: chText,
                                slug: chSlug,
                                time_ago: chTime
                            });
                        }
                    });

                    const mainLatestChapter = chapter_list[0]?.chapter_title || "Ch. ?";
                    const ulClass = luf.find('ul').attr('class') || 'Manhwa';

                    const itemData = {
                        title: title,
                        slug: getSlug(link),
                        thumb: getThumb($, $(el).find('.imgu')),
                        type: ulClass.trim(),
                        rating: "0",
                        latest_chapter: mainLatestChapter,
                        recent_chapters: chapter_list 
                    };

                    // Masukin ke array yang tepat sesuai judul box
                    if (boxTitle.includes('project update')) {
                        project_update.push(itemData);
                    } else if (boxTitle.includes('latest update')) {
                        latest_update.push(itemData);
                    }
                });
            }
        });

        if (top_daily.length === 0 && project_update.length === 0 && latest_update.length === 0) {
            return res.status(500).json({ error: "Gagal mengekstrak elemen HTML." });
        }

        res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=240');
        
        // Return Data
        res.json({
            status: "success",
            data: {
                top_daily: top_daily,
                project_update: project_update,
                recommended_manhwa: latest_update // 🔥 Kita map Latest Update ke recommended_manhwa biar nyambung ke UI "Episode Terbaru" lu!
            }
        });

    } catch (error) {
        console.error("Error Home Proxy:", error.message);
        res.status(500).json({ error: "Gagal terhubung ke ManhwaIndo" });
    }
});

module.exports = router;
