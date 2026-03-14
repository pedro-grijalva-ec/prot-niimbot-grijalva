import {
    NiimbotBluetoothClient,
    B1PrintTask,
    ImageEncoder
} from '@mmote/niimbluelib';

export type PrinterStatus = {
    battery: number;
    paperStatus: number;
    isConnected: boolean;
    deviceName?: string;
};

export class NiimbotService {
    private client: NiimbotBluetoothClient;
    private status: PrinterStatus = {
        battery: 0,
        paperStatus: 0,
        isConnected: false,
    };

    constructor() {
        this.client = new NiimbotBluetoothClient();

        this.client.on('connect', () => {
            this.status.isConnected = true;
            console.log('Printer connected');
        });

        this.client.on('disconnect', () => {
            this.status.isConnected = false;
            this.status.deviceName = undefined;
            console.log('Printer disconnected');
        });
    }

    async connect() {
        try {
            const info = await this.client.connect();
            this.status.deviceName = info.deviceName;
            this.status.isConnected = true;
            return true;
        } catch (error) {
            console.error('Failed to connect:', error);
            throw error;
        }
    }

    async disconnect() {
        await this.client.disconnect();
        this.status.isConnected = false;
    }

    async printCanvas(canvas: HTMLCanvasElement) {
        if (!this.status.isConnected) throw new Error('Printer not connected');

        try {
            console.log(`Printing canvas ${canvas.width}x${canvas.height}`);

            const encoded = ImageEncoder.encodeCanvas(canvas);
            const task = new B1PrintTask(this.client.abstraction);

            await task.printInit();
            await task.printPage(encoded, 1);
            await task.waitForFinished();

            return true;
        } catch (error) {
            console.error('Print failed:', error);
            throw error;
        }
    }

    getStatus(): PrinterStatus {
        return { ...this.status };
    }
}

export const printerService = new NiimbotService();
