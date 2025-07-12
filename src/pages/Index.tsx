import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import CommunityStats from "@/components/CommunityStats";
import RecentDiscussions from "@/components/RecentDiscussions";
import UpcomingEvents from "@/components/UpcomingEvents";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <CommunityStats />
      <RecentDiscussions />
      <UpcomingEvents />
      <Footer />
    </div>
  );
};

export default Index;
