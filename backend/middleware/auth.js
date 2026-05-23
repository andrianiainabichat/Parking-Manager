const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ success: false, message: 'Token manquant' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token invalide' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'parking_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token expiré ou invalide' });
  }
};
