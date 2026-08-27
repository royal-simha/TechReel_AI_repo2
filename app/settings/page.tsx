'use client';

import { PageContainer, PageHeader } from '@/components/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { User, Mail, Shield, Zap, LogOut, RotateCcw } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function SettingsPage() {
  const { user, isDemoMode, signOut } = useAuth();
  const { resetInteractions, loadDemo } = useApp();

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        subtitle="Manage your account and application preferences."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Account */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Account
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user?.email || 'demo@techreel.ai'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{isDemoMode ? 'Demo Mode' : 'Authenticated'}</span>
              {isDemoMode && (
                <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
                  No account
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isDemoMode ? 'Exit Demo Mode' : 'Sign Out'}
            </Button>
          </CardContent>
        </Card>

        {/* Demo Controls */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              Demo Controls
            </CardTitle>
            <CardDescription>Manage demo data and interactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Load the hackathon demo scenario or reset all interactions to test the cold start flow.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={loadDemo}>
                <Zap className="h-4 w-4 mr-2 text-warning" />
                Load Hackathon Demo
              </Button>
              <Button variant="outline" size="sm" onClick={resetInteractions}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Interactions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
