const secret = process.env.JWT_SECRET || process.env.secret_jwt;
if (!secret) throw new Error('JWT_SECRET must be configured');
module.exports = secret;
