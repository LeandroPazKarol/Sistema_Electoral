"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AssignForm({ operadores, mesas }: { operadores: any[], mesas: any[] }) {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedMesas, setSelectedMesas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = (mesaId: string) => {
    setSelectedMesas((prev) =>
      prev.includes(mesaId) ? prev.filter((id) => id !== mesaId) : [...prev, mesaId]
    );
  };

  const handleAssign = async () => {
    if (!selectedUser || selectedMesas.length === 0) return;
    setLoading(true);
    
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser, mesaIds: selectedMesas }),
      });
      if (res.ok) {
        alert("Mesas asignadas correctamente");
        setSelectedMesas([]);
        router.refresh();
      } else {
        alert("Error al asignar mesas");
      }
    } catch (e) {
      alert("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Seleccionar Operador</label>
        <select
          className="border p-2 rounded w-full md:w-1/3"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">-- Selecciona un operador --</option>
          {operadores.map((op) => (
            <option key={op.id} value={op.id}>{op.username}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-2">Mesas Disponibles</h3>
        <div className="max-h-96 overflow-y-auto border rounded p-4">
          {mesas.length === 0 && <p className="text-slate-500 text-sm">No hay mesas registradas.</p>}
          {mesas.map((mesa) => {
            const isAssigned = mesa.assignments.some((a: any) => a.userId === selectedUser);
            const assignees = mesa.assignments.map((a: any) => a.user.username).join(", ");
            return (
              <label key={mesa.id} className="flex items-center space-x-3 mb-2 p-2 hover:bg-slate-50 rounded">
                <input
                  type="checkbox"
                  checked={selectedMesas.includes(mesa.id) || isAssigned}
                  onChange={() => handleToggle(mesa.id)}
                  disabled={isAssigned}
                  className="rounded text-blue-600"
                />
                <span className="flex-1">
                  Mesa {mesa.codigo} - {mesa.distrito.name} 
                  {assignees && <span className="ml-2 text-xs bg-slate-200 px-2 py-1 rounded-full">Asignada a: {assignees}</span>}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleAssign}
        disabled={loading || !selectedUser || selectedMesas.length === 0}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Asignando..." : "Asignar seleccionadas"}
      </button>
    </div>
  );
}
