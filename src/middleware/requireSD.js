// More generic version of requireRole which just checks if it is a valid staff or developer.
// Less precise than requireRole but faster than implementing an array check.
const requireSD = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'staff' && req.user.role !== 'developer') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  next();
};

module.exports = requireSD;