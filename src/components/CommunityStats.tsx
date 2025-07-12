import { Card, CardContent } from "@/components/ui/card";

const CommunityStats = () => {
  const stats = [
    { number: "15,000+", label: "Community Members" },
    { number: "50+", label: "Cities Covered" },
    { number: "200+", label: "Monthly Events" },
    { number: "5+", label: "Years Strong" }
  ];

  return (
    <div className="bg-muted/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Growing Together Across the UK
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our community spans from London to Edinburgh, creating connections and 
            opportunities for Chinese residents throughout the United Kingdom.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-border">
              <CardContent className="p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityStats;