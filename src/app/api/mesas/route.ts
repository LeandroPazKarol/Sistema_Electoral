import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";

export async function GET() {
  const mesas = await prisma.mesa.findMany({
    include: { votos: true },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json(mesas);
}

export async function POST(req: Request) {
  const { nombre } = await req.json();
  if (!nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  
  try {
    const mesa = await prisma.mesa.create({ data: { nombre } });
    broadcastEvent("update", {});
    return NextResponse.json(mesa);
  } catch (e) {
    return NextResponse.json({ error: "Error o duplicada" }, { status: 400 });
  }
}
