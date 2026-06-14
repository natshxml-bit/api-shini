const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

const BASE_URL = 'https://www.manhwaindo.my/series/';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Referer': 'https://www.manhwaindo.my/'
};

function getThumb($, el) {
    const noscript = $(el).find('noscript').html();
    if (noscript) {
        const match = noscript.match(/src=["']([^"']+)["']/);
        if (match) return match[1];
    }
    const img = $(el).find('img');
    return img.attr('data-src') || img.attr('src') || '';
}

function getSlug(url) {
    if (!url) return '';
    const parts = url.split('/series/');
    if (parts.length > 1) {
        return parts[1].replace(/\//g, '');
    }
    const parts2 = url.split('.my/');
    if (parts2.length > 1) {
         return parts2[1].replace(/\//g, '');
    }
    return '';
}

const genreMap = {
    "action": "3", "adventure": "12", "comedy": "5", "crime": "1764", "demons": "217", 
    "drama": "18", "ecchi": "22", "fantasy": "13", "game": "14", "gender bender": "112", 
    "gore": "48", "harem": "23", "historical": "191", "horror": "53", "isekai": "28", 
    "josei": "41", "kids": "6839", "magic": "58", "martial arts": "51", "mature": "30", 
    "mecha": "88", "medical": "162", "military": "117", "mystery": "60", "police": "964", 
    "psychological": "61", "reincarnation": "46", "romance": "16", "school": "56", 
    "school life": "6", "sci-fi": "34", "seinen": "31", "shoujo": "125", "shounen": "10", 
    "slice of life": "7", "smut": "6670", "sports": "276", "super power": "97", 
    "superhero": "522", "supernatural": "39", "survival": "7026", "thriller": "119", 
    "tragedy": "42", "vampire": "828", "villainess": "6896", "webtoons": "215", 
    "wuxia": "520", "yaoi": "7185", "yuri": "81"
};

router.get('/', async (req, res) => {
    try {
        const params = new URLSearchParams();
        const q = req.query;

        if (q.q) {
            params.set('s', q.q);
            var targetUrl = `https://www.manhwaindo.my/?${params.toString()}`;
            if (q.page && q.page > 1) {
                targetUrl = `https://www.manhwaindo.my/page/${q.page}/?${params.toString()}`;
            }
        } else {
            const order = q.order || q.sort;
            if (order) {
                if (order === 'latest' || order === 'update') params.set('order', 'update');
                else if (order === 'popular') params.set('order', 'popular');
                else if (order === 'a-z' || order === 'title') params.set('order', 'title');
                else if (order === 'z-a' || order === 'titlereverse') params.set('order', 'titlereverse');
                else if (order === 'added') params.set('order', 'latest');
                else params.set('order', order);
            } else {
                params.set('order', 'update');
            }

            if (q.status) {
                const st = q.status.toLowerCase();
                if (st === '1' || st === 'ongoing') params.set('status', 'ongoing');
                else if (st === '2' || st === 'completed') params.set('status', 'completed');
                else if (st === 'hiatus') params.set('status', 'hiatus');
            }

            const type = q.type || q.format; 
            if (type) params.set('type', type.toLowerCase());

            if (q.genre) {
                const genreQuery = q.genre.toLowerCase();
                const genreId = genreMap[genreQuery];
                if (genreId) {
                    params.set('genre[]', genreId); 
                }
            }

            var targetUrl = `${BASE_URL}?${params.toString()}`;
            if (q.page && q.page > 1) {
                targetUrl = `${BASE_URL}page/${q.page}/?${params.toString()}`;
            }
        }

        console.log("🔍 Mencari komik di:", decodeURIComponent(targetUrl));
        const response = await axios.get(targetUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);
        
        const searchResults = [];

        $('.listupd .bs').each((i, el) => {
            const bsx = $(el).find('.bsx');
            const a = bsx.find('a');
            
            const title = bsx.find('.tt').text().trim() || a.attr('title');
            const link = a.attr('href');
            const thumb = getThumb($, bsx);
            const type = bsx.find('.typename').text().trim() || "Manga";
            const rating = bsx.find('.numscore').text().trim() || "0";
            const latest_chapter = bsx.find('.epxs').text().trim() || "Ch. ?";

            searchResults.push({
                title: title,
                slug: getSlug(link),
                thumb: thumb,
                type: type.toUpperCase(),
                rating: rating,
                latest_chapter: latest_chapter
            });
        });

        if (searchResults.length === 0) {
            return res.status(404).json({ error: "Data tidak ditemukan atau habis." });
        }

        let totalPages = 1;
        $('.pagination a.page-numbers').each((i, el) => {
            const pageNum = parseInt($(el).text().trim());
            if (!isNaN(pageNum) && pageNum > totalPages) {
                totalPages = pageNum;
            }
        });

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        
        res.json({
            status: "success",
            data: searchResults,
            pagination: {
                current_page: q.page ? parseInt(q.page) : 1,
                total_pages: totalPages
            }
        });

    } catch (error) {
        console.error("Error Search Proxy:", error.message);
        res.status(500).json({ error: "Gagal memuat data pencarian dari ManhwaIndo" });
    }
});

module.exports = router;
