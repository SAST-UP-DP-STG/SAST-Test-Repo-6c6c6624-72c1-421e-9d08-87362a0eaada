const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  const cookieToken = req.cookies && req.cookies.token ? req.cookies.token : null;
  const token = bearer || cookieToken;

  if (!token) {
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Authentication required' });
    return res.redirect('/login');
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    return next();
  } catch (e) {
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Invalid token' });
    res.clearCookie('token');
    return res.redirect('/login');
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Authentication required' });
    return res.redirect('/login');
  }
  if (req.user.role !== 'admin') {
    if (req.path.startsWith('/api/')) return res.status(403).json({ error: 'Admin role required' });
    return res.status(403).render('dashboard', { title: 'Forbidden', user: null, tokenCount: 0, message: 'Admin role required' });
  }
  next();
}

module.exports = { authenticateJWT, requireAdmin };
