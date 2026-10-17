const { protect, adminOnly } = require('./auth');
module.exports = (req, res, next) => protect(req, res, () => adminOnly(req, res, next));
