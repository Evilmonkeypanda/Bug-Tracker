const requireRole = (requireRole) => {

    return (req,res, next) => {
        // check user exists. req.user is set by auth.js
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication Required'});
        }
        // Check user has permission to access.
        if (req.user.role !== requireRole){
            return res.status(403).json({ error: 'Insufficient permissions'});
        }
        // If both checks pass then proceed.
        next();
    };
};

module.exports = requireRole;