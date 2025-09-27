import { useState } from "react"
import { Home, Package, User, Building2, BarChart3, CreditCard, Settings, HelpCircle, Bell, FileText, Shield, TrendingUp, Users, Database, Link, Route, Heart } from "lucide-react"
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
} from "@/components/ui/sidebar"
import arigiLogo from '@/assets/arigi-logo.png'

const publicItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "My Profile", url: "/consumer-journey", icon: Route },
  { title: "Marketplace", url: "/marketplace", icon: Package },
  { title: "Wishlist", url: "/wishlist", icon: Heart },
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
  { title: "Reports", url: "/reports", icon: FileText },
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
  const [isExpanded, setIsExpanded] = useState(false)
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
    <div 
      className={`fixed left-0 top-0 h-full heritage-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out z-50 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="p-2 border-b border-sidebar-border h-16 flex items-center">
        <div className="flex items-center space-x-2 px-2 overflow-hidden">
          <img src={arigiLogo} alt="ARIGI" className="h-8 w-8 flex-shrink-0" />
          <span 
            className={`font-bold text-lg whitespace-nowrap transition-all duration-300 font-playfair heritage-text-gradient ${
              isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}
          >
            ARIGI
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {/* Public Navigation */}
        <div className="px-2 mb-6">
          <div 
            className={`text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-3 px-2 transition-all duration-300 font-inter ${
              isExpanded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Navigation
          </div>
          <div className="space-y-1">
            {currentPublicItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end
                className={({ isActive }) =>
                  `flex items-center px-2 py-2 rounded-lg transition-all duration-200 font-inter ${
                    isActive
                      ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium border-l-2 border-sidebar-primary shadow-gold'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span 
                  className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                    isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                >
                  {item.title}
                </span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* User Navigation - Show based on role */}
        {(user && !isConsumer) || (user && isConsumer) ? (
          <div className="px-2 mb-6">
            <div 
              className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2 transition-all duration-300 ${
                isExpanded ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {isConsumer ? "My Account" : "Account"}
            </div>
            <div className="space-y-1">
              {currentUserItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span 
                    className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                      isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    }`}
                  >
                    {item.title}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}

        {/* Distillery Navigation - Only show for distilleries and admins */}
        {((user && isDistillery) || (user && isAdmin)) && (
          <div className="px-2 mb-6">
            <div 
              className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2 transition-all duration-300 ${
                isExpanded ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Distillery
            </div>
            <div className="space-y-1">
              {distilleryItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span 
                    className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                      isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    }`}
                  >
                    {item.title}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Support & Settings */}
        <div className="px-2">
          <div 
            className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2 transition-all duration-300 ${
              isExpanded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Support
          </div>
          <div className="space-y-1">
            {currentSupportItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center px-2 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span 
                  className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                    isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                >
                  {item.title}
                </span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}