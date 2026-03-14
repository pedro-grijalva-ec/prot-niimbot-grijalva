import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { NiimbotClient } from '@mmote/niimblue-node';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow;
let niimbot = null;
let isPolling = false;
let apiUrl = 'http://localhost:3000'; // Default, will be updated via UI

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        titleBarStyle: 'hidden',
        backgroundColor: '#0f172a',
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- IPC IPC ---

ipcMain.handle('printer:connect', async () => {
    try {
        niimbot = new NiimbotClient();
        await niimbot.connect(); // This picks the first B1 usually, or we can scan
        return { success: true, model: 'Niimbot B1' };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('api:set-url', (event, url) => {
    apiUrl = url;
    return { success: true };
});

ipcMain.handle('bridge:status', () => {
    return {
        isPrinterConnected: !!niimbot,
        isPolling,
        apiUrl
    };
});

// Polling Logic
async function pollJobs() {
    if (!isPolling || !niimbot) return;

    try {
        const response = await axios.get(`${apiUrl}/v1/jobs/pending`);
        const jobs = response.data;

        if (jobs.length > 0) {
            mainWindow.webContents.send('bridge:log', `Found ${jobs.length} pending jobs`);

            for (const job of jobs) {
                mainWindow.webContents.send('bridge:log', `Printing job ${job.id} (${job.type})`);

                // Convert base64 bitmap to Buffer/Uint8Array
                const bitmapBuffer = Buffer.from(job.bitmap, 'base64');

                // NIIMBLUE-NODE conversion: NiimbotClient expects a specific format
                // For B1, we usually send the bitmap data
                await niimbot.print({
                    image: bitmapBuffer,
                    // B1 specific tasks would go here if needed via the library
                });

                // Mark as complete
                await axios.post(`${apiUrl}/v1/jobs/${job.id}/complete`);
                mainWindow.webContents.send('bridge:log', `Job ${job.id} marked as complete.`);
            }
        }
    } catch (err) {
        mainWindow.webContents.send('bridge:log', `Poll error: ${err.message}`);
    }

    if (isPolling) {
        setTimeout(pollJobs, 5000);
    }
}

ipcMain.handle('bridge:toggle-polling', (event, state) => {
    isPolling = state;
    if (isPolling) {
        pollJobs();
    }
    return { isPolling };
});
