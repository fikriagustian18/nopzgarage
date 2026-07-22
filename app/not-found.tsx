import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 rounded-full bg-slate-800 p-4 text-emerald-400 border border-slate-700">
        <FileQuestion className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
        404
      </h1>
      <h2 className="text-xl font-semibold text-slate-200 mb-2">
        Halaman Tidak Ditemukan
      </h2>
      <p className="max-w-md text-sm text-slate-400 mb-6">
        Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
      </p>
      <Link href="/">
        <Button className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Button>
      </Link>
    </div>
  );
}
