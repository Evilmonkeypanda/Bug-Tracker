const jwt = require('jsonwebtoken');

const verifyToken = (req,res,next) => {
    // Get the authorization header
    const authHeader = req.headers['authorization'];
    // Split the token off of the header
    const token = authHeader && authHeader.split(' ')[1];

    // Quick check if token was actually provided
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    // If the token exists, verify it is correct
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token'});
    }
};
module.exports = verifyToken;