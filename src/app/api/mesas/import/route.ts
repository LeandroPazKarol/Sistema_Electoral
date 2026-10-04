
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const data = await req.json();
    const mesas = data.mesas; // Array of objects

    if (!Array.isArray(mesas)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    let creadas = 0;
    let omitidas = 0;

    for (const row of mesas) {
      const {
        codigo_mesa,
        region,
        consejero,
        provincia,
        distrito,
        electores,
        latitud,
        longitud,
      } = row;

      if (!codigo_mesa || !region || !consejero || !provincia || !distrito || !electores) {
        omitidas++;
        continue;
      }

      // Existe?
      const existe = await prisma.mesa.findUnique({
        where: { codigo: codigo_mesa.toString() },
      });

      if (existe) {
        omitidas++;
        continue;
      }

      // Jerarquía
      let regionRec = await prisma.region.findFirst({ where: { name: region } });
      if (!regionRec) {
        regionRec = await prisma.region.create({ data: { name: region } });
      }

      let consRec = await prisma.consejero.findFirst({
        where: { name: consejero, regionId: regionRec.id },
      });
      if (!consRec) {
        consRec = await prisma.consejero.create({
          data: { name: consejero, regionId: regionRec.id },
        });
      }

      let provRec = await prisma.provincia.findFirst({
        where: { name: provincia, consejeroId: consRec.id },
      });
      if (!provRec) {
        provRec = await prisma.provincia.create({
          data: { name: provincia, consejeroId: consRec.id },
        });
      }

      let distRec = await prisma.distrito.findFirst({
        where: { name: distrito, provinciaId: provRec.id },
      });
      if (!distRec) {
        distRec = await prisma.distrito.create({
          data: { name: distrito, provinciaId: provRec.id },
        });
      }

      // Crear Mesa
      await prisma.mesa.create({
        data: {
          codigo: codigo_mesa.toString(),
          electores: parseInt(electores, 10),
          regionId: regionRec.id,
          consejeroId: consRec.id,
          provinciaId: provRec.id,
          distritoId: distRec.id,
          latitud: latitud ? parseFloat(latitud) : null,
          longitud: longitud ? parseFloat(longitud) : null,
        },
      });

      creadas++;
    }

    // Auditoria
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "IMPORTAR_MESAS",
        newData: { creadas, omitidas },
      }
    });

    return NextResponse.json({ success: true, creadas, omitidas });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
