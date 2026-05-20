const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/db');

const router = express.Router();

// Route to register a new user
// TODO: Include a default admin user, only admin can create staff or developer accounts.
router.post('/register', async (req, res, next) =>{
    try {
        // Get user information
        const { username, password, role } = req.body;
        // Verify that information
        if (!username || !password || !role){
            return res.status(400).json({ error: 'Username, password, and role are required.' });
        }
        if (!['reporter', 'staff', 'developer'].includes(role)){
            return res.status(400).json({ error: 'Invalid Role'});
        }
        // Hash the password. No plaintext here!
        const passwordHash = await bcrypt.hash(password, 10);
        // Create a new unique user ID
        const userId = crypto.randomUUID();
        // Prepare insert statement. Prepare used to prevent injection and other attacks.
        const stmt = db.prepare('INSERT INTO users (id,username,password_hash, role) VALUES (?,?,?,?) ');
        stmt.run(userId, username, passwordHash,role);
        // Success returns user information.
        res.status(201).json({
            data: {userId, username, role}
        });
    } catch (err){
        next(err); // Passes errors forwards.
    }
});

// Login route
router.post('/login', async (req,res,next) =>{
    try {
            // accepts username and password
            const {username, password} = req.body;
            // Verify both at the same time
            if (!username || !password){
                return res.status(400).json({error: 'Username and password required.'});
            }
            const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
            const user = stmt.get(username);
            // Verify user exists but be vague, can't let someone know if they have a correct username in case of attacks.
            if (!user){
                return res.status(401).json({error: 'Invalid credentials'});
            }

            // Re-hash password to check if it matches stored password.
            const passwordMatch = await bcrypt.compare(password, user.password_hash);

            if(!passwordMatch){
                return res.status(401).json({error: 'Invalid credentials'});
            }
            // Create the user token header
            const token = jwt.sign({
                userId: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            {expiresIn: '24h'}
    );
    res.json({
        data: {
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        }
    });
    } catch(err){
        next(err);
    }
});
module.exports = router;