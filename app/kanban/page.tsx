// app/kanban/page.tsx - Public Kanban Board untuk Customer
import Link from "next/link";
import { PublicKanban } from "@/components/shared/PublicKanban";
import { ArrowLeft, Wrench } from "lucide-react";

export default function KanbanPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">NopzGarage</h1>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
             Status Servis Real-Time
          </h2>
          <p className="text-gray-600">
            Lihat posisi motor Anda dalam antrian servis
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Auto-refresh setiap 20 detik
          </p>
        </div>

        <PublicKanban />
      </div>
    </div>
  );
}
