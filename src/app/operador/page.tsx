import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function OperadorDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "OPERADOR") {
    redirect("/login");
  }

  const asignaciones = await prisma.mesaAssignment.findMany({
    where: { userId: session.user.id },
    include: {
      mesa: {
        include: {
          distrito: true
        }
      }
    }
  });

  const mesas = asignaciones.map(a => a.mesa);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Mis Mesas Asignadas</h1>
      <p>Bienvenido, {session.user.username}</p>
      
      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mesa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Distrito</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {mesas.length === 0 ? (
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900" colSpan={4} style={{textAlign: "center"}}>
                  No tienes mesas asignadas aún.
                </td>
              </tr>
            ) : (
              mesas.map((mesa) => (
                <tr key={mesa.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{mesa.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{mesa.distrito.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      mesa.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                      mesa.estado === 'REGISTRADA' ? 'bg-green-100 text-green-800' :
                      mesa.estado === 'OBSERVADA' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {mesa.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {mesa.estado === 'PENDIENTE' ? (
                      <Link href={`/operador/mesas/${mesa.id}/registrar`} className="text-blue-600 hover:text-blue-900">
                        Registrar
                      </Link>
                    ) : (
                      <span className="text-slate-400">Registrada</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
