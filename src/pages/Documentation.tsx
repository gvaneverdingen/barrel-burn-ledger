import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BookOpen, Video, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Documentation = () => {
  const { user } = useAuth();

  const docSections = [
    {
      title: "Getting Started",
      icon: BookOpen,
      items: [
        { name: "Platform Overview", type: "guide", url: "#" },
        { name: "Account Setup", type: "guide", url: "#" },
        { name: "First Purchase Guide", type: "guide", url: "#" },
        { name: "Understanding Cask Investment", type: "guide", url: "#" },
      ]
    },
    {
      title: "Investment Guides",
      icon: FileText,
      items: [
        { name: "Cask Valuation Methods", type: "pdf", url: "#" },
        { name: "Risk Assessment Framework", type: "pdf", url: "#" },
        { name: "Market Analysis Reports", type: "pdf", url: "#" },
        { name: "Legal & Regulatory Guide", type: "pdf", url: "#" },
      ]
    },
    {
      title: "Video Tutorials",
      icon: Video,
      items: [
        { name: "Platform Navigation", type: "video", url: "#" },
        { name: "Making Your First Purchase", type: "video", url: "#" },
        { name: "Portfolio Management", type: "video", url: "#" },
        { name: "Understanding Market Trends", type: "video", url: "#" },
      ]
    }
  ];

  const getItemIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <Download className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Documentation</h1>
          </div>
        </header>
        
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Knowledge Center</h2>
            <p className="text-muted-foreground">
              Everything you need to know about whisky cask investment and using our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {docSections.map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <section.icon className="h-5 w-5" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {section.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getItemIcon(item.type)}
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Terms of Service
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Privacy Policy
              </Button>
              <Button variant="outline" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Investment Guide PDF
              </Button>
              <Button variant="outline" className="justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Regulatory Information
              </Button>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Documentation;