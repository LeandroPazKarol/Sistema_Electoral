"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardClient() {
  const [stats, setStats] = useState<any>(null);
  const [ultimas, setUltimas] = useState<any[]>([]);

  const fetchSummary = async () => {
    const res = await fetch("/api/dashboard/summary");
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setUltimas(data.ultimas);
    }
  };

  useEffect(() => {
    fetchSummary();

    const evtSource = new EventSource("/api/events");
    evtSource.addEventListener("mesa-actualizada", (e) => {
      // Re-fetch data softly
      fetchSummary();
    });

    return () => {
      evtSource.close();
    };
  }, []);

  if (!stats) return <div className="text-slate-500">Cargando métricas...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-slate-500">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total de Mesas</h2>
          <p className="text-3xl mt-2 font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pendientes</h2>
          <p className="text-3xl mt-2 font-bold text-yellow-600">{stats.pendientes}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Registradas</h2>
          <p className="text-3xl mt-2 font-bold text-green-600">{stats.registradas}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Avance</h2>
          <p className="text-3xl mt-2 font-bold text-purple-600">{stats.avance.toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-bold text-lg text-slate-800">Últimas Mesas Registradas</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mesa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Distrito</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hora</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {ultimas.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{u.mesa.codigo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-500">{u.mesa.distrito.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {u.mesa.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {format(new Date(u.createdAt), "HH:mm:ss", { locale: es })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
