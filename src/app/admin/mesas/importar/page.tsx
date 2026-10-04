"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";

export default function ImportarMesasPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setLoading(true);
    setMessage("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch("/api/mesas/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mesas: results.data }),
          });
          const data = await res.json();
          if (res.ok) {
            setMessage(`Éxito. Creadas: ${data.creadas}, Omitidas: ${data.omitidas}`);
            router.refresh();
          } else {
            setMessage(`Error: ${data.error}`);
          }
        } catch (error) {
          setMessage("Error de conexión");
        } finally {
          setLoading(false);
        }
      },
      error: () => {
        setMessage("Error al leer el archivo CSV.");
        setLoading(false);
      }
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Importar Mesas</h1>
      <div className="bg-white p-6 rounded-lg shadow max-w-xl">
        <p className="mb-4 text-slate-600">
          Sube un archivo CSV con las columnas: <br/>
          <strong>codigo_mesa, region, consejero, provincia, distrito, electores, latitud, longitud</strong>
        </p>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          className="block w-full border border-slate-200 p-2 rounded mb-4"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Procesando..." : "Subir e Importar"}
        </button>
        {message && <p className="mt-4 font-medium text-slate-800">{message}</p>}
      </div>
    </div>
  );
}
