import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) return;

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (!isMobile) return;

    // Show prompt after 3 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);

    // Handle beforeinstallprompt for Android/Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
      localStorage.setItem("pwa-prompt-dismissed", "true");
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-md">
      <Card className="p-4 shadow-lg border-primary/20 bg-background">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-sm">Instalează aplicația RoEu</h3>
            {isIOS ? (
              <p className="text-xs text-muted-foreground">
                Pentru a instala aplicația pe iPhone:
                <br />
                1. Apasă butonul <Share className="inline h-3 w-3" /> Share
                <br />
                2. Selectează "Add to Home Screen"
                <br />
                3. Confirmă instalarea
              </p>
            ) : deferredPrompt ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Instalează aplicația pentru o experiență mai bună și acces rapid!
                </p>
                <Button 
                  onClick={handleInstall}
                  size="sm"
                  className="w-full"
                >
                  Instalează acum
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Pentru a instala aplicația:
                <br />
                1. Deschide meniul browserului
                <br />
                2. Selectează "Add to Home Screen"
                <br />
                3. Confirmă instalarea
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
