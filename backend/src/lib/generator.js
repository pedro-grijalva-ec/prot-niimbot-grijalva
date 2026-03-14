import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import JsBarcode from 'jsbarcode';
export class LabelGenerator {
    canvas;
    ctx;
    constructor(options = { widthMm: 40, heightMm: 30, dpi: 203 }) {
        const pixelWidth = Math.round((options.widthMm / 25.4) * options.dpi);
        const pixelHeight = Math.round((options.heightMm / 25.4) * options.dpi);
        this.canvas = createCanvas(pixelWidth, pixelHeight);
        this.ctx = this.canvas.getContext('2d');
    }
    async generateTicket(data) {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'black';
        // Header / Logo area
        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.round(height * 0.12)}px serif`;
        ctx.fillText('Grijalva', width / 2 + 20, height * 0.12);
        ctx.font = `${Math.round(height * 0.08)}px serif`;
        ctx.fillText('joyería', width / 2 + 25, height * 0.20);
        // Logo "G" (simulated)
        ctx.beginPath();
        ctx.arc(width * 0.2, height * 0.12, height * 0.1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = `italic bold ${Math.round(height * 0.1)}px serif`;
        ctx.fillText('G', width * 0.2, height * 0.15);
        // Fields Layout
        const startX = width * 0.05;
        const startY = height * 0.32;
        const rowHeight = height * 0.09;
        const drawRow = (label, value, y) => {
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
        const drawMoney = (label, value, y) => {
            ctx.font = `${Math.round(height * 0.06)}px sans-serif`;
            ctx.fillText(label, startX, y);
            ctx.font = `bold ${Math.round(height * 0.06)}px sans-serif`;
            ctx.fillText(`$ ${value}`, startX + width * 0.2, y);
        };
        drawMoney('Precio: ', data.precio, moneyY);
        drawMoney('Abono: ', data.abono, moneyY + rowHeight);
        drawMoney('Saldo: ', data.saldo, moneyY + rowHeight * 2);
        // Serial
        ctx.textAlign = 'right';
        ctx.font = `bold ${Math.round(height * 0.12)}px sans-serif`;
        ctx.fillText(data.serial, width - 10, height * 0.85);
        return this.canvas;
    }
    async generateDescription(data) {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.round(height * 0.08)}px sans-serif`;
        ctx.fillText('DESCRIPCIÓN DE TRABAJO', width / 2, height * 0.12);
        ctx.font = `bold ${Math.round(height * 0.06)}px sans-serif`;
        ctx.fillText(`Serial: ${data.serial}`, width / 2, height * 0.20);
        ctx.beginPath();
        ctx.moveTo(10, height * 0.25);
        ctx.lineTo(width - 10, height * 0.25);
        ctx.stroke();
        ctx.textAlign = 'left';
        ctx.font = `${Math.round(height * 0.07)}px sans-serif`;
        const words = data.descripcion.split(' ');
        let line = '';
        let y = height * 0.35;
        const lineHeight = height * 0.09;
        const maxWidth = width - 20;
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, 10, y);
                line = words[i] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        ctx.fillText(line, 10, y);
        return this.canvas;
    }
    /** Gets thresholded bitmap */
    getBitmap() {
        const { width, height } = this.canvas;
        const imageData = this.ctx.getImageData(0, 0, width, height);
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
//# sourceMappingURL=generator.js.map