import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Calendar, Trophy, Users, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Live Timing", icon: Activity },
    { href: "/races", label: "Calendar", icon: Calendar },
    { href: "/standings", label: "Standings", icon: Trophy },
    { href: "/drivers", label: "Drivers", icon: Users },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0a0a0a] text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/70 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="container flex h-13 max-w-screen-2xl items-center px-4 gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 rounded flex items-center justify-center font-black text-white tracking-tighter italic text-sm bg-[#E8002D]">
              F1
            </div>
            <span className="font-black tracking-tight text-base uppercase italic hidden sm:inline-block text-white">
              TELECRONACA
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-zinc-800",
                    isActive
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8002D] animate-pulse" />
              <span className="font-mono uppercase tracking-widest">OpenF1 Live</span>
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
            >
              <ShieldAlert className="w-3 h-3" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-screen-2xl mx-auto p-4 md:p-6">
        {children}
      </main>

      <footer className="border-t border-zinc-900 py-3 px-6 text-[10px] text-zinc-700 text-center uppercase tracking-widest font-mono">
        F1 Live Telecronaca · Powered by OpenF1 API · Not affiliated with Formula 1
      </footer>
    </div>
  );
}
