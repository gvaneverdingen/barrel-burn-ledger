import { useState } from "react"
import { Home, Package, User, Building2, BarChart3, CreditCard, Settings, HelpCircle, Bell, FileText, Shield, TrendingUp, Users, Database, Link, Route } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import arigiLogo from '@/assets/arigi-logo.png'

const publicItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Consumer Journey", url: "/consumer-journey", icon: Route },
  { title: "Marketplace", url: "/marketplace", icon: Package },
]

const adminItems = [
  { title: "Admin View", url: "/admin", icon: Users },
  { title: "Test Data", url: "/test-data", icon: Database },
  { title: "Blockchain Testing", url: "/blockchain-testing", icon: Link },
]

const consumerItems = [
  { title: "Portfolio", url: "/portfolio", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
]

const userItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Portfolio", url: "/portfolio", icon: BarChart3 },
  { title: "Transactions", url: "/transactions", icon: CreditCard },
  { title: "Market Insights", url: "/insights", icon: TrendingUp },
  { title: "Notifications", url: "/notifications", icon: Bell },
]

const distilleryItems = [
  { title: "My Distillery", url: "/distillery", icon: Building2 },
  { title: "Manage Casks", url: "/distillery/casks", icon: Package },
  { title: "Sales Analytics", url: "/distillery/analytics", icon: BarChart3 },
  { title: "Verification", url: "/distillery/verification", icon: Shield },
]

const supportItems = [
  { title: "Documentation", url: "/docs", icon: FileText },
  { title: "Help Center", url: "/help", icon: HelpCircle },
  { title: "Settings", url: "/settings", icon: Settings },
]

const consumerSupportItems = [
  { title: "Help Center", url: "/help", icon: HelpCircle },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  const { user, userRole } = useAuth()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  
  // Role-based navigation logic
  const isConsumer = userRole === 'consumer'
  const isAdmin = userRole === 'administrator'
  const isDistillery = userRole === 'distillery'
  
  // Determine which items to show based on role
  const getPublicItems = () => {
    if (isConsumer) {
      return publicItems // Consumer sees basic public items
    }
    if (isAdmin) {
      return [...publicItems, ...adminItems] // Admin sees everything
    }
    return publicItems // Others see basic public items
  }
  
  const getUserItems = () => {
    if (isConsumer) {
      return consumerItems // Consumer sees only portfolio and profile
    }
    return userItems // Others see full user items
  }
  
  const getSupportItems = () => {
    if (isConsumer) {
      return consumerSupportItems // Consumer sees limited support
    }
    return supportItems // Others see full support
  }
  
  const currentPublicItems = getPublicItems()
  const currentUserItems = getUserItems()
  const currentSupportItems = getSupportItems()
  
  const isPublicExpanded = currentPublicItems.some((i) => isActive(i.url))
  const isUserExpanded = user && currentUserItems.some((i) => isActive(i.url))
  const isDistilleryExpanded = user && isDistillery && distilleryItems.some((i) => isActive(i.url))
  const isSupportExpanded = currentSupportItems.some((i) => isActive(i.url))
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"

  return (
    <Sidebar collapsible="icon">
      {/* Logo and trigger */}
      <div className="p-2 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2 px-2">
            <img src={arigiLogo} alt="ARIGI" className="h-8 w-8" />
            <span className="font-bold text-lg">ARIGI</span>
          </div>
        )}
        <SidebarTrigger className={collapsed ? "mx-auto" : "ml-auto"} />
      </div>

      <SidebarContent>
        {/* Public Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {currentPublicItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Navigation - Show based on role */}
        {(user && !isConsumer) || (user && isConsumer) ? (
          <SidebarGroup>
            <SidebarGroupLabel>{isConsumer ? "My Account" : "Account"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {currentUserItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {/* Distillery Navigation - Only show for distilleries and admins */}
        {((user && isDistillery) || (user && isAdmin)) && (
          <SidebarGroup>
            <SidebarGroupLabel>Distillery</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {distilleryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Support & Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {currentSupportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}