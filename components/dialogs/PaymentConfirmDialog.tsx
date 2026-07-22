"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Wallet, Loader2 } from "lucide-react";
import { toast } from "@/hooks/useToast";

type PaymentConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    details: {
        label: string;
        value: string;
    }[];
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
};

export function PaymentConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    details,
    confirmLabel = "Bayar Sekarang",
    onConfirm
}: PaymentConfirmDialogProps) {
    const [loading, setLoading] = useState(false);

    async function handleConfirm() {
        setLoading(true);
        try {
            await onConfirm();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-green-100 rounded-full">
                            <Wallet className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                            <DialogDescription className="mt-1">{description}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="bg-muted/30 border rounded-lg p-4 space-y-3 py-4">
                    {details.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-bold">{item.value}</span>
                        </div>
                    ))}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
