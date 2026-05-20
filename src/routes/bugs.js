const express = require('express');
const crypto = require('crypto');
const db = require('../db/db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const requireSD = require('../middleware/requireSD');

const router = express.Router();

router.post('/', verifyToken, requireRole('reporter'), async (req, res, next) => {
    try {
            // Get important information from the request.
            const {title, description, steps_to_reproduce, severity } = req.body;

            // Validate all information.
            // TODO: Possibly create different checks to fine-tune error message.
            if (!title || !description || !severity){
                return res.status(400).json({ error: 'Title, Description, and Severity are required.'});
            }
            // Separate check for severity as it has specific possibilities.
            const validSeverities = ['low','medium','high','critical'];
            if (!validSeverities.includes(severity)){
                return res.status(400).json({ error: 'Invalid severity level.'});
            }
            // Generate UUID for bug
            const bugId = crypto.randomUUID();

            // Get user ID
            const reporterId = req.user.userId;

            // Statement prep for insert. 
            // Using prepare to shield against injection.
            const stmt = db.prepare(`INSERT INTO bug_reports (id, reporter_id, title, description, steps_to_reproduce, severity, status) VALUES (?,?,?,?,?,?, 'pending')`);
            // Run the statement.
            stmt.run(bugId,reporterId,title,description,steps_to_reproduce,severity);

            // Return information gives overview of bug report submitted.
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
    // Very basic error hand-off. Will be using this everywhere until I notice it break horribly.
    } catch (err){
        next(err);
    }
});

// Route to get all bug reports submitted by current user.
router.get('/mine', verifyToken, requireRole('reporter'), async (req,res,next) => {
    try{
        // Will search bug_reports by the user ID.
        const reporterId = req.user.userId;
        const stmt = db.prepare(`SELECT * FROM bug_reports WHERE reporter_id = ?`);
        const bugs = stmt.all(reporterId);
        // returns all bug reports found.
        res.status(200).json({
            data: bugs
        });
    } catch (err) {
        next(err);
    }
});

// Route for admin/staff to see all pending bug reports. 
// These are any reports that have been submitted but have not been reviewed yet.
router.get('/pending', verifyToken, requireRole('staff'), async (req,res,next) => {
    try{
        // Simple statement to pull all bug_reports that are still pending.
        const stmt = db.prepare(`SELECT * FROM bug_reports WHERE status = 'pending'`);
        const pending_bugs = stmt.all();
        // Return all these reports.
        res.status(200).json({
            data: pending_bugs
        });

    } catch (err) {
        next(err);
    }
});

// Route to allow admin/staff to change the status of a pending report to either investigating or denied.
// If denied a reason is provided.
router.patch('/:id/review', verifyToken, requireRole('staff'), async (req,res,next) =>{
    try{
        // Get core information for db search and input.
        const bugId = req.params.id;
        const {decision, denial_reason} = req.body;
        const staffId = req.user.userId;

        // Validation to ensure no funky table information happens.
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

// Simple route to get all active bug reports. 
// This only includes reports that have been approved by admin/staff
router.get('/active', verifyToken, requireRole('developer'), async (req,res,next) => {
    try{
        // Hard coded db SELECT for 'investigating'
        // If the status changes to something else later on this will cause headaches.
        const stmt = db.prepare(`SELECT * FROM bug_reports WHERE status = 'investigating'`);
        const bugs = stmt.all();
        // Returns all the bug reports
        res.status(200).json({
            data: bugs
        });
    }catch (err){
        next(err);
    }
});

// Route to set status of bug reports to squashed. IE, Completed.
// Squashed is less intuitive than "Completed" but it adds **Personality**
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
        // Preparing patch statement with update time.
        const patchStmt = db.prepare(`UPDATE bug_reports SET status = ?, updated_at = datetime(\'now\') WHERE id = ?`);
        patchStmt.run('squashed', bugId);
        // Return confirmation message.
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

// Route to get a specific bug report via ID
router.get('/:id', verifyToken, requireSD, async(req,res,next) => {
    try{
        // Get bug ID from input parameters
        const bugId = req.params.id;
        // Get bug and validate it's existence.
        const checkBug = db.prepare('SELECT * FROM bug_reports WHERE id = ?');
        const bug = checkBug.get(bugId);
        if (!bug){
            return res.status(404).json({
                error: 'Bug Report not found.'
            });
        }
        // Get all bug notes via FK
        // No validation as we validated bugID already and if there are no notes then we just don't show anything.
        const bugNotes = db.prepare('SELECT * FROM dev_notes WHERE bug_report_id = ?');
        const notes = bugNotes.all(bugId);
        // Had to look up how to wrap like this and I still don't quite understand it
        return res.status(200).json({
            data: { ...bug, notes: notes}
        });
    } catch (err){
        next(err);
    }
});
module.exports = router;