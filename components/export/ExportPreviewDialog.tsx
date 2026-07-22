"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Download, Loader2, FileText, Table, Maximize2, Minimize2 } from "lucide-react";
import type { ExportFormat, PageOrientation } from "@/lib/export/types";

interface ExportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onExport: (format: ExportFormat, orientation: PageOrientation) => Promise<Blob>;
  defaultFormat?: ExportFormat;
  defaultOrientation?: PageOrientation;
}

export function ExportPreviewDialog({
  open,
  onOpenChange,
  title,
  onExport,
  defaultFormat = "pdf",
  defaultOrientation = "landscape",
}: ExportPreviewDialogProps) {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [orientation, setOrientation] = useState<PageOrientation>(defaultOrientation);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Auto-generate preview when dialog opens
  useEffect(() => {
    if (open && !previewUrl && format === "pdf") {
      generatePreview();
    }
    
    // Cleanup: revoke URL when dialog closes or component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [open]);

  // Re-generate preview when format or orientation changes
  useEffect(() => {
    if (open && format === "pdf") {
      generatePreview();
    } else if (format === "excel") {
      // Clear preview for Excel
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [format, orientation]);

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const blob = await onExport(format, orientation);
      
      // Create preview URL for PDF
      if (format === "pdf") {
        // Revoke old URL if exists to prevent memory leaks
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } else {
        // For Excel, we can't preview, so show a message
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await onExport(format, orientation);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_")}_${new Date().getTime()}.${
        format === "pdf" ? "pdf" : "xlsx"
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch (error) {
      console.error("Error downloading file:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[95vw] h-[95vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Export Preview - {title}</DialogTitle>
          <DialogDescription>
            Pilih format dan orientasi, lalu preview sebelum download
          </DialogDescription>
        </DialogHeader>

        {/* Format and Orientation Controls */}
        <div className="flex flex-wrap gap-3 items-center border-b pb-4">
          <div className="flex gap-2">
            <Button
              variant={format === "pdf" ? "default" : "outline"}
              size="default"
              onClick={() => setFormat("pdf")}
              className="min-w-[110px]"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant={format === "excel" ? "default" : "outline"}
              size="default"
              onClick={() => setFormat("excel")}
              className="min-w-[110px]"
            >
              <Table className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>

          <div className="h-8 w-px bg-border" />

          <div className="flex gap-2">
            <Button
              variant={orientation === "portrait" ? "default" : "outline"}
              size="default"
              onClick={() => setOrientation("portrait")}
              className="min-w-[120px]"
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Portrait
            </Button>
            <Button
              variant={orientation === "landscape" ? "default" : "outline"}
              size="default"
              onClick={() => setOrientation("landscape")}
              className="min-w-[120px]"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Landscape
            </Button>
          </div>

          <div className="flex-1" />

          <Button onClick={generatePreview} disabled={isGenerating} size="default" variant="secondary" className="min-w-[160px]">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Preview"
            )}
          </Button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 border rounded-lg overflow-hidden bg-muted/20">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">Generating preview...</p>
              </div>
            </div>
          ) : previewUrl && format === "pdf" ? (
            <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
          ) : format === "excel" ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Table className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Excel preview tidak tersedia
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Klik Download untuk mengunduh file Excel
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Klik Generate Preview untuk melihat dokumen
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleDownload} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
