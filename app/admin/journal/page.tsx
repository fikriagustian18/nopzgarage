"use client";

import { useEffect, useState } from "react";
import { getJournalEntries } from "@/app/actions/payments";
import { RoleGuard } from "@/components/RoleGuard";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/Table";
import { Search, Loader2, BookOpen } from "lucide-react";
import { ExportButton } from "@/components/export/ExportButton";
import { exportJournalEntries } from "@/lib/export/reports/journalExport";
import type { JournalEntryExport } from "@/lib/export/types";

export default function GeneralJournalPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Load Data
    async function loadData() {
        setLoading(true);
        const res = await getJournalEntries();
        if (res.success) setEntries(res.entries || []);
        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, []);

    // Filter Logic
    const filteredEntries = entries.filter(entry => 
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.reference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.items?.some((item: any) => 
            item.account?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.account?.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
      <RoleGuard allowedRoles={["OWNER"]}>
        <div className="min-h-screen bg-background text-foreground">
            <div className="p-8 space-y-6">
                {/* Title Section */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-primary" />
                        Jurnal Umum (General Journal)
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Catatan semua transaksi akuntansi dalam sistem double-entry bookkeeping.
                    </p>
                </div>

                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Daftar Jurnal</CardTitle>
                            <CardDescription>Semua entri jurnal akuntansi dari transaksi pembayaran.</CardDescription>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Cari jurnal..." 
                                    className="pl-9 w-full md:w-[250px]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <ExportButton
                                title="Jurnal_Umum"
                                onExport={async (format, orientation) => {
                                    // Convert entries to export format
                                    const exportData: JournalEntryExport[] = entries.map(entry => ({
                                        id: entry.id,
                                        date: entry.date,
                                        description: entry.description,
                                        reference: entry.reference,
                                        items: entry.items || [],
                                    }));
                                    return await exportJournalEntries(exportData, format, orientation);
                                }}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table className="min-w-[900px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Tanggal</TableHead>
                                        <TableHead>Deskripsi</TableHead>
                                        <TableHead>Ref</TableHead>
                                        <TableHead>Akun</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Kredit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredEntries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                {searchQuery ? "Tidak ada yang cocok dengan pencarian" : "Belum ada jurnal."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEntries.map((entry) => {
                                            // Group items by entry
                                            const itemCount = entry.items?.length || 0;
                                            
                                            return entry.items?.map((item: any, idx: number) => (
                                                <TableRow key={`${entry.id}-${idx}`} className={idx === 0 ? "border-t-2 border-primary/20" : ""}>
                                                    {/* Date & Description - only show on first row of entry */}
                                                    {idx === 0 ? (
                                                        <>
                                                            <TableCell className="font-mono text-xs align-top" rowSpan={itemCount}>
                                                                {format(new Date(entry.date), "dd/MM/yyyy", { locale: id })}
                                                                <div className="text-[10px] text-muted-foreground">
                                                                    {format(new Date(entry.date), "HH:mm")}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="align-top" rowSpan={itemCount}>
                                                                <div className="font-medium">{entry.description}</div>
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground font-mono align-top" rowSpan={itemCount}>
                                                                {entry.reference ? entry.reference.slice(-8) : "(-)"}
                                                            </TableCell>
                                                        </>
                                                    ) : null}
                                                    
                                                    {/* Account */}
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {idx > 0 && <span className="text-muted-foreground text-xs ml-4">↳</span>}
                                                            <div>
                                                                <div className="font-medium text-sm">{item.account?.name}</div>
                                                                <div className="text-xs text-muted-foreground font-mono">
                                                                    {item.account?.code}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    
                                                    {/* Debit */}
                                                    <TableCell className="text-right font-mono">
                                                        {item.debit > 0 ? (
                                                            <span className="text-green-600 dark:text-green-400 font-semibold">
                                                                Rp {Number(item.debit).toLocaleString('id-ID')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    
                                                    {/* Credit */}
                                                    <TableCell className="text-right font-mono">
                                                        {item.credit > 0 ? (
                                                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                                                Rp {Number(item.credit).toLocaleString('id-ID')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ));
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Card */}
                <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Total Entries</p>
                                <p className="text-2xl font-bold">{entries.length}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Total Debit</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    Rp {entries.reduce((sum, e) => 
                                        sum + e.items?.reduce((iSum: number, i: any) => iSum + Number(i.debit || 0), 0), 0
                                    ).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Total Kredit</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    Rp {entries.reduce((sum, e) => 
                                        sum + e.items?.reduce((iSum: number, i: any) => iSum + Number(i.credit || 0), 0), 0
                                    ).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </RoleGuard>
    );
}
