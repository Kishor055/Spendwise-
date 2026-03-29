"use client";

import { useAuth } from '@/context/auth-context';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, Bell, Shield, HelpCircle, ChevronRight, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: Settings, label: 'Settings', color: 'text-primary bg-primary/10' },
    { icon: Bell, label: 'Notifications', color: 'text-accent bg-accent/10' },
    { icon: Shield, label: 'Privacy & Security', color: 'text-[#43A047] bg-[#43A047]/10' },
    { icon: HelpCircle, label: 'Help & Support', color: 'text-muted-foreground bg-muted' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-6 pt-10 pb-8 flex flex-col items-center gap-4">
        <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
          <AvatarImage src={user?.photoURL || ''} />
          <AvatarFallback className="bg-primary text-white text-3xl font-bold">
            {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{user?.displayName || 'Spendwise User'}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </header>

      <main className="px-6 space-y-6 max-w-4xl mx-auto">
        <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl">
          <CardHeader className="bg-primary text-white p-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Account Level
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-xl">Spendwise Free</p>
                <p className="text-sm text-muted-foreground">Standard features enabled</p>
              </div>
              <Button size="sm" className="rounded-full bg-accent hover:bg-accent/90">Upgrade</Button>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.label}
              className="w-full flex items-center justify-between p-4 glass-card rounded-2xl hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.color)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="font-semibold">{item.label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </section>

        <Button 
          variant="destructive" 
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-destructive/20"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Log Out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}