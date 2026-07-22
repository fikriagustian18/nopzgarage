"use client";

import { useEffect, useId, useState } from "react";

export function MermaidDiagram({ chart, className }: { chart: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const [isMounted, setIsMounted] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const init = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose",
          themeVariables: {
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontSize: "14px",
            primaryColor: "#f1f5f9", // slate-100
            primaryTextColor: "#0f172a", // slate-900
            primaryBorderColor: "#cbd5e1", // slate-300
            lineColor: "#64748b", // slate-500
            secondaryColor: "#e2e8f0", // slate-200
            tertiaryColor: "#ffffff",
          },
        });

        const element = document.getElementById(`mermaid-${id}`);
        if (element) {
          element.innerHTML = "";
          // Unique ID for SVG definition to avoid conflicts
          const { svg } = await mermaid.render(`render-${id}`, chart);
          element.innerHTML = svg;
        }
      } catch (error) {
        console.error("Mermaid error:", error);
        const element = document.getElementById(`mermaid-${id}`);
        if (element) {
          element.innerHTML = ""; // Clear existing content
          const errorContainer = document.createElement('div');
          errorContainer.className = "p-4 text-red-500 text-sm bg-red-50 rounded border border-red-200";
          
          const errorTitle = document.createElement('p');
          errorTitle.className = "font-bold";
          errorTitle.textContent = "Failed to render diagram";
          
          const errorMessage = document.createElement('pre');
          errorMessage.className = "mt-2 whitespace-pre-wrap text-xs";
          errorMessage.textContent = error instanceof Error ? error.message : "Syntax Error";
          
          errorContainer.appendChild(errorTitle);
          errorContainer.appendChild(errorMessage);
          element.appendChild(errorContainer);
        }
      }
    };
    init();
  }, [chart, id, isMounted]);

  if (!isMounted) return <div className="animate-pulse h-64 w-full bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm">Loading Diagram...</div>;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.2));
  const handleReset = () => setScale(1);

  return (
    <div className="relative w-full border rounded-lg bg-card shadow-sm overflow-hidden group">
      <style>{`
        #mermaid-${id} svg {
          max-width: none !important;
          height: auto !important;
        }
      `}</style>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm">
        <button 
          onClick={handleZoomIn}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
          title="Zoom In"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button 
          onClick={handleReset}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
          title="Reset Zoom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        <button 
          onClick={handleZoomOut}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
          title="Zoom Out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
      </div>

      <div className="w-full h-[500px] md:h-[600px] overflow-auto p-4 flex justify-center bg-dots-pattern">
        <div 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out'
          }}
          className="min-w-full flex justify-center"
        >
        <div id={`mermaid-${id}`} className={`min-w-[100px] ${className || ""}`} />
        </div>
      </div>
    </div>
  );
}
