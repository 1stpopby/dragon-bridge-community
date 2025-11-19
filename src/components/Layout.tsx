import { ReactNode } from "react";
import Navigation from "./Navigation";
import MobileNavigation from "./MobileNavigation";
import Footer from "./Footer";
import PWAInstallPrompt from "./PWAInstallPrompt";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

const Layout = ({ children, showFooter = true }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
      <MobileNavigation />
      <PWAInstallPrompt />
    </div>
  );
};

export default Layout;