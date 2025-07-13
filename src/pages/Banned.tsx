import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ban, Clock, Shield, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBanCheck } from "@/hooks/useBanCheck";
import { Navigate } from "react-router-dom";

export default function Banned() {
  const { signOut } = useAuth();
  const { isBanned, banInfo, loading, recheckBanStatus } = useBanCheck();
  const [checking, setChecking] = useState(false);

  // If not banned, redirect to home
  if (!loading && !isBanned) {
    return <Navigate to="/" replace />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleRecheck = async () => {
    setChecking(true);
    await recheckBanStatus();
    setChecking(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isTemporary = banInfo?.ban_type === 'temporary';
  const expiresAt = banInfo?.expires_at ? new Date(banInfo.expires_at) : null;
  const isExpired = expiresAt && expiresAt <= new Date();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking account status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <Ban className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">Account Suspended</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            Your account has been suspended and you cannot access the platform at this time.
          </p>

          {banInfo && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-left space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Reason</h4>
                  <p className="text-sm">{banInfo.reason}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Ban Type</h4>
                    <Badge variant={isTemporary ? "secondary" : "destructive"}>
                      {banInfo.ban_type}
                    </Badge>
                  </div>
                  
                  {isTemporary && expiresAt && (
                    <div className="text-right">
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">
                        {isExpired ? "Expired" : "Expires"}
                      </h4>
                      <div className="flex items-center text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(banInfo.expires_at)}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Banned On</h4>
                  <p className="text-sm">{formatDate(banInfo.banned_at)}</p>
                </div>
              </div>

              {isTemporary && !isExpired && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Temporary Suspension
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-200">
                        Your access will be restored automatically when the ban expires.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {isTemporary && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleRecheck}
                disabled={checking}
              >
                {checking ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {checking ? "Checking..." : "Check Status"}
              </Button>
            )}
            
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            If you believe this is an error, please contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}