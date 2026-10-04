import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";

export async function POST(req: Request) {
  const { mesaId, partidoId, accion } = await req.json();
  
  if (!mesaId || !partidoId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  try {
    // Uso de operaciones atómicas (increment/decrement) para garantizar concurrencia al 100%
    if (accion === "add") {
      await prisma.voto.upsert({
        where: { mesaId_partidoId: { mesaId, partidoId } },
        update: { cantidad: { increment: 1 } },
        create: { mesaId, partidoId, cantidad: 1 }
      });
    } else {
      // Para restar aseguramos no bajar de 0
      const voto = await prisma.voto.findUnique({
        where: { mesaId_partidoId: { mesaId, partidoId } }
      });
      if (voto && voto.cantidad > 0) {
        await prisma.voto.update({
          where: { id: voto.id },
          data: { cantidad: { decrement: 1 } }
        });
      }
    }

    broadcastEvent("update", {});
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Error de bd" }, { status: 500 });
  }
}
