import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleMapsProvider } from "@/components/GoogleMapsProvider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Forum from "./pages/Forum";
import ForumPost from "./pages/ForumPost";
import Feed from "./pages/Feed";
import Events from "./pages/Events";
import Community from "./pages/Community";
import GroupForum from "./pages/GroupForum";
import Marketplace from "./pages/Marketplace";
import FooterPage from "./pages/FooterPage";
import Services from "./pages/Services";
import ServiceManagement from "./pages/ServiceManagement";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import CompanyProfile from "./pages/CompanyProfile";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import MyMarketplace from "./pages/MyMarketplace";
import Banned from "./pages/Banned";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/useAuth";
import { AdminAuthProvider } from "./hooks/useAdminAuth";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { BanCheckWrapper } from "./components/BanCheckWrapper";
import AdminLogin from "./pages/AdminLogin";
import { useDynamicTitle } from "./hooks/useDynamicTitle";
import { useDynamicFavicon } from "./hooks/useDynamicFavicon";

const queryClient = new QueryClient();

const App = () => {
  // Initialize dynamic title and favicon functionality
  useDynamicTitle();
  useDynamicFavicon();
  
  return (
  <QueryClientProvider client={queryClient}>
    <GoogleMapsProvider>
      <TooltipProvider>
        <AuthProvider>
          <AdminAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <BanCheckWrapper>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum/:postId" element={<ForumPost />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/events" element={<Events />} />
              <Route path="/community" element={<Community />} />
              <Route path="/group/:groupId" element={<GroupForum />} />
              <Route path="/marketplace" element={<Marketplace />} />

              <Route path="/services" element={<Services />} />
              <Route path="/service-management" element={<ServiceManagement />} />
              <Route path="/admin" element={<AdminProtectedRoute><Admin /></AdminProtectedRoute>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/company/:companyId" element={<CompanyProfile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/my-marketplace" element={<MyMarketplace />} />
              <Route path="/banned" element={<Banned />} />
              
              {/* Footer Pages Routes */}
              <Route path="/contact" element={<FooterPage />} />
              <Route path="/help" element={<FooterPage />} />
              <Route path="/privacy" element={<FooterPage />} />
              <Route path="/terms" element={<FooterPage />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BanCheckWrapper>
        </BrowserRouter>
        </AdminAuthProvider>
      </AuthProvider>
    </TooltipProvider>
    </GoogleMapsProvider>
  </QueryClientProvider>
  );
};

export default App;
