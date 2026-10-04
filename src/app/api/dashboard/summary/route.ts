import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const total = await prisma.mesa.count();
    const pendientes = await prisma.mesa.count({ where: { estado: "PENDIENTE" } });
    const registradas = await prisma.mesa.count({ where: { estado: "REGISTRADA" } });
    const observadas = await prisma.mesa.count({ where: { estado: "OBSERVADA" } });
    const validadas = await prisma.mesa.count({ where: { estado: "VALIDADA" } });
    
    // Ultimas 5 mesas registradas
    const ultimas = await prisma.resultado.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        mesa: {
          include: { distrito: true }
        }
      }
    });

    const stats = {
      total,
      pendientes,
      registradas,
      observadas,
      validadas,
      avance: total > 0 ? ((registradas + validadas) / total) * 100 : 0
    };

    return NextResponse.json({ success: true, stats, ultimas });
  } catch (error: any) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
