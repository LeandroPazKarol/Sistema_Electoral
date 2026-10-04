import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      role: "ADMINISTRADOR",
    },
  });

  const operador = await prisma.user.upsert({
    where: { username: "operador1" },
    update: {},
    create: {
      username: "operador1",
      passwordHash: await bcrypt.hash("operador123", 10),
      role: "OPERADOR",
    },
  });

  const orgs = [
    { name: "Organización A", tipo: "CANDIDATURA" },
    { name: "Organización B", tipo: "CANDIDATURA" },
    { name: "Votos Blancos", tipo: "BLANCO" },
    { name: "Votos Nulos", tipo: "NULO" },
  ];

  for (const org of orgs) {
    await prisma.organizacion.create({ data: org as any }).catch(() => {});
  }

  // Mesas mock
  let region = await prisma.region.findFirst({ where: { name: "Lima" } });
  if (!region) region = await prisma.region.create({ data: { name: "Lima" } });

  let cons = await prisma.consejero.findFirst({ where: { name: "Consejero A" } });
  if (!cons) cons = await prisma.consejero.create({ data: { name: "Consejero A", regionId: region.id } });

  let prov = await prisma.provincia.findFirst({ where: { name: "Lima" } });
  if (!prov) prov = await prisma.provincia.create({ data: { name: "Lima", consejeroId: cons.id } });

  let dist = await prisma.distrito.findFirst({ where: { name: "Miraflores" } });
  if (!dist) dist = await prisma.distrito.create({ data: { name: "Miraflores", provinciaId: prov.id } });

  for (let i = 1; i <= 5; i++) {
    const cod = `00000${i}`;
    const exists = await prisma.mesa.findUnique({ where: { codigo: cod } });
    if (!exists) {
      await prisma.mesa.create({
        data: {
          codigo: cod,
          electores: 300,
          regionId: region.id,
          consejeroId: cons.id,
          provinciaId: prov.id,
          distritoId: dist.id,
          latitud: -12.121 + (i * 0.001),
          longitud: -77.029 + (i * 0.001),
        }
      });
    }
  }

  console.log("Usuarios, organizaciones y mesas creados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
