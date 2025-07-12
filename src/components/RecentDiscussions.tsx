import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, TrendingUp } from "lucide-react";

const RecentDiscussions = () => {
  const discussions = [
    {
      title: "Best Chinese restaurants in Manchester?",
      category: "Food & Dining",
      replies: 24,
      time: "2 hours ago",
      trending: true
    },
    {
      title: "NHS GP registration process help needed",
      category: "Healthcare",
      replies: 18,
      time: "4 hours ago",
      trending: false
    },
    {
      title: "Chinese New Year celebration plans London 2024",
      category: "Events",
      replies: 45,
      time: "6 hours ago",
      trending: true
    },
    {
      title: "University application advice for international students",
      category: "Education",
      replies: 33,
      time: "8 hours ago",
      trending: false
    },
    {
      title: "Finding accommodation in Birmingham - tips?",
      category: "Housing",
      replies: 29,
      time: "12 hours ago",
      trending: false
    }
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Food & Dining": "bg-orange-100 text-orange-800",
      "Healthcare": "bg-green-100 text-green-800",
      "Events": "bg-purple-100 text-purple-800",
      "Education": "bg-blue-100 text-blue-800",
      "Housing": "bg-yellow-100 text-yellow-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Recent Discussions
            </h2>
            <p className="text-lg text-muted-foreground">
              Join the conversation and get help from our community
            </p>
          </div>
          <Button variant="outline">
            View All Discussions
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {discussions.map((discussion, index) => (
            <Card key={index} className="border-border hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold line-clamp-2 flex-1 mr-2">
                    {discussion.title}
                  </CardTitle>
                  {discussion.trending && (
                    <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <Badge 
                  variant="secondary" 
                  className={`w-fit ${getCategoryColor(discussion.category)}`}
                >
                  {discussion.category}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{discussion.replies} replies</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{discussion.time}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentDiscussions;