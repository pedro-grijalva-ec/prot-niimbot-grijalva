import { Canvas } from 'canvas';
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
export declare class LabelGenerator {
    private canvas;
    private ctx;
    constructor(options?: TemplateOptions);
    generateTicket(data: LabelData): Promise<Canvas>;
    generateDescription(data: LabelData): Promise<Canvas>;
    /** Gets thresholded bitmap */
    getBitmap(): Buffer;
}
//# sourceMappingURL=generator.d.ts.map