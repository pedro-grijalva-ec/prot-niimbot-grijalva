import { useState, useEffect, useRef } from 'react';
import { Bluetooth, BluetoothConnected, Printer, RefreshCw, Layers, CheckCircle2, AlertCircle, FileText, User, Phone, Calendar, DollarSign, Hash } from 'lucide-react';
import { printerService } from './lib/printer';
import type { PrinterStatus } from './lib/printer';
import { LabelGenerator } from './lib/templates';
import type { LabelData } from './lib/templates';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_LABEL: LabelData = {
  nombre: 'Juan Pérez',
  telefono: '555-0192-33',
  fechaEntrada: '2026-03-14',
  fechaEntrega: '2026-03-20',
  precio: '1500.00',
  abono: '500.00',
  saldo: '1000.00',
  serial: '000565',
  descripcion: 'Reparación de anillo de oro 18K con incrustación de diamante. Pulido y limpieza general.'
};

export default function App() {
  const [status, setStatus] = useState<PrinterStatus>(printerService.getStatus());
  const [labelData, setLabelData] = useState<LabelData>(DEFAULT_LABEL);
  const [ticketUrl, setTicketUrl] = useState<string>('');
  const [descUrl, setDescUrl] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'ticket' | 'desc'>('ticket');
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generator = useRef(new LabelGenerator());

  useEffect(() => {
    updatePreviews();
  }, [labelData]);

  const updatePreviews = async () => {
    const tCanvas = await generator.current.generateTicket(labelData);
    setTicketUrl(tCanvas.toDataURL('image/png'));

    const dCanvas = await generator.current.generateDescription(labelData);
    setDescUrl(dCanvas.toDataURL('image/png'));
  };

  const handleConnect = async () => {
    try {
      setError(null);
      await printerService.connect();
      setStatus(printerService.getStatus());
    } catch (err: any) {
      setError(err.message || 'Error al conectar la impresora');
    }
  };

  const handleDisconnect = async () => {
    await printerService.disconnect();
    setStatus(printerService.getStatus());
  };

  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    setError(null);

    try {
      // 1. Generate the active label based on preview mode
      if (previewMode === 'ticket') {
        await generator.current.generateTicket(labelData);
      } else {
        await generator.current.generateDescription(labelData);
      }

      const rotated = generator.current.getRotatedCanvas();

      // 2. Print a single label
      console.log(`Printing single ${previewMode} label...`);
      await printerService.printCanvas(rotated);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0ea5e9', '#38bdf8', '#ffffff', '#fbbf24']
      });
    } catch (err: any) {
      setError(err.message || 'Error al imprimir la secuencia');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-niimbot-500 rounded-lg glow">
            <Printer className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Grijalva <span className="text-niimbot-400">Joyería</span></h1>
        </div>

        <button
          onClick={status.isConnected ? handleDisconnect : handleConnect}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all duration-300",
            status.isConnected
              ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
              : "bg-niimbot-600 text-white hover:bg-niimbot-500 glow"
          )}
        >
          {status.isConnected ? <BluetoothConnected size={18} /> : <Bluetooth size={18} />}
          {status.isConnected ? 'Conectado' : 'Conectar Impresora'}
        </button>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Editor (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="glass rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="text-niimbot-400" size={20} />
              <h2 className="text-lg font-semibold">Datos del Trabajo</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5"><User size={12} /> Nombre del Cliente</label>
                <input
                  type="text"
                  value={labelData.nombre}
                  onChange={(e) => setLabelData({ ...labelData, nombre: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-1 focus:ring-niimbot-500 text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5"><Phone size={12} /> Teléfono</label>
                <input
                  type="text"
                  value={labelData.telefono}
                  onChange={(e) => setLabelData({ ...labelData, telefono: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-1 focus:ring-niimbot-500 text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5"><Hash size={12} /> Serial / ID</label>
                <input
                  type="text"
                  value={labelData.serial}
                  onChange={(e) => setLabelData({ ...labelData, serial: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-niimbot-400 font-bold outline-none focus:ring-1 focus:ring-niimbot-500 text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5"><Calendar size={12} /> Fecha Entrada</label>
                <input
                  type="date"
                  value={labelData.fechaEntrada}
                  onChange={(e) => setLabelData({ ...labelData, fechaEntrada: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-1 focus:ring-niimbot-500 text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5"><Calendar size={12} /> Fecha Entrega</label>
                <input
                  type="date"
                  value={labelData.fechaEntrega}
                  onChange={(e) => setLabelData({ ...labelData, fechaEntrega: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-1 focus:ring-niimbot-500 text-sm"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-3 gap-4 border-t border-slate-700 pt-4 mt-2">
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5"><DollarSign size={10} /> Precio</label>
                  <input
                    type="text"
                    value={labelData.precio}
                    onChange={(e) => setLabelData({ ...labelData, precio: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-niimbot-500 text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5"><DollarSign size={10} /> Abono</label>
                  <input
                    type="text"
                    value={labelData.abono}
                    onChange={(e) => setLabelData({ ...labelData, abono: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-niimbot-500 text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5"><DollarSign size={10} /> Saldo</label>
                  <input
                    type="text"
                    value={labelData.saldo}
                    onChange={(e) => setLabelData({ ...labelData, saldo: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-orange-400 font-bold outline-none focus:ring-1 focus:ring-niimbot-500 text-sm"
                  />
                </div>
              </div>

              <div className="md:col-span-2 mt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5"><FileText size={12} /> Descripción Detallada</label>
                <textarea
                  value={labelData.descripcion}
                  onChange={(e) => setLabelData({ ...labelData, descripcion: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-1 focus:ring-niimbot-500 text-sm resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Preview & Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="glass rounded-2xl p-6 border border-slate-700/50 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vista Previa</h3>
              <div className="flex bg-slate-900/80 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setPreviewMode('ticket')}
                  className={cn("px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all", previewMode === 'ticket' ? "bg-niimbot-600 text-white" : "text-slate-500 hover:text-slate-300")}
                >
                  Ticket
                </button>
                <button
                  onClick={() => setPreviewMode('desc')}
                  className={cn("px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all", previewMode === 'desc' ? "bg-niimbot-600 text-white" : "text-slate-500 hover:text-slate-300")}
                >
                  Info
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-niimbot-500 to-amber-500 rounded-lg blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative bg-white p-3 rounded-lg shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 p-1 bg-slate-100 text-[8px] text-slate-400 font-bold uppercase leading-none">40x30mm</div>
                {previewMode === 'ticket' ? (
                  ticketUrl ? <img src={ticketUrl} alt="Ticket Preview" className="w-[300px] h-auto block" /> : null
                ) : (
                  descUrl ? <img src={descUrl} alt="Desc Preview" className="w-[300px] h-auto block" /> : null
                )}
              </div>
            </div>

            <div className="mt-8 w-full space-y-3">
              <button
                onClick={handlePrint}
                disabled={!status.isConnected || isPrinting}
                className={cn(
                  "w-full py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all duration-300 shadow-lg",
                  status.isConnected
                    ? "bg-white text-slate-900 hover:bg-slate-100 glow cursor-pointer active:scale-95"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                )}
              >
                <div className="flex items-center gap-3">
                  {isPrinting ? <RefreshCw className="animate-spin" size={20} /> : <Printer size={20} />}
                  <span>{isPrinting ? 'Imprimiendo...' : `Imprimir ${previewMode === 'ticket' ? 'Ticket' : 'Descripción'}`}</span>
                </div>
                {!isPrinting && <span className="text-[10px] font-medium text-slate-400">IMPRIME SOLO 1 ETIQUETA (PRUEBA)</span>}
              </button>

              {!status.isConnected && (
                <p className="text-center text-xs text-amber-500 mt-2 flex items-center justify-center gap-1 font-medium bg-amber-500/10 py-2 rounded-lg border border-amber-500/20">
                  <AlertCircle size={14} /> Conecta la impresora para habilitar
                </p>
              )}
            </div>
          </section>

          <section className="glass rounded-xl p-4 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={18} />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Modelo Detectado</p>
                <p className="text-xs text-white font-medium">Niimbot B1 Smart Labeler</p>
              </div>
            </div>
            {status.isConnected && (
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-500">Batería</p>
                <p className="text-xs text-green-400 font-bold">84%</p>
              </div>
            )}
          </section>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div className="text-sm">
                <p className="font-semibold text-red-500">Error en el sistema</p>
                <p className="text-red-400/80">{error}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-12 pb-8 text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
          Grijalva Joyería • Prototipo de Impresión Térmica v1.2.0
        </p>
      </footer>
    </div>
  );
}
