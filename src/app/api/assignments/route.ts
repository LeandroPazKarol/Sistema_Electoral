import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { userId, mesaIds } = await req.json();

    if (!userId || !Array.isArray(mesaIds)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Assign mesas
    let assigned = 0;
    for (const mesaId of mesaIds) {
      const exists = await prisma.mesaAssignment.findUnique({
        where: { userId_mesaId: { userId, mesaId } }
      });

      if (!exists) {
        await prisma.mesaAssignment.create({
          data: {
            userId,
            mesaId,
            assignedBy: session.user.id
          }
        });
        assigned++;
      }
    }

    return NextResponse.json({ success: true, assigned });
  } catch (error) {
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
