/**
 * [LEGACY] Auth Middleware
 * Used by Admin Dashboard routes (moviesRoute, artistRoutes, etc).
 * For new features, use 'auth.js'.
 */
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decryptedToken = jwt.verify(token, process.env.jwt_secret);
    req.userId = decryptedToken.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: error.message, success: false });
  }
};
