"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Table, ChevronDown } from "lucide-react";
import { ExportPreviewDialog } from "./ExportPreviewDialog";
import type { ExportFormat, PageOrientation } from "@/lib/export/types";

import { ReactNode } from "react"; // Ensure ReactNode is imported if not already

interface ExportButtonProps {
  title: string;
  onExport: (format: ExportFormat, orientation: PageOrientation) => Promise<Blob>;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
  label?: string;
  hideLabel?: boolean;
  icon?: ReactNode;
}

export function ExportButton({
  title,
  onExport,
  variant = "outline",
  size = "default",
  showIcon = true,
  label = "Export",
  hideLabel = false,
  icon,
}: ExportButtonProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");

  const handleExportClick = (format: ExportFormat) => {
    setSelectedFormat(format);
    setShowPreview(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="gap-2">
            {icon ? icon : (showIcon && <Download className="h-4 w-4" />)}
            {!hideLabel && label}
            {!hideLabel && <ChevronDown className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExportClick("pdf")}>
            <FileText className="h-4 w-4 mr-2" />
            Export to PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportClick("excel")}>
            <Table className="h-4 w-4 mr-2" />
            Export to Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        title={title}
        onExport={onExport}
        defaultFormat={selectedFormat}
        defaultOrientation="landscape"
      />
    </>
  );
}
