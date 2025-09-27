import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Home, 
  Package, 
  User, 
  Building2, 
  BarChart3, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  Bell, 
  FileText, 
  Shield, 
  TrendingUp,
  Eye,
  Users,
  Database,
  Heart,
  RefreshCw
} from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'guest' | 'consumer' | 'distillery'>('guest');

  const allPages = [
    {
      category: "Public Pages",
      pages: [
        { name: "Home", path: "/", description: "Landing page with hero section", icon: Home },
        { name: "Marketplace", path: "/marketplace", description: "Browse available casks", icon: Package },
        { name: "Cask Details", path: "/cask/1", description: "Individual cask information and purchase", icon: Eye },
        { name: "Authentication", path: "/auth", description: "Login/signup forms", icon: Shield },
      ]
    },
    {
      category: "User Pages",
      pages: [
        { name: "Profile", path: "/profile", description: "User profile management", icon: User },
        { name: "Portfolio", path: "/portfolio", description: "Investment dashboard and holdings", icon: BarChart3 },
        { name: "Wishlist", path: "/wishlist", description: "Favorite casks and price alerts", icon: Heart },
        { name: "Secondary Market", path: "/secondary-market", description: "Resale marketplace with blockchain transparency", icon: RefreshCw },
        { name: "Transactions", path: "/transactions", description: "Transaction history", icon: CreditCard },
        { name: "Market Insights", path: "/insights", description: "Market analysis and trends", icon: TrendingUp },
        { name: "Reports", path: "/reports", description: "Portfolio reports and compliance", icon: FileText },
        { name: "Notifications", path: "/notifications", description: "User notifications", icon: Bell },
        { name: "Payment Success", path: "/payment-success", description: "Post-purchase confirmation", icon: CreditCard },
      ]
    },
    {
      category: "Distillery Pages",
      pages: [
        { name: "My Distillery", path: "/distillery", description: "Distillery profile and management", icon: Building2 },
        { name: "Manage Casks", path: "/distillery/casks", description: "Cask inventory management", icon: Package },
        { name: "Sales Analytics", path: "/distillery/analytics", description: "Sales performance metrics", icon: BarChart3 },
        { name: "Verification", path: "/distillery/verification", description: "Distillery verification process", icon: Shield },
      ]
    },
    {
      category: "Support Pages",
      pages: [
        { name: "Documentation", path: "/docs", description: "Platform documentation", icon: FileText },
        { name: "Help Center", path: "/help", description: "Support and FAQs", icon: HelpCircle },
        { name: "Settings", path: "/settings", description: "Application settings", icon: Settings },
      ]
    }
  ];

  const userRoles = [
    {
      role: 'guest',
      name: 'Guest User',
      description: 'Unauthenticated visitor',
      access: ['Home', 'Marketplace', 'Cask Details', 'Authentication'],
      color: 'bg-gray-100 text-gray-800'
    },
    {
      role: 'consumer',
      name: 'Consumer/Investor',
      description: 'Authenticated user who can invest in casks',
      access: ['All Public Pages', 'Profile', 'Portfolio', 'Wishlist', 'Secondary Market', 'Transactions', 'Market Insights', 'Reports', 'Notifications'],
      color: 'bg-green-100 text-green-800'
    },
    {
      role: 'distillery',
      name: 'Distillery',
      description: 'Verified distillery that can list casks',
      access: ['All Consumer Access', 'Secondary Market Access', 'My Distillery', 'Manage Casks', 'Sales Analytics', 'Verification'],
      color: 'bg-blue-100 text-blue-800'
    }
  ];

  const databaseTables = [
    { name: "profiles", description: "User profiles and roles", icon: Users },
    { name: "distilleries", description: "Distillery information", icon: Building2 },
    { name: "casks", description: "Cask inventory and details", icon: Package },
    { name: "cask_types", description: "Types of casks available", icon: Database },
    { name: "cask_ownership", description: "User cask ownership records", icon: CreditCard },
    { name: "transactions", description: "Purchase and sale transactions", icon: TrendingUp },
    { name: "fee_structure", description: "Platform fee configuration", icon: Settings },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          <header className="h-16 border-b flex items-center px-6">
            <SidebarTrigger />
            <div className="ml-4">
              <h1 className="text-2xl font-bold">Administrator View</h1>
              <p className="text-sm text-muted-foreground">Preview all pages and features</p>
            </div>
          </header>
          
          <div className="p-6 space-y-6">
            {/* Role Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Role Simulation
                </CardTitle>
                <CardDescription>
                  Select a user role to see what features they have access to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userRoles.map((role) => (
                    <Card 
                      key={role.role}
                      className={`cursor-pointer transition-all ${
                        selectedRole === role.role ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedRole(role.role as any)}
                    >
                      <CardContent className="p-4">
                        <Badge className={role.color}>{role.name}</Badge>
                        <p className="text-sm mt-2 mb-3">{role.description}</p>
                        <div className="text-xs text-muted-foreground">
                          <strong>Access:</strong>
                          <ul className="mt-1 space-y-1">
                            {role.access.map((access, index) => (
                              <li key={index}>• {access}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="pages" className="w-full">
              <TabsList>
                <TabsTrigger value="pages">All Pages</TabsTrigger>
                <TabsTrigger value="database">Database Structure</TabsTrigger>
                <TabsTrigger value="features">Feature Status</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pages" className="space-y-6">
                {allPages.map((category) => (
                  <Card key={category.category}>
                    <CardHeader>
                      <CardTitle>{category.category}</CardTitle>
                      <CardDescription>
                        {category.category === "Public Pages" && "Accessible to all visitors"}
                        {category.category === "User Pages" && "Requires authentication"}
                        {category.category === "Distillery Pages" && "Requires distillery role"}
                        {category.category === "Support Pages" && "Help and configuration"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.pages.map((page) => (
                          <Card key={page.path} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <page.icon className="h-4 w-4" />
                                <span className="font-medium">{page.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {page.description}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(page.path)}
                                  className="flex-1"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(page.path, '_blank')}
                                >
                                  ↗
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="database" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Database Tables Overview
                    </CardTitle>
                    <CardDescription>
                      Current database structure and table relationships
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {databaseTables.map((table) => (
                        <Card key={table.name}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <table.icon className="h-4 w-4" />
                              <span className="font-medium font-mono">{table.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {table.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">✅ Implemented Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <p>• User Authentication & Profile Management</p>
                        <p>• Cask Marketplace with Search & Filtering</p>
                        <p>• Individual Cask Detail Pages</p>
                        <p>• Stripe Payment Integration</p>
                        <p>• Portfolio Dashboard with ROI Tracking</p>
                        <p>• Transaction History</p>
                        <p>• Role-based Access Control</p>
                        <p>• Responsive Design with Sidebar Navigation</p>
                        <p>• Database with RLS Policies</p>
                        <p>• Blockchain Integration (UI Ready)</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-amber-600">🚧 Pending Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <p>• Distillery Management Panel</p>
                        <p>• Secondary Market Trading</p>
                        <p>• Advanced Analytics Dashboard</p>
                        <p>• Notification System</p>
                        <p>• Document Management</p>
                        <p>• Help Center & Support</p>
                        <p>• Admin Panel for Platform Management</p>
                        <p>• Email Notifications</p>
                        <p>• KYC/Verification Process</p>
                        <p>• Mobile App Optimization</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Development Actions</CardTitle>
                <CardDescription>Common development and testing shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/marketplace')}
                    className="h-20 flex flex-col gap-2"
                  >
                    <Package className="h-5 w-5" />
                    Test Marketplace
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/portfolio')}
                    className="h-20 flex flex-col gap-2"
                  >
                    <BarChart3 className="h-5 w-5" />
                    View Portfolio
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/auth')}
                    className="h-20 flex flex-col gap-2"
                  >
                    <Shield className="h-5 w-5" />
                    Test Auth
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://supabase.com/dashboard/project/vnmmjmxhtbplfkdughxu', '_blank')}
                    className="h-20 flex flex-col gap-2"
                  >
                    <Database className="h-5 w-5" />
                    Supabase DB
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;