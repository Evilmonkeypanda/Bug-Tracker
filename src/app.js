require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));


app.use('/api/auth', require('./routes/auth'));
app.use('/api/bugs', require('./routes/bugs'));
app.use('/api/bugs/:id/notes', require('./routes/notes'));

// Catch any errors that happen to pop up.
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Start the server.
app.listen(PORT, () => {
    console.log(`Bug Tracker API running on http://localhost:${PORT}`);
});