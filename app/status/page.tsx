'use client';

import { useState } from "react";
import { searchOrderByPlate } from "@/app/actions/order-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Gauge, ArrowLeft, Loader2, AlertCircle, CheckCircle, CheckCircle2, Clock, Wrench, Settings, Printer } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { ThemeToggle } from "@/components/ThemeToggle"; // Import ThemeToggle
import { ExportButton } from "@/components/export/ExportButton";
import { exportInvoice } from "@/lib/export/reports/invoice-export";
import type { InvoiceExport } from "@/lib/export/types";

export default function StatusPage() {
  const [plateNumber, setPlateNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<any[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOrders([]);
    setLoading(true);
 
    const result = await searchOrderByPlate(plateNumber);
    
    setLoading(false);

    if (result.success && result.orders) {
      setOrders(result.orders);
    } else {
      setError(result.error || "Terjadi kesalahan");
    }
  }

  const getStatusInfo = (status: string) => {
    const statusMap: any = {
      'PENDING': { label: 'Menunggu Konfirmasi', color: 'bg-gray-100 text-gray-800', icon: Clock },
      'ESTIMATED': { label: 'Sudah Diestimasi', color: 'bg-blue-100 text-blue-800', icon: Clock },
      'CONFIRMED': { label: 'Menunggu Servis', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
      'QUEUE': { label: 'Dalam Antrian', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'IN_PROGRESS': { label: 'Sedang Dikerjakan', color: 'bg-blue-100 text-blue-800', icon: Wrench },
      'READY': { label: 'Siap Diambil', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'COMPLETED': { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'CANCELLED': { label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  const getPaymentInfo = (status: string) => {
    const paymentMap: any = {
      'UNPAID': { label: 'Belum Bayar', color: 'bg-red-50 text-red-700 border-red-200' },
      'PARTIAL': { label: 'DP', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      'PAID': { label: 'Lunas', color: 'bg-green-50 text-green-700 border-green-200' },
    };
    return paymentMap[status] || { label: status, color: 'bg-gray-50 text-gray-700' };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-primary/10 rounded-b-[50%] blur-3xl -z-10"></div>

      <div className="w-full max-w-4xl mx-auto space-y-6 py-8">
        <div className="flex justify-between items-center mb-4">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
            </Link>
            <ThemeToggle />
        </div>
        
        <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-2">
                <Gauge className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Cek Status Servis</h1>
            <p className="text-muted-foreground">
                Pantau progress pengerjaan motor Anda secara real-time.
            </p>
        </div>

        <Card className="border-border/50 shadow-xl">
            <CardHeader>
                <CardTitle>Lacak Kendaraan</CardTitle>
                <CardDescription>Masukkan nomor polisi kendaraan Anda.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSearch}>
                    <div className="space-y-2">
                        <Input 
                            value={plateNumber}
                            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                            placeholder="Contoh: B 1234 XYZ" 
                            className="text-center text-lg font-mono uppercase tracking-widest h-12"
                            disabled={loading}
                        />
                    </div>
                    <Button className="w-full h-12 text-lg font-bold gap-2" disabled={loading}>
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        {loading ? 'Mencari...' : 'Cek Sekarang'}
                    </Button>
                </form>

                {/* Error State */}
                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Results */}
                {orders.length > 0 && (
                    <div className="mt-8 space-y-4">
                        <h3 className="font-bold text-lg">Ditemukan {orders.length} data servis:</h3>
                        {orders.map((order) => {
                            const statusInfo = getStatusInfo(order.status);
                            const paymentInfo = getPaymentInfo(order.paymentStatus);
                            const StatusIcon = statusInfo.icon;
                            
                            // Safe parse items - could be string or already parsed
                            let items = [];
                            try {
                                if (typeof order.items === 'string') {
                                    items = JSON.parse(order.items);
                                } else if (Array.isArray(order.items)) {
                                    items = order.items;
                                }
                            } catch (e) {
                                items = [];
                            }

                            return (
                                <Card key={order.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                                    <CardContent className="p-6 space-y-4">
                                        {/* Header */}
                                        <div className="flex justify-between items-start pb-4 border-b">
                                            <div>
                                                <h4 className="font-bold text-xl">{order.vehicle}</h4>
                                                <p className="text-sm text-muted-foreground">Plat: {order.plateNumber}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Customer: {order.custName}</p>
                                            </div>
                                            <div className="text-right space-y-2 flex flex-col items-end">
                                                <Badge className={`${statusInfo.color} border`}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {statusInfo.label}
                                                </Badge>
                                                <Badge variant="outline" className={paymentInfo.color}>
                                                    {paymentInfo.label}
                                                </Badge>
                                                {order.status === 'QUEUE' && order.queuePosition !== null && (
                                                    <div className="mt-2 text-xs font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 px-2.5 py-1 rounded-full border border-yellow-200 dark:border-yellow-900/50">
                                                        Nomor Antrian: Q-{String(order.queuePosition).padStart(2, '0')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Keluhan */}
                                        <div className="pb-4 border-b">
                                            <p className="text-xs text-muted-foreground mb-1">Keluhan / Permintaan</p>
                                            <p className="text-sm font-medium">{order.complaint}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Jenis Servis: <span className="font-medium capitalize">{order.serviceType.replace('_', ' ')}</span>
                                            </p>
                                        </div>

                                        {/* NOTA / INVOICE DETAIL */}
                                        {items.length > 0 && (
                                            <div className="pb-4 border-b">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="h-px flex-1 bg-border"></div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Detail Pekerjaan & Parts</p>
                                                    <div className="h-px flex-1 bg-border"></div>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    {/* Header Table */}
                                                    <div className="flex text-xs font-bold text-muted-foreground border-b pb-1">
                                                        <div className="flex-1">Item</div>
                                                        <div className="w-16 text-center">Qty</div>
                                                        <div className="w-28 text-right">Harga</div>
                                                        <div className="w-32 text-right">Subtotal</div>
                                                    </div>
                                                    
                                                    {/* Items List */}
                                                    {items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex text-sm py-1.5 hover:bg-muted/30 rounded px-1">
                                                            <div className="flex-1">
                                                                <p className="font-medium">{item.name}</p>
                                                                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                                                    {item.type === 'part' ? (
                                                                        <><Wrench className="h-3 w-3" /> Spare Part</>
                                                                    ) : (
                                                                        <><Settings className="h-3 w-3" /> Jasa</>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div className="w-16 text-center font-mono">{item.qty}x</div>
                                                            <div className="w-28 text-right font-mono text-xs">
                                                                Rp {Number(item.price).toLocaleString('id-ID')}
                                                            </div>
                                                            <div className="w-32 text-right font-bold">
                                                                Rp {(item.qty * item.price).toLocaleString('id-ID')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Timeline */}
                                        <div className="grid md:grid-cols-2 gap-4 pt-2 border-b pb-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Tanggal Masuk</p>
                                                <p className="text-sm font-bold">{format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}</p>
                                            </div>
                                            {order.status === 'COMPLETED' && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Selesai</p>
                                                    <p className="text-sm font-bold text-green-600">{format(new Date(order.updatedAt), "dd MMM yyyy, HH:mm", { locale: id })}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pricing Summary */}
                                        <div className="pt-2 space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span className="font-mono">Rp {Number(order.totalPrice).toLocaleString('id-ID')}</span>
                                            </div>
                                            {order.totalPaid > 0 && (
                                                <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                                                    <span>Sudah Dibayar</span>
                                                    <span className="font-bold font-mono">- Rp {Number(order.totalPaid).toLocaleString('id-ID')}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-2 border-t-2 border-dashed">
                                                <span className="font-bold">Total Tagihan</span>
                                                <span className="text-2xl font-black text-primary">
                                                    Rp {(Number(order.totalPrice) - Number(order.totalPaid)).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            {order.paymentStatus === 'PAID' && (
                                                <div className="text-center pt-2 pb-2">
                                                    <Badge className="bg-green-600 text-white flex items-center gap-1 w-fit mx-auto">
                                                        <CheckCircle2 className="h-3 w-3" /> LUNAS
                                                    </Badge>
                                                </div>
                                            )}

                                            {/* Action Buttons: Print Estimate / Receipt */}
                                            <div className="pt-4 flex justify-end border-t border-border/50">
                                                <ExportButton
                                                    title={order.paymentStatus === 'PAID' ? `Kuitansi_${order.id.slice(-6)}` : `Estimasi_${order.id.slice(-6)}`}
                                                    label={order.paymentStatus === 'PAID' ? "Cetak Bukti Pembayaran" : "Cetak Estimasi Biaya"}
                                                    variant="outline"
                                                    size="sm"
                                                    icon={<Printer className="h-4 w-4" />}
                                                    onExport={async (exportFormat, orientation) => {
                                                        const invoiceData: InvoiceExport = {
                                                            invoiceNumber: `INV-${order.id.slice(-6).toUpperCase()}`,
                                                            invoiceDate: new Date(order.createdAt),
                                                            dueDate: new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000),
                                                            customerName: order.custName,
                                                            customerAddress: "-",
                                                            items: items.map((item: any) => ({
                                                                description: item.name,
                                                                quantity: item.qty,
                                                                unitPrice: item.price,
                                                                total: item.qty * item.price
                                                            })),
                                                            subtotal: order.totalPrice,
                                                            tax: 0,
                                                            discount: 0,
                                                            total: order.totalPrice,
                                                            paymentStatus: order.paymentStatus === 'PAID' ? 'LUNAS' : order.paymentStatus === 'PARTIAL' ? 'DP' : 'BELUM BAYAR',
                                                            notes: `Kendaraan: ${order.vehicle} (${order.plateNumber || '-'}) \nKeluhan: ${order.complaint}`
                                                        };
                                                        return await exportInvoice(invoiceData, exportFormat, orientation);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
            <p>Data diperbarui secara real-time oleh teknisi kami.</p>
            <p className="mt-1">Untuk informasi lebih lanjut, hubungi kami melalui WhatsApp.</p>
        </div>
      </div>
    </div>
  );
}
