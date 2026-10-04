import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RegisterForm from "./register-form";

export default async function RegistrarMesaPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "OPERADOR") {
    redirect("/login");
  }

  const mesaId = params.id;

  const mesa = await prisma.mesa.findUnique({
    where: { id: mesaId },
    include: {
      region: true,
      consejero: true,
      provincia: true,
      distrito: true
    }
  });

  if (!mesa) return <div>Mesa no encontrada</div>;
  if (mesa.estado !== "PENDIENTE") return <div>Mesa ya registrada</div>;

  const asignacion = await prisma.mesaAssignment.findUnique({
    where: { userId_mesaId: { userId: session.user.id, mesaId } }
  });

  if (!asignacion) return <div>No tienes permiso sobre esta mesa</div>;

  const organizaciones = await prisma.organizacion.findMany();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Mesa {mesa.codigo}</h1>
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <p><strong>Región:</strong> {mesa.region.name}</p>
        <p><strong>Provincia:</strong> {mesa.provincia.name}</p>
        <p><strong>Distrito:</strong> {mesa.distrito.name}</p>
        <p className="mt-2 text-lg"><strong>Electores Habilitados:</strong> <span className="text-blue-600">{mesa.electores}</span></p>
      </div>

      <RegisterForm mesa={mesa} organizaciones={organizaciones} />
    </div>
  );
}
