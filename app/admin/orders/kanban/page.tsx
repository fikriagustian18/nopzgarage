// app/admin/orders/kanban/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Clock,
  User,
  Car,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { getAdminOrders } from "@/lib/actions/orders";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { ProcessOrderDialog } from "@/components/dialogs/ProcessOrderDialog";
import { OrderDialog } from "@/components/dialogs/OrderDialog";

type KanbanOrder = {
  id: string;
  custName: string;
  vehicle: string;
  plateNumber: string | null;
  serviceType: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  mechanic?: {
    name: string;
  } | null;
  queueNumber?: string;
};

type KanbanColumn = "PENDING" | "IN_PROGRESS" | "WAITING_FOR_PAYMENT" | "READY";
const KANBAN_COLUMNS: KanbanColumn[] = ["PENDING", "IN_PROGRESS", "WAITING_FOR_PAYMENT", "READY"];

export default function Page() {
  const router = useRouter();
  const [orders, setOrders] = useState<KanbanOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialogs
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<KanbanOrder | undefined>();

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setIsLoading(true);
    try {
      const result = await getAdminOrders({ limit: 100 });
      if (result.success && result.orders) {
        setOrders(result.orders as unknown as KanbanOrder[]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const getOrdersByColumn = (column: KanbanColumn) => {
    return orders.filter((order) => {
      if (column === "PENDING") {
        return order.status === "PENDING";
      }
      if (column === "IN_PROGRESS") {
        return order.status === "IN_PROGRESS";
      }
      if (column === "READY") {
        return order.status === "READY" && order.paymentStatus === "PAID";
      }
      if (column === "WAITING_FOR_PAYMENT") {
        return (order.status === "READY" || order.status === "COMPLETED") && order.paymentStatus !== "PAID";
      }
      return false;
    });
  };

  const getStatusConfig = (column: KanbanColumn) => {
    const config: Record<
      KanbanColumn,
      { label: string; color: string; bg: string; borderColor: string; icon: any }
    > = {
      PENDING: { 
        label: "Menunggu Estimasi", 
        color: "text-secondary", 
        bg: "bg-secondary/10", 
        borderColor: "border-secondary",
        icon: Clock 
      },
      IN_PROGRESS: { 
        label: "Sedang Dikerjakan", 
        color: "text-primary", 
        bg: "bg-primary/10", 
        borderColor: "border-primary",
        icon: Wrench 
      },
      READY: { 
        label: "Siap Diambil", 
        color: "text-chart-1", 
        bg: "bg-chart-1/10", 
        borderColor: "border-chart-1",
        icon: CheckCircle 
      },
      WAITING_FOR_PAYMENT: { 
        label: "Menunggu Pembayaran", 
        color: "text-teal-600 dark:text-teal-400", 
        bg: "bg-teal-100 dark:bg-teal-950/20", 
        borderColor: "border-teal-500",
        icon: Clock 
      },
    };
    return config[column] || config["PENDING"];
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Compact */}
      <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/orders")}>
            <Wrench className="h-6 w-6 text-primary" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Kanban Board</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Order Baru
          </Button>
        </div>
      </header>

      {/* Board Area */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full min-w-[1200px]">
          {KANBAN_COLUMNS.map((column) => {
            const columnConfig = getStatusConfig(column);
            const columnOrders = getOrdersByColumn(column);
            const Icon = columnConfig.icon;

            return (
              <div key={column} className="flex-1 flex flex-col bg-muted/30 rounded-xl border border-border h-full max-w-xs xl:max-w-sm">
                {/* Column Header */}
                <div className={`p-4 rounded-t-xl border-b border-border bg-card flex justify-between items-center sticky top-0 z-10 shadow-sm`}>
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${columnConfig.bg}`}>
                      <Icon className={`h-5 w-5 ${columnConfig.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground">{columnConfig.label}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    {columnOrders.length}
                  </Badge>
                </div>

                {/* Cards Container */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {columnOrders.map((order) => (
                    <Card key={order.id} className={`cursor-move hover:shadow-lg transition-all border-l-4 ${columnConfig.borderColor} group bg-card`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-mono text-muted-foreground">
                                ID: {order.id.slice(-6)}
                              </span>
                              {order.queueNumber && (
                                <Badge className="text-[9px] h-4 px-1 bg-primary/10 text-primary border border-primary/20 font-mono font-bold">
                                  {order.queueNumber}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-bold text-foreground text-sm line-clamp-1">{order.custName}</h4>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {column === "PENDING" && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedOrder(order);
                                  setProcessDialogOpen(true);
                                }}>
                                  <Wrench className="h-3 w-3 mr-2" /> Proses Estimasi
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => router.push(`/admin/pelayanan?search=ORD-${order.id.slice(-6).toUpperCase()}`)}>
                                Lihat Detail
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2 mb-3 bg-muted/50 p-2 rounded text-xs font-medium text-foreground">
                          <Car className="h-3 w-3 text-muted-foreground" />
                          {order.vehicle}
                          {order.plateNumber && <span className="text-muted-foreground">| {order.plateNumber}</span>}
                        </div>

                        <div className="flex justify-between items-end mt-4">
                          <div className="flex items-center gap-2">
                             {order.mechanic ? (
                               <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                                      {order.mechanic.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-[10px] font-medium text-primary truncate max-w-[80px]">
                                    {order.mechanic.name}
                                  </span>
                               </div>
                             ) : (
                               <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                                 <User className="h-3 w-3" />
                                 <span className="text-[10px]">Unassigned</span>
                               </div>
                             )}
                          </div>
                          
                          <div className="text-right">
                             <div className="text-[10px] text-muted-foreground mb-0.5">Total</div>
                             <div className="font-bold text-sm text-foreground">
                               Rp {(order.totalPrice || 0).toLocaleString("id-ID")}
                             </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {columnOrders.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground min-h-[150px] border-2 border-dashed border-border rounded-lg bg-muted/30">
                      <p className="text-sm">Kosong</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Dialogs */}
      {selectedOrder && (
        <ProcessOrderDialog
          open={processDialogOpen}
          onOpenChange={setProcessDialogOpen}
          order={selectedOrder}
          onSuccess={fetchOrders}
        />
      )}
      
      <OrderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
        onSuccess={fetchOrders}
      />
    </div>
  );
}
