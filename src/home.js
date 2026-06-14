const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

// Base URL target scraping
const TARGET_URL = 'https://web1.mgkomik.cc/';

router.get('/', async (req, res) => {
    try {
        // Fetch HTML dari web target
        const { data } = await axios.get(TARGET_URL);
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

