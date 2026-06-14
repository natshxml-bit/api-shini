const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

// Base URL target scraping
const TARGET_URL = 'https://web1.mgkomik.cc/';

router.get('/', async (req, res) => {
    try {
        // Fetch HTML dari web target dengan Header Palsu biar ga kena 403
        const { data } = await axios.get(TARGET_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.google.com/',
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"'
            }
        });
        
        const $ = cheerio.load(data);

        const projectUpdate = [];
        const komikUpdate = [];
        const trending = [];

        // 1. Scraping Section: Project Update
        $('.project-grid .project-card').each((i, el) => {
            const chapters = [];
            $(el).find('.project-chapter-row').each((idx, chapEl) => {
                chapters.push({
                    chapter: $(chapEl).find('.project-chapter-capsule').text().trim(),
                    url: $(chapEl).find('.project-chapter-capsule').attr('href'),
                    date: $(chapEl).find('.project-chapter-date').text().trim()
                });
            });

            projectUpdate.push({
                title: $(el).find('.project-title').text().trim(),
                slug: $(el).attr('data-slug'),
                cover: $(el).find('.project-cover').attr('src'),
                status: $(el).find('.manga-status-badge').text().trim(),
                type_flag: $(el).find('.flag-badge img').attr('alt'),
                chapters: chapters
            });
        });

        // 2. Scraping Section: Komik Update
        $('.manga-grid .manga-card').each((i, el) => {
            const chapters = [];
            $(el).find('.chapter-row').each((idx, chapEl) => {
                chapters.push({
                    chapter: $(chapEl).find('.chapter-capsule').text().trim(),
                    url: $(chapEl).find('.chapter-capsule').attr('href'),
                    date: $(chapEl).find('.chapter-date').text().trim()
                });
            });

            komikUpdate.push({
                title: $(el).find('.manga-title').text().trim(),
                slug: $(el).attr('data-slug'),
                cover: $(el).find('.manga-cover').attr('src'),
                status: $(el).find('.manga-status-badge').text().trim(),
                type_flag: $(el).find('.flag-badge img').attr('alt'),
                chapters: chapters
            });
        });

        // 3. Scraping Section: Komik Trending (Sidebar)
        $('.trending-list .trending-item').each((i, el) => {
            const chapters = [];
            $(el).find('.trending-chapter-item').each((idx, chapEl) => {
                chapters.push({
                    chapter: $(chapEl).find('.trending-chapter-link').text().trim(),
                    url: $(chapEl).find('.trending-chapter-link').attr('href'),
                    date: $(chapEl).find('.trending-chapter-date').text().trim()
                });
            });

            trending.push({
                title: $(el).find('.trending-title').text().trim(),
                cover: $(el).find('.trending-cover').attr('src'),
                url: $(el).find('.trending-title').attr('href'),
                chapters: chapters
            });
        });

        // Return response dalam bentuk JSON
        res.status(200).json({
            status: true,
            message: "Berhasil mengambil data home",
            data: {
                projectUpdate,
                komikUpdate,
                trending
            }
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Gagal scraping data",
            error: error.message
        });
    }
});

module.exports = router;
