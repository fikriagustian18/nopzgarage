"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global App Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 rounded-full bg-red-500/10 p-4 text-red-500 border border-red-500/20">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">
        Terjadi Kesalahan Aplikasi
      </h2>
      <p className="max-w-md text-sm text-slate-400 mb-6">
        {error.message || "Maaf, terjadi masalah saat memproses permintaan Anda."}
      </p>
      <Button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
      >
        <RefreshCw className="h-4 w-4" />
        Coba Lagi
      </Button>
    </div>
  );
}
