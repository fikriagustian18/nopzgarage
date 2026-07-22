"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { OrderItem, processOrder } from "@/app/actions/orders";
import { getEmployees } from "@/app/actions/employees";
import { getSpareParts } from "@/app/actions/inventory";
import { getContent } from "@/app/actions/content"; // Added import
import { toast } from "@/hooks/useToast";
import { Loader2, Plus, Trash2, Calculator, User, UserPlus, DollarSign, Wrench, Settings, List as ListIcon, Package } from "lucide-react";
import { notifyOrderUpdated } from "@/hooks/useNotification";
import { Badge } from "@/components/ui/Badge";

type ProcessOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    custName: string;
    vehicle: string;
  };
  onSuccess?: () => void;
};

type Employee = {
  id: string;
  name: string;
  role: string;
  salaryType?: string;
  commissionRate?: number;
};

type FeeAllocation = {
  employeeId: string;
  name: string;
  amount: number;
  note?: string;
};

export function ProcessOrderDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: ProcessOrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [items, setItems] = useState<OrderItem[]>([
    { name: "Jasa Servis", qty: 1, price: 0, type: "service" },
  ]);
  
  // Lead Mechanic untuk display Kanban
  const [selectedLeadId, setSelectedLeadId] = useState("");
  
  // Fee Allocations (Bisa banyak karyawan)
  const [fees, setFees] = useState<FeeAllocation[]>([]);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]); // New state
  const [showConfirmation, setShowConfirmation] = useState(false);

  async function loadData() {
    const [empRes, partRes, contentRes] = await Promise.all([
      getEmployees(true),
      getSpareParts(),
      getContent('services') // Fetch services
    ]);

    if (empRes.success && empRes.employees) {
      setEmployees(empRes.employees);
    }
    if (partRes.success && partRes.spareParts) {
      setSpareParts(partRes.spareParts);
    }
    if (contentRes.success && contentRes.data?.content && Array.isArray((contentRes.data.content as any).items)) {
      setServicesList((contentRes.data.content as any).items);
    }
  }

  // Load employees & parts on open
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Calculations
  const totalPrice = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const totalFee = fees.reduce((sum, f) => sum + f.amount, 0);

  const handleAddService = () => {
    setItems([...items, { name: "", qty: 1, price: 0, type: "service" }]);
  };

  const handleAddPart = () => {
    setItems([...items, { name: "", qty: 1, price: 0, type: "part" }]);
  };

  const handleAddItem = () => {
    setItems([...items, { name: "", qty: 1, price: 0, type: "service" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<OrderItem>) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], ...updates };
      return newItems;
    });
  };

  // Fee Handlers
  const handleAddFee = () => {
    setFees([...fees, { employeeId: "", name: "", amount: 0 }]);
  };

  const handleUpdateFee = (index: number, field: keyof FeeAllocation, value: any) => {
    const newFees = [...fees];
    if (field === 'employeeId') {
      const emp = employees.find(e => e.id === value);
      
      // Auto-fill fee amount logic
      let defaultAmount = 0;
      if (emp?.salaryType === 'COMMISSION' && emp?.commissionRate) {
        defaultAmount = Number(emp.commissionRate);
      }
      
      newFees[index] = { 
        ...newFees[index], 
        employeeId: value, 
        name: emp?.name || '', 
        amount: defaultAmount
      };
      
      // Jika Lead Mechanic belum dipilih, set otomatis ke orang pertama yg ditambahkan jika role mekanik
      if (!selectedLeadId && emp?.role.toLowerCase().includes('mekanik')) {
        setSelectedLeadId(value);
      }
    } else {
      newFees[index] = { ...newFees[index], [field]: value };
    }
    setFees(newFees);
  };

  const handleRemoveFee = (index: number) => {
    setFees(fees.filter((_, i) => i !== index));
  };

  const handleLeadMechanicChange = (value: string) => {
    setSelectedLeadId(value);
    if (value) {
      const isAlreadyInFees = fees.some(f => f.employeeId === value);
      if (!isAlreadyInFees) {
        const emp = employees.find(e => e.id === value);
        if (emp) {
          let defaultAmount = 0;
          if (emp.salaryType === 'COMMISSION' && emp.commissionRate) {
            defaultAmount = Number(emp.commissionRate);
          }
          setFees(prev => [
            ...prev,
            {
              employeeId: value,
              name: emp.name,
              amount: defaultAmount
            }
          ]);
        }
      }
    }
  };

  // Validate and show confirmation
  const handleValidateAndConfirm = () => {
    if (!selectedLeadId) {
      toast({
        variant: "destructive",
        title: "Pilih Penanggung Jawab",
        description: "Harap tentukan 1 Penanggung Jawab Pengerjaan (Mekanik Utama).",
      });
      return;
    }

    // Validate Items
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.name || item.price < 0) { // Price can be 0 (bonus/garansi) but typically > 0. Let's allow 0 but warn if name empty.
            toast({
                variant: "destructive",
                title: "Periksa Item",
                description: `Item baris ke-${i + 1} tidak valid. Pastikan nama terisi dan harga valid.`,
            });
            return;
        }
        
        // Stock check for parts
        if (item.type === 'part') {
            const part = spareParts.find(p => p.name === item.name);
            if (part && item.qty > part.stock) {
                 toast({
                    variant: "destructive",
                    title: "Stok Barang Kurang",
                    description: `Stok ${item.name} hanya tersisa ${part.stock}, diminta ${item.qty}.`,
                });
                return;
            }
        }
    }
    
    // Check fee completeness (fee wajib diisi)
    if (fees.length === 0) {
      toast({
        variant: "destructive",
        title: "Periksa Alokasi Fee",
        description: "Alokasi fee wajib diisi. Harap tentukan minimal 1 penerima fee.",
      });
      return;
    }

    if (fees.some(f => !f.employeeId || f.amount <= 0)) {
      toast({
        variant: "destructive",
        title: "Periksa Alokasi Fee",
        description: "Pastikan penerima fee dipilih dan nominal valid (> 0).",
      });
      return;
    }

    // Validation passed, show confirmation
    setShowConfirmation(true);
  };

  // Actual submit after confirmation
  const handleConfirmedSubmit = async () => {
    setLoading(true);

    try {
      const result = await processOrder({
        orderId: order.id,
        items,
        mechanicId: selectedLeadId,
        fees: fees,
      });

      if (result.success) {
        toast({
          title: " Order Diproses!",
          description: "Estimasi & Alokasi Fee tersimpan.",
        });
        
        // Add notification
        notifyOrderUpdated(order.custName, order.id, "IN_PROGRESS");
        
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: result.error || "Gagal memproses order",
        });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error sistem" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Calculator className="h-5 w-5 text-primary" />
            Estimasi & Alokasi Fee
          </DialogTitle>
          <DialogDescription>
            Input biaya untuk customer dan fee nominal untuk tim (Admin, Mekanik).
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8 py-4">
          {/* LEFT COLUMN: Customer Items */}
          <div className="space-y-4">
            <div className="bg-muted/40 p-3 rounded-lg text-sm mb-4 border border-border">
              <div className="font-semibold text-foreground border-b border-border pb-2 mb-2">Tagihan Customer (Invoice)</div>
               <div>Customer: <b className="text-foreground">{order.custName}</b></div>
               <div>Unit: <b className="text-foreground">{order.vehicle}</b></div>
            </div>

            <div className="flex justify-between items-center">
              <Label>Item Barang & Jasa</Label>
              <div className="flex gap-1.5">
                <Button
                  type="Button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddService}
                  className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Wrench className="h-3 w-3 mr-1" /> + Jasa
                </Button>
                <Button
                  type="Button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddPart}
                  className="h-7 text-xs border-muted-foreground/40 hover:bg-muted/50"
                >
                  <Package className="h-3 w-3 mr-1" /> + Part
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {items.map((item, index) => (
                <ItemInput
                  key={index}
                  index={index}
                  item={item}
                  spareParts={spareParts}
                  servicesList={servicesList}
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>

            <div className="bg-primary/10 p-3 rounded text-right mt-4">
               <span className="text-xs text-muted-foreground">Total Tagihan Ke Customer</span>
               <div className="text-xl font-bold text-primary">Rp {totalPrice.toLocaleString('id-ID')}</div>
            </div>
          </div>

          {/* RIGHT COLUMN: Internal Fee Allocation */}
          <div className="space-y-4 border-l pl-8 border-border">
             <div className="bg-orange-500/10 p-3 rounded-lg text-sm mb-4 border border-orange-500/20">
              <div className="font-semibold text-orange-600 dark:text-orange-400 border-b border-orange-500/20 pb-2 mb-2">Internal: Alokasi Fee Tim</div>
              <div className="text-xs text-orange-600/80 dark:text-orange-400/80">
                Input nominal fee untuk setiap orang yang terlibat. Tidak masuk tagihan customer.
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Label>Penerima Fee & Gaji</Label>
              <Button type="Button" size="sm" variant="outline" onClick={handleAddFee} className="h-7 text-xs border-dashed">
                <UserPlus className="h-3 w-3 mr-1" /> Add Person
              </Button>
            </div>

            {fees.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-xs border-2 border-dashed border-muted rounded bg-muted/20">
                Belum ada alokasi fee.
                <br/>Klik "Add Person" untuk tambah Admin/Teknisi.
              </div>
            )}

             <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
               {fees.map((fee, index) => (
                 <div key={index} className="flex gap-2 items-start bg-card p-2 border border-border rounded shadow-sm">
                   <div className="w-[180px]">
                      <Select
                        value={fee.employeeId}
                        onValueChange={(v) => handleUpdateFee(index, "employeeId", v)}
                      >
                        <SelectTrigger className="w-full h-8 text-xs border-0 focus:ring-0 bg-muted/50">
                          <SelectValue placeholder="Pilih Karyawan" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.filter(e => e.role.toLowerCase().includes('mekanik')).map(e => (
                             <SelectItem key={e.id} value={e.id}>
                               {e.name} - <span className="text-gray-400 text-[10px]">{e.role}</span>
                             </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>

                   {/* Catatan Fee */}
                   <div className="flex-1">
                      <Input
                        placeholder="Ket. (Opsional)"
                        className="h-8 text-xs border-0 bg-transparent focus-visible:ring-0 px-2"
                        value={fee.note || ''}
                        onChange={(e) => handleUpdateFee(index, "note", e.target.value)}
                      />
                   </div>

                   <div className="flex items-center border-l pl-2 w-[100px]">
                      <span className="text-[10px] text-gray-400 mr-1">Rp</span>
                      <Input 
                        type="number"
                        className="h-8 text-xs border-0 focus-visible:ring-0 text-right p-0 font-bold text-orange-600"
                        placeholder="0"
                        value={fee.amount}
                        onChange={(e) => handleUpdateFee(index, "amount", parseInt(e.target.value) || 0)}
                      />
                   </div>
                   <Button
                      type="Button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFee(index)}
                      className="h-8 w-6 text-muted-foreground hover:text-destructive"
                   >
                      <Trash2 className="h-3 w-3" />
                   </Button>
                 </div>
               ))}
            </div>

            <div className="pt-4 border-t border-border">
               <div className="mb-4">
                 <Label className="text-xs mb-1 block">Penanggung Jawab Utama (Lead)</Label>
                 <Select
                    value={selectedLeadId}
                    onValueChange={handleLeadMechanicChange}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Pilih Lead Mechanic..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Filter only chosen employees or show all, let's show all for flexibility but usually one of the fee receivers */}
                      {employees.filter(e => e.role.toLowerCase().includes('mekanik')).map(e => (
                         <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
               
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Total Pengeluaran Fee:</span>
                 <span className="font-bold text-foreground">Rp {totalFee.toLocaleString('id-ID')}</span>
               </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
            <Button onClick={handleValidateAndConfirm} disabled={loading} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan & Kerjakan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Confirmation Dialog */}
    <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Konfirmasi Estimasi Order
          </DialogTitle>
          <DialogDescription>
            Periksa kembali detail estimasi sebelum menyimpan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-bold text-sm mb-1">Informasi Customer</h4>
            <p className="text-sm">{order.custName} - {order.vehicle}</p>
          </div>

          {/* Items List */}
          <div>
            <h4 className="font-bold text-sm mb-2">Detail Pekerjaan ({items.length} item)</h4>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm p-2 bg-muted/20 rounded">
                  <span>{item.name} x{item.qty}</span>
                  <span className="font-bold">Rp {(item.qty * item.price).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
            <span className="font-bold">TOTAL ESTIMASI</span>
            <span className="text-2xl font-black text-primary">Rp {totalPrice.toLocaleString('id-ID')}</span>
          </div>

          {/* Fee Allocation */}
          <div>
            <h4 className="font-bold text-sm mb-2">Alokasi Fee ({fees.length} orang)</h4>
            <div className="space-y-1">
              {fees.map((fee, idx) => {
                const emp = employees.find(e => e.id === fee.employeeId);
                return (
                  <div key={idx} className="flex justify-between text-sm p-2 bg-muted/20 rounded">
                    <span>{emp?.name || 'Unknown'}</span>
                    <span className="font-bold">Rp {fee.amount.toLocaleString('id-ID')}</span>
                  </div>
                );
              })}
              <div className="flex justify-between text-sm p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800 mt-2">
                <span className="font-bold">Total Fee</span>
                <span className="font-bold text-yellow-700 dark:text-yellow-400">Rp {totalFee.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Mechanic */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-bold text-sm mb-1">Penanggung Jawab</h4>
            <p className="text-sm">{employees.find(e => e.id === selectedLeadId)?.name || '-'}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowConfirmation(false)}>
            Periksa Lagi
          </Button>
          <Button 
            onClick={() => {
              setShowConfirmation(false);
              handleConfirmedSubmit();
            }} 
            disabled={loading}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Ya, Proses Order Ini
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

// Helper component for item input to keep main component clean
function ItemInput({ 
  item, 
  index, 
  spareParts, 
  servicesList,
  onUpdate, 
  onRemove 
}: { 
  item: OrderItem, 
  index: number, 
  spareParts: any[], 
  servicesList?: any[],
  onUpdate: (index: number, updates: Partial<OrderItem>) => void,
  onRemove: (index: number) => void
}) {
  const [isCustomService, setIsCustomService] = useState(false);

  return (
    <div className="flex gap-2 items-start py-1">
      {/* Type Badge - Static, type is determined by which button was clicked */}
      <div className="w-[80px] h-10 flex items-center gap-1.5 px-2 rounded-md border border-border bg-muted/40 text-xs font-medium shrink-0">
        {item.type === 'service'
          ? <><Wrench className="h-3 w-3 text-primary" /><span className="text-primary">Jasa</span></>
          : <><Package className="h-3 w-3 text-muted-foreground" /><span>Part</span></>
        }
      </div>

      {/* Name / Product Select - Flexible Width (Expanded) */}
      <div className="flex-1 min-w-[200px]">
        {item.type === 'part' ? (
          <div className="relative">
             <Select
              value={item.name}
              onValueChange={(value) => {
                const part = spareParts.find((p: any) => p.name === value);
                if (part) {
                  onUpdate(index, { name: part.name, price: part.sellPrice });
                } else {
                  onUpdate(index, { name: value });
                }
              }}
            >
                <SelectTrigger className={`w-full h-10 text-xs text-left shadow-sm ${!item.name ? 'border-destructive ring-1 ring-destructive' : ''}`}>
                 <SelectValue placeholder="Pilih Sparepart..." />
               </SelectTrigger>
               <SelectContent className="max-h-[200px]">
                  {spareParts.map((part: any) => (
                    <SelectItem key={part.id} value={part.name}>
                      <div className="flex justify-between w-full gap-4 items-center">
                        <span className="font-medium">{part.name}</span>
                        <Badge variant={part.stock > 0 ? "outline" : "destructive"} className="text-[10px] h-5">
                          Stok: {part.stock}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
               </SelectContent>
             </Select>
           </div>
         ) : (
           /* Service Selection Logic */
           !isCustomService && servicesList && servicesList.length > 0 ? (
              <Select
                 value={servicesList.some(s => s.title === item.name) ? item.name : ""}
                 onValueChange={(value) => {
                   if (value === "CUSTOM_INPUT") {
                     setIsCustomService(true);
                     onUpdate(index, { name: "" });
                   } else {
                     const matchedService = servicesList.find(s => s.title === value);
                     onUpdate(index, {
                       name: value,
                       price: matchedService?.price ? Number(matchedService.price) : item.price,
                     });
                   }
                 }}
               >
                 <SelectTrigger className={`w-full h-10 text-xs text-left shadow-sm ${!item.name ? 'border-destructive/50' : ''}`}>
                   <SelectValue placeholder="Pilih Jasa Layanan..." />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="CUSTOM_INPUT" className="font-semibold text-primary">
                     Input Jasa Custom Manual
                   </SelectItem>
                  {servicesList.map((service: any) => (
                    <SelectItem key={service.id} value={service.title}>
                      {service.title} <span className="text-muted-foreground text-[10px] ml-2">({service.serviceType === 'MODIFICATION' ? 'Modif' : 'Ringan'})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          ) : (
            <div className="relative flex items-center">
               <Input
                placeholder="Ketik Nama Jasa..."
                value={item.name}
                onChange={(e) => onUpdate(index, { name: e.target.value })}
                className={`w-full h-10 text-xs shadow-sm ${!item.name ? 'border-destructive/50' : ''}`}
                autoFocus={isCustomService}
              />
              {servicesList && servicesList.length > 0 && (
                <Button 
                  type="Button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 w-6 h-6"
                  onClick={() => setIsCustomService(false)}
                  title="Kembali ke pilihan list"
                >
                  <ListIcon className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        )}
      </div>

      {/* Qty Input */}
      <div className="w-[70px]">
        <div className="relative">
            <Input
              type="number"
              value={item.qty}
              onChange={(e) => onUpdate(index, { qty: parseInt(e.target.value) || 1 })}
              className="w-full h-10 text-xs text-center shadow-sm"
              min="1"
            />
            <span className="absolute right-2 top-2.5 text-[10px] text-muted-foreground pointer-events-none">x</span>
        </div>
      </div>

      {/* Price Input - Widened slightly */}
      <div className="w-[140px]">
        <div className="relative">
            <span className="absolute left-2 top-2.5 text-[10px] text-muted-foreground pointer-events-none">Rp</span>
            <Input
              type="number"
              placeholder="0"
              value={item.price}
              onChange={(e) => onUpdate(index, { price: parseInt(e.target.value) || 0 })}
              className="w-full h-10 text-xs text-right pl-6 font-medium shadow-sm"
              min="0"
            />
        </div>
      </div>

      <Button
        type="Button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        className="h-10 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
