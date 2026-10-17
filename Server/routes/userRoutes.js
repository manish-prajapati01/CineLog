const router = require('express').Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middlewares/auth');
router.get('/get-current-user', protect, (req, res) => res.json({ success: true, data: req.user }));
router.get('/get-all-users', protect, adminOnly, async (req, res, next) => {
  try { res.json({ success: true, data: await User.find().select('name email role isActive createdAt avatar').sort({ createdAt: -1 }).limit(500) }); }
  catch (error) { next(error); }
});
module.exports = router;
