import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Calendar, Trophy, Users, ShieldAlert } from "lucide-react";
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
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4">
          <div className="mr-8 flex items-center space-x-2">
            <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center font-bold text-white tracking-tighter italic">
              F1
            </div>
            <span className="font-bold tracking-tight text-lg uppercase italic hidden sm:inline-block text-white">
              Live Telecronaca
            </span>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center space-x-4">
             <Link href="/admin" className="text-xs text-muted-foreground hover:text-white flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Admin
             </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
