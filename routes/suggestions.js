const express = require('express');
const router = express.Router();
const aiService = require('../api/aiService');
const { isLoggedIn } = require('../middleware');

// @route   GET /suggestions
// @desc    Show 10 AI-generated trip suggestions
// @access  Private
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const data = await aiService.generateSuggestions();
        const fallback = [
            { name: 'Kyoto, Japan', highlights: 'Temples, gardens, traditional culture', bestTime: 'Mar-May or Oct-Nov' },
            { name: 'Queenstown, New Zealand', highlights: 'Adventure sports, stunning landscapes', bestTime: 'Dec-Feb or Jun-Aug' },
            { name: 'Lisbon, Portugal', highlights: 'Historic neighborhoods, food, viewpoints', bestTime: 'Apr-Jun or Sep-Oct' },
            { name: 'Reykjavík, Iceland', highlights: 'Northern Lights, waterfalls, lagoons', bestTime: 'Sep-Mar (Aurora) or Jun-Aug' },
            { name: 'Bali, Indonesia', highlights: 'Beaches, temples, rice terraces', bestTime: 'Apr-Oct' },
            { name: 'Vancouver, Canada', highlights: 'Mountains, seafront, parks', bestTime: 'May-Sep' },
            { name: 'Cape Town, South Africa', highlights: 'Table Mountain, beaches, wine', bestTime: 'Oct-Apr' },
            { name: 'Seville, Spain', highlights: 'Architecture, flamenco, gastronomy', bestTime: 'Mar-May or Sep-Oct' },
            { name: 'Kyiv, Ukraine', highlights: 'History, culture, architecture', bestTime: 'May-Jun or Sep' },
            { name: 'Cusco, Peru', highlights: 'Inca heritage, Machu Picchu gateway', bestTime: 'Apr-Oct' }
        ];
        let suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
        if (suggestions.length < 10) {
            const needed = 10 - suggestions.length;
            suggestions = suggestions.concat(fallback.slice(0, needed));
        } else if (suggestions.length > 10) {
            suggestions = suggestions.slice(0, 10);
        }
        const key = process.env.GOOGLE_CSE_API_KEY;
        const cx = process.env.GOOGLE_CSE_CX;
        const useGoogleImages = (process.env.GOOGLE_IMAGES || '').toLowerCase() === 'on';
        const FAST = (process.env.FAST_SUGGESTIONS || 'on').toLowerCase() !== 'off';

        async function withTimeout(promise, ms) {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), ms);
            try {
                return await promise(ctrl.signal);
            } finally { clearTimeout(t); }
        }
        async function getGoogleImage(name) {
            if (!useGoogleImages || !key || !cx || typeof fetch !== 'function') return null;
            const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(name)}&searchType=image&num=1&safe=active&key=${key}&cx=${cx}`;
            try {
                const r = await withTimeout((signal)=>fetch(url,{signal}), 1200);
                if (!r.ok) return null;
                const j = await r.json();
                const link = j && j.items && j.items[0] && (j.items[0].link || j.items[0].image?.thumbnailLink);
                return link || null;
            } catch (_) { return null; }
        }
        async function getWikipediaImage(name) {
            if (!useGoogleImages || typeof fetch !== 'function') return null;
            const api = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=600&titles=${encodeURIComponent(name)}`;
            try {
                const r = await withTimeout((signal)=>fetch(api,{signal}), 800);
                if (!r.ok) return null;
                const j = await r.json();
                const pages = j && j.query && j.query.pages;
                if (!pages) return null;
                const first = Object.values(pages)[0];
                const src = first && first.thumbnail && first.thumbnail.source;
                return src || null;
            } catch (_) { return null; }
        }
        const withImages = await Promise.all(suggestions.map(async (s, i) => {
            if (FAST) {
                const unsplash = `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(s.name + ',travel,landmark,city')}&sig=${i+1}`;
                const picsum = `https://picsum.photos/seed/${encodeURIComponent(s.name)}/600/400`;
                return { ...s, imageUrl: unsplash, fallbackUrl: picsum };
            }
            const g = await getGoogleImage(s.name);
            const w = g ? null : await getWikipediaImage(s.name);
            const unsplash = `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(s.name + ',travel,landmark,city')}&sig=${i+1}`;
            const picsum = `https://picsum.photos/seed/${encodeURIComponent(s.name)}/600/400`;
            return {
                ...s,
                imageUrl: g || w || unsplash,
                fallbackUrl: picsum
            };
        }));
        res.render('suggestions', { suggestions: withImages });
    } catch (err) {
        console.error(err);
        const fallback = [
            { name: 'Kyoto, Japan', highlights: 'Temples, gardens, traditional culture', bestTime: 'Mar-May or Oct-Nov' },
            { name: 'Queenstown, New Zealand', highlights: 'Adventure sports, stunning landscapes', bestTime: 'Dec-Feb or Jun-Aug' },
            { name: 'Lisbon, Portugal', highlights: 'Historic neighborhoods, food, viewpoints', bestTime: 'Apr-Jun or Sep-Oct' },
            { name: 'Reykjavík, Iceland', highlights: 'Northern Lights, waterfalls, lagoons', bestTime: 'Sep-Mar (Aurora) or Jun-Aug' },
            { name: 'Bali, Indonesia', highlights: 'Beaches, temples, rice terraces', bestTime: 'Apr-Oct' },
            { name: 'Vancouver, Canada', highlights: 'Mountains, seafront, parks', bestTime: 'May-Sep' },
            { name: 'Cape Town, South Africa', highlights: 'Table Mountain, beaches, wine', bestTime: 'Oct-Apr' },
            { name: 'Seville, Spain', highlights: 'Architecture, flamenco, gastronomy', bestTime: 'Mar-May or Sep-Oct' },
            { name: 'Kyiv, Ukraine', highlights: 'History, culture, architecture', bestTime: 'May-Jun or Sep' },
            { name: 'Cusco, Peru', highlights: 'Inca heritage, Machu Picchu gateway', bestTime: 'Apr-Oct' }
        ];
        const key = process.env.GOOGLE_CSE_API_KEY;
        const cx = process.env.GOOGLE_CSE_CX;
        const useGoogleImages = (process.env.GOOGLE_IMAGES || '').toLowerCase() === 'on';
        const FAST = (process.env.FAST_SUGGESTIONS || 'on').toLowerCase() !== 'off';
        async function withTimeout(promise, ms) {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), ms);
            try { return await promise(ctrl.signal); } finally { clearTimeout(t); }
        }
        async function getGoogleImage(name) {
            if (!useGoogleImages || !key || !cx || typeof fetch !== 'function') return null;
            const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(name)}&searchType=image&num=1&safe=active&key=${key}&cx=${cx}`;
            try {
                const r = await withTimeout((signal)=>fetch(url,{signal}), 1200);
                if (!r.ok) return null;
                const j = await r.json();
                const link = j && j.items && j.items[0] && (j.items[0].link || j.items[0].image?.thumbnailLink);
                return link || null;
            } catch (_) { return null; }
        }
        async function getWikipediaImage(name) {
            if (!useGoogleImages || typeof fetch !== 'function') return null;
            const api = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=600&titles=${encodeURIComponent(name)}`;
            try {
                const r = await withTimeout((signal)=>fetch(api,{signal}), 800);
                if (!r.ok) return null;
                const j = await r.json();
                const pages = j && j.query && j.query.pages;
                if (!pages) return null;
                const first = Object.values(pages)[0];
                const src = first && first.thumbnail && first.thumbnail.source;
                return src || null;
            } catch (_) { return null; }
        }
        const withImages = await Promise.all(fallback.map(async (s, i) => {
            if (FAST) {
                const unsplash = `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(s.name + ',travel,landmark,city')}&sig=${i+1}`;
                const picsum = `https://picsum.photos/seed/${encodeURIComponent(s.name)}/600/400`;
                return { ...s, imageUrl: unsplash, fallbackUrl: picsum };
            }
            const g = await getGoogleImage(s.name);
            const w = g ? null : await getWikipediaImage(s.name);
            const unsplash = `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(s.name + ',travel,landmark,city')}&sig=${i+1}`;
            const picsum = `https://picsum.photos/seed/${encodeURIComponent(s.name)}/600/400`;
            return {
                ...s,
                imageUrl: g || w || unsplash,
                fallbackUrl: picsum
            };
        }));
        res.render('suggestions', { suggestions: withImages });
    }
});

module.exports = router;