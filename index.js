const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./database');
const { processReceipt } = require('./receiptProcesser');
const authRoutes = require('./authRoutes');
const { authenticateJWT } = require('./authMiddleware');
const { log } = require('console');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.use('/upload', authenticateJWT);
app.use('/validate', authenticateJWT);
app.use('/process', authenticateJWT);
app.use('/receipts', authenticateJWT);

// Check upload directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// API Routes
app.post('/upload', upload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = path.join('uploads', req.file.originalname);
        fs.renameSync(req.file.path, filePath);
        

        db.run(
            'INSERT INTO receipt_file (file_name, file_path, user_id) VALUES (?, ?, ?)',
            [req.file.originalname, filePath, req.user.id],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({
                    message: 'File uploaded successfully',
                    fileId: this.lastID
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/validate/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        db.get('SELECT * FROM receipt_file WHERE id = ? AND user_id = ?',
            [fileId, req.user.id], async (err, file) => {
                if (err || !file) {
                    return res.status(404).json({ error: 'File not found' });
                }

                const isValid = await validatePdf(file.file_path);
                let updateParams;

                if (isValid) {
                    updateParams = [1, null, fileId];
                } else {
                    updateParams = [0, 'Invalid PDF file', fileId];
                }

                db.run(
                    'UPDATE receipt_file SET is_valid = ?, invalid_reason = ? WHERE id = ?',
                    updateParams,
                    function (err) {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ is_valid: !!isValid, invalid_reason: updateParams[1] });
                    }
                );
            });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/process/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        db.get('SELECT * FROM receipt_file WHERE id = ? AND user_id = ?',
            [fileId, req.user.id], async (err, file) => {
                if (err || !file) {
                    return res.status(400).json({ error: 'Valid file not found' });
                }

                const receiptData = await processReceipt(file.file_path);
                 log(`Processing receipt:`, receiptData);
                db.run(
                    'INSERT INTO receipt (purchased_at, merchant_name, total_amount, file_path, user_id) VALUES (?, ?, ?, ?, ?)',
                    [receiptData.purchased_at, receiptData.merchant_name, receiptData.total_amount, file.file_path, req.user.id],
                    function (err) {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                     log(`Receipt inserted with ID: ${this.lastID}`);
                        db.run(
                            'UPDATE receipt_file SET is_processed = 1 WHERE id = ?',
                            [fileId],
                            function (err) {
                                if (err) {
                                    return res.status(500).json({ error: err.message });
                                }
                                res.json({
                                    message: 'Receipt processed successfully',
                                    receiptId: this.lastID
                                });
                            }
                        );
                    }
                );
            });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/receipts', (req, res) => {
    log(`Fetching receipts for user ID: ${req.user.id}`);
    db.all('SELECT * FROM receipt', [], (err, receipts) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(receipts);
    });
});

app.get('/receipts/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM receipt WHERE id = ?', [id], (err, receipt) => {
        if (err || !receipt) {
            return res.status(404).json({ error: 'Receipt not found' });
        }
        res.json(receipt);
    });
});


async function validatePdf(filePath) {
    return new Promise((resolve) => {
        const stream = fs.createReadStream(filePath);
        let header = '';

        stream.on('data', (chunk) => {
            header += chunk.toString('utf8', 0, 4);
            stream.destroy();
        });

        stream.on('close', () => {
            resolve(header === '%PDF');
        });

        stream.on('error', () => {
            resolve(false);
        });
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});