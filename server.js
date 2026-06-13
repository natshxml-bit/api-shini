const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// Import Rute
const homeRoute = require('./src/home');
const detailRoute = require('./src/detail');
const chapterRoute = require('./src/chapter');
const searchRoute = require('./src/search');

app.get('/', (req, res) => {
    res.json({
        message: "pake ajalah ",
        status: "Server Online",
        intruksi: `

1. HOME: GET /api/home
2. DETAIL: GET /api/detail/:id
3. CHAPTER: GET /api/chapter/:id
4. SEARCH & FILTER: GET /api/search?parameter=value
   - Search: /api/search?q=judul
   - Status: /api/search?status=1 (Ongoing) / 2 (Completed)
   - Format: /api/search?format=manhwa
   - Genre: /api/search?genre=action
   - Pagination: /api/search?page=1&page_size=24
`, 
        endpoints: [
            "/api/home",
            "/api/detail/:id",
            "/api/chapter/:id",
            "/api/search"
        ]
    });
});

app.use('/api/home', homeRoute);
app.use('/api/detail', detailRoute);
app.use('/api/chapter', chapterRoute);
app.use('/api/search', searchRoute);

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(` Server Backend http://localhost:${PORT}`);
    });
}

module.exports = app;
