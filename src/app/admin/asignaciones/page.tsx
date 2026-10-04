import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AssignForm from "./assign-form";

export default async function AsignacionesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMINISTRADOR") {
    redirect("/login");
  }

  const operadores = await prisma.user.findMany({
    where: { role: "OPERADOR" },
    select: { id: true, username: true }
  });

  const mesas = await prisma.mesa.findMany({
    include: {
      distrito: true,
      assignments: {
        include: { user: true }
      }
    }
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Asignación de Mesas</h1>
      <AssignForm operadores={operadores} mesas={mesas} />
    </div>
  );
}
