"use client";

import { useEffect, useState } from "react";
import { MediaGalleryItem } from "@/app/actions/mediaGallery";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";

interface MediaGalleryDisplayProps {
  items?: MediaGalleryItem[];
  columns?: number;
  className?: string;
}

export function MediaGalleryDisplay({
  items = [],
  columns = 3,
  className = "",
}: MediaGalleryDisplayProps) {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid gap-6 ${
        columns === 2
          ? "grid-cols-1 md:grid-cols-2"
          : columns === 3
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      } ${className}`}
    >
      {items.map((item, idx) => (
        <Card
          key={item.id}
          className="group overflow-hidden border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
        >
          <div className="relative w-full aspect-square md:aspect-video overflow-hidden bg-muted">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              loading={idx < 6 ? "eager" : "lazy"}
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <h3 className="text-white font-black text-xl mb-2">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-white/90 text-sm line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
