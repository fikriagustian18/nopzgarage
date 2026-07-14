"use client";

import { useEffect, useState } from "react";
import { getLiveQueueStats, QueueOrder, QueueStats } from "@/app/actions/queue";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, Wrench, Clock, CheckCircle, Bike, 
    Calendar, Hourglass, 
    Flag, CircleDashed, Timer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export function LiveQueueList() {
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [stats, setStats] = useState<QueueStats>({ totalFinished: 0, totalProgress: 0, totalQueue: 0 });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  async function fetchQueue() {
    setLoading(true);
    const result = await getLiveQueueStats(dateFilter);
    if (result.success && result.orders && result.stats) {
      setOrders(result.orders);
      setStats(result.stats);
    }
    setLoading(false);
  }

  // Initial load & Date change
  useEffect(() => {
    fetchQueue();
  }, [dateFilter]);

  // Auto refresh interval (only if today)
  useEffect(() => {
    const isToday = dateFilter === format(new Date(), 'yyyy-MM-dd');
    if (!isToday) return;

    const interval = setInterval(() => {
        // Silent refresh (no loading spinner)
        getLiveQueueStats(dateFilter).then(res => {
            if (res.success && res.orders && res.stats) {
                setOrders(res.orders);
                setStats(res.stats);
            }
        });
    }, 15000); // 15 seconds fast update

    return () => clearInterval(interval);
  }, [dateFilter]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "QUEUE": 
      case "PENDING":
        return { 
            label: "DALAM ANTRIAN", 
            color: "text-yellow-500", 
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
            icon: Hourglass 
        };
      case "IN_PROGRESS": 
      case "WORKING":
        return { 
            label: "DIKERJAKAN", 
            color: "text-blue-500", 
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            icon: Wrench 
        };
      case "COMPLETED": 
      case "READY":
        return { 
            label: "SELESAI", 
            color: "text-green-500", 
            bg: "bg-green-500/10",
            border: "border-green-500/20",
            icon: CheckCircle 
        };
      default: 
        return { 
            label: status, 
            color: "text-muted-foreground", 
            bg: "bg-muted",
            border: "border-border",
            icon: Clock 
        };
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 1. TOP STATS BAR - Sleek Glass Panel */}
      <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
          <div className="bg-card/50 backdrop-blur-xl border border-white/5 p-1 rounded-full flex divide-x divide-white/5 w-full md:w-auto overflow-x-auto">
              <StatsItem 
                  label="Waiting" 
                  value={stats.totalQueue} 
                  icon={Hourglass} 
                  activeColor="text-yellow-500" 
              />
              <StatsItem 
                  label="In Pit" 
                  value={stats.totalProgress} 
                  icon={Wrench} 
                  activeColor="text-blue-500" 
              />
              <StatsItem 
                  label="Finished" 
                  value={stats.totalFinished} 
                  icon={Flag} 
                  activeColor="text-green-500" 
              />
          </div>

          <div className="flex items-center gap-3 bg-muted/30 p-1 px-3 rounded-full border border-white/5">
              <Calendar className="h-4 w-4 text-primary" />
              <input 
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent border-none text-sm focus:ring-0 p-0 text-foreground font-medium"
              />
          </div>
      </div>

      {/* 2. QUEUE CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <div className="relative">
                <div className="absolute inset-0 bg-primary blur-xl opacity-20 animate-pulse"></div>
                <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
            </div>
            <p className="text-xs tracking-[0.2em] font-medium text-muted-foreground animate-pulse">LOADING DATA...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-card/20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <CircleDashed className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">Track Kosong</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                Tidak ada kendaraan dalam antrian untuk tanggal ini.
            </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
            {orders.map((order, index) => {
                const statusInfo = getStatusInfo(order.status);
                const isFinished = order.status === 'COMPLETED' || order.status === 'READY';
                
                return (
                 <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                 >
                    <div className={`group relative h-full bg-gradient-to-br from-card to-card/50 border border-white/5 hover:border-primary/30 transition-all duration-500 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/5`}>
                        {/* Status Indicator Glow */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${statusInfo.bg.replace('/10', '')} opacity-40 group-hover:opacity-100 transition-opacity`}></div>
                        
                        <div className="p-5 flex flex-col h-full relative z-10">
                             {/* Header Plate */}
                             <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <div className="font-mono text-2xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">
                                        {order.plateNumber || "NO-PLAT"}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <Bike className="h-3 w-3" />
                                        <span className="truncate max-w-[140px]">{order.vehicle}</span>
                                    </div>
                                </div>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${statusInfo.bg} ${statusInfo.color}`}>
                                    <statusInfo.icon className="h-4 w-4" />
                                </div>
                             </div>

                             {/* Customer */}
                             <div className="mb-4">
                                <p className="text-sm font-semibold text-foreground/80 truncate">{order.custName}</p>
                                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">RIDER / OWNER</p>
                             </div>

                             {/* Footer Info */}
                             <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium">
                                 <div className="flex items-center gap-1.5 text-muted-foreground">
                                     <Timer className="h-3.5 w-3.5" />
                                     <span>{format(new Date(order.createdAt), "HH:mm")}</span>
                                 </div>
                                 
                                 <Badge variant="outline" className={`${statusInfo.color} ${statusInfo.border} bg-transparent border`}>
                                     {statusInfo.label}
                                 </Badge>
                             </div>
                        </div>
                    </div>
                 </motion.div>
                );
            })}
            </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function StatsItem({ label, value, icon: Icon, activeColor }: any) {
    return (
        <div className="px-6 py-3 flex items-center gap-3 min-w-[140px]">
            <div className={`p-2 rounded-lg bg-muted/50 ${activeColor} bg-opacity-10`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="text-2xl font-black leading-none">{value}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{label}</div>
            </div>
        </div>
    );
}
