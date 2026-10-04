import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";

export async function GET() {
  const partidos = await prisma.partido.findMany();
  return NextResponse.json(partidos);
}

export async function POST(req: Request) {
  const { nombre, color } = await req.json();
  if (!nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  
  try {
    const partido = await prisma.partido.create({ 
      data: { nombre, color: color || "#3b82f6" } 
    });
    broadcastEvent("update", {});
    return NextResponse.json(partido);
  } catch (e) {
    return NextResponse.json({ error: "Error o duplicado" }, { status: 400 });
  }
}
