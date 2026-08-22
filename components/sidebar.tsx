'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Film,
  Brain,
  Sparkles,
  User,
  HelpCircle,
  MessageSquare,
  Settings,
  Zap,
  Menu,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { useApp } from '@/lib/context';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Reel Activity', href: '/reel-activity', icon: Film },
  { label: 'AI Analysis', href: '/ai-analysis', icon: Brain },
  { label: 'Recommendations', href: '/recommendations', icon: Sparkles },
  { label: 'Interest Profile', href: '/interest-profile', icon: User },
  { label: 'Explainable AI', href: '/explainable-ai', icon: HelpCircle },
  { label: 'Feedback', href: '/feedback', icon: MessageSquare },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className={cn('h-4 w-4', active && 'text-primary')} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { user, isDemoMode, signOut } = useAuth();

  const displayName = user?.email?.split('@')[0] || 'Demo User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const role = isDemoMode ? 'Demo Mode' : 'Student';

  return (
    <div className="border-t border-sidebar-border p-4 space-y-3">
      {isDemoMode && (
        <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2">
          <Zap className="h-4 w-4 text-warning" />
          <span className="text-xs font-semibold text-warning">DEMO MODE</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">Active</Badge>
        </div>
      )}
      <div className="flex items-center gap-3 rounded-lg px-3 py-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center text-primary-foreground text-xs font-bold">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        {(user || isDemoMode) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function SidebarHeader() {
  return (
    <div className="flex items-center gap-2.5 px-6 py-5 border-b border-sidebar-border">
      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center shadow-md">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-base font-bold tracking-tight">TechReel AI</h1>
        <p className="text-[11px] text-muted-foreground">Intelligent Reel Agent</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          <NavContent />
        </div>
        <SidebarFooter />
      </aside>

      {/* Mobile Header + Sheet */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-sm font-bold">TechReel AI</h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-col h-full">
                <SidebarHeader />
                <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
                  <NavContent onNavigate={() => setOpen(false)} />
                </div>
                <SidebarFooter />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
