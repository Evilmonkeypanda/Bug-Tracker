const express = require('express');
const crypto = require('crypto');
const db = require('../db/db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const requireSD = require('../middleware/requireSD');

const router = express.Router();

router.post('/', verifyToken, requireRole('reporter'), async (req, res, next) => {
    try {
            const {title, description, steps_to_reproduce, severity } = req.body;

            if (!title || !description || !severity){
                return res.status(400).json({ error: 'Title, Description, and Severity are required.'});
            }
            const validSeverities = ['low','medium','high','critical'];
            if (!validSeverities.includes(severity)){
                return res.status(400).json({ error: 'Invalid severity level.'});
            }
            const bugId = crypto.randomUUID();
            const reporterId = req.user.userId;

            const stmt = db.prepare(`INSERT INTO bug_reports (id, reporter_id, title, description, steps_to_reproduce, severity, status) VALUES (?,?,?,?,?,?, 'pending')`);
            stmt.run(bugId,reporterId,title,description,steps_to_reproduce,severity);

            res.status(201).json({
                data: {
                    id: bugId,
                    reporter_id: reporterId,
                    title,
                    description,
                    steps_to_reproduce,
                    severity,
                    status: 'pending'
                }
            });
    } catch (err){
        next(err);
    }
});

router.get('/mine', verifyToken, requireRole('reporter'), async (req,res,next) => {
    try{
        const reporterId = req.user.userId;
        const stmt = db.prepare(`SELECT * FROM bug_reports WHERE reporter_id = ?`);
        const bugs = stmt.all(reporterId);
        res.status(200).json({
            data: bugs
        });
    } catch (err) {
        next(err);
    }
});

router.get('/pending', verifyToken, requireRole('staff'), async (req,res,next) => {
    try{
        const stmt = db.prepare(`SELECT * FROM bug_reports WHERE status = 'pending'`);
        const pending_bugs = stmt.all();
        res.status(200).json({
            data: pending_bugs
        });

    } catch (err) {
        next(err);
    }
});

router.patch('/:id/review', verifyToken, requireRole('staff'), async (req,res,next) =>{
    try{
        const bugId = req.params.id;
        const {decision, denial_reason} = req.body;
        const staffId = req.user.userId;

        if (!decision || !['approved', 'denied'].includes(decision)) {
            return res.status(400).json({ error: 'Decision must be either approved or denied' });
        }
        if (decision === 'denied' && !denial_reason){
            return res.status(400).json({ error:'Denial reason required'});
        }
        if (denial_reason && !['not_enough_info', 'already_investigating'].includes(denial_reason)) {
            return res.status(400).json({ error: 'Invalid denial reason' });
        }

        // Updating the bug reports database
        const revStmt = db.prepare('UPDATE bug_reports SET status = ? WHERE id = ?');
        const newStatus = decision === 'approved' ? 'investigating' : 'denied';

        revStmt.run(newStatus, bugId);


        // Adding action to review actions
        const reviewId = crypto.randomUUID();
        const insStmt = db.prepare('INSERT INTO review_actions (id, bug_report_id, staff_id, decision, denial_reason) VALUES (?,?,?,?,?)');
        insStmt.run(reviewId, bugId, staffId, decision, denial_reason || null);


        // return success response
        res.status(200).json({
            data: {
                message: 'Bug Review Completed',
                bugId,
                decision,
                newStatus
            }
        });
    } catch (err){
        next(err);
    }
});

router.get('/active', verifyToken, requireRole('developer'), async (req,res,next) => {
    try{
        const stmt = db.prepare(`SELECT * FROM bug_reports WHERE status = 'investigating'`);
        const bugs = stmt.all();
        res.status(200).json({
            data: bugs
        });
    }catch (err){
        next(err);
    }
});

router.patch('/:id/squash', verifyToken, requireRole('developer'), async (req,res,next) =>{
    try {
        const bugId = req.params.id;
        // First make sure the bug is currently under investigation.
        const checkStmt = db.prepare(`SELECT * FROM bug_reports WHERE id = ?`);
        const bugCheck = checkStmt.get(bugId);
        if (!bugCheck){
            return res.status(404).json({
                error: 'Bug not found!'
            });
        }
        if (bugCheck.status !== "investigating"){
            return res.status(409).json({
                error: 'Cannot squash a bug not under investigation.'
            });
        }
        const patchStmt = db.prepare(`UPDATE bug_reports SET status = ?, updated_at = datetime(\'now\') WHERE id = ?`);
        patchStmt.run('squashed', bugId);
        res.status(200).json({
            data: {
                message: 'Bug Report Updated!',
                bugId
            }
        });
    } catch (err){
        next(err);
    }
});

router.get('/:id', verifyToken, requireSD, async(req,res,next) => {
    try{
        const bugId = req.params.id;
        const checkBug = db.prepare('SELECT * FROM bug_reports WHERE id = ?');
        const bug = checkBug.get(bugId);
        if (!bug){
            return res.status(404).json({
                error: 'Bug Report not found.'
            });
        }
        const bugNotes = db.prepare('SELECT * FROM dev_notes WHERE bug_report_id = ?');
        const notes = bugNotes.all(bugId);
        return res.status(200).json({
            data: { ...bug, notes: notes}
        });
    } catch (err){
        next(err);
    }
});
module.exports = router;