// Use after auth(). Role is read from the signed token, not from the client.
function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ error: 'Admin access only' });
}

module.exports = adminOnly;
