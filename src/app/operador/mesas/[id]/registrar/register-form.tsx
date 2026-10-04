"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm({ mesa, organizaciones }: { mesa: any, organizaciones: any[] }) {
  const [votos, setVotos] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleInputChange = (orgId: number, value: string) => {
    // Solo permitir números
    if (value === "" || /^\d+$/.test(value)) {
      setVotos(prev => ({ ...prev, [orgId]: value }));
    }
  };

  const totalVotos = useMemo(() => {
    return Object.values(votos).reduce((acc, val) => acc + (parseInt(val) || 0), 0);
  }, [votos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (totalVotos > mesa.electores) {
      setError("El total de votos no puede ser mayor a la cantidad de electores.");
      return;
    }

    // Check if all fields are filled
    const allFilled = organizaciones.every(o => votos[o.id] !== undefined && votos[o.id] !== "");
    if (!allFilled) {
      setError("Debes llenar todos los campos (coloca 0 si no hubo votos).");
      return;
    }

    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setLoading(true);
    try {
      const detalles = organizaciones.map(o => ({
        organizacionId: o.id,
        votos: parseInt(votos[o.id]) || 0
      }));

      const res = await fetch(`/api/mesas/${mesa.id}/resultados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detalles }),
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Resultado guardado con éxito.");
        router.push("/operador");
        router.refresh();
      } else {
        setError(data.error);
        setShowConfirm(false);
      }
    } catch (e) {
      setError("Error de red");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow max-w-2xl">
        {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>}

        <div className="space-y-4">
          {organizaciones.map((org) => (
            <div key={org.id} className="flex items-center justify-between border-b pb-2">
              <label className="font-medium text-slate-700">{org.name}</label>
              <input
                type="text"
                value={votos[org.id] || ""}
                onChange={(e) => handleInputChange(org.id, e.target.value)}
                className="w-32 border rounded p-2 text-right"
                placeholder="0"
                required
              />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t-2 border-slate-200 flex justify-between items-center">
          <span className="text-xl font-bold text-slate-800">TOTAL:</span>
          <span className={`text-xl font-bold ${totalVotos > mesa.electores ? 'text-red-600' : 'text-blue-600'}`}>
            {totalVotos} / {mesa.electores}
          </span>
        </div>

        <button type="submit" className="mt-8 w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">
          GUARDAR RESULTADO
        </button>
      </form>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">CONFIRMAR RESULTADO</h2>
            <p className="mb-4">Mesa: <strong>{mesa.codigo}</strong></p>
            <div className="space-y-2 mb-4 border-b pb-4">
              {organizaciones.map(o => (
                <div key={o.id} className="flex justify-between text-sm">
                  <span>{o.name}</span>
                  <strong>{votos[o.id] || 0}</strong>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-lg mb-6">
              <span>Total</span>
              <span>{totalVotos}</span>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">¿Estás seguro de registrar estos resultados? Esta acción no se puede deshacer libremente.</p>
            
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border rounded text-slate-600">Cancelar</button>
              <button onClick={confirmSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">
                {loading ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
