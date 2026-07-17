import { auth } from "@/lib/auth";
import Link from "next/link";
import { BookingForm } from "@/components/BookingForm";
import { LiveQueueList } from "@/components/LiveQueueList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { getAllSettings, GeneralSettings, HolidaySettings } from "@/app/actions/settings";
import { getMediaGallery } from "@/app/actions/media-gallery";
import { getSocialEmbeds } from "@/app/actions/social-embeds";
import { MediaGalleryDisplay } from "@/components/MediaGalleryDisplay";
import { SocialEmbedsDisplay } from "@/components/SocialEmbedsDisplay";
import { 
  Wrench, 
  Clock, 
  Calendar, 
  Zap, 
  Shield, 
  Award, 
  Users, 
  CheckCircle, 
  Phone, 
  Mail, 
  MapPin,
  Star,
  TrendingUp,
  Settings,
  Gauge,
  Target,
  AlertOctagon,
  Megaphone,
  Share2,
  ChevronRight,
  LogIn,
  Heart,
  Sparkles,
  ArrowRight,
  ImagePlus,
  Instagram
} from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

// Map string icon names to Lucide components
const ICON_MAP: Record<string, any> = {
  Zap, Settings, Wrench, Clock, Shield, Award, Star, Heart
};

export default async function Home() {
  const session = await auth();
  const settings = await getAllSettings();
  const { holiday, general, content } = settings;

  // Fetch Media Gallery and Social Embeds
  const galleryItems = await getMediaGallery("GALLERY");
  const posterItems = await getMediaGallery("POSTER");
  const bannerItems = await getMediaGallery("BANNER");
  const carouselItems = await getMediaGallery("CAROUSEL");
  const socialEmbeds = await getSocialEmbeds();

  // Extract Dynamic Content
  const servicesConfig = content['services']?.content || {};
  const serviceItems = Array.isArray(servicesConfig.items) ? servicesConfig.items : [
    // Default Fallback if empty
    {
       id: "1", title: "Fast Lane", description: "Servis cepat untuk perawatan rutin",
       features: ["Ganti oli & filter", "Tune up ringan"],
       tag: "SAME DAY SERVICE", icon: "Zap"
    },
    {
       id: "2", title: "Project Lane", description: "Modifikasi & Heavy Repair",
       features: ["Turun mesin", "Modifikasi Body"],
       tag: "CUSTOM PROJECT", icon: "Settings"
    }
  ];
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const footerConfig = (content['footer'] as any)?.content || {};
  const testimonialsConfig = (content['testimonials'] as any)?.content || {};
  const testimonialItems = Array.isArray(testimonialsConfig.items) ? testimonialsConfig.items : [
      { name: "Andi Saputra", quote: "Pelayanan luar biasa, motor jadi enak banget.", vehicle: "Yamaha NMAX", rating: 5 },
      { name: "Siti Aminah", quote: "Fitur trackingnya sangat membantu.", vehicle: "Honda Beat", rating: 5 },
      { name: "Budi Santoso", quote: "Modifikasi project lane hasilnya rapi banget.", vehicle: "Kawasaki Ninja", rating: 5 }
  ];

  // Cast content['promos'] to any to avoid TS errors
  const promosContent = (content['promos'] as any);
  const promos = promosContent?.content?.items || [];
  const activePromo = promos.find((p: any) => p.isActive);

  const themeConfig = content['theme_config']?.content || {};
  const primaryColor = themeConfig.primaryColor || "#6E2E72"; // Default
  const secondaryColor = themeConfig.secondaryColor || "#FE6804"; // Default
  const fontScale = themeConfig.fontScale || 1;

  // Generate CSS Variables Injection
  const themeStyle = `
    :root {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
      --temp-font-scale: ${fontScale};
    }
    .dark {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
    }
    html {
      font-size: calc(16px * var(--temp-font-scale));
    }
  `;

  console.log("[LANDING_PAGE] Rendering with Theme:", { primaryColor, secondaryColor });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden antialiased">
      
      {/* Dynamic Theme Injection */}
      <style dangerouslySetInnerHTML={{ __html: themeStyle }} />

      {/* Header - Enhanced with better visual weight */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-background/90 border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo - Better spacing and hover effect */}
            <div className="flex flex-col items-start gap-1 group cursor-pointer transition-all duration-300 hover:scale-[1.02]">
              <div className="relative">
                <Image 
                  src="/logo.svg" 
                  alt="NopzGarage" 
                  width={180} 
                  height={45} 
                  style={{ height: "auto" }}
                  className="relative z-10 transition-opacity duration-300 group-hover:opacity-90"
                  priority
                />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground tracking-[0.2em] pl-0.5 font-nfs uppercase font-bold">
               REMAP N CUSTOM
              </p>
            </div>

            {/* Navigation - Better spacing and hover states */}
            <nav className="flex gap-3 md:gap-4 items-center">
              <Link 
                href="/status" 
                className="hidden md:flex group items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-all duration-300 px-4 py-2 rounded-lg hover:bg-primary/5"
              >
                <Gauge className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                <span>Cek Status</span>
              </Link>
              
              <ThemeToggle />

              {session ? (
                <Link 
                  href={session.user.role === "EMPLOYEE" ? "/employee" : "/admin"} 
                  className="group px-5 md:px-6 py-2.5 md:py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                >
                  <span>Dashboard</span>
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="group px-5 md:px-6 py-2.5 md:py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* HOLIDAY BANNER - Enhanced with better animation */}
      {holiday.isHoliday && (
          <div className="bg-destructive text-destructive-foreground px-4 py-4 relative animate-in slide-in-from-top-5 shadow-2xl z-40 border-b-2 border-destructive/50">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-3 text-center md:text-left">
                <AlertOctagon className="h-6 w-6 animate-pulse" />
                <span className="font-black uppercase tracking-wider text-lg">BENGKEL SEDANG TUTUP</span>
                <span className="hidden md:inline mx-3 opacity-40">•</span>
                <span className="text-sm font-semibold opacity-95">{holiday.reason || "Libur Sementara"}</span>
                {holiday.openAt && (
                    <span className="text-sm bg-white/25 backdrop-blur-sm px-3 py-1 rounded-lg ml-2 font-mono font-bold">
                        Buka: {holiday.openAt}
                    </span>
                )}
            </div>
          </div>
      )}

      {/* HERO SECTION - Dramatically improved with better visual hierarchy */}
      {content.hero.isVisible && (
        <section className="relative py-20 md:py-32 lg:py-40 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
          {/* Enhanced Background Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary/8 via-transparent to-transparent opacity-50"></div>
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 lg:px-6 relative z-10">
            <div className="max-w-6xl mx-auto text-center space-y-10">
              {/* Badge - More refined */}
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-full text-foreground text-sm font-bold backdrop-blur-xl shadow-lg shadow-primary/10 animate-in fade-in-0 slide-in-from-bottom-3 duration-700 hover:scale-105 transition-transform cursor-default">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="tracking-wider">Racing Performance Specialist</span>
              </div>
              
              {/* Main Heading - Better typography scale */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-foreground leading-[0.9] tracking-tighter animate-in fade-in-0 slide-in-from-bottom-5 duration-1000 delay-100">
                {content.hero.title || "NOPZ GARAGE"}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary drop-shadow-2xl">
                   {(content.hero.content as any)?.highlightText || content.hero.subtitle?.split(' ')[0] || "PREMIUM"}
                </span>
              </h1>
              
              {/* Subtitle - Better contrast and readability */}
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in-0 slide-in-from-bottom-5 duration-1000 delay-200">
                {content.hero.subtitle || "Teknisi berpengalaman, peralatan modern, dan layanan berkualitas MotoGP standard."}
              </p>
              
              {/* CTA Buttons - Enhanced with better visual weight */}
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in-0 slide-in-from-bottom-5 duration-1000 delay-300">
                  <Link 
                    href="/booking" 
                    className="group w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground text-base md:text-lg font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-2xl shadow-primary/40 hover:shadow-primary/60 flex items-center justify-center gap-2.5 border-2 border-primary/20"
                  >
                    <Calendar className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                    <span>{content.hero.ctaText || "Booking Sekarang"}</span>
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link 
                    href="/status" 
                    className="group w-full sm:w-auto px-8 py-4 bg-background border-2 border-border hover:border-primary/50 text-foreground text-base md:text-lg font-bold rounded-2xl hover:bg-muted/50 transition-all duration-300 flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Gauge className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                    <span>Cek Status</span>
                  </Link>
              </div>

              {/* Stats Bar - Refined with better spacing */}
              <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16 border-t border-dashed border-border/70 max-w-5xl mx-auto">
                 <div className="text-center group cursor-default">
                    <div className="text-4xl md:text-5xl font-black font-mono text-foreground group-hover:text-primary transition-colors duration-300">
                      {content.stats.motors}
                    </div>
                    <div className="text-xs md:text-sm uppercase tracking-[0.15em] text-muted-foreground mt-2 font-bold">Motors</div>
                 </div>
                 <div className="text-center group cursor-default">
                    <div className="text-4xl md:text-5xl font-black font-mono text-foreground group-hover:text-primary transition-colors duration-300">
                      {content.stats.satisfaction}
                    </div>
                    <div className="text-xs md:text-sm uppercase tracking-[0.15em] text-muted-foreground mt-2 font-bold">Satisfaction</div>
                 </div>
                 <div className="text-center group cursor-default">
                    <div className="text-4xl md:text-5xl font-black font-mono text-foreground group-hover:text-primary transition-colors duration-300">
                      {content.stats.experience}
                    </div>
                    <div className="text-xs md:text-sm uppercase tracking-[0.15em] text-muted-foreground mt-2 font-bold">Years</div>
                 </div>
                 <div className="text-center group cursor-default">
                    <div className="text-4xl md:text-5xl font-black font-mono text-foreground group-hover:text-primary transition-colors duration-300">
                      {content.stats.support}
                    </div>
                    <div className="text-xs md:text-sm uppercase tracking-[0.15em] text-muted-foreground mt-2 font-bold">Support</div>
                 </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PROMO BANNER - Enhanced animation */}
      {activePromo && (
        <section className="py-5 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient text-white overflow-hidden shadow-xl relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1),transparent_50%)]"></div>
            <div className="container mx-auto px-4 flex items-center justify-center gap-4 relative z-10">
                <Megaphone className="h-6 w-6 animate-bounce" />
                <span className="font-bold text-base md:text-lg text-center">
                    {activePromo.title}: {activePromo.desc}
                </span>
            </div>
        </section>
      )}

      {/* DYNAMIC SERVICES SECTION - Major improvement */}
      {content['services']?.isVisible !== false && (
        <section className="py-24 md:py-32 bg-gradient-to-b from-background to-muted/20 relative" id="services">
          <div className="container mx-auto px-4 lg:px-6">
            {/* Section Header - Better hierarchy */}
            <div className="text-center mb-20 space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase tracking-widest">
                <Wrench className="h-4 w-4" />
                Layanan Kami
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-tight">
                {content['services']?.title || "Layanan Unggulan"}
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed font-medium">
                {content['services']?.subtitle || "Pilih layanan terbaik untuk performa maksimal motor Anda"}
              </p>
            </div>

            {/* Services Grid - Better cards */}
            <div className={`grid md:grid-cols-${Math.min(serviceItems.length, 2)} lg:grid-cols-${Math.min(serviceItems.length, 3)} gap-6 lg:gap-8 max-w-7xl mx-auto`}>
              {serviceItems.map((item: any, idx: number) => {
                 const IconComp = ICON_MAP[item.icon] || Zap;
                 return (
                    <div 
                      key={idx} 
                      className="group relative bg-card border-2 border-border hover:border-primary/60 rounded-3xl p-8 lg:p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 flex flex-col h-full"
                    >
                      {/* Background Icon */}
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                         <IconComp className="h-40 w-40" />
                      </div>
                      
                      <div className="relative z-10 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-5 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border-2 border-primary/20 group-hover:border-primary/40 group-hover:scale-110 transition-all duration-500 shadow-lg">
                                <IconComp className="h-8 w-8 text-primary" />
                            </div>
                            {item.tag && (
                                <span className="px-3 py-1.5 bg-primary/15 border-2 border-primary/30 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest">
                                    {item.tag}
                                </span>
                            )}
                        </div>

                        {/* Content */}
                        <h3 className="text-2xl lg:text-3xl font-black mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-sm lg:text-base mb-8 leading-relaxed font-medium">
                            {item.description}
                        </p>

                        {/* Features List */}
                        <div className="mt-auto space-y-4 pt-8 border-t-2 border-dashed border-border/50">
                            <ul className="space-y-4">
                                {Array.isArray(item.features) && item.features.map((feat: string, fIdx: number) => (
                                    <li key={fIdx} className="flex items-start gap-3 text-sm font-semibold text-foreground">
                                        <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                      </div>
                    </div>
                 );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CAROUSEL / HIGHLIGHTS SECTION */}
      {carouselItems.length > 0 && (
        <section className="py-24 bg-background relative border-t-2 border-border/50">
          <div className="container mx-auto px-4 lg:px-6">
             <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="h-4 w-4" />
                  Highlights
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-foreground">Featured <span className="text-primary">Content</span></h2>
                <p className="text-muted-foreground font-medium max-w-2xl mx-auto">
                   Sorotan utama dan momen terbaik terbaru
                </p>
             </div>
             <MediaGalleryDisplay items={carouselItems} columns={1} className="max-w-4xl mx-auto" />
          </div>
        </section>
      )}

      {/* LIVE QUEUE SECTION - Enhanced design */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-muted/20 to-background border-y-2 border-border/50 relative overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-secondary/5 to-transparent pointer-events-none"></div>
        
        <div className="container mx-auto px-4 lg:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-6">
             <div className="inline-block relative">
                 <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-30 animate-pulse"></div>
                 <div className="relative bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-xl border-2 border-primary/40 text-primary px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-3 mb-6 mx-auto w-fit shadow-lg">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary shadow-lg shadow-primary/50"></span>
                    </span>
                    <span className="tracking-[0.2em] uppercase">Live Monitoring</span>
                 </div>
             </div>
             
             <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
                Antrian <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary">Sirkuit</span>
             </h2>
             <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto">
               Pantau status pengerjaan motor Anda secara real-time langsung dari bengkel.
             </p>
          </div>
          
          {/* Queue Container */}
          <div className="max-w-7xl mx-auto bg-card/50 backdrop-blur-sm border-2 border-border hover:border-primary/30 rounded-3xl shadow-2xl p-2 md:p-10 transition-all duration-500 hover:shadow-primary/10">
              <LiveQueueList />
          </div>
        </div>
      </section>

      {/* BOOKING SECTION - Dramatically improved */}
      <section id="booking" className="py-24 md:py-32 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="container mx-auto px-4 lg:px-6 relative z-10">
           <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
               {/* Left Content */}
               <div className="space-y-8">
                   <div className="space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full text-secondary text-xs font-bold uppercase tracking-widest">
                        <Calendar className="h-4 w-4" />
                        Booking Servis
                      </div>
                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-foreground">
                         Siap untuk <br />
                         <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                           Performa Puncak?
                         </span>
                      </h2>
                      <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                         Jangan biarkan motor Anda menunggu. Booking jadwal servis sekarang dan nikmati pelayanan tanpa antri.
                      </p>
                   </div>
                   
                   {/* Benefits */}
                   <div className="space-y-6 pt-4">
                       <div className="flex items-start gap-5 group cursor-default">
                           <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-primary/40 transition-all duration-300">
                               <Calendar className="h-7 w-7 text-primary" />
                           </div>
                           <div className="pt-1">
                               <div className="font-black text-lg mb-1 text-foreground">Pilih Jadwal</div>
                               <div className="text-sm text-muted-foreground leading-relaxed font-medium">
                                 Sesuaikan dengan waktu luang Anda, fleksibel dan mudah
                               </div>
                           </div>
                       </div>
                       <div className="flex items-start gap-5 group cursor-default">
                           <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border-2 border-secondary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-secondary/40 transition-all duration-300">
                               <Wrench className="h-7 w-7 text-secondary" />
                           </div>
                           <div className="pt-1">
                               <div className="font-black text-lg mb-1 text-foreground">Datang & Servis</div>
                               <div className="text-sm text-muted-foreground leading-relaxed font-medium">
                                 Mekanik profesional siap mengerjakan motor Anda dengan standar terbaik
                               </div>
                           </div>
                       </div>
                       <div className="flex items-start gap-5 group cursor-default">
                           <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-primary/40 transition-all duration-300">
                               <CheckCircle className="h-7 w-7 text-primary" />
                           </div>
                           <div className="pt-1">
                               <div className="font-black text-lg mb-1 text-foreground">Track Progress</div>
                               <div className="text-sm text-muted-foreground leading-relaxed font-medium">
                                 Pantau status pengerjaan motor secara real-time di dashboard
                               </div>
                           </div>
                       </div>
                   </div>
               </div>

               {/* Booking CTA Card */}
                <div className="bg-card/80 backdrop-blur-xl border-2 border-border hover:border-primary/30 rounded-3xl p-8 lg:p-12 shadow-2xl hover:shadow-primary/10 transition-all duration-500 flex flex-col justify-between min-h-[380px]">
                    <div className="space-y-6">
                       <div className="inline-flex p-3 bg-primary/10 rounded-xl border border-primary/20">
                         <Calendar className="h-6 w-6 text-primary" />
                       </div>
                       <h3 className="text-3xl font-black text-foreground">Booking Servis Online</h3>
                       <p className="text-muted-foreground text-sm leading-relaxed">
                         Gunakan form booking online interaktif kami untuk mendaftarkan kendaraan Anda secara berkala. Pilih layanan, sesuaikan jadwal, dan dapatkan nomor antrian digital Anda instan.
                       </p>
                    </div>
                    <div className="pt-8">
                       <Link href="/booking">
                         <Button className="w-full h-14 text-sm font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform rounded-xl">
                           Mulai Booking Sekarang
                         </Button>
                       </Link>
                    </div>
                </div>
           </div>
        </div>
      </section>

      {/* BANNER SECTION - Full Width */}
      {bannerItems.length > 0 && (
        <section className="py-24 bg-muted/20 relative">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-16 space-y-4">
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full text-secondary text-xs font-bold uppercase tracking-widest">
                 <Megaphone className="h-4 w-4" />
                 Special Offers
               </div>
               <h2 className="text-3xl md:text-5xl font-black text-foreground">Promo & <span className="text-secondary">Events</span></h2>
               <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">
                 Jangan lewatkan penawaran spesial dan event menarik
               </p>
            </div>
            <MediaGalleryDisplay items={bannerItems} columns={1} className="max-w-5xl mx-auto" />
          </div>
        </section>
      )}

      {/* MEDIA GALLERY SECTION - New */}
      {galleryItems.length > 0 && (
        <section className="py-24 md:py-32 bg-gradient-to-b from-background to-muted/20 relative">
          <div className="container mx-auto px-4 lg:px-6">
            {/* Section Header */}
            <div className="text-center mb-20 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase tracking-widest">
                <ImagePlus className="h-4 w-4" />
                Gallery
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight">
                Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Projects</span>
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto">
                Lihat koleksi hasil kerja dan project terbaik kami
              </p>
            </div>

            {/* Gallery Grid */}
            <MediaGalleryDisplay items={galleryItems} columns={3} />
          </div>
        </section>
      )}

      {/* POSTER SECTION - New */}
      {posterItems.length > 0 && (
        <section className="py-24 md:py-32 bg-gradient-to-b from-muted/20 to-background relative">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase tracking-widest">
                <Award className="h-4 w-4" />
                Latest Updates
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-foreground">Posters & <span className="text-primary">Flyers</span></h2>
              <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">
                Informasi detail tentang layanan dan event mendatang
              </p>
            </div>
            <MediaGalleryDisplay items={posterItems} columns={2} />
          </div>
        </section>
      )}

      {/* SOCIAL MEDIA SECTION - New */}
      {socialEmbeds.length > 0 && (
        <section className="py-24 md:py-32 bg-gradient-to-b from-background to-muted/20 border-y-2 border-border/50">
          <div className="container mx-auto px-4 lg:px-6">
            {/* Section Header */}
            <div className="text-center mb-20 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full text-secondary text-xs font-bold uppercase tracking-widest">
                <Instagram className="h-4 w-4" />
                Social Media
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight">
                Follow Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Journey</span>
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto">
                Update terbaru dari Instagram, TikTok, dan konten sosial media kami
              </p>
            </div>

            {/* Social Embeds Grid */}
            <SocialEmbedsDisplay items={socialEmbeds} columns={3} />
          </div>
        </section>
      )}

      {/* TESTIMONIALS - Enhanced cards */}
      {(content['testimonials'] as any)?.isVisible !== false && (
      <section className="py-24 md:py-32 bg-gradient-to-b from-muted/30 to-background border-t-2 border-border/50">
         <div className="container mx-auto px-4 lg:px-6">
             {/* Section Header */}
             <div className="text-center mb-20 space-y-6">
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase tracking-widest">
                   <Star className="h-4 w-4 fill-primary" />
                   Testimonial
                 </div>
                 <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight">
                   {(content['testimonials'] as any)?.title || "Apa Kata Mereka?"}
                 </h2>
                 <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto">
                   {(content['testimonials'] as any)?.subtitle || "Testimoni jujur dari pelanggan setia NopzGarage"}
                 </p>
             </div>

             {/* Testimonials Grid */}
             <div className={`grid md:grid-cols-${Math.min(testimonialItems.length, 2)} lg:grid-cols-${Math.min(testimonialItems.length, 3)} gap-6 lg:gap-8 max-w-7xl mx-auto`}>
                {testimonialItems.map((item: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="group bg-card border-2 border-border hover:border-primary/40 p-8 lg:p-10 rounded-3xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 flex flex-col h-full"
                    >
                        {/* Stars */}
                        <div className="flex gap-1 mb-6">
                            {[1,2,3,4,5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-5 w-5 transition-all duration-300 ${
                                    star <= (item.rating || 5) 
                                      ? "fill-yellow-400 text-yellow-400 scale-100" 
                                      : "text-muted scale-90"
                                  }`} 
                                />
                            ))}
                        </div>

                        {/* Quote */}
                        <blockquote className="italic text-muted-foreground text-base lg:text-lg mb-8 flex-1 leading-relaxed font-medium">
                          "{item.quote}"
                        </blockquote>

                        {/* Author Info */}
                        <div className="pt-6 border-t-2 border-dashed border-border/50">
                          <div className="font-black text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                            {item.name}
                          </div>
                          <div className="text-sm text-muted-foreground font-semibold mt-1">
                            {item.vehicle}
                          </div>
                        </div>
                    </div>
                ))}
             </div>
         </div>
      </section>
      )}

      {/* Footer - Enhanced with better structure */}
      <footer className="bg-gradient-to-b from-card to-background border-t-2 border-border/50 pt-20 pb-10">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-20">
            
            {/* Brand Column */}
            <div className="space-y-8">
               <div className="flex flex-col items-start gap-3">
                  <Image 
                    src="/logo.svg" 
                    alt="NopzGarage" 
                    width={200} 
                    height={50} 
                    style={{ height: "auto" }}
                    className="h-12 w-auto"
                  />
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium mt-2">
                    {footerConfig.description || "Fokus kami membereskan masalah, bukan menambah masalah baru. Datang, sampaikan keluhannya, biar tim kami yang cari sumber penyakitnya secara detail. Solusi yang kami tawarkan selalu berdasarkan data dan kondisi real motor. Kerja tuntas, transparan, dan bertanggung jawab."}
                  </p>
               </div>

               {/* Social Links */}
               <div className="flex gap-3">
                  {footerConfig.instagram && (
                    <a 
                      href={footerConfig.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="h-12 w-12 bg-muted border-2 border-border rounded-xl flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all duration-300 hover:scale-110"
                    >
                      <span className="sr-only">Instagram</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    </a>
                  )}
                  {footerConfig.whatsapp && (
                    <a 
                      href={footerConfig.whatsapp} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="h-12 w-12 bg-muted border-2 border-border rounded-xl flex items-center justify-center hover:bg-green-500 hover:border-green-500 hover:text-white transition-all duration-300 hover:scale-110"
                    >
                      <span className="sr-only">WhatsApp</span>
                       <Phone className="h-5 w-5" />
                    </a>
                  )}
                  {footerConfig.facebook && (
                    <a 
                      href={footerConfig.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="h-12 w-12 bg-muted border-2 border-border rounded-xl flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-300 hover:scale-110"
                    >
                       <span className="sr-only">Facebook</span>
                       <Share2 className="h-5 w-5" />
                    </a>
                  )}
               </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-black text-xl mb-8 flex items-center gap-3 text-foreground">
                <div className="h-10 w-10 bg-primary/10 border-2 border-primary/20 rounded-xl flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                Quick Links
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link 
                    href="#services" 
                    className="group text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-3 font-semibold text-sm"
                  >
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    Layanan Kami
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/booking" 
                    className="group text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-3 font-semibold text-sm"
                  >
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    Booking Servis
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/status" 
                    className="group text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-3 font-semibold text-sm"
                  >
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    Cek Status Motor
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/employee" 
                    className="group text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-3 font-semibold text-sm"
                  >
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    Login Karyawan
                  </Link>
                </li>
              </ul>
            </div>

            {/* Jam Operasional */}
            <div>
              <h4 className="font-black text-xl mb-8 flex items-center gap-3 text-foreground">
                <div className="h-10 w-10 bg-primary/10 border-2 border-primary/20 rounded-xl flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                Jam Operasional
              </h4>
              <ul className="space-y-5 text-muted-foreground">
                <li className="flex justify-between items-center border-b-2 border-dashed border-border/50 pb-4">
                  <span className="font-semibold text-sm">{general.days?.[0]} - {general.days?.[general.days.length - 1]}</span>
                  <span className="font-black text-foreground text-sm">{general.openTime} - {general.closeTime}</span>
                </li>
                <li className="flex justify-between items-center border-b-2 border-dashed border-border/50 pb-4">
                  <span className="font-semibold text-sm">Minggu</span>
                  <span className="text-destructive font-black text-sm">TUTUP</span>
                </li>
                <li className="text-xs text-muted-foreground/80 leading-relaxed font-medium pt-2">
                  *Libur nasional tutup kecuali ada pemberitahuan khusus di sosial media kami.
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-black text-xl mb-8 flex items-center gap-3 text-foreground">
                <div className="h-10 w-10 bg-primary/10 border-2 border-primary/20 rounded-xl flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                Hubungi Kami
              </h4>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm leading-relaxed font-medium pt-1">
                    {general.address || "Jl. Raya Otomotif No. 88, Jakarta Selatan, Indonesia"}
                  </span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm font-bold">
                    {general.phone || "0812-3456-7890"}
                  </span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm font-semibold">
                    {general.email || "info@nopzgarage.com"}
                  </span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar - Enhanced */}
          <div className="border-t-2 border-border/50 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="text-sm text-muted-foreground text-center md:text-left font-medium">
                 &copy; {new Date().getFullYear()} <span className="font-black text-foreground">NopzGarage</span>. All rights reserved.
             </div>
             <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground font-bold">
                 <Link href="#" className="hover:text-primary transition-colors duration-300">Privacy Policy</Link>
                 <Link href="#" className="hover:text-primary transition-colors duration-300">Terms of Service</Link>
                 <Link href="#" className="hover:text-primary transition-colors duration-300">Sitemap</Link>
                 <Link href="/login" className="hover:text-primary transition-colors duration-300">Admin Login</Link>
             </div>
          </div>
        </div>
      </footer>

    </div>
  );
}