import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';

export interface LabelData {
    nombre: string;
    telefono: string;
    fechaEntrada: string;
    fechaEntrega: string;
    precio: string;
    abono: string;
    saldo: string;
    serial: string;
    descripcion: string;
}

export interface TemplateOptions {
    widthMm: number;
    heightMm: number;
    dpi: number;
}

export class LabelGenerator {
    private canvas: Canvas;
    private ctx: CanvasRenderingContext2D;

    constructor(options: TemplateOptions = { widthMm: 40, heightMm: 30, dpi: 203 }) {
        const pixelWidth = Math.round((options.widthMm / 25.4) * options.dpi);
        const pixelHeight = Math.round((options.heightMm / 25.4) * options.dpi);

        this.canvas = createCanvas(pixelWidth, pixelHeight);
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    async generateTicket(data: LabelData): Promise<Canvas> {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';

        // Header / Logo area
        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.round(height * 0.12)}px serif`;
        ctx.fillText('Grijalva', width / 2 + 20, height * 0.12);
        ctx.font = `${Math.round(height * 0.08)}px serif`;
        ctx.fillText('joyería', width / 2 + 25, height * 0.20);

        // Logo "G"
        ctx.beginPath();
        ctx.arc(width * 0.2, height * 0.12, height * 0.1, 0, Math.PI * 2);
        ctx.stroke();
        // ctx.font = `italic bold ${Math.round(height * 0.1)}px serif`;
        // ctx.fillText('G', width * 0.2, height * 0.15);

        // Fields
        const startX = width * 0.05;
        const startY = height * 0.35;
        const rowHeight = height * 0.09;

        const drawRow = (label: string, value: string, y: number) => {
            ctx.textAlign = 'left';
            ctx.font = `${Math.round(height * 0.06)}px sans-serif`;
            ctx.fillText(label, startX, y);
            const labelWidth = ctx.measureText(label).width;
            ctx.font = `bold ${Math.round(height * 0.06)}px sans-serif`;
            ctx.fillText(value, startX + labelWidth + 5, y);
        };

        drawRow('Nombre: ', data.nombre, startY);
        drawRow('Teléfono: ', data.telefono, startY + rowHeight);
        drawRow('F. Entrada: ', data.fechaEntrada, startY + rowHeight * 2);
        drawRow('F. Entrega: ', data.fechaEntrega, startY + rowHeight * 3);

        // Money area
        const moneyY = startY + rowHeight * 4.5;
        const drawMoney = (label: string, value: string, y: number) => {
            ctx.font = `${Math.round(height * 0.06)}px sans-serif`;
            ctx.fillText(label, startX, y);
            ctx.font = `bold ${Math.round(height * 0.06)}px sans-serif`;
            ctx.fillText(`$   ${value}`, startX + width * 0.25, y);
        };

        drawMoney('Precio:', data.precio, moneyY);
        drawMoney('Abono:', data.abono, moneyY + rowHeight);
        drawMoney('Saldo:', data.saldo, moneyY + rowHeight * 2);

        // Serial
        ctx.textAlign = 'right';
        ctx.font = `bold ${Math.round(height * 0.15)}px sans-serif`;
        ctx.fillText(data.serial, width - 10, height * 0.85);

        return this.canvas;
    }

    async generateDescription(data: LabelData): Promise<Canvas> {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';

        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.round(height * 0.08)}px sans-serif`;
        ctx.fillText('DESCRIPCIÓN DE TRABAJO', width / 2, height * 0.12);
        ctx.font = `bold ${Math.round(height * 0.08)}px sans-serif`;
        ctx.fillText(`Serial: ${data.serial}`, width / 2, height * 0.22);

        ctx.beginPath();
        ctx.moveTo(10, height * 0.28);
        ctx.lineTo(width - 10, height * 0.28);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = `${Math.round(height * 0.07)}px sans-serif`;
        const words = data.descripcion.split(' ');
        let line = '';
        let y = height * 0.40;
        const lineHeight = height * 0.10;
        const maxWidth = width - 20;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line.trim(), 10, y);
                line = words[i] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), 10, y);

        return this.canvas;
    }

    /** Gets thresholded bitmap, ROTATED 90 degrees for printer */
    getBitmap(): Buffer {
        // Create a rotated canvas for the bitmap
        const rotated = createCanvas(this.canvas.height, this.canvas.width);
        const rctx = rotated.getContext('2d');
        rctx.translate(rotated.width / 2, rotated.height / 2);
        rctx.rotate(Math.PI / 2);
        rctx.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.height / 2);

        const { width, height } = rotated;
        const imageData = rctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const bitmap = Buffer.alloc(width * height);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] ?? 255;
            const g = data[i + 1] ?? 255;
            const b = data[i + 2] ?? 255;
            const avg = (r + g + b) / 3;
            bitmap[i / 4] = avg < 128 ? 1 : 0;
        }

        return bitmap;
    }
}
