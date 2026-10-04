"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="bg-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-xl tracking-tight">
              Elecciones en Tiempo Real
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-slate-300" />
              <span className="text-sm font-medium">
                {session.user.username} ({session.user.role})
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
