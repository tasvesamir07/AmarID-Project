"use client";

import { useEffect, useState, createElement } from "react";
import {
  Moon,
  Sun,
  Shield,
  LayoutDashboard,
  CreditCard,
  Activity,
  Clock,
  ArrowRight,
  Menu,
  X,
  ShoppingBag,
  User,
  LogOut,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const [dark, setDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { identityId, universalId, logout } = useAuth();
  const isLoggedIn = !!identityId || !!universalId;

  useEffect(() => {
    const isDark =
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
  };

  // Only show citizen account nav items if logged in!
  const authenticatedNavItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/consent", icon: Shield, label: "Consent" },
    { href: "/activity", icon: Activity, label: "Activity" },
    { href: "/proof-of-life", icon: Clock, label: "Proof of Life" },
    { href: "/bazar", icon: ShoppingBag, label: "Bazar Demo" },
  ];

  // Public items when logged out
  const publicNavItems = [
    { href: "/", icon: Shield, label: "About AmarID" },
    { href: "/bazar", icon: ShoppingBag, label: "Bazar Demo RP" },
  ];

  const navItems = isLoggedIn ? authenticatedNavItems : publicNavItems;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Sovereign Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white fill-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-foreground flex items-center gap-0.5">
              Amar<span className="text-primary">ID</span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent ml-0.5 inline-block" />
            </span>
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase -mt-1 hidden sm:inline">
              Sovereign Identity
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/60">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                {createElement(item.icon, { className: "h-4 w-4" })}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Theme + Auth Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2.5 rounded-xl border border-border/60 bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all shadow-sm"
          >
            {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex border-border/80 shadow-sm">
                <Link href="/id" className="flex items-center gap-1.5 font-medium">
                  <User className="h-4 w-4 text-primary" />
                  <span>My Profile</span>
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => logout()}
                className="hidden sm:inline-flex text-muted-foreground hover:text-destructive gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="border-border/80 hover:bg-secondary">
                <Link href="/login" className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary" />
                  <span>Sign In</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex shadow-sm">
                <Link href="/onboarding" className="flex items-center gap-1.5 font-medium">
                  <UserPlus className="h-4 w-4" />
                  <span>Get Universal ID</span>
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-border/60 bg-card text-muted-foreground hover:text-foreground"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-fadeIn">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {createElement(item.icon, { className: "h-4 w-4" })}
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-border space-y-2">
            {isLoggedIn ? (
              <Button
                variant="outline"
                className="w-full text-destructive"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/onboarding" onClick={() => setMobileMenuOpen(false)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Get Universal ID
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
