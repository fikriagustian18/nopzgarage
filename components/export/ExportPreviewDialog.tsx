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

/**
 * Props for the ExportPreviewDialog component.
 */
interface ExportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onExport: (format: ExportFormat, orientation: PageOrientation) => Promise<Blob>;
  defaultFormat?: ExportFormat;
  defaultOrientation?: PageOrientation;
}

/**
 * Dialog component for displaying a preview of exported PDF/Excel documents.
 */
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

  async function generatePreview(targetFormat = format, targetOrientation = orientation) {
    setIsGenerating(true);
    try {
      const blob = await onExport(targetFormat, targetOrientation);
      
      // Create preview URL for PDF
      if (targetFormat === "pdf") {
        setPreviewUrl((prevUrl) => {
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl);
          }
          return blob && blob.size > 0 ? URL.createObjectURL(blob) : null;
        });
      } else {
        setPreviewUrl((prevUrl) => {
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl);
          }
          return null;
        });
      }
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  // Auto-generate preview immediately when dialog opens
  useEffect(() => {
    if (open) {
      setFormat(defaultFormat);
      setOrientation(defaultOrientation);
      setPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return null;
      });

      if (defaultFormat === "pdf") {
        generatePreview(defaultFormat, defaultOrientation);
      }
    } else {
      setPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return null;
      });
    }
  }, [open, defaultFormat, defaultOrientation]);

  function handleFormatChange(newFormat: ExportFormat) {
    setFormat(newFormat);
    if (newFormat === "pdf") {
      generatePreview(newFormat, orientation);
    } else {
      setPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return null;
      });
    }
  }

  function handleOrientationChange(newOrientation: PageOrientation) {
    setOrientation(newOrientation);
    if (format === "pdf") {
      generatePreview(format, newOrientation);
    }
  }

  async function handleDownload() {
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] flex flex-col p-6">
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
              onClick={() => handleFormatChange("pdf")}
              className="min-w-[110px]"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant={format === "excel" ? "default" : "outline"}
              size="default"
              onClick={() => handleFormatChange("excel")}
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
              onClick={() => handleOrientationChange("portrait")}
              className="min-w-[120px]"
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Portrait
            </Button>
            <Button
              variant={orientation === "landscape" ? "default" : "outline"}
              size="default"
              onClick={() => handleOrientationChange("landscape")}
              className="min-w-[120px]"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Landscape
            </Button>
          </div>

          <div className="flex-1" />

          <Button
            onClick={() => generatePreview(format, orientation)}
            disabled={isGenerating}
            size="default"
            variant="secondary"
            className="min-w-[160px]"
          >
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
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title="PDF Preview"
            />
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

