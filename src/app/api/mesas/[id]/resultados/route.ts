import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "OPERADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const mesaId = params.id;
    const { detalles } = await req.json(); // Array of { organizacionId, votos }

    if (!Array.isArray(detalles)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    // Verificar permisos del operador sobre esta mesa
    const asignacion = await prisma.mesaAssignment.findUnique({
      where: { userId_mesaId: { userId: session.user.id, mesaId } }
    });

    if (!asignacion) {
      return NextResponse.json({ error: "No tienes permiso sobre esta mesa" }, { status: 403 });
    }

    // Usar Transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const mesa = await tx.mesa.findUnique({ where: { id: mesaId } });
      if (!mesa) throw new Error("Mesa no encontrada");
      if (mesa.estado !== "PENDIENTE") throw new Error("Mesa ya registrada");

      let totalVotos = 0;
      for (const d of detalles) {
        if (typeof d.votos !== 'number' || d.votos < 0 || !Number.isInteger(d.votos)) {
          throw new Error("Votos inválidos");
        }
        totalVotos += d.votos;
      }

      if (totalVotos > mesa.electores) {
        throw new Error("Total de votos supera el número de electores");
      }

      const nuevoResultado = await tx.resultado.create({
        data: {
          mesaId,
          registeredBy: session.user.id,
          totalVotos,
          detalles: {
            create: detalles.map(d => ({
              organizacionId: d.organizacionId,
              votos: d.votos
            }))
          }
        }
      });

      await tx.mesa.update({
        where: { id: mesaId },
        data: { estado: "REGISTRADA" }
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREAR_RESULTADO",
          mesaId,
          newData: { totalVotos, detalles }
        }
      });

      return nuevoResultado;
    });

    // Emitir el evento de forma asíncrona
    broadcastEvent("mesa-actualizada", { mesaId });

    return NextResponse.json({ success: true, resultado });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 400 });
  }
}
