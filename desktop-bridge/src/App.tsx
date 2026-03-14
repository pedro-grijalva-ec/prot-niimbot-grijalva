import { useState, useEffect, useRef } from 'react';
import { Bluetooth, BluetoothConnected, Wifi, Loader2, Play, Square, Settings, Terminal, Activity, ShieldCheck, Database } from 'lucide-react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

declare global {
    interface Window {
        electronAPI: {
            connectPrinter: () => Promise<{ success: boolean; model?: string; error?: string }>;
            setApiUrl: (url: string) => Promise<{ success: boolean }>;
            getStatus: () => Promise<{ isPrinterConnected: boolean; isPolling: boolean; apiUrl: string }>;
            togglePolling: (state: boolean) => Promise<{ isPolling: boolean }>;
            onLog: (callback: (message: string) => void) => void;
        };
    }
}

export default function App() {
    const [status, setStatus] = useState({ isPrinterConnected: false, isPolling: false, apiUrl: '' });
    const [logs, setLogs] = useState<string[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial status
        window.electronAPI.getStatus().then(setStatus);

        // Listen for logs
        window.electronAPI.onLog((msg) => {
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-50));
        });
    }, []);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleConnect = async () => {
        setIsConnecting(true);
        const result = await window.electronAPI.connectPrinter();
        if (result.success) {
            setLogs(prev => [...prev, `Conectado a la impresora Niimbot B1`]);
        } else {
            setLogs(prev => [...prev, `Error: ${result.error}`]);
        }
        window.electronAPI.getStatus().then(setStatus);
        setIsConnecting(false);
    };

    const togglePolling = async () => {
        const nextState = !status.isPolling;
        const result = await window.electronAPI.togglePolling(nextState);
        setStatus(prev => ({ ...prev, isPolling: result.isPolling }));
        setLogs(prev => [...prev, nextState ? "Iniciando monitoreo de GCP..." : "Monitoreo detenido."]);
    };

    return (
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
            {/* App Region Header (Drag area) */}
            <div className="h-4 -mt-6 -mx-6 mb-4 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-1 bg-slate-700/50 rounded-full" />
            </div>

            <header className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        Grijalva <span className="text-sky-400">Bridge</span>
                    </h1>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Puente de Impresión Local</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Micro-pills */}
                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all duration-500 flex items-center gap-1.5",
                        status.isPrinterConnected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-500 border border-slate-700")}>
                        <Bluetooth size={10} strokeWidth={3} />
                        {status.isPrinterConnected ? 'CONECTADO' : 'SIN IMPRESORA'}
                    </div>

                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all duration-500 flex items-center gap-1.5",
                        status.isPolling ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 glow" : "bg-slate-800 text-slate-500 border border-slate-700")}>
                        <Activity size={10} strokeWidth={3} className={status.isPolling ? "animate-pulse" : ""} />
                        {status.isPolling ? 'ACTIVO' : 'IDLE'}
                    </div>
                </div>
            </header>

            <main className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
                {/* Left Control Panel */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                    <section className="glass rounded-2xl p-6 glow">
                        <div className="flex items-center gap-2 mb-6">
                            <Settings className="text-sky-400" size={18} />
                            <h2 className="text-sm font-bold uppercase tracking-wider">Control Maestro</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 mb-1.5">
                                    <Database size={10} /> Endpoint API Cloud
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={status.apiUrl}
                                        onChange={(e) => {
                                            const url = e.target.value;
                                            setStatus(s => ({ ...s, apiUrl: url }));
                                            window.electronAPI.setApiUrl(url);
                                        }}
                                        placeholder="http://TU_IP_GCP:3000"
                                        className="flex-1 bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500 text-sky-200"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleConnect}
                                    disabled={isConnecting || status.isPrinterConnected}
                                    className={cn("py-4 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all duration-300 group",
                                        status.isPrinterConnected
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:border-sky-500/50"
                                    )}
                                >
                                    {isConnecting ? <Loader2 className="animate-spin" /> : status.isPrinterConnected ? <ShieldCheck /> : <Bluetooth />}
                                    <span className="text-[10px] font-bold uppercase">{isConnecting ? 'Buscando...' : status.isPrinterConnected ? 'Servicio Activo' : 'Conectar B1'}</span>
                                </button>

                                <button
                                    onClick={togglePolling}
                                    disabled={!status.isPrinterConnected}
                                    className={cn("py-4 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all duration-300",
                                        status.isPolling
                                            ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                                            : "bg-sky-500 text-white shadow-lg glow hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 disabled:shadow-none"
                                    )}
                                >
                                    {status.isPolling ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                    <span className="text-[10px] font-bold uppercase">{status.isPolling ? 'Detener Bridge' : 'Iniciar Bridge'}</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    <footer className="mt-auto px-2">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Wifi size={14} />
                            <span className="text-[10px] font-medium tracking-tight">Status: {status.isPolling ? 'Conexión Segura Establecida con GCP' : 'Esperando activación local'}</span>
                        </div>
                    </footer>
                </div>

                {/* Right Console Panel */}
                <div className="col-span-12 lg:col-span-7 overflow-hidden flex flex-col bg-slate-950/80 rounded-2xl border border-slate-700/50 relative">
                    <div className="px-4 py-3 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Terminal size={14} className="text-sky-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Consola de Eventos</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 custom-scrollbar">
                        {logs.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 filter grayscale">
                                <terminal size={48} className="mb-4" />
                                <p>Esperando actividad del sistema...</p>
                            </div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className={cn("flex gap-3", log.includes('Error') ? "text-red-400" : "text-slate-400")}>
                                <span className="text-sky-500/50 shrink-0 select-none">›</span>
                                <span className="break-all">{log}</span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>

                    {status.isPolling && (
                        <div className="absolute bottom-4 right-4 animate-bounce">
                            <div className="bg-sky-500 w-2 h-2 rounded-full glow" />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
