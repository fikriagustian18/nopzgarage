// components/PublicKanban.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicKanbanOrders } from "@/app/actions/orders";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Clock, Wrench, CheckCircle2, Shield } from "lucide-react";

type OrderCard = {
  id: string;
  vehicle: string;
  serviceType: "LIGHT_SERVICE" | "MODIFICATION";
  status: string;
  plateNumber: string;
  createdAt: Date;
  queueNumber?: string;
};

export function PublicKanban() {
  // Auto-refresh setiap 20 detik
  const { data, isLoading } = useQuery({
    queryKey: ["public-kanban"],
    queryFn: async () => {
      const result = await getPublicKanbanOrders();
      if (!result.success) throw new Error(result.error);
      return result.orders;
    },
    refetchInterval: 20000, // 20 detik
    refetchOnWindowFocus: true,
  });

  const orders = data || [];

  // Pisahkan berdasarkan status
  const queueOrders = orders.filter((o: OrderCard) => o.status === "QUEUE");
  const inProgressOrders = orders.filter(
    (o: OrderCard) => o.status === "IN_PROGRESS"
  );
  const readyOrders = orders.filter((o: OrderCard) => o.status === "READY");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Status Kendaraan Anda</h1>
        <p className="text-gray-600">Pantau progress servis secara real-time</p>
        <Badge variant="outline" className="mt-2">
          Auto-refresh setiap 20 detik
        </Badge>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QUEUE */}
        <KanbanColumn
          title="Dalam Antrian"
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
          orders={queueOrders}
        />

        {/* IN PROGRESS */}
        <KanbanColumn
          title="Sedang Dikerjakan"
          icon={<Wrench className="w-5 h-5" />}
          color="blue"
          orders={inProgressOrders}
        />

        {/* READY */}
        <KanbanColumn
          title="Siap Diambil"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
          orders={readyOrders}
        />
      </div>

      {/* Privacy Notice */}
      <div className="text-center text-sm text-gray-500 mt-8">
        <p className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          Data pribadi Anda aman. Kami hanya menampilkan merk kendaraan dan 3
          digit terakhir plat nomor.
        </p>
      </div>
    </div>
  );
}

// ==================== Kanban Column Component ====================
function KanbanColumn({
  title,
  icon,
  color,
  orders,
}: {
  title: string;
  icon: React.ReactNode;
  color: "yellow" | "blue" | "green";
  orders: OrderCard[];
}) {
  const colorClasses = {
    yellow: "bg-yellow-50 border-yellow-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
  };

  const badgeClasses = {
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
  };

  return (
    <div className={`rounded-lg border-2 ${colorClasses[color]} p-4`}>
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-semibold text-lg">{title}</h2>
        <Badge className={badgeClasses[color]}>{orders.length}</Badge>
      </div>

      {/* Order Cards */}
      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Tidak ada kendaraan</p>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}

// ==================== Order Card Component ====================
function OrderCard({ order }: { order: OrderCard }) {
  const serviceTypeLabel = {
    LIGHT_SERVICE: "Servis Ringan",
    MODIFICATION: "Modifikasi",
  };

  const serviceTypeColor = {
    LIGHT_SERVICE: "bg-green-100 text-green-700",
    MODIFICATION: "bg-purple-100 text-purple-700",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="font-semibold">{order.vehicle}</span>
          <Badge
            variant="secondary"
            className={serviceTypeColor[order.serviceType]}
          >
            {serviceTypeLabel[order.serviceType]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 flex justify-between items-center">
          <p>Nomor: ...{order.plateNumber}</p>
          {order.queueNumber && (
            <Badge variant="outline" className="font-mono font-bold text-xs bg-primary/10 text-primary border-primary/20">
              {order.queueNumber}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
