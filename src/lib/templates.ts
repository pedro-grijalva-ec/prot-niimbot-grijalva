// JsBarcode removed as it was unused in Grijalva template

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
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private options: TemplateOptions;

    constructor(options: TemplateOptions = { widthMm: 40, heightMm: 30, dpi: 203 }) {
        this.options = options;
        this.canvas = document.createElement('canvas');
        // Swap dimensions for the canvas to match printer feed orientation if horizontal printing is rotated
        // For many Niimbot B1 setups, the "width" of the head is the horizontal dimension.
        // If it prints rotated, we rotate the drawing.
        const pixelWidth = Math.round((options.widthMm / 25.4) * options.dpi);
        const pixelHeight = Math.round((options.heightMm / 25.4) * options.dpi);

        this.canvas.width = pixelWidth;
        this.canvas.height = pixelHeight;
        this.ctx = this.canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    }

    private setupRotation() {
        // No-op for now, we'll draw normally but check if we need to swap dimensions
        // Actually, to fix rotation, we can rotate the context.
    }

    /**
     * Generates the Main Ticket label (the one with the logo and client info)
     */
    async generateTicket(data: LabelData): Promise<HTMLCanvasElement> {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        ctx.save();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;

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
        ctx.font = `italic bold ${Math.round(height * 0.1)}px serif`;
        ctx.fillText('G', width * 0.2, height * 0.15);

        // Fields Layout
        const startX = width * 0.05;
        const startY = height * 0.35; // Moved down slightly
        const rowHeight = height * 0.09;
        const labelFont = `${Math.round(height * 0.06)}px sans-serif`;
        const valueFont = `bold ${Math.round(height * 0.06)}px sans-serif`;

        const drawRow = (label: string, value: string, y: number) => {
            ctx.textAlign = 'left';
            ctx.font = labelFont;
            ctx.fillText(label, startX, y);
            const labelWidth = ctx.measureText(label).width;
            ctx.font = valueFont;
            ctx.fillText(value, startX + labelWidth + 5, y);

            // Dotted line
            ctx.setLineDash([1, 2]);
            ctx.beginPath();
            ctx.moveTo(startX + labelWidth + 5, y + 2);
            ctx.lineTo(width - 60, y + 2);
            ctx.stroke();
            ctx.setLineDash([]);
        };

        drawRow('Nombre: ', data.nombre, startY);
        drawRow('Teléfono: ', data.telefono, startY + rowHeight);
        drawRow('F. Entrada: ', data.fechaEntrada, startY + rowHeight * 2);
        drawRow('F. Entrega: ', data.fechaEntrega, startY + rowHeight * 3);

        // Money area (columns)
        const moneyY = startY + rowHeight * 4.5;

        const drawMoney = (label: string, value: string, y: number) => {
            ctx.font = labelFont;
            ctx.fillText(label, startX, y);
            ctx.font = valueFont;
            ctx.fillText(`$   ${value}`, startX + width * 0.25, y);
        };

        drawMoney('Precio:', data.precio, moneyY);
        drawMoney('Abono:', data.abono, moneyY + rowHeight);
        drawMoney('Saldo:', data.saldo, moneyY + rowHeight * 2);

        // Serial ID (Big and bold on the right)
        ctx.textAlign = 'right';
        ctx.font = `bold ${Math.round(height * 0.15)}px sans-serif`;
        ctx.fillText(data.serial, width - 10, height * 0.85);

        ctx.restore();
        return this.canvas;
    }

    /**
     * Generates the Description label (Job details)
     */
    async generateDescription(data: LabelData): Promise<HTMLCanvasElement> {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        ctx.save();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';

        // Header
        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.round(height * 0.08)}px sans-serif`;
        ctx.fillText('DESCRIPCIÓN DE TRABAJO', width / 2, height * 0.12);
        ctx.font = `bold ${Math.round(height * 0.08)}px sans-serif`;
        ctx.fillText(`Serial: ${data.serial}`, width / 2, height * 0.22);

        ctx.beginPath();
        ctx.moveTo(10, height * 0.28);
        ctx.lineTo(width - 10, height * 0.28);
        ctx.stroke();

        // Multiline description text
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

        ctx.restore();
        return this.canvas;
    }

    /** Generates a landscape canvas but physically oriented for the printer head if needed */
    // NOTE: If the image in the printer is vertical, we might need to swap W/H and rotate context.
    // We'll provide a rotated version specifically for the printer.
    getRotatedCanvas(): HTMLCanvasElement {
        const rotated = document.createElement('canvas');
        rotated.width = this.canvas.height;
        rotated.height = this.canvas.width;
        const rctx = rotated.getContext('2d')!;
        rctx.translate(rotated.width / 2, rotated.height / 2);
        rctx.rotate(Math.PI / 2); // 90 degrees clockwise
        rctx.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.height / 2);
        return rotated;
    }
}
