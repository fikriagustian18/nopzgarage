"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Download, FileText, Table } from "lucide-react";

import { ExportPreviewDialog } from "./ExportPreviewDialog";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

import type { ExportFormat, PageOrientation } from "@/lib/export/types";

interface ExportButtonProps {
  title: string;
  tooltip?: string;
  onExport: (format: ExportFormat, orientation: PageOrientation) => Promise<Blob>;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
  label?: string;
  hideLabel?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function ExportButton({
  title,
  tooltip,
  onExport,
  variant = "outline",
  size = "default",
  showIcon = true,
  label = "Export",
  hideLabel = false,
  icon,
  className,
}: ExportButtonProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");

  function handleExportClick(format: ExportFormat) {
    setSelectedFormat(format);
    setShowPreview(true);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`gap-2 ${className || ""}`}
            title={tooltip || title}
          >
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
