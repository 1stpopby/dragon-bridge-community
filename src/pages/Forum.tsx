import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Plus, Search, TrendingUp, Clock, Users } from "lucide-react";

const Forum = () => {
  const categories = [
    { name: "General Discussion", posts: 1250, color: "bg-blue-100 text-blue-800" },
    { name: "Food & Dining", posts: 890, color: "bg-orange-100 text-orange-800" },
    { name: "Healthcare", posts: 654, color: "bg-green-100 text-green-800" },
    { name: "Education", posts: 543, color: "bg-purple-100 text-purple-800" },
    { name: "Housing", posts: 432, color: "bg-yellow-100 text-yellow-800" },
    { name: "Jobs & Careers", posts: 321, color: "bg-pink-100 text-pink-800" }
  ];

  const recentPosts = [
    {
      title: "Best Chinese restaurants in Manchester city center?",
      author: "Li Wei",
      category: "Food & Dining",
      replies: 24,
      time: "2 hours ago",
      trending: true
    },
    {
      title: "NHS GP registration - what documents do I need?",
      author: "Chen Ming",
      category: "Healthcare",
      replies: 18,
      time: "4 hours ago",
      trending: false
    },
    {
      title: "University of Edinburgh Chinese student association",
      author: "Wang Xiao",
      category: "Education",
      replies: 33,
      time: "6 hours ago",
      trending: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Community Forum
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with fellow Chinese residents, ask questions, share experiences, 
              and help build our supportive community across the UK.
            </p>
          </div>
          
          {/* Search and New Post */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search discussions..." 
                className="pl-10"
              />
            </div>
            <Button size="default" className="sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Recent Discussions</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Latest</Button>
                <Button variant="ghost" size="sm">Trending</Button>
                <Button variant="ghost" size="sm">Unanswered</Button>
              </div>
            </div>

            <div className="space-y-4">
              {recentPosts.map((post, index) => (
                <Card key={index} className="border-border hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold line-clamp-2 flex-1 mr-4">
                        {post.title}
                      </h3>
                      {post.trending && (
                        <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {post.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">by {post.author}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.replies} replies</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{post.time}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                    <div>
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-muted-foreground">{category.posts} posts</div>
                    </div>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Members</span>
                  <span className="font-semibold">15,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Posts Today</span>
                  <span className="font-semibold">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Online Now</span>
                  <span className="font-semibold">1,043</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Forum;