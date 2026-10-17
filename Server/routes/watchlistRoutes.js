const router = require('express').Router();
const Watchlist = require('../models/Watchlist');
const { protect } = require('../middlewares/auth');
router.use(protect);
const valid = (id, type) => Number.isSafeInteger(Number(id)) && Number(id) > 0 && ['movie', 'tv'].includes(type);
router.get('/', async (req, res, next) => {
  try { const list = await Watchlist.findOne({ userId: req.userId }); res.json({ success: true, data: list?.items || [] }); } catch (e) { next(e); }
});
router.post('/', async (req, res, next) => {
  try {
    const { tmdbId, mediaType, title, posterPath } = req.body;
    if (!valid(tmdbId, mediaType) || typeof title !== 'string' || !title.trim() || title.length > 300) return res.status(400).json({ message: 'A valid title and media type are required' });
    try { await Watchlist.updateOne({ userId: req.userId }, { $setOnInsert: { items: [] } }, { upsert: true }); } catch (e) { if (e.code !== 11000) throw e; }
    const list = await Watchlist.findOneAndUpdate({ userId: req.userId, items: { $not: { $elemMatch: { tmdbId: Number(tmdbId), mediaType } } } }, { $push: { items: { tmdbId: Number(tmdbId), mediaType, title: title.trim(), posterPath, status: 'planned' } } }, { new: true, runValidators: true });
    if (!list) return res.status(409).json({ message: 'Already in your library' });
    res.status(201).json({ success: true, data: list.items });
  } catch (e) { next(e); }
});
router.patch('/:tmdbId/:mediaType', async (req, res, next) => {
  try {
    const { tmdbId, mediaType } = req.params;
    if (!valid(tmdbId, mediaType)) return res.status(400).json({ message: 'Invalid title' });
    const update = {};
    for (const field of ['status', 'collectionName', 'notes']) if (req.body[field] !== undefined) update[`items.$.${field}`] = req.body[field];
    if (req.body.status) update['items.$.watchedAt'] = req.body.status === 'watched' ? new Date() : null;
    if (req.body.watchedAt !== undefined) {
      const date = new Date(req.body.watchedAt);
      if (Number.isNaN(date.getTime()) || date > new Date()) return res.status(400).json({ message: 'Choose a valid past viewing date' });
      update['items.$.watchedAt'] = date;
      update['items.$.status'] = 'watched';
    }
    const list = await Watchlist.findOneAndUpdate({ userId: req.userId, items: { $elemMatch: { tmdbId: Number(tmdbId), mediaType } } }, { $set: update }, { new: true, runValidators: true });
    if (!list) return res.status(404).json({ message: 'Title not in your library' });
    res.json({ success: true, data: list.items });
  } catch (e) { if (e.name === 'ValidationError') e.status = 400; next(e); }
});
router.delete('/:tmdbId/:mediaType', async (req, res, next) => {
  try {
    if (!valid(req.params.tmdbId, req.params.mediaType)) return res.status(400).json({ message: 'Invalid title' });
    const list = await Watchlist.findOneAndUpdate({ userId: req.userId }, { $pull: { items: { tmdbId: Number(req.params.tmdbId), mediaType: req.params.mediaType } } }, { new: true });
    res.json({ success: true, data: list?.items || [] });
  } catch (e) { next(e); }
});
router.get('/check/:tmdbId/:mediaType', async (req, res, next) => {
  try { const list = await Watchlist.findOne({ userId: req.userId }); res.json({ success: true, inWatchlist: list?.hasItem(Number(req.params.tmdbId), req.params.mediaType) || false }); } catch (e) { next(e); }
});
module.exports = router;
