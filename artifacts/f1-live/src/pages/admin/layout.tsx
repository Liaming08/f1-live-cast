import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { ShieldAlert, LogOut, ChevronRight, Activity, Calendar, Users, Type, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (localStorage.getItem("f1admin_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "f1admin") {
      localStorage.setItem("f1admin_auth", "true");
      setIsAuthenticated(true);
    } else {
      alert("Invalid password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("f1admin_auth");
    setIsAuthenticated(false);
    setLocation("/");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground">
        <form onSubmit={handleLogin} className="w-full max-w-sm p-8 bg-card border border-border/50 rounded-lg shadow-xl text-center space-y-6">
          <ShieldAlert className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold uppercase tracking-widest">Admin Access</h1>
          <input
            type="password"
            placeholder="Enter password"
            className="w-full bg-input border border-border/50 rounded p-3 text-center tracking-widest outline-none focus:border-primary transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-primary text-primary-foreground font-bold tracking-widest uppercase p-3 rounded hover:bg-primary/90 transition-colors">
            Access System
          </button>
        </form>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: Activity, exact: true },
    { href: "/admin/races", label: "Races", icon: Calendar },
    { href: "/admin/teams", label: "Teams", icon: ShieldAlert },
    { href: "/admin/drivers", label: "Drivers", icon: Users },
    { href: "/admin/commentary", label: "Commentary", icon: Type },
    { href: "/admin/race-control", label: "Race Control", icon: Flag },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4">
          <div className="flex items-center space-x-2 mr-6 text-primary">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold tracking-widest text-sm uppercase">Race Control Admin</span>
          </div>
          
          <nav className="flex items-center space-x-1 overflow-x-auto">
            {navItems.map(item => {
              const active = item.exact ? location === item.href : location.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors",
                  active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white hover:bg-secondary"
                )}>
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              Live App <ChevronRight className="w-3 h-3" />
            </Link>
            <button onClick={handleLogout} className="text-xs text-destructive flex items-center gap-1 hover:text-destructive/80 transition-colors">
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
