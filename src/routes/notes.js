const express = require('express');
const crypto = require('crypto');
const db = require('../db/db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const requireSD = require('../middleware/requireSD');

const router = express.Router({mergeParams: true}); // Merge params to allow bug_id to be passed through.

router.post('/', verifyToken, requireRole('developer'), async (req,res,next) => {
    try{
        // First check that the bug exists
        const bugStmt = db.prepare('SELECT * FROM bug_reports WHERE id = ?');
        const bugId = req.params.id;
        const bug = bugStmt.get(bugId);
        if (!bug){
            return res.status(404).json({ error: 'Bug not found!'});
        }

        // Bug does exist, create a new note entry including the bug id for reference.
        // Get body content
        const {content} = req.body;
        // check content is populated
        if (!content || !content.trim()){
            return res.status(400).json({error: 'Note content is required.'});
        }
        // Create unique note ID
        const noteId = crypto.randomUUID();
        // Get user ID
        const dev_id = req.user.userId;
        const noteStmt = db.prepare('INSERT INTO dev_notes (id,bug_report_id,author_id,content) VALUES (?,?,?,?)');
        noteStmt.run(noteId,bugId,dev_id, content);
        res.status(201).json({
            data: {
                id: noteId,
                bug_report_id: bugId,
                author_id: dev_id,
                content,
                message: 'Note added successfully.'
            }
        });
    } catch (err){
        next(err);
    }
});

module.exports = router;