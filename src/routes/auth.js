const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/db');

const router = express.Router();

router.post('/register', async (req, res, next) =>{
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role){
            return res.status(400).json({ error: 'Username, password, and role are required.' });
        }
        if (!['reporter', 'staff', 'developer'].includes(role)){
            return res.status(400).json({ error: 'Invalid Role'});
        }
        const passwordHash = await bcrypt.hash(password, 10);

        const userId = crypto.randomUUID();

        const stmt = db.prepare('INSERT INTO users (id,username,password_hash, role) VALUES (?,?,?,?) ');
        stmt.run(userId, username, passwordHash,role);

        res.status(201).json({
            data: {userId, username, role}
        });
    } catch (err){
        next(err); // Passes errors forwards.
    }
});

router.post('/login', async (req,res,next) =>{
    try {
            const {username, password} = req.body;
            if (!username || !password){
                return res.status(400).json({error: 'Username and password required.'});
            }
            const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
            const user = stmt.get(username);

            if (!user){
                return res.status(401).json({error: 'Invalid credentials'});
            }

            const passwordMatch = await bcrypt.compare(password, user.password_hash);

            if(!passwordMatch){
                return res.status(401).json({error: 'Invalid credentials'});
            }
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