import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Notifications = () => {
  const { user } = useAuth();

  const notifications = [
    {
      id: 1,
      type: "info",
      title: "Portfolio Update",
      message: "Your Highland Single Malt cask has increased in value by 3.2%",
      time: "2 hours ago",
      read: false,
      icon: CheckCircle,
    },
    {
      id: 2,
      type: "warning",
      title: "Payment Reminder",
      message: "Your next quarterly storage fee is due in 5 days",
      time: "1 day ago",
      read: false,
      icon: AlertCircle,
    },
    {
      id: 3,
      type: "success",
      title: "Transaction Complete",
      message: "Successfully purchased Speyside Single Malt - Cask #SM2024",
      time: "3 days ago",
      read: true,
      icon: CheckCircle,
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Notifications</h1>
          </div>
        </header>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
            <Badge variant="secondary">
              {notifications.filter(n => !n.read).length} unread
            </Badge>
          </div>

          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className={`${!notification.read ? 'border-primary/50 bg-primary/5' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <notification.icon className={`h-5 w-5 ${
                        notification.type === 'success' ? 'text-green-500' :
                        notification.type === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                      <div>
                        <CardTitle className="text-base">{notification.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{notification.time}</span>
                        </div>
                      </div>
                    </div>
                    {!notification.read && (
                      <Badge variant="default" className="text-xs">New</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {notifications.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-sm text-muted-foreground text-center">
                  You're all caught up! New notifications will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Notifications;