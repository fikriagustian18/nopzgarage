// components/ForgotPasswordRequestsTab.tsx - Forgot Password Requests Management
"use client";

import { useState, useEffect } from "react";
import { getForgotPasswordRequests, resolveForgotPasswordRequest } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Loader2, Key } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type ForgotPasswordRequest = {
  id: string;
  userId: string;
  status: string;
  createdAt: Date;
  user: {
    email: string;
    role: string;
    employee?: {
      name: string;
      role: string;
    } | null;
  };
};

export function ForgotPasswordRequestsTab() {
  const [requests, setRequests] = useState<ForgotPasswordRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ForgotPasswordRequest | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const result = await getForgotPasswordRequests();
    
    if (result.success && result.requests) {
      setRequests(result.requests as any);
    }
    
    setLoading(false);
  };

  const handleResolve = async () => {
    if (!selectedRequest) return;

    if (newPassword !== confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    const result = await resolveForgotPasswordRequest(
      selectedRequest.id,
      newPassword,
      "Admin" // TODO: Get from session
    );

    if (result.success) {
      toast.success("Password berhasil direset");
      setResolveDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      loadRequests();
    } else {
      toast.error(result.error || "Gagal reset password");
    }
  };

  const openResolveDialog = (request: ForgotPasswordRequest) => {
    setSelectedRequest(request);
    setNewPassword("");
    setConfirmPassword("");
    setResolveDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Permintaan Lupa Password
          </CardTitle>
          <CardDescription>
            Kelola permintaan reset password dari karyawan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">
                      {request.user.employee?.name || request.user.email}
                    </p>
                    <Badge variant="outline">{request.user.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {request.user.email}
                  </p>
                  {request.user.employee && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {request.user.employee.role}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(request.createdAt), {
                      addSuffix: true,
                      locale: idLocale,
                    })}
                  </p>
                </div>
                <Button
                  onClick={() => openResolveDialog(request)}
                  className="gap-2"
                >
                  <Key className="h-4 w-4" />
                  Reset Password
                </Button>
              </div>
            ))}

            {requests.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                <p className="text-muted-foreground">
                  Tidak ada permintaan reset password
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Buat password baru untuk{" "}
              {selectedRequest?.user.employee?.name || selectedRequest?.user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">User:</p>
              <p className="text-sm text-muted-foreground">
                {selectedRequest?.user.email}
              </p>
              {selectedRequest?.user.employee && (
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.user.employee.name} -{" "}
                  {selectedRequest.user.employee.role}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Ketik ulang password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleResolve}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
