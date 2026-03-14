import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { LabelGenerator } from './lib/generator.js';
import type { LabelData } from './lib/generator.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

interface PrintJob {
    id: string;
    orderId: string;
    data: LabelData;
    type: 'ticket' | 'description';
    status: 'pending' | 'printing' | 'completed' | 'failed';
    createdAt: Date;
    bitmap?: Buffer;
}

const jobs: Map<string, PrintJob> = new Map();

app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.2.0' });
});

// Create a print order (generates 3 labels)
app.post('/v1/print', async (req, res) => {
    try {
        const labelData: LabelData = req.body;
        const orderId = uuidv4();
        const generator = new LabelGenerator();

        // 1. Generate Ticket Bitmap
        await generator.generateTicket(labelData);
        const ticketBitmap = generator.getBitmap();

        // 2. Generate Description Bitmap
        await generator.generateDescription(labelData);
        const descBitmap = generator.getBitmap();

        // Add 2 Ticket labels
        for (let i = 0; i < 2; i++) {
            const id = uuidv4();
            jobs.set(id, {
                id,
                orderId,
                data: labelData,
                type: 'ticket',
                status: 'pending',
                createdAt: new Date(),
                bitmap: ticketBitmap
            });
        }

        // Add 1 Description label
        const descId = uuidv4();
        jobs.set(descId, {
            id: descId,
            orderId,
            data: labelData,
            type: 'description',
            status: 'pending',
            createdAt: new Date(),
            bitmap: descBitmap
        });

        res.status(202).json({
            orderId,
            message: 'Print order accepted (3 labels generated)'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/v1/jobs/pending', (req, res) => {
    const pending = Array.from(jobs.values())
        .filter(j => j.status === 'pending')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(j => ({
            id: j.id,
            orderId: j.orderId,
            type: j.type,
            data: j.data,
            bitmap: j.bitmap?.toString('base64'),
            width: 320,
            height: 240
        }));

    res.json(pending);
});

app.post('/v1/jobs/:id/complete', (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    job.status = 'completed';
    res.json({ id: job.id, status: job.status });
});

app.get('/v1/jobs/:id', (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const { bitmap, ...jobInfo } = job;
    res.json(jobInfo);
});

app.listen(port, () => {
    console.log(`Niimbot Grijalva API listening at http://localhost:${port}`);
});
