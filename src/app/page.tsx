"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Plus, Minus, UserPlus, TableProperties } from "lucide-react";

export default function Home() {
  const [mesas, setMesas] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  
  const [nuevaMesa, setNuevaMesa] = useState("");
  const [nuevoPartido, setNuevoPartido] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#3b82f6");

  const fetchData = async () => {
    const resM = await fetch("/api/mesas");
    const dataM = await resM.json();
    setMesas(dataM);

    const resP = await fetch("/api/partidos");
    const dataP = await resP.json();
    setPartidos(dataP);
  };

  useEffect(() => {
    fetchData();
    const evtSource = new EventSource("/api/events");
    evtSource.addEventListener("update", () => {
      fetchData();
    });
    return () => evtSource.close();
  }, []);

  const addMesa = async () => {
    if (!nuevaMesa) return;
    await fetch("/api/mesas", { method: "POST", body: JSON.stringify({ nombre: nuevaMesa }) });
    setNuevaMesa("");
  };

  const addPartido = async () => {
    if (!nuevoPartido) return;
    await fetch("/api/partidos", { 
      method: "POST", 
      body: JSON.stringify({ nombre: nuevoPartido, color: nuevoColor }) 
    });
    setNuevoPartido("");
  };

  const updateVoto = async (mesaId: string, partidoId: string, accion: "add" | "sub") => {
    // Optimistic update
    setMesas(prev => prev.map(m => {
      if (m.id === mesaId) {
        const vIdx = m.votos.findIndex((v: any) => v.partidoId === partidoId);
        const newVotos = [...m.votos];
        if (vIdx >= 0) {
          newVotos[vIdx] = { ...newVotos[vIdx], cantidad: accion === 'add' ? newVotos[vIdx].cantidad + 1 : Math.max(0, newVotos[vIdx].cantidad - 1) };
        } else if (accion === 'add') {
          newVotos.push({ partidoId, cantidad: 1 });
        }
        return { ...m, votos: newVotos };
      }
      return m;
    }));

    await fetch("/api/votos", {
      method: "POST",
      body: JSON.stringify({ mesaId, partidoId, accion })
    });
  };

  // Calcular totales
  const chartData = partidos.map(p => {
    let total = 0;
    mesas.forEach(m => {
      const v = m.votos.find((voto: any) => voto.partidoId === p.id);
      if (v) total += v.cantidad;
    });
    return { name: p.nombre, Votos: total, color: p.color };
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TableProperties className="text-white h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Escrutinio<span className="text-blue-600">EnVivo</span></h1>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full animate-pulse">
            Sincronizado en tiempo real
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* DASHBOARD PRINCIPAL */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full inline-block"></span>
              Resultados Globales
            </h2>
            <div className="h-80 w-full">
              {partidos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="Votos" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-400 font-medium">Agrega partidos políticos para visualizar estadísticas.</p>
                </div>
              )}
            </div>
          </div>

          {/* CONTROLES DE CONFIGURACIÓN */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700">
                <UserPlus className="h-5 w-5 text-indigo-500" />
                Registrar Partido Político
              </h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={nuevoPartido} 
                  onChange={e => setNuevoPartido(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                  placeholder="Ej: Partido ABC..."
                />
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Color representativo</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", 
                      "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", 
                      "#d946ef", "#f43f5e", "#64748b", "#334155"
                    ].map(color => (
                      <button
                        key={color}
                        onClick={() => setNuevoColor(color)}
                        className={`w-8 h-8 rounded-full transition-transform ${nuevoColor === color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Seleccionar color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <button onClick={addPartido} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors">
                  Añadir Partido
                </button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700">
                <TableProperties className="h-5 w-5 text-blue-500" />
                Abrir Nueva Mesa
              </h3>
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  value={nuevaMesa} 
                  onChange={e => setNuevaMesa(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="Ej: Aula 102 - Mesa 1"
                />
                <button onClick={addMesa} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors">
                  Añadir Mesa
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LISTA DE MESAS (ESCRUTINIO) */}
        <h2 className="text-2xl font-bold mb-6 text-slate-800">Mesas de Escrutinio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mesas.map(mesa => (
            <div key={mesa.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-slate-800 px-6 py-4">
                <h3 className="font-bold text-xl text-white">{mesa.nombre}</h3>
                <p className="text-slate-400 text-xs mt-1">Personero de mesa interactivo</p>
              </div>
              
              <div className="p-4 space-y-3">
                {partidos.length === 0 && <p className="text-sm text-slate-400 p-2 text-center">Registra partidos primero</p>}
                
                {partidos.map(p => {
                  const votoObj = mesa.votos.find((v: any) => v.partidoId === p.id);
                  const cantidad = votoObj ? votoObj.cantidad : 0;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{backgroundColor: p.color}}></div>
                        <span className="font-bold text-slate-700 truncate w-24 sm:w-32">{p.nombre}</span>
                      </div>
                      
                      <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                        <button 
                          onClick={() => updateVoto(mesa.id, p.id, "sub")} 
                          className="w-10 h-10 flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors active:scale-95"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        
                        <div className="w-14 text-center">
                          <span className="text-2xl font-black text-slate-800 block leading-none">{cantidad}</span>
                        </div>
                        
                        <button 
                          onClick={() => updateVoto(mesa.id, p.id, "add")} 
                          className="w-10 h-10 flex items-center justify-center rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors active:scale-95"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
