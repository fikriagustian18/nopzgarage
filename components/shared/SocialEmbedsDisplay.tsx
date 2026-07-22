"use client";

import { useEffect } from "react";
import { SocialEmbedItem } from "@/lib/actions/socialEmbeds";
import { Card, CardContent } from "@/components/ui/Card";
import { ExternalLink, Instagram, Music, Youtube } from "lucide-react";

interface SocialEmbedsDisplayProps {
  items?: SocialEmbedItem[];
  columns?: number;
  className?: string;
}

const PLATFORM_ICONS = {
  INSTAGRAM: Instagram,
  TIKTOK: Music,
  YOUTUBE: Youtube,
};

const PLATFORM_COLORS = {
  INSTAGRAM: "from-purple-500 to-pink-500",
  TIKTOK: "from-black to-gray-800",
  YOUTUBE: "from-red-600 to-red-700",
};

export function SocialEmbedsDisplay({
  items = [],
  columns = 3,
  className = "",
}: SocialEmbedsDisplayProps) {
  useEffect(() => {
    // Load Instagram embed script
    if (items.some((item) => item.platform === "INSTAGRAM")) {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [items]);

  useEffect(() => {
    // Load TikTok embed script
    if (items.some((item) => item.platform === "TIKTOK")) {
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [items]);

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
      {items.map((item) => {
        const Icon = PLATFORM_ICONS[item.platform as keyof typeof PLATFORM_ICONS];
        const gradientClass = PLATFORM_COLORS[item.platform as keyof typeof PLATFORM_COLORS];

        return (
          <Card
            key={item.id}
            className="group overflow-hidden border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
          >
            {/* Header */}
            <div
              className={`bg-gradient-to-r ${gradientClass} text-white p-4 flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <span className="font-bold text-sm">{item.platform}</span>
              </div>
              <a
                href={item.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Content */}
            <CardContent className="p-4">
              {item.title && (
                <h4 className="font-black text-lg mb-2">{item.title}</h4>
              )}
              {item.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {item.description}
                </p>
              )}

              {/* Embed */}
              {item.embedCode && (
                <div
                  className="embed-container"
                  dangerouslySetInnerHTML={{ __html: item.embedCode }}
                />
              )}

              {/* Fallback: Link to post */}
              {!item.embedCode && (
                <a
                  href={item.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 bg-primary text-primary-foreground text-center font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Lihat Post
                </a>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
