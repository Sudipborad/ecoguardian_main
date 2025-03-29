import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from './SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

const Navbar: React.FC = () => {
  const { toggle } = useSidebar();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      // Role-specific dashboards
      case '/admin':
        return 'Admin Dashboard';
      case '/officer-dashboard':
        return 'Officer Dashboard';
      case '/user-dashboard':
        return 'User Dashboard';
      
      // Common routes
      case '/complaints':
        return 'Complaints';
      case '/new-complaint':
        return 'New Complaint';
      case '/profile':
        return 'Profile';
      case '/settings':
        return 'Settings';
      
      // Admin specific routes
      case '/officers':
        return 'Officers Management';
      case '/users':
        return 'Users Management';
      
      // Officer specific routes
      case '/schedule':
        return 'Schedule';
      case '/recyclable-requests':
        return 'Recyclable Requests';
      
      // User specific routes
      case '/recyclable-item':
        return 'Recycle Items';
      
      default:
        return 'Eco Guardian';
    }
  };

  const handleLogout = () => {
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    // In a real application, you would handle actual logout logic here
  };

  return (
    <header className="h-16 border-b bg-background/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggle} className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-auto">
                <div className="flex flex-col gap-2 p-2">
                  <div className="flex items-start gap-2 rounded-md p-2 hover:bg-muted">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Complaint resolved</p>
                      <p className="text-xs text-muted-foreground">Your complaint #1234 has been resolved.</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-md p-2 hover:bg-muted">
                    <div className="flex-1">
                      <p className="text-sm font-medium">New assignment</p>
                      <p className="text-xs text-muted-foreground">You have been assigned to a new complaint.</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-md p-2 hover:bg-muted">
                    <div className="flex-1">
                      <p className="text-sm font-medium">System update</p>
                      <p className="text-xs text-muted-foreground">The system will be updated tomorrow at 2:00 AM.</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
