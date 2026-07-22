export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
      </div>
      <p className="text-sm font-medium text-slate-400 animate-pulse">
        Memuat data...
      </p>
    </div>
  );
}
