const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Serve the frontend index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Provably Fair logic variables
let currentServerSeed = crypto.randomBytes(32).toString('hex');
let hashedServerSeed = crypto.createHash('sha256').update(currentServerSeed).digest('hex');

app.get('/api/game-info', (req, res) => {
    res.json({ serverSeedHash: hashedServerSeed, nonce: 0 });
});

app.post('/api/bet', (req, res) => {
    const { clientSeed, nonce, betAmount, prediction } = req.body;
    
    if (!clientSeed || nonce === undefined || !betAmount || !prediction) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    // Hash calculation
    const hash = crypto.createHmac('sha512', currentServerSeed).update(`${clientSeed}:${nonce}`).digest('hex');
    let resultNumber = (parseInt(hash.substring(0, 5), 16) % 10000) / 100;
    
    const win = resultNumber < prediction;
    const winMultiplier = 99 / prediction;
    const payout = win ? (betAmount * winMultiplier) : 0;
    const revealedServerSeed = currentServerSeed;

    // Rotate seeds
    currentServerSeed = crypto.randomBytes(32).toString('hex');
    hashedServerSeed = crypto.createHash('sha256').update(currentServerSeed).digest('hex');

    res.json({
        roll: resultNumber,
        win,
        payout,
        revealedServerSeed,
        newServerSeedHash: hashedServerSeed
    });
});

app.listen(5000, () => console.log('Server running! Open http://localhost:5000 in your browser.'));