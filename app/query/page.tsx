"use client";

import { useState, useEffect } from "react";
import { executePrismaQuery, executeRawSql, executePrismaCode } from "@/lib/actions/database";
import { 
  Database, 
  Terminal, 
  Play, 
  AlertTriangle, 
  FileText, 
  Download, 
  Info, 
  Trash2, 
  Search, 
  Code, 
  Copy,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  History
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { RoleGuard } from "@/components/shared/RoleGuard";

// Database models and schema information for sidebar
const DB_MODELS = [
  {
    name: "User",
    fields: [
      { name: "id", type: "String (cuid)" },
      { name: "email", type: "String (unique)" },
      { name: "role", type: "String (OWNER | ADMIN | EMPLOYEE)" },
      { name: "employeeId", type: "String (nullable)" },
      { name: "isActive", type: "Boolean" },
      { name: "createdAt", type: "DateTime" },
      { name: "updatedAt", type: "DateTime" }
    ],
    presetJson: '{\n  "take": 10,\n  "select": {\n    "id": true,\n    "email": true,\n    "role": true,\n    "isActive": true,\n    "createdAt": true\n  }\n}'
  },
  {
    name: "Order",
    fields: [
      { name: "id", type: "String (cuid)" },
      { name: "custName", type: "String" },
      { name: "custPhone", type: "String" },
      { name: "vehicle", type: "String" },
      { name: "plateNumber", type: "String (nullable)" },
      { name: "complaint", type: "String" },
      { name: "serviceType", type: "ServiceType (LIGHT_SERVICE | HEAVY_SERVICE | etc.)" },
      { name: "status", type: "OrderStatus (PENDING | IN_PROGRESS | DONE | etc.)" },
      { name: "scheduledAt", type: "DateTime (nullable)" },
      { name: "totalPrice", type: "Decimal" },
      { name: "totalPaid", type: "Decimal" },
      { name: "paymentStatus", type: "PaymentStatus (UNPAID | HALF_PAID | PAID)" },
      { name: "mechanicId", type: "String (nullable)" },
      { name: "createdAt", type: "DateTime" }
    ],
    presetJson: '{\n  "take": 5,\n  "orderBy": {\n    "createdAt": "desc"\n  },\n  "include": {\n    "mechanic": {\n      "select": {\n        "name": true,\n        "role": true\n      }\n    }\n  }\n}'
  },
  {
    name: "Employee",
    fields: [
      { name: "id", type: "String (cuid)" },
      { name: "name", type: "String" },
      { name: "role", type: "String" },
      { name: "phone", type: "String (nullable)" },
      { name: "salaryType", type: "SalaryType (DAILY | COMMISSION | MONTHLY)" },
      { name: "dailyRate", type: "Decimal" },
      { name: "commissionRate", type: "Decimal" },
      { name: "isActive", type: "Boolean" }
    ],
    presetJson: '{\n  "where": {\n    "isActive": true\n  }\n}'
  },
  {
    name: "SparePart",
    fields: [
      { name: "id", type: "String (cuid)" },
      { name: "code", type: "String (unique)" },
      { name: "name", type: "String" },
      { name: "stock", type: "Int" },
      { name: "minStock", type: "Int" },
      { name: "unit", type: "String" },
      { name: "buyPrice", type: "Decimal" },
      { name: "sellPrice", type: "Decimal" },
      { name: "isActive", type: "Boolean" }
    ],
    presetJson: '{\n  "where": {\n    "isActive": true\n  },\n  "orderBy": {\n    "stock": "asc"\n  }\n}'
  },
  {
    name: "BankAccount",
    fields: [
      { name: "id", type: "String (cuid)" },
      { name: "bankCode", type: "String" },
      { name: "bankName", type: "String" },
      { name: "accountNumber", type: "String" },
      { name: "accountName", type: "String" },
      { name: "currentBalance", type: "Decimal" },
      { name: "isActive", type: "Boolean" }
    ],
    presetJson: '{\n  "orderBy": {\n    "bankName": "asc"\n  }\n}'
  },
  {
    name: "Payment",
    fields: [
      { name: "id", type: "String (cuid)" },
      { name: "date", type: "DateTime" },
      { name: "amount", type: "Decimal" },
      { name: "paymentMethod", type: "String" },
      { name: "orderId", type: "String (nullable)" },
      { name: "bankAccountId", type: "String (nullable)" }
    ],
    presetJson: '{\n  "take": 10,\n  "orderBy": {\n    "date": "desc"\n  }\n}'
  },
  {
    name: "SystemSetting",
    fields: [
      { name: "id", type: "String (cuid)" },
      { name: "key", type: "String (unique)" },
      { name: "value", type: "String" },
      { name: "updatedAt", type: "DateTime" }
    ],
    presetJson: '{\n  "orderBy": {\n    "key": "asc"\n  }\n}'
  },
  {
    name: "ActivityLog",
    fields: [
      { name: "id", type: "String (cuid)" },
      { name: "action", type: "String" },
      { name: "title", type: "String" },
      { name: "details", type: "String" },
      { name: "userName", type: "String (nullable)" },
      { name: "role", type: "String (nullable)" },
      { name: "createdAt", type: "DateTime" }
    ],
    presetJson: '{\n  "take": 10,\n  "orderBy": {\n    "createdAt": "desc"\n  }\n}'
  }
];

const PRISMA_OPERATIONS = [
  "findMany",
  "findFirst",
  "findUnique",
  "count",
  "aggregate",
  "groupBy"
];

interface QueryHistoryItem {
  id: string;
  type: "prisma" | "sql" | "js";
  query: string;
  timestamp: string;
  target?: string; // Model name for prisma, etc.
}

export default function DatabaseConsolePublic() {
  const [activeQueryTab, setActiveQueryTab] = useState<string>("prisma");
  const [activeResultTab, setActiveResultTab] = useState<string>("Table");
  
  // State for Prisma Builder
  const [selectedModel, setSelectedModel] = useState<string>("User");
  const [selectedOp, setSelectedOp] = useState<string>("findMany");
  const [prismaArgs, setPrismaArgs] = useState<string>("{\n  \"take\": 10\n}");

  // State for Raw SQL
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM "User" LIMIT 10;');

  // State for JS Playground
  const [jsCode, setJsCode] = useState<string>(
    '// Tulis kode kueri prisma di sini, gunakan return untuk mengembalikan data\nconst activeUsers = await prisma.user.findMany({\n  where: { isActive: true },\n  take: 5\n});\nreturn activeUsers;'
  );

  // General query management states
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  
  // UI filter states
  const [sidebarSearch, setSidebarSearch] = useState<string>("");
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({ User: true });
  const [resultFilter, setResultFilter] = useState<string>("");
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Load query history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("nopzgarage_query_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveToHistory = (type: "prisma" | "sql" | "js", query: string, target?: string) => {
    const newItem: QueryHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      query,
      timestamp: new Date().toLocaleTimeString(),
      target
    };
    const updated = [newItem, ...history.slice(0, 19)]; // limit to 20
    setHistory(updated);
    localStorage.setItem("nopzgarage_query_history", JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("nopzgarage_query_history");
    toast.success("Riwayat kueri dibersihkan.");
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(prismaArgs);
      setPrismaArgs(JSON.stringify(parsed, null, 2));
      toast.success("JSON berhasil dirapikan!");
    } catch (err: any) {
      toast.error(`Format JSON salah: ${err.message}`);
    }
  };

  const executeQuery = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResultData(null);
    setExecTime(null);
    setRowCount(null);
    setCurrentPage(1);

    try {
      let res;
      if (activeQueryTab === "prisma") {
        res = await executePrismaQuery(selectedModel, selectedOp, prismaArgs);
        saveToHistory("prisma", `${selectedModel}.${selectedOp}(${prismaArgs})`, `${selectedModel}.${selectedOp}`);
      } else if (activeQueryTab === "sql") {
        res = await executeRawSql(sqlQuery);
        saveToHistory("sql", sqlQuery, "SQL Raw");
      } else {
        res = await executePrismaCode(jsCode);
        saveToHistory("js", jsCode, "JS Playground");
      }

      if (res.success) {
        setResultData(res.result);
        setExecTime(res.duration ?? null);
        setRowCount(res.count ?? null);
        
        // Auto switch tab if not array
        if (!Array.isArray(res.result)) {
          setActiveResultTab("json");
        } else {
          setActiveResultTab("Table");
        }
        toast.success("Kueri berhasil dieksekusi!");
      } else {
        setErrorMsg(res.error || "Terjadi kesalahan tidak dikenal.");
        toast.error("Gagal mengeksekusi kueri.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghubungi server.");
      toast.error("Terjadi error server.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (modelName: string) => {
    const model = DB_MODELS.find(m => m.name === modelName);
    if (model) {
      setSelectedModel(modelName);
      setSelectedOp("findMany");
      if (model.presetJson) {
        setPrismaArgs(model.presetJson);
      }
      setActiveQueryTab("prisma");
      toast.info(`Preset model ${modelName} diterapkan.`);
    }
  };

  const loadFromHistoryItem = (item: QueryHistoryItem) => {
    setActiveQueryTab(item.type);
    if (item.type === "prisma") {
      if (item.target) {
        const [model, op] = item.target.split(".");
        setSelectedModel(model);
        setSelectedOp(op);
      }
      // Extract args from query string
      const match = item.query.match(/\(([\s\S]*)\)$/);
      if (match) {
        setPrismaArgs(match[1]);
      }
    } else if (item.type === "sql") {
      setSqlQuery(item.query);
    } else if (item.type === "js") {
      setJsCode(item.query);
    }
    toast.success("Kueri dari riwayat dimuat!");
  };

  // Export Results
  const exportToJson = () => {
    if (!resultData) return;
    const blob = new Blob([JSON.stringify(resultData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `query_result_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Data berhasil diekspor ke JSON!");
  };

  const exportToCsv = () => {
    if (!resultData || !Array.isArray(resultData) || resultData.length === 0) {
      toast.error("Hasil harus berupa list objek untuk diekspor ke CSV.");
      return;
    }
    
    try {
      // Find all distinct keys
      const headers = Array.from(new Set(resultData.flatMap(row => Object.keys(row || {}))));
      
      const csvRows = [
        headers.join(","), // header row
        ...resultData.map(row => 
          headers.map(header => {
            const val = row[header];
            if (val === null || val === undefined) return "";
            if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            return `"${val.toString().replace(/"/g, '""')}"`;
          }).join(",")
        )
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `query_result_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Data berhasil diekspor ke CSV!");
    } catch (e: any) {
      toast.error(`Gagal mengekspor CSV: ${e.message}`);
    }
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Hasil disalin ke clipboard!");
  };

  // Filtered sidebar models
  const filteredModels = DB_MODELS.filter(model => 
    model.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    model.fields.some(f => f.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
  );

  const toggleModelExpand = (name: string) => {
    setExpandedModels(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Filtered result table
  const getFilteredResult = () => {
    if (!resultData) return [];
    if (!Array.isArray(resultData)) return [resultData];
    
    if (!resultFilter.trim()) return resultData;
    
    return resultData.filter(row => {
      if (!row) return false;
      return Object.values(row).some(val => {
        if (val === null || val === undefined) return false;
        return val.toString().toLowerCase().includes(resultFilter.toLowerCase());
      });
    });
  };

  const processedData = getFilteredResult();
  
  // Pagination indexes
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = Array.isArray(processedData) 
    ? processedData.slice(startIndex, startIndex + pageSize) 
    : processedData;

  // Extract columns for table view
  const tableColumns = Array.isArray(resultData) && resultData.length > 0
    ? Array.from(new Set(resultData.flatMap(row => Object.keys(row || {}))))
    : [];

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="flex-1 p-6 space-y-6 max-w-[1400px] mx-auto min-h-screen bg-background text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8 text-primary animate-pulse" />
            Prisma Database Console (Public Dev Mode)
          </h1>
          <p className="text-muted-foreground">
            Akses publik sementara untuk mempermudah development database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-sm bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1.5 font-medium">
            <AlertTriangle className="h-4 w-4" />
            Akses Tanpa Login (Public)
          </Badge>
        </div>
      </div>

      {/* Warning Callout */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-4 rounded-lg flex items-start gap-3 text-sm">
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Perhatian (Development Only)</p>
          <p className="opacity-90">
            Halaman ini dapat diakses secara publik di `/query` tanpa perlunya login. Pastikan Anda menonaktifkan
            kembali akses publik ini sebelum melakukan deployment ke lingkungan produksi (production).
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Schema Explorer & History */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Schema Explorer */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Eksplorasi Skema
              </CardTitle>
              <CardDescription>Pilih tabel & salin struktur field</CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari tabel..."
                  className="pl-8"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 max-h-[400px] overflow-y-auto space-y-1">
              {filteredModels.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-8">Model tidak ditemukan</p>
              ) : (
                filteredModels.map(model => {
                  const isExpanded = !!expandedModels[model.name];
                  return (
                    <div key={model.name} className="border border-muted/50 rounded-md overflow-hidden bg-muted/5">
                      <div
                        onClick={() => toggleModelExpand(model.name)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold hover:bg-muted/30 transition-colors text-left cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          {model.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyPreset(model.name);
                          }}
                          title="Terapkan Preset Kueri"
                        >
                          <Sparkles className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-3 pb-2 border-t pt-1 bg-background text-xs space-y-1 divide-y divide-muted/30">
                          {model.fields.map(field => (
                            <div key={field.name} className="flex justify-between py-1 font-mono">
                              <span className="text-foreground/80">{field.name}</span>
                              <span className="text-muted-foreground">{field.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Query History */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Riwayat Kueri
                </CardTitle>
              </div>
              {history.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClearHistory} 
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  title="Hapus Semua Riwayat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-2 max-h-[300px] overflow-y-auto space-y-1">
              {history.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-8">Belum ada riwayat kueri</p>
              ) : (
                history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistoryItem(item)}
                    className="w-full text-left p-2 rounded hover:bg-muted/40 transition-colors border border-transparent hover:border-muted/60 space-y-1 block"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-primary truncate max-w-[120px]">{item.target || item.type}</span>
                      <span className="text-muted-foreground">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-mono max-h-[2.4em] overflow-hidden whitespace-pre-wrap leading-tight">
                      {item.query.substring(0, 100)}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Query Editors & Results */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Query Editors Panel */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <Tabs value={activeQueryTab} onValueChange={(val) => {
                setActiveQueryTab(val);
                setErrorMsg(null);
              }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2 border-b">
                  <TabsList className="grid grid-cols-3 w-full sm:w-[360px]">
                    <TabsTrigger value="prisma" className="gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Prisma Client
                    </TabsTrigger>
                    <TabsTrigger value="sql" className="gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      SQL Raw
                    </TabsTrigger>
                    <TabsTrigger value="js" className="gap-1.5">
                      <Code className="h-3.5 w-3.5" />
                      JS Playground
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Execution Button */}
                  <Button 
                    onClick={executeQuery} 
                    disabled={loading} 
                    className="bg-primary hover:bg-primary/95 text-white gap-2 font-semibold shadow shrink-0"
                  >
                    <Play className="h-4 w-4" />
                    {loading ? "Mengeksekusi..." : "Jalankan Kueri"}
                  </Button>
                </div>

                {/* Prisma Client Tab */}
                <TabsContent value="prisma" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="model-select">Pilih Model Database</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger id="model-select" className="mt-1.5 font-semibold">
                          <SelectValue placeholder="Pilih model..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DB_MODELS.map(m => (
                            <SelectItem key={m.name} value={m.name} className="font-mono">
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="operation-select">Operasi</Label>
                      <Select value={selectedOp} onValueChange={setSelectedOp}>
                        <SelectTrigger id="operation-select" className="mt-1.5 font-semibold">
                          <SelectValue placeholder="Pilih operasi..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PRISMA_OPERATIONS.map(op => (
                            <SelectItem key={op} value={op} className="font-mono">
                              {op}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prisma-args">
                        Argumen Kueri (Format JSON - <span className="font-mono">prisma.{selectedModel.toLowerCase()}.{selectedOp}(...)</span>)
                      </Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleFormatJson}
                        className="h-7 text-xs gap-1 border-muted hover:bg-muted"
                      >
                        Format JSON
                      </Button>
                    </div>
                    <textarea
                      id="prisma-args"
                      value={prismaArgs}
                      onChange={(e) => setPrismaArgs(e.target.value)}
                      className="w-full h-40 font-mono text-sm p-3 border rounded-md bg-zinc-950 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                    />
                  </div>
                </TabsContent>

                {/* SQL Tab */}
                <TabsContent value="sql" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sql-query">Kueri Raw SQL (PostgreSQL)</Label>
                      <Select onValueChange={(val) => setSqlQuery(val)}>
                        <SelectTrigger className="w-[200px] h-7 text-xs">
                          <SelectValue placeholder="Pilih preset SQL..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='SELECT * FROM "User" LIMIT 10;'>10 User Terbaru</SelectItem>
                          <SelectItem value='SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 10;'>10 Order Terbaru</SelectItem>
                          <SelectItem value='SELECT status, count(*), sum("totalPrice") FROM "Order" GROUP BY status;'>Order Berdasarkan Status</SelectItem>
                          <SelectItem value='SELECT "paymentMethod", sum(amount) FROM "Payment" GROUP BY "paymentMethod";'>Total Pembayaran per Metode</SelectItem>
                          <SelectItem value='SELECT name, stock, "minStock" FROM "SparePart" WHERE stock < "minStock" AND "isActive" = true;'>Stok Suku Cadang Kritis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <textarea
                      id="sql-query"
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="w-full h-40 font-mono text-sm p-3 border rounded-md bg-zinc-950 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                    />
                  </div>
                </TabsContent>

                {/* JS playground Tab */}
                <TabsContent value="js" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="js-code">Script Javascript Kustom (Prisma Playground)</Label>
                      <Select onValueChange={(val) => setJsCode(val)}>
                        <SelectTrigger className="w-[240px] h-7 text-xs">
                          <SelectValue placeholder="Pilih template script..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={'// Ambil 5 order terbaru beserta info mekaniknya\nconst orders = await prisma.order.findMany({\n  take: 5,\n  include: {\n    mechanic: {\n      select: { name: true, role: true }\n    }\n  },\n  orderBy: { createdAt: "desc" }\n});\nreturn orders;'}>Order & Mekanik Relasi</SelectItem>
                          <SelectItem value={'// Hitung summary jumlah record database\nconst users = await prisma.user.count();\nconst orders = await prisma.order.count();\nconst parts = await prisma.sparePart.count();\nconst payments = await prisma.payment.aggregate({\n  _sum: { amount: true }\n});\nreturn {\n  totalUsers: users,\n  totalOrders: orders,\n  totalSpareParts: parts,\n  totalIncome: payments._sum.amount\n};'}>Database Summary Stats</SelectItem>
                          <SelectItem value={'// Temukan sparepart dengan stock < minStock\nconst criticalParts = await prisma.sparePart.findMany({\n  where: {\n    stock: {\n      lt: 5 // Batas kustom\n    },\n    isActive: true\n  },\n  orderBy: { stock: "asc" }\n});\nreturn criticalParts;'}>Critical Spareparts (Stock &lt; 5)</SelectItem>
                          <SelectItem value={'// Update password user dengan hashing bcrypt\n// bcrypt sudah tersedia langsung sebagai parameter global\nconst email = "user@example.com"; // Ganti dengan email target\nconst plainPassword = "passwordbaru123"; // Ganti dengan password baru\n\nconst hashedPassword = await bcrypt.hash(plainPassword, 10);\nconst updatedUser = await prisma.user.update({\n  where: { email: email },\n  data: { password: hashedPassword }\n});\n\nreturn {\n  success: true,\n  message: `Password untuk ${email} berhasil diupdate`,\n  userId: updatedUser.id\n};'}>Update Password (Bcrypt Hash)</SelectItem>
                          <SelectItem value={'// Update semua password user sekaligus\n// bcrypt sudah tersedia langsung sebagai parameter global\nconst plainPassword = "passwordbaru123"; // Password baru untuk semua user\n\nconst hashedPassword = await bcrypt.hash(plainPassword, 10);\nconst result = await prisma.user.updateMany({\n  data: { password: hashedPassword }\n});\n\nreturn {\n  success: true,\n  message: "Semua password user berhasil diperbarui",\n  updatedCount: result.count\n};'}>Update Semua Password (Bcrypt Hash)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <textarea
                      id="js-code"
                      value={jsCode}
                      onChange={(e) => setJsCode(e.target.value)}
                      className="w-full h-48 font-mono text-sm p-3 border rounded-md bg-zinc-950 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                      <Info className="h-3.5 w-3.5" />
                      Gunakan objek <code className="bg-muted px-1 py-0.5 rounded font-mono text-foreground font-semibold">prisma</code> secara langsung (misal: <code className="bg-muted px-1 py-0.5 rounded font-mono">await prisma.user.count()</code>) dan kembalikan nilai menggunakan kata kunci <code className="bg-muted px-1 py-0.5 rounded font-mono font-semibold">return</code>.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Error Message Display */}
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-400 p-4 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1 font-mono text-sm w-full overflow-x-auto">
                <p className="font-semibold text-rose-600 dark:text-rose-300">Eksekusi Gagal:</p>
                <pre className="whitespace-pre-wrap leading-tight mt-1 bg-rose-950/20 p-2 rounded">{errorMsg}</pre>
              </div>
            </div>
          )}

          {/* Results Console */}
          {resultData !== null && (
            <Card className="shadow-sm">
              <CardHeader className="p-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Hasil Kueri
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground font-mono">
                      <span className="bg-muted px-2 py-0.5 rounded">Waktu: {execTime}ms</span>
                      <span className="bg-muted px-2 py-0.5 rounded">Jumlah: {rowCount} baris</span>
                    </div>
                  </div>
                  
                  {/* Exports and Table/JSON triggers */}
                  <div className="flex items-center gap-2">
                    <Tabs value={activeResultTab} onValueChange={setActiveResultTab} className="w-[180px]">
                      <TabsList className="grid grid-cols-2 h-8">
                        <TabsTrigger value="Table" disabled={!Array.isArray(resultData) || resultData.length === 0} className="text-xs">Grid</TabsTrigger>
                        <TabsTrigger value="json" className="text-xs">JSON</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {/* Export Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(resultData, null, 2))}
                        className="h-8 w-8 p-0"
                        title="Salin JSON"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToJson}
                        className="h-8 gap-1.5 text-xs"
                        title="Unduh JSON"
                      >
                        <Download className="h-3.5 w-3.5" />
                        JSON
                      </Button>
                      {Array.isArray(resultData) && resultData.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportToCsv}
                          className="h-8 gap-1.5 text-xs"
                          title="Unduh CSV"
                        >
                          <Download className="h-3.5 w-3.5" />
                          CSV
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Client side filter for result array */}
                {Array.isArray(resultData) && resultData.length > 0 && (
                  <div className="pt-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Filter hasil kueri saat ini..."
                        value={resultFilter}
                        onChange={(e) => {
                          setResultFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="h-8 pl-8 text-xs max-w-sm"
                      />
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                
                {/* Grid View Table */}
                {activeResultTab === "Table" && Array.isArray(resultData) && resultData.length > 0 ? (
                  <div className="overflow-x-auto max-h-[500px]">
                    <Table>
                      <TableHeader className="bg-muted/30 sticky top-0 z-10">
                        <TableRow>
                          {tableColumns.map(col => (
                            <TableHead key={col} className="font-mono text-xs whitespace-nowrap">
                              {col}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={tableColumns.length} className="text-center py-8 text-muted-foreground text-sm">
                              Tidak ada data yang cocok dengan filter.
                            </TableCell>
                          </TableRow>
                        ) : (
                          (paginatedData as any[]).map((row, idx) => (
                            <TableRow key={idx} className="hover:bg-muted/10 font-mono text-xs">
                              {tableColumns.map(col => {
                                const cellVal = row?.[col];
                                let renderedVal = "";
                                
                                if (cellVal === null || cellVal === undefined) {
                                  renderedVal = "NULL";
                                } else if (typeof cellVal === "object") {
                                  renderedVal = JSON.stringify(cellVal);
                                } else if (typeof cellVal === "boolean") {
                                  renderedVal = cellVal ? "TRUE" : "FALSE";
                                } else {
                                  renderedVal = cellVal.toString();
                                }

                                return (
                                  <TableCell 
                                    key={col} 
                                    className={`whitespace-nowrap max-w-[240px] truncate ${cellVal === null || cellVal === undefined ? "text-muted-foreground/60 italic" : "text-foreground"}`}
                                    title={renderedVal}
                                  >
                                    {renderedVal}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : activeResultTab === "Table" ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Hasil bukan merupakan list data yang dapat ditabelkan.
                  </div>
                ) : null}

                {/* JSON view code-block */}
                {activeResultTab === "json" && (
                  <div className="p-4 bg-zinc-950 text-emerald-400 font-mono text-xs overflow-auto max-h-[500px] border-t">
                    <pre className="whitespace-pre">{JSON.stringify(resultData, null, 2)}</pre>
                  </div>
                )}

                {/* Pagination control for arrays */}
                {Array.isArray(resultData) && resultData.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t bg-muted/10">
                    <div className="text-xs text-muted-foreground">
                      Menampilkan <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(startIndex + pageSize, totalItems)}</span> dari <span className="font-semibold">{totalItems}</span> baris
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="h-8 text-xs"
                      >
                        Sebelumnya
                      </Button>
                      <div className="text-xs px-2">
                        Halaman {currentPage} dari {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="h-8 text-xs"
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          )}

        </div>

      </div>
    </div>
  </RoleGuard>
  );
}
