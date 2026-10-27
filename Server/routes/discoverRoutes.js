const router = require('express').Router();
const tmdb = require('../services/tmdbService');
router.get('/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    if (!['movie', 'tv'].includes(type)) return res.status(400).json({ message: 'Invalid media type' });
    const page = Math.max(1, Math.min(500, Math.floor(Number(req.query.page)) || 1));
    const allowed = ['popularity.desc', 'vote_average.desc', type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc'];
    const params = { page, sort_by: allowed.includes(req.query.sort) ? req.query.sort : 'popularity.desc' };
    if (/^\d{4}$/.test(req.query.year || '')) {
      if (type === 'tv') {
        params['air_date.gte'] = `${req.query.year}-01-01`;
        params['air_date.lte'] = `${req.query.year}-12-31`;
      } else params.year = req.query.year;
    }
    if (req.query.upcoming === 'true') {
      const today = new Date().toISOString().slice(0,10);
      delete params.year;
      delete params['air_date.gte']; delete params['air_date.lte'];
      params[type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte'] = today;
      params.sort_by = req.query.order === 'date' ? (type === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc') : 'popularity.desc';
    }
    if (/^\d+$/.test(req.query.genre || '')) params.with_genres = req.query.genre;
    if (/^[a-z]{2}$/.test(req.query.language || '') || req.query.language === 'indian') params.language = req.query.language;
    if (Number(req.query.rating) >= 1 && Number(req.query.rating) <= 9) params.vote_average_gte = Number(req.query.rating);
    res.json({ success: true, ...await (type === 'movie' ? tmdb.discoverMovies(params) : tmdb.discoverTV(params)) });
  } catch (error) { next(error); }
});
router.get('/:type/:id/providers', async (req, res, next) => {
  try {
    if (!['movie', 'tv'].includes(req.params.type) || !/^\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Invalid title' });
    const data = await tmdb.getWatchProviders(req.params.type, req.params.id);
    res.json({ success: true, data: data.results || {} });
  } catch (error) { next(error); }
});
module.exports = router;
