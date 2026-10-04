import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMINISTRADOR") {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard Administrativo</h1>
      <p className="mb-8 text-slate-600">Bienvenido, {session.user.username}</p>
      
      <DashboardClient />
    </div>
  );
}
