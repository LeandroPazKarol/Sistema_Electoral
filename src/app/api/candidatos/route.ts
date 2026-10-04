import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";

export async function GET() {
  const candidatos = await prisma.candidato.findMany();
  return NextResponse.json(candidatos);
}

export async function POST(req: Request) {
  const { nombre } = await req.json();
  if (!nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  
  try {
    const candidato = await prisma.candidato.create({ data: { nombre } });
    broadcastEvent("update", {});
    return NextResponse.json(candidato);
  } catch (e) {
    return NextResponse.json({ error: "Error o duplicado" }, { status: 400 });
  }
}
