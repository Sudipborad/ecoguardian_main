import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertTriangle,
  FileImage,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/lib/AuthContext';

const ComplaintsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { fetchData } = useSupabase();
  const { userId, userRole } = useAuth();

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        let complaintsData;
        
        // Filter complaints based on user role
        if (userRole === 'admin') {
          // Admins can see all complaints
          complaintsData = await fetchData('complaints');
        } else if (userRole === 'officer') {
          // Officers see:
          // 1. Complaints assigned to them
          // 2. Unassigned complaints in their area
          // 3. All complaints in their area
          const allComplaints = await fetchData('complaints');
          const officerData = await fetchData('users', {
            filter: { clerk_id: userId },
            single: true
          });
          
          let officerArea = 'unassigned';
          
          // Determine officer area
          if (officerData && officerData.area) {
            officerArea = officerData.area.toLowerCase();
          } else if (userId === 'officer1') {
            officerArea = 'bopal';
          } else if (userId === 'officer2') {
            officerArea = 'south bopal';
          }
          
          console.log(`Filtering complaints for officer ${userId} with area: ${officerArea}`);
          
          // Filter complaints based on area and assignment
          complaintsData = allComplaints.filter(c => {
            const isAssignedToMe = c.assigned_to === userId;
            
            // Check if complaint is in officer's area (case insensitive matching)
            const complaintArea = (c.area || '').toLowerCase();
            const isInMyArea = officerArea === 'bopal' ? 
              (complaintArea === 'bopal' || (complaintArea.includes('bopal') && !complaintArea.includes('south'))) :
              officerArea === 'south bopal' ?
              (complaintArea === 'south bopal' || (complaintArea.includes('south') && complaintArea.includes('bopal'))) :
              false;
            
            const isUnassigned = !c.assigned_to;
            
            return isAssignedToMe || (isInMyArea) || isUnassigned;
          });
          
          console.log(`Found ${complaintsData.length} complaints for officer to display`);
        } else {
          // Regular users only see their own complaints
          complaintsData = await fetchData('complaints', {
            filter: { user_id: userId }
          });
        }
        
        // Get submitter data for each complaint
        const users = await fetchData('users');
        
        // Format the complaints data
        const formattedComplaints = complaintsData.map(complaint => {
          const submitter = users.find(u => u.clerk_id === complaint.user_id);
          const assignedOfficer = users.find(u => u.clerk_id === complaint.assigned_to);
          
          return {
            id: complaint.id,
            title: complaint.title,
            description: complaint.description,
            location: complaint.location || 'Location not specified',
            coordinates: complaint.coordinates || null,
            status: complaint.status || 'pending',
            date: complaint.created_at,
            time: new Date(complaint.created_at).toLocaleTimeString(),
            priority: complaint.priority || 'medium',
      reporter: {
              name: submitter ? `${submitter.first_name} ${submitter.last_name}` : 'Unknown User',
              contact: submitter?.email || 'No contact information'
            },
            assignedTo: assignedOfficer ? `${assignedOfficer.first_name} ${assignedOfficer.last_name}` : null,
            hasImage: !!complaint.image_url,
            imageUrl: complaint.image_url || null,
            resolution: complaint.resolution_notes ? {
              date: complaint.resolved_at,
              officer: users.find(u => u.clerk_id === complaint.resolved_by)?.first_name || 'Unknown',
              notes: complaint.resolution_notes
            } : null
          };
        });
        
        setComplaints(formattedComplaints);
      } catch (error) {
        console.error('Error loading complaints:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userRole]); // Remove fetchData from dependencies

  // Filter complaints based on search term and filters
  const filteredComplaints = complaints.filter(complaint => {
    // Filter by search term
    const matchesSearch = 
      !searchTerm || 
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(complaint.status);
    
    // Filter by priority
    const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(complaint.priority);
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Status color mapping
  const statusColors = {
    pending: { color: 'text-amber-500', bg: 'bg-amber-50' },
    assigned: { color: 'text-blue-500', bg: 'bg-blue-50' },
    inProgress: { color: 'text-purple-500', bg: 'bg-purple-50' },
    resolved: { color: 'text-green-500', bg: 'bg-green-50' }
  };

  // Priority color mapping
  const priorityColors = {
    low: 'bg-green-500',
    medium: 'bg-blue-500',
    high: 'bg-amber-500',
    critical: 'bg-red-500'
  };

  // Toggle complaint expansion
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Complaints</h1>
          <Button asChild>
            <Link to="/new-complaint">Submit New Complaint</Link>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search by title, location or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 w-full">
                <Filter className="h-4 w-4" />
                <span>Status</span>
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('pending')}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked 
                      ? [...prev, 'pending'] 
                      : prev.filter(s => s !== 'pending')
                  );
                }}
              >
                Pending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('assigned')}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked 
                      ? [...prev, 'assigned'] 
                      : prev.filter(s => s !== 'assigned')
                  );
                }}
              >
                Assigned
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('inProgress')}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked 
                      ? [...prev, 'inProgress'] 
                      : prev.filter(s => s !== 'inProgress')
                  );
                }}
              >
                In Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('resolved')}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked 
                      ? [...prev, 'resolved'] 
                      : prev.filter(s => s !== 'resolved')
                  );
                }}
              >
                Resolved
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 w-full">
                <AlertTriangle className="h-4 w-4" />
                <span>Priority</span>
                {priorityFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {priorityFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={priorityFilter.includes('low')}
                onCheckedChange={(checked) => {
                  setPriorityFilter(prev => 
                    checked 
                      ? [...prev, 'low'] 
                      : prev.filter(p => p !== 'low')
                  );
                }}
              >
                Low
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter.includes('medium')}
                onCheckedChange={(checked) => {
                  setPriorityFilter(prev => 
                    checked 
                      ? [...prev, 'medium'] 
                      : prev.filter(p => p !== 'medium')
                  );
                }}
              >
                Medium
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter.includes('high')}
                onCheckedChange={(checked) => {
                  setPriorityFilter(prev => 
                    checked 
                      ? [...prev, 'high'] 
                      : prev.filter(p => p !== 'high')
                  );
                }}
              >
                High
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter.includes('critical')}
                onCheckedChange={(checked) => {
                  setPriorityFilter(prev => 
                    checked 
                      ? [...prev, 'critical'] 
                      : prev.filter(p => p !== 'critical')
                  );
                }}
              >
                Critical
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* View Mode Tabs */}
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            {/* Uncomment when map functionality is implemented
            <TabsTrigger value="map">Map View</TabsTrigger>
            */}
            </TabsList>
          
          <TabsContent value="list" className="mt-6">
              {filteredComplaints.length > 0 ? (
              <div className="space-y-4">
                {filteredComplaints.map((complaint) => (
                  <Card 
                    key={complaint.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div 
                      className={cn(
                        "w-1 h-full absolute left-0 top-0 bottom-0",
                        priorityColors[complaint.priority]
                      )}
                    />
                      <CardContent className="p-0">
                      <div className="p-4 pl-6">
                        <div 
                          className="flex items-start justify-between cursor-pointer"
                          onClick={() => toggleExpand(complaint.id)}
                        >
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{complaint.title}</h3>
                                  {complaint.hasImage && (
                                <span className="text-blue-500">
                                  <FileImage className="h-4 w-4" />
                                </span>
                                  )}
                                </div>
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                    <span>{complaint.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(complaint.date)}</span>
                              </div>
                              {complaint.assignedTo && (
                                <div className="flex items-center gap-1">
                                  <span>Assigned to: {complaint.assignedTo}</span>
                                </div>
                                )}
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "px-2.5 py-0.5 rounded-full text-xs font-medium",
                              statusColors[complaint.status]?.bg,
                              statusColors[complaint.status]?.color
                            )}>
                              {complaint.status}
                            </div>
                            {expandedIds.includes(complaint.id) ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        {expandedIds.includes(complaint.id) && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium mb-1">Description</h4>
                                <p className="text-sm">{complaint.description}</p>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Reported By</h4>
                                  <p className="text-sm">{complaint.reporter.name}</p>
                                  <p className="text-sm text-muted-foreground">{complaint.reporter.contact}</p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Priority</h4>
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-3 h-3 rounded-full",
                                      priorityColors[complaint.priority]
                                    )} />
                                    <p className="text-sm capitalize">{complaint.priority}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {complaint.hasImage && complaint.imageUrl && (
                                  <div>
                                  <h4 className="text-sm font-medium mb-2">Attached Image</h4>
                                  <a 
                                    href={complaint.imageUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block max-w-sm"
                                  >
                                    <img 
                                      src={complaint.imageUrl} 
                                      alt={`Image for ${complaint.title}`} 
                                      className="rounded-md border max-h-48 object-contain"
                                    />
                                  </a>
                                  </div>
                                )}
                                
                              {complaint.resolution && (
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Resolution</h4>
                                  <p className="text-sm">{complaint.resolution.notes}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Resolved by {complaint.resolution.officer} on {formatDate(complaint.resolution.date)}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex justify-end">
                                <Button asChild>
                                  <Link to={`/complaints/${complaint.id}`}>View Details</Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8">
                <h3 className="text-lg font-medium">No complaints found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting the filters or search term</p>
                <Button asChild className="mt-4">
                  <Link to="/new-complaint">Submit New Complaint</Link>
                </Button>
                </div>
              )}
            </TabsContent>
            
          <TabsContent value="grid" className="mt-6">
            {filteredComplaints.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredComplaints.map((complaint) => (
                  <Card key={complaint.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div 
                      className={cn(
                        "h-1 w-full",
                        priorityColors[complaint.priority]
                      )}
                    />
                    <CardContent className="p-4">
                      <div className="flex justify-between mb-3">
                        <div className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium",
                          statusColors[complaint.status]?.bg,
                          statusColors[complaint.status]?.color
                        )}>
                          {complaint.status}
                        </div>
                        <span className="text-xs text-muted-foreground">#{complaint.id.slice(0, 8)}</span>
                      </div>
                      
                      <h3 className="font-medium line-clamp-1">{complaint.title}</h3>
                      
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="line-clamp-1">{complaint.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{formatDate(complaint.date)}</span>
                      </div>
                      
                      <p className="text-sm mt-3 line-clamp-2">{complaint.description}</p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            priorityColors[complaint.priority]
                          )} />
                          <span className="text-xs capitalize">{complaint.priority}</span>
                        </div>
                        
                        <Button size="sm" asChild>
                          <Link to={`/complaints/${complaint.id}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8">
                <h3 className="text-lg font-medium">No complaints found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting the filters or search term</p>
                <Button asChild className="mt-4">
                  <Link to="/new-complaint">Submit New Complaint</Link>
                </Button>
              </div>
            )}
            </TabsContent>
          </Tabs>
      </div>
    </Layout>
  );
};

export default ComplaintsPage;
