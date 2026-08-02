"use client";

import { useState, useEffect, ComponentType } from "react";
import { 
  Plus, 
  Trash2, 
  Zap, 
  Settings, 
  Wrench, 
  Clock, 
  Shield, 
  Award, 
  Star, 
  Heart, 
  Target, 
  ThumbsUp,
  MessageSquare, 
  Megaphone, 
  Link2, 
  Save, 
  Globe, 
  Layout, 
  Palette, 
  TrendingUp,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/Tabs";
import { Slider } from "@/components/ui/Slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/Select";
import { getContent, updateContent } from "@/lib/actions/content";
import { DEFAULT_SERVICE_ITEMS } from "@/lib/constants/serviceDefaults";

export interface IconOption {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export interface ServiceTypeOption {
  value: string;
  label: string;
}

export interface HeroContentState {
  title: string;
  subtitle: string;
  ctaText: string;
  highlightText: string;
  isVisible: boolean;
}

export interface ServicesHeaderState {
  title: string;
  subtitle: string;
  isVisible: boolean;
}

export interface ServiceItemState {
  id?: string;
  title: string;
  description: string;
  features?: string[];
  tag?: string;
  icon: string;
  serviceType?: string;
}

export interface FeatureItemState {
  title: string;
  desc: string;
}

export interface ThemeConfigState {
  primaryColor: string;
  secondaryColor: string;
  fontScale: number;
  fontFamily: string;
}

export interface StatsConfigState {
  motors: string;
  satisfaction: string;
  experience: string;
  support: string;
}

export interface TestimonialItemState {
  name: string;
  quote: string;
  vehicle: string;
  rating: number;
}

export interface PromoItemState {
  title: string;
  desc: string;
  isActive: boolean;
}

export interface FooterConfigState {
  instagram: string;
  whatsapp: string;
  maps: string;
}

const ICONS: IconOption[] = [
  { value: "Zap", label: "Petir (Cepat)", icon: Zap },
  { value: "Settings", label: "Gear (Project)", icon: Settings },
  { value: "Wrench", label: "Obeng (Servis)", icon: Wrench },
  { value: "Clock", label: "Jam (Waktu)", icon: Clock },
  { value: "Shield", label: "Perisai (Garansi)", icon: Shield },
  { value: "Award", label: "Piala (Kualitas)", icon: Award },
  { value: "Target", label: "Target (Akurasi)", icon: Target },
  { value: "Star", label: "Bintang (Premium)", icon: Star },
  { value: "Heart", label: "Hati (Peduli)", icon: Heart },
];

const SERVICE_TYPES: ServiceTypeOption[] = [
  { value: "LIGHT_SERVICE", label: "Fast Lane / Ringan" },
  { value: "MODIFICATION", label: "Project / Berat" }
];

export function WebsiteContentTab() {
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("hero");

  const [hero, setHero] = useState<HeroContentState>({
    title: "", 
    subtitle: "", 
    ctaText: "Booking Sekarang", 
    highlightText: "", 
    isVisible: true
  });

  const [servicesHeader, setServicesHeader] = useState<ServicesHeaderState>({
    title: "", 
    subtitle: "", 
    isVisible: true
  });
  
  const [serviceItems, setServiceItems] = useState<ServiceItemState[]>([]);
  const [featureItems, setFeatureItems] = useState<FeatureItemState[]>([]);

  const [theme, setTheme] = useState<ThemeConfigState>({
    primaryColor: "#a855f7",
    secondaryColor: "#f97316",
    fontScale: 1,
    fontFamily: "sans"
  });

  const [stats, setStats] = useState<StatsConfigState>({
    motors: "5000+",
    satisfaction: "99%",
    experience: "15 Tahun",
    support: "24 Jam"
  });

  const [testimonials, setTestimonials] = useState<TestimonialItemState[]>([]);
  const [promos, setPromos] = useState<PromoItemState[]>([]);
  const [footer, setFooter] = useState<FooterConfigState>({ 
    instagram: "", 
    whatsapp: "", 
    maps: "" 
  });

  useEffect(() => {
    loadAllContent();
  }, []);

  async function loadAllContent() {
    const heroData = await getContent("hero");
    if (heroData.success && heroData.data) {
      const contentObj = (heroData.data.content as Record<string, string>) || {};
      setHero({
        title: heroData.data.title || "NOPZ GARAGE",
        subtitle: heroData.data.subtitle || "Cepat & Terpercaya",
        ctaText: contentObj.ctaText || "Booking Sekarang",
        highlightText: contentObj.highlightText || "",
        isVisible: heroData.data.isVisible
      });
    }

    const servicesData = await getContent("services");
    if (servicesData.success && servicesData.data) {
      const contentObj = (servicesData.data.content as { items?: ServiceItemState[] }) || {};
      setServicesHeader({
        title: servicesData.data.title || "Layanan Unggulan",
        subtitle: servicesData.data.subtitle || "Solusi perawatan dan modifikasi berkualitas tinggi untuk motor Anda",
        isVisible: servicesData.data.isVisible
      });
      if (contentObj.items && Array.isArray(contentObj.items)) {
        setServiceItems(contentObj.items);
      } else {
        setServiceItems(DEFAULT_SERVICE_ITEMS);
      }
    }

    const statsData = await getContent("stats");
    if (statsData.success && statsData.data) {
      const contentObj = (statsData.data.content as Record<string, string>) || {};
      setStats({
        motors: contentObj.motors || "5000+",
        satisfaction: contentObj.satisfaction || "99%",
        experience: contentObj.experience || "15 Tahun",
        support: contentObj.support || "24 Jam"
      });
    }

    const featuresData = await getContent("features");
    if (featuresData.success && featuresData.data) {
      const contentObj = featuresData.data.content as unknown;
      if (Array.isArray(contentObj)) {
        setFeatureItems(contentObj as FeatureItemState[]);
      } else if (contentObj && typeof contentObj === "object" && "items" in contentObj && Array.isArray((contentObj as { items: unknown }).items)) {
        setFeatureItems((contentObj as { items: FeatureItemState[] }).items);
      } else {
        setFeatureItems([
          { title: "Garansi Resmi", desc: "Setiap pengerjaan dilindungi garansi resmi. Kepuasan terjamin." },
          { title: "Teknisi Bersertifikat", desc: "Tim mekanik profesional dengan pengalaman 15+ tahun." },
          { title: "Spare Parts Original", desc: "Hanya menggunakan parts original dari distributor resmi." }
        ]);
      }
    } else {
      setFeatureItems([
        { title: "Garansi Resmi", desc: "Setiap pengerjaan dilindungi garansi resmi. Kepuasan terjamin." },
        { title: "Teknisi Bersertifikat", desc: "Tim mekanik profesional dengan pengalaman 15+ tahun." },
        { title: "Spare Parts Original", desc: "Hanya menggunakan parts original dari distributor resmi." }
      ]);
    }

    const testiData = await getContent("testimonials");
    if (testiData.success && testiData.data) {
      const contentObj = (testiData.data.content as { items?: TestimonialItemState[] }) || {};
      if (contentObj.items) {
        setTestimonials(contentObj.items);
      }
    } else {
      setTestimonials([
        { name: "Andi Saputra", quote: "Pelayanan luar biasa, motor jadi enak banget.", vehicle: "Yamaha NMAX", rating: 5 },
        { name: "Siti Aminah", quote: "Fitur trackingnya sangat membantu.", vehicle: "Honda Beat", rating: 5 }
      ]);
    }

    const promoData = await getContent("promos");
    if (promoData.success && promoData.data) {
      const contentObj = (promoData.data.content as { items?: PromoItemState[] }) || {};
      if (contentObj.items) {
        setPromos(contentObj.items);
      }
    } else {
      setPromos([
        { title: "PROMO MERDEKA", desc: "Diskon Jasa Servis 17%", isActive: true }
      ]);
    }

    const footerData = await getContent("footer");
    if (footerData.success && footerData.data) {
      const contentObj = (footerData.data.content as Record<string, string>) || {};
      setFooter({
        instagram: contentObj.instagram || "#",
        whatsapp: contentObj.whatsapp || "#",
        maps: contentObj.maps || "#"
      });
    }

    const themeData = await getContent("theme_config");
    if (themeData.success && themeData.data) {
      const contentObj = (themeData.data.content as Record<string, unknown>) || {};
      setTheme({
        primaryColor: (contentObj.primaryColor as string) || "#a855f7",
        secondaryColor: (contentObj.secondaryColor as string) || "#f97316",
        fontScale: (contentObj.fontScale as number) || 1,
        fontFamily: (contentObj.fontFamily as string) || "sans"
      });
    }

    setLoading(false);
  }

  async function handleSaveHero() {
    const res = await updateContent("hero", {
      title: hero.title,
      subtitle: hero.subtitle,
      content: { ctaText: hero.ctaText, highlightText: hero.highlightText },
      isVisible: hero.isVisible
    });
    if (res.success) {
      toast.success("Hero section updated");
    } else {
      toast.error("Gagal update");
    }
  }

  async function handleSaveStats() {
    const res = await updateContent("stats", {
      title: "Stats Bar",
      subtitle: "Statistics numbers",
      content: stats,
      isVisible: true
    });
    if (res.success) {
      toast.success("Stats updated");
    } else {
      toast.error("Gagal update stats");
    }
  }

  async function handleSaveServices() {
    const res = await updateContent("services", {
      title: servicesHeader.title,
      subtitle: servicesHeader.subtitle,
      content: { items: serviceItems },
      isVisible: servicesHeader.isVisible
    });
    if (res.success) {
      toast.success("Services section updated");
    } else {
      toast.error("Gagal update");
    }
  }

  async function handleSaveFeatures() {
    const res = await updateContent("features", {
      title: "Why Choose Us",
      subtitle: "Features List",
      content: { items: featureItems },
      isVisible: true
    });
    if (res.success) {
      toast.success("Features section updated");
    } else {
      toast.error("Gagal update");
    }
  }

  async function handleSaveTheme() {
    const res = await updateContent("theme_config", {
      title: "Theme Configuration",
      subtitle: "Color and typography settings",
      content: theme,
      isVisible: true
    });
    if (res.success) {
      toast.success("Tema berhasil disimpan! Refresh halaman depan untuk melihat hasil.");
    } else {
      toast.error("Gagal update tema");
    }
  }

  async function handleSaveTestimonials() {
    const res = await updateContent("testimonials", {
      title: "Apa Kata Mereka?",
      subtitle: "Testimoni Pelanggan",
      content: { items: testimonials },
      isVisible: true
    });
    if (res.success) {
      toast.success("Testimoni berhasil disimpan");
    } else {
      toast.error("Gagal update testimoni");
    }
  }

  async function handleSavePromos() {
    const res = await updateContent("promos", {
      title: "Promo Banner",
      subtitle: "Promo yang sedang aktif",
      content: { items: promos },
      isVisible: true
    });
    if (res.success) {
      toast.success("Promo berhasil disimpan");
    } else {
      toast.error("Gagal update promo");
    }
  }

  async function handleSaveFooter() {
    const res = await updateContent("footer", {
      title: "Footer Links",
      subtitle: "Social Media & Maps",
      content: footer,
      isVisible: true
    });
    if (res.success) {
      toast.success("Footer berhasil disimpan");
    } else {
      toast.error("Gagal update footer");
    }
  }

  function handleAddServiceItem() {
    setServiceItems([
      ...serviceItems, 
      {
        id: Date.now().toString(),
        title: "Layanan Baru",
        description: "Deskripsi singkat mengenai pengerjaan dan manfaat layanan ini...",
        features: ["Fitur utama 1", "Fitur utama 2"],
        tag: "NEW SERVICE",
        icon: "Wrench",
        serviceType: "LIGHT_SERVICE"
      }
    ]);
  }

  function handleRemoveServiceItem(index: number) {
    const nextItems = [...serviceItems];
    nextItems.splice(index, 1);
    setServiceItems(nextItems);
  }

  function handleUpdateServiceItem(index: number, field: string, value: unknown) {
    const nextItems = [...serviceItems];
    nextItems[index] = { ...nextItems[index], [field]: value };
    setServiceItems(nextItems);
  }

  function handleAddServiceFeature(serviceIndex: number) {
    const nextItems = [...serviceItems];
    if (!nextItems[serviceIndex].features) {
      nextItems[serviceIndex].features = [];
    }
    nextItems[serviceIndex].features.push("");
    setServiceItems(nextItems);
  }

  function handleRemoveServiceFeature(serviceIndex: number, featureIndex: number) {
    const nextItems = [...serviceItems];
    if (nextItems[serviceIndex].features) {
      nextItems[serviceIndex].features.splice(featureIndex, 1);
      setServiceItems(nextItems);
    }
  }

  function handleUpdateServiceFeatureText(serviceIndex: number, featureIndex: number, text: string) {
    const nextItems = [...serviceItems];
    if (nextItems[serviceIndex].features) {
      nextItems[serviceIndex].features[featureIndex] = text;
      setServiceItems(nextItems);
    }
  }

  function handleAddFeatureItem() {
    setFeatureItems([
      ...featureItems, 
      {
        title: "Keunggulan Baru",
        desc: "Deskripsi keunggulan..."
      }
    ]);
  }

  function handleRemoveFeatureItem(index: number) {
    const nextItems = [...featureItems];
    nextItems.splice(index, 1);
    setFeatureItems(nextItems);
  }

  function handleUpdateFeatureItem(index: number, field: string, value: unknown) {
    const nextItems = [...featureItems];
    nextItems[index] = { ...nextItems[index], [field]: value };
    setFeatureItems(nextItems);
  }

  function handleAddTestimonial() {
    setTestimonials([
      ...testimonials, 
      { 
        name: "Nama", 
        quote: "Komentar...", 
        vehicle: "Kendaraan", 
        rating: 5 
      }
    ]);
  }

  function handleRemoveTestimonial(index: number) {
    const nextItems = [...testimonials];
    nextItems.splice(index, 1);
    setTestimonials(nextItems);
  }

  function handleUpdateTestimonial(index: number, field: string, value: unknown) {
    const nextItems = [...testimonials];
    nextItems[index] = { ...nextItems[index], [field]: value };
    setTestimonials(nextItems);
  }

  function handleAddPromo() {
    setPromos([
      ...promos, 
      { 
        title: "JUDUL", 
        desc: "Keterangan promo", 
        isActive: false 
      }
    ]);
  }

  function handleRemovePromo(index: number) {
    const nextItems = [...promos];
    nextItems.splice(index, 1);
    setPromos(nextItems);
  }

  function handleUpdatePromo(index: number, field: string, value: unknown) {
    const nextItems = [...promos];
    nextItems[index] = { ...nextItems[index], [field]: value };
    setPromos(nextItems);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2">
        <Loader2 className="animate-spin text-primary h-5 w-5" /> 
        <span>Loading CMS...</span>
      </div>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Konten & Tampilan Website</CardTitle>
        <CardDescription>Atur konten landing page dan tema warna website Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={subTab}
          onValueChange={setSubTab}
          className="w-full"
        >
          <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 lg:w-full h-auto">
            <TabsTrigger value="hero" className="gap-2">
              <Layout className="h-4 w-4" /> Hero
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <TrendingUp className="h-4 w-4" /> Stats
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Globe className="h-4 w-4" /> Layanan
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <ThumbsUp className="h-4 w-4" /> Keunggulan
            </TabsTrigger>
            <TabsTrigger value="testimoni" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Testimoni
            </TabsTrigger>
            <TabsTrigger value="promo" className="gap-2">
              <Megaphone className="h-4 w-4" /> Promo
            </TabsTrigger>
            <TabsTrigger value="footer" className="gap-2">
              <Link2 className="h-4 w-4" /> Footer
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" /> Tampilan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-6 animate-in fade-in-50">
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border">
              <div>
                <h4 className="font-medium">Tampilkan Hero Banner?</h4>
                <p className="text-sm text-muted-foreground">Banner besar di bagian paling atas.</p>
              </div>
              <Switch 
                checked={hero.isVisible} 
                onCheckedChange={(checked) => setHero({ ...hero, isVisible: checked })} 
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Judul Utama (Headline)</Label>
                <Input 
                  value={hero.title} 
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Teks Tombol (CTA)</Label>
                <Input 
                  value={hero.ctaText} 
                  onChange={(e) => setHero({ ...hero, ctaText: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Sub-judul (Subheadline)</Label>
                <Textarea 
                  value={hero.subtitle} 
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  className="resize-none"
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Teks Highlight (Gradient) - NFS Style</Label>
                <Input 
                  value={hero.highlightText} 
                  onChange={(e) => setHero({ ...hero, highlightText: e.target.value })}
                  placeholder="Contoh: PRESTIGE (Akan muncul warna-warni)"
                />
                <p className="text-[10px] text-muted-foreground">Jika kosong, akan mengambil kata pertama dari Sub-judul.</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveHero} 
                className="gap-2 bg-primary text-primary-foreground"
              >
                <Save className="h-4 w-4" /> Simpan Perubahan
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6 animate-in fade-in-50">
            <div className="bg-muted/30 p-4 rounded-lg border">
              <p className="text-sm font-medium">Statistik Bengkel</p>
              <p className="text-sm text-muted-foreground">Angka yang muncul di bawah Hero Banner.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Motors Handled</Label>
                <Input
                  value={stats.motors}
                  onChange={(e) => setStats({ ...stats, motors: e.target.value })}
                  placeholder="5000+"
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Satisfaction</Label>
                <Input
                  value={stats.satisfaction}
                  onChange={(e) => setStats({ ...stats, satisfaction: e.target.value })}
                  placeholder="99%"
                />
              </div>
              <div className="space-y-2">
                <Label>Years Experience</Label>
                <Input
                  value={stats.experience}
                  onChange={(e) => setStats({ ...stats, experience: e.target.value })}
                  placeholder="15 Tahun"
                />
              </div>
              <div className="space-y-2">
                <Label>Support Availability</Label>
                <Input
                  value={stats.support}
                  onChange={(e) => setStats({ ...stats, support: e.target.value })}
                  placeholder="24 Jam"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSaveStats} 
                className="gap-2 bg-primary text-primary-foreground"
              >
                <Save className="h-4 w-4" /> Simpan Stats
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6 animate-in fade-in-50">
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border">
              <div>
                <h4 className="font-medium">Tampilkan Section Layanan?</h4>
                <p className="text-sm text-muted-foreground">Daftar kartu layanan unggulan. Otomatis masuk ke Form Booking.</p>
              </div>
              <Switch 
                checked={servicesHeader.isVisible} 
                onCheckedChange={(checked) => setServicesHeader({ ...servicesHeader, isVisible: checked })} 
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Judul Section</Label>
                <Input 
                  value={servicesHeader.title} 
                  onChange={(e) => setServicesHeader({ ...servicesHeader, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Section</Label>
                <Input 
                  value={servicesHeader.subtitle} 
                  onChange={(e) => setServicesHeader({ ...servicesHeader, subtitle: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Daftar Kartu Layanan</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddServiceItem}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Tambah Layanan
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {serviceItems.map((item, index) => {
                  const IconComponent = ICONS.find((i) => i.value === item.icon)?.icon || Zap;
                  return (
                    <Card 
                      key={index} 
                      className="relative group border border-muted-foreground/20 hover:border-primary/50 transition-all hover:shadow-md"
                    >
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur rounded-md p-1 shadow-sm border z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleRemoveServiceItem(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div className="w-full overflow-hidden">
                            <Input 
                              value={item.title} 
                              onChange={(e) => handleUpdateServiceItem(index, 'title', e.target.value)} 
                              className="font-bold h-7 text-sm px-1 border-transparent hover:border-input focus:border-input transition-colors mb-1 truncate"
                              placeholder="Nama Layanan"
                            />
                            <Input 
                              value={item.tag || ''} 
                              onChange={(e) => handleUpdateServiceItem(index, 'tag', e.target.value)} 
                              placeholder="Tag (Opsional)"
                              className="h-5 text-[10px] px-1 border-transparent hover:border-input focus:border-input text-primary font-medium"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Select 
                            value={item.serviceType || "LIGHT_SERVICE"} 
                            onValueChange={(val) => handleUpdateServiceItem(index, 'serviceType', val)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Textarea 
                            value={item.description}
                            onChange={(e) => handleUpdateServiceItem(index, 'description', e.target.value)}
                            className="h-16 text-xs resize-none"
                            placeholder="Deskripsi singkat..."
                          />
                        </div>
                        
                        <div className="bg-muted/30 p-2 rounded-md h-[120px] overflow-y-auto">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                              Fitur ({item.features?.length || 0})
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={() => handleAddServiceFeature(index)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="space-y-1">
                            {item.features?.map((feat, fIdx) => (
                              <div key={fIdx} className="flex gap-1 items-center">
                                <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
                                <Input 
                                  value={feat}
                                  onChange={(e) => handleUpdateServiceFeatureText(index, fIdx, e.target.value)}
                                  className="h-5 text-[10px] px-1 bg-transparent border-none focus:bg-background focus:ring-0"
                                  placeholder="Fitur..."
                                />
                                <Trash2 
                                  className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-destructive shrink-0" 
                                  onClick={() => handleRemoveServiceFeature(index, fIdx)} 
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <Select 
                          value={item.icon} 
                          onValueChange={(val) => handleUpdateServiceItem(index, 'icon', val)}
                        >
                          <SelectTrigger className="w-full h-7 text-xs bg-muted/20">
                            <span className="flex items-center gap-2 truncate">
                              Ganti Icon: {ICONS.find((i) => i.value === item.icon)?.label}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {ICONS.map((iconOpt) => (
                              <SelectItem key={iconOpt.value} value={iconOpt.value}>
                                <div className="flex items-center gap-2">
                                  <iconOpt.icon className="h-3 w-3" /> {iconOpt.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSaveServices} 
                className="gap-2 bg-primary text-primary-foreground"
              >
                <Save className="h-4 w-4" /> Simpan Layanan
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6 animate-in fade-in-50">
            <div className="bg-muted/30 p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                Bagian <strong>&quot;Kenapa NopzGarage?&quot;</strong>. Disarankan hanya 3 poin utama agar tampilan rapi.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Daftar Keunggulan</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddFeatureItem}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Tambah Poin
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {featureItems.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex gap-3 items-start p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center h-8 w-8 bg-primary/10 rounded-full text-primary font-bold text-xs shrink-0 mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <Input 
                        value={item.title}
                        placeholder="Judul Keunggulan"
                        onChange={(e) => handleUpdateFeatureItem(index, 'title', e.target.value)}
                        className="font-bold border-none h-7 px-0 focus-visible:ring-0 bg-transparent text-sm"
                      />
                      <Input 
                        value={item.desc}
                        placeholder="Penjelasan singkat..."
                        onChange={(e) => handleUpdateFeatureItem(index, 'desc', e.target.value)}
                        className="text-xs border-none h-auto py-0 px-0 focus-visible:ring-0 bg-transparent text-muted-foreground"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveFeatureItem(index)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSaveFeatures} 
                className="gap-2 bg-primary text-primary-foreground"
              >
                <Save className="h-4 w-4" /> Simpan Keunggulan
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6 animate-in fade-in-50">
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
              <p className="text-sm font-medium text-primary">
                Kustomisasi Tema Website
              </p>
              <p className="text-xs text-muted-foreground">
                Ganti warna identitas brand dan ukuran font untuk menyesuaikan selera Anda.
                Perubahan akan langsung diterapkan setelah disimpan.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Warna Utama (Primary)</Label>
                  <div className="flex gap-3 items-center">
                    <Input 
                      type="color" 
                      className="w-12 h-12 p-1 rounded-md cursor-pointer"
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    />
                    <Input 
                      type="text" 
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      className="font-mono uppercase w-32"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Digunakan untuk tombol, highlight, dan elemen penting.</p>
                </div>

                <div className="space-y-3">
                  <Label>Warna Aksen (Secondary)</Label>
                  <div className="flex gap-3 items-center">
                    <Input 
                      type="color" 
                      className="w-12 h-12 p-1 rounded-md cursor-pointer"
                      value={theme.secondaryColor}
                      onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                    />
                    <Input 
                      type="text" 
                      value={theme.secondaryColor}
                      onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                      className="font-mono uppercase w-32"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Digunakan untuk badge, border, dan dekorasi.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="flex justify-between">
                    <span>Ukuran Font (Skala)</span>
                    <span className="font-bold text-primary">{theme.fontScale}x</span>
                  </Label>
                  <Slider 
                    min={0.8} 
                    max={1.2} 
                    step={0.05} 
                    value={[theme.fontScale]} 
                    onValueChange={(vals) => setTheme({ ...theme, fontScale: vals[0] })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Lebih Kecil</span>
                    <span>Normal</span>
                    <span>Lebih Besar</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Jenis Font</Label>
                  <Select 
                    value={theme.fontFamily || "sans"} 
                    onValueChange={(val) => setTheme({ ...theme, fontFamily: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Modern Standard (Inter)</SelectItem>
                      <SelectItem value="orbitron">NFS Racing (Orbitron)</SelectItem>
                      <SelectItem value="russo">Bold Sporty (Russo One)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">&quot;NFS Racing&quot; menggunakan font Orbitron yang futuristik.</p>
                </div>

                <div className="p-4 rounded-lg bg-background border shadow-sm space-y-2 mt-8">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Preview Tampilan</div>
                  <div 
                    style={{ borderColor: theme.secondaryColor }}
                    className="border-l-4 pl-4 py-2"
                  >
                    <h3 style={{ color: theme.primaryColor }} className="text-2xl font-bold">Judul Headline</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Ini adalah contoh teks dengan warna dan ukuran yang Anda pilih. 
                      <span style={{ color: theme.secondaryColor }} className="font-bold ml-1">Warna aksen.</span>
                    </p>
                    <Button 
                      size="sm" 
                      className="mt-3"
                      style={{ backgroundColor: theme.primaryColor, color: '#fff' }}
                    >
                      Tombol Contoh
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSaveTheme} 
                className="gap-2 bg-primary text-primary-foreground"
              >
                <Save className="h-4 w-4" /> Simpan Tema
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="testimoni" className="space-y-6 animate-in fade-in-50">
            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
              <div>
                <h4 className="font-medium">Daftar Testimoni</h4>
                <p className="text-sm text-muted-foreground">Apa kata pelanggan tentang bengkel Anda.</p>
              </div>
              <Button
                size="sm"
                onClick={handleAddTestimonial}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Tambah
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((item, i) => (
                <Card key={i} className="relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => handleRemoveTestimonial(i)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-3 w-3 ${star <= (item.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} 
                          onClick={() => handleUpdateTestimonial(i, 'rating', star)} 
                        />
                      ))}
                    </div>
                    <Textarea 
                      value={item.quote} 
                      onChange={(e) => handleUpdateTestimonial(i, 'quote', e.target.value)} 
                      className="text-xs resize-none" 
                      placeholder="Komentar..."
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        value={item.name} 
                        onChange={(e) => handleUpdateTestimonial(i, 'name', e.target.value)} 
                        className="h-7 text-xs" 
                        placeholder="Nama"
                      />
                      <Input 
                        value={item.vehicle} 
                        onChange={(e) => handleUpdateTestimonial(i, 'vehicle', e.target.value)} 
                        className="h-7 text-xs" 
                        placeholder="Motor"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSaveTestimonials} 
                className="gap-2 bg-primary text-primary-foreground"
              >
                <Save className="h-4 w-4" /> Simpan Testimoni
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="promo" className="space-y-6 animate-in fade-in-50">
            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
              <div>
                <h4 className="font-medium">Promo Banner</h4>
                <p className="text-sm text-muted-foreground">Banner berjalan di bagian atas website.</p>
              </div>
              <Button
                size="sm"
                onClick={handleAddPromo}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Tambah
              </Button>
            </div>
            {promos.map((item, i) => (
              <div key={i} className="flex gap-4 items-center p-3 border rounded-lg">
                <Switch 
                  checked={item.isActive} 
                  onCheckedChange={(checked) => handleUpdatePromo(i, 'isActive', checked)} 
                />
                <div className="flex-1 space-y-2">
                  <Input
                    value={item.title}
                    onChange={(e) => handleUpdatePromo(i, 'title', e.target.value)}
                    placeholder="Judul Promo"
                    className="font-bold"
                  />
                  <Input
                    value={item.desc}
                    onChange={(e) => handleUpdatePromo(i, 'desc', e.target.value)}
                    placeholder="Deskripsi singkat"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePromo(i)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSavePromos} 
                className="gap-2 bg-primary text-primary-foreground"
              >
                <Save className="h-4 w-4" /> Simpan Promo
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="footer" className="space-y-6 animate-in fade-in-50">
            <div className="bg-muted/30 p-4 rounded-lg border">
              <p className="text-sm font-medium">Link Footer</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Instagram Link</Label>
                <Input
                  value={footer.instagram}
                  onChange={(e) => setFooter({ ...footer, instagram: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Link</Label>
                <Input
                  value={footer.whatsapp}
                  onChange={(e) => setFooter({ ...footer, whatsapp: e.target.value })}
                  placeholder="https://wa.me/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Google Maps Link</Label>
                <Input
                  value={footer.maps}
                  onChange={(e) => setFooter({ ...footer, maps: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSaveFooter} 
                className="gap-2 bg-primary text-primary-foreground"
              >
                <Save className="h-4 w-4" /> Simpan Footer
              </Button>
            </div>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}
