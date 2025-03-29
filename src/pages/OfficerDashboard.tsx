import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  MapPin,
  ArrowRight,
  ClipboardList,
  UserCheck,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/lib/AuthContext';
import { useUser } from '@clerk/clerk-react';
import { Complaint } from '@/schema';

const getOfficerArea = (officerData: any): string => {
  // First try to get area from database
  if (officerData && officerData.area) {
    return officerData.area;
  }
  
  // Hardcoded fallbacks based on clerk_id
  if (officerData && officerData.clerk_id) {
    if (officerData.clerk_id === 'officer1') return 'bopal';
    if (officerData.clerk_id === 'officer2') return 'south bopal';
  }
  
  // Default
  return 'unassigned';
};

const OfficerDashboard = () => {
  const [progress, setProgress] = useState(0);
  const { fetchData, updateData } = useSupabase();
  const { userId } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { 
      title: 'Assigned Cases', 
      value: '0', 
      icon: ClipboardList, 
      color: 'text-blue-500', 
      bgColor: 'bg-blue-50' 
    },
    { 
      title: 'Resolved', 
      value: '0', 
      icon: CheckCircle2, 
      color: 'text-green-500', 
      bgColor: 'bg-green-50' 
    },
    { 
      title: 'Pending', 
      value: '0', 
      icon: Clock, 
      color: 'text-amber-500', 
      bgColor: 'bg-amber-50' 
    },
    { 
      title: 'Critical', 
      value: '0', 
      icon: AlertTriangle, 
      color: 'text-red-500', 
      bgColor: 'bg-red-50' 
    },
  ]);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [officerName, setOfficerName] = useState('');
  const [officerArea, setOfficerArea] = useState('');
  const [areaComplaints, setAreaComplaints] = useState([]);

  useEffect(() => {
    const fetchOfficerData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        console.log("Fetching officer data, officer ID (clerk_id):", userId);
        
        // Get all complaints
        const allComplaints = await fetchData('complaints');
        console.log(`Total complaints found: ${allComplaints?.length || 0}`);
        
        // Get the officer data upfront to use throughout the function
        const officerData = await fetchData('users', {
          filter: { clerk_id: userId },
          single: true
        });
        
        console.log("Officer data:", officerData);
        
        // Get officer name from Clerk user
        if (user) {
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          setOfficerName(`${firstName} ${lastName}`.trim() || user.username || 'Officer');
        }
        
        // Set officer area if officerData is available
        if (officerData) {
          setOfficerArea(getOfficerArea(officerData));
        } else {
          setOfficerArea('Unassigned');
        }
        
        if (allComplaints && Array.isArray(allComplaints)) {
          // Debug each complaint's assigned_to value
          allComplaints.forEach(c => {
            console.log(`Complaint ${c.id}: assigned_to=${c.assigned_to || 'null'}, area=${c.area || 'null'}, status=${c.status || 'null'}`);
          });
          
          // Force assignment logic - find complaints that should be assigned to this officer
          let officerComplaints = allComplaints.filter(c => c.assigned_to === userId);
          console.log(`Complaints already assigned to officer ${userId}: ${officerComplaints.length}`);
          
          // Check if we have area-based matching complaints
          let areaMatchingComplaints = [];
          const officerArea = getOfficerArea(officerData);
          
          if (userId === 'officer1') {
            areaMatchingComplaints = allComplaints.filter(c => 
              c.status !== 'resolved' && 
              (c.area?.toLowerCase() === 'bopal' || 
               (c.area?.toLowerCase()?.includes('bopal') && !c.area?.toLowerCase()?.includes('south')))
            );
            console.log(`Found ${areaMatchingComplaints.length} area matching complaints for bopal`);
          } 
          else if (userId === 'officer2') {
            areaMatchingComplaints = allComplaints.filter(c => 
              c.status !== 'resolved' && 
              (c.area?.toLowerCase() === 'south bopal' || 
               (c.area?.toLowerCase()?.includes('south') && c.area?.toLowerCase()?.includes('bopal')))
            );
            console.log(`Found ${areaMatchingComplaints.length} area matching complaints for south bopal`);
          }
          
          // Add area-matching but unassigned complaints for this officer's auto-assignment
          if (officerComplaints.length === 0) {
            // If no complaints assigned, find unassigned complaints for this area
            console.log("No assigned complaints, checking for area assignments");
            
            console.log(`Officer ${userId} has area: ${officerArea}`);
            
            // Look for unassigned complaints in this officer's area
            let unassignedAreaComplaints = areaMatchingComplaints.filter(c => !c.assigned_to);
            console.log(`Found ${unassignedAreaComplaints.length} unassigned complaints for area ${officerArea}`);
            
            // If still no complaints, try assigning any unassigned complaint
            if (unassignedAreaComplaints.length === 0 && (userId === 'officer1' || userId === 'officer2')) {
              console.log("No area-specific complaints, trying any unassigned");
              unassignedAreaComplaints = allComplaints.filter(c => !c.assigned_to && c.status !== 'resolved').slice(0, 5);
            }
            
            // Assign complaints to this officer
            for (const complaint of unassignedAreaComplaints) {
              console.log(`Auto-assigning complaint ${complaint.id} to officer ${userId}`);
              
              try {
                // Ensure we have valid data according to the schema
                const complaintUpdate: Partial<Complaint> = { 
                  assigned_to: userId,
                  assigned_at: new Date().toISOString(),
                  status: 'in-progress',
                  area: officerArea
                };
                
                // Log the update object
                console.log(`Updating complaint with clean data:`, complaintUpdate);
                
                const result = await updateData('complaints', complaint.id, complaintUpdate);
                
                // Debug the response
                console.log('Update response:', result);
                
                if (result) {
                  console.log(`Successfully assigned complaint ${complaint.id} to area ${officerArea}`);
                  // Add to officerComplaints directly instead of fetching again
                  officerComplaints.push({
                    ...complaint,
                    assigned_to: userId,
                    assigned_at: new Date().toISOString(),
                    status: 'in-progress',
                    area: officerArea
                  });
                } else {
                  console.error(`Failed to assign complaint ${complaint.id}`);
                }
              } catch (error) {
                console.error(`Error assigning complaint ${complaint.id}:`, error);
              }
            }
          }
          
          // Count stats
          const totalAssigned = officerComplaints.length;
          const resolvedCount = allComplaints.filter(c => c.status === 'resolved' && c.resolved_by === userId).length;
          const pendingCount = officerComplaints.filter(c => c.status === 'pending' || c.status === 'in-progress').length;
          const criticalCount = officerComplaints.filter(c => c.priority === 'critical').length;
          
          console.log(`Officer stats: Total=${totalAssigned}, Resolved=${resolvedCount}, Pending=${pendingCount}, Critical=${criticalCount}`);
          
          // Update stats
          setStats([
            { 
              title: 'Assigned Cases', 
              value: totalAssigned.toString(), 
              icon: ClipboardList, 
              color: 'text-blue-500', 
              bgColor: 'bg-blue-50' 
            },
            { 
              title: 'Resolved', 
              value: resolvedCount.toString(), 
              icon: CheckCircle2, 
              color: 'text-green-500', 
              bgColor: 'bg-green-50' 
            },
            { 
              title: 'Pending', 
              value: pendingCount.toString(), 
              icon: Clock, 
              color: 'text-amber-500', 
              bgColor: 'bg-amber-50' 
            },
            { 
              title: 'Critical', 
              value: criticalCount.toString(), 
              icon: AlertTriangle, 
              color: 'text-red-500', 
              bgColor: 'bg-red-50' 
            },
          ]);
          
          // Format and set complaints for display
          const formattedComplaints = officerComplaints
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 4)
            .map(complaint => ({
              id: complaint.id,
              title: complaint.title,
              location: complaint.location || 'No location specified',
              status: complaint.status,
              date: `Assigned ${formatDate(complaint.assigned_at || complaint.created_at)}`,
              priority: complaint.priority || 'medium',
              dueBy: getDueDate(complaint.created_at, complaint.priority)
            }));
          
          setAssignedComplaints(formattedComplaints);
          
          // Set schedule items
          const todaySchedule = officerComplaints
            .filter(c => c.status !== 'resolved')
            .slice(0, 3)
            .map((complaint, index) => ({
              id: index + 1,
              title: `Inspect ${complaint.title}`,
              location: complaint.location || 'Location not specified',
              time: getTimeSlot(index),
              complaintId: complaint.id
            }));
          
          setScheduleItems(todaySchedule);

          // Format area-matching complaints for display
          if (areaMatchingComplaints && areaMatchingComplaints.length > 0) {
            const formattedAreaComplaints = areaMatchingComplaints
              .filter(c => c.assigned_to !== userId) // Only show complaints not assigned to this officer
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 4)
              .map(complaint => ({
                id: complaint.id,
                title: complaint.title,
                location: complaint.location || 'No location specified',
                status: complaint.status,
                assigned: complaint.assigned_to ? 'Assigned' : 'Unassigned',
                date: formatDate(complaint.created_at),
                priority: complaint.priority || 'medium',
                dueBy: getDueDate(complaint.created_at, complaint.priority)
              }));
            
            setAreaComplaints(formattedAreaComplaints);
            console.log(`Set ${formattedAreaComplaints.length} area complaints for display`);
          }
        }
      } catch (error) {
        console.error('Error fetching officer data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOfficerData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      console.log("Cleaning up officer dashboard effect");
    };
  }, [userId, user]); // Only depend on userId and user
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };
  
  // Helper function to calculate due date based on priority
  const getDueDate = (createdAt, priority) => {
    const date = new Date(createdAt);
    const now = new Date();
    
    let daysToAdd = 7; // default for low priority
    if (priority === 'medium') daysToAdd = 5;
    if (priority === 'high') daysToAdd = 3;
    if (priority === 'critical') daysToAdd = 1;
    
    date.setDate(date.getDate() + daysToAdd);
    
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };
  
  // Helper function to generate time slots
  const getTimeSlot = (index) => {
    const startHour = 9 + (index * 2);
    const endHour = startHour + 1;
    return `${startHour}:00 AM - ${endHour}:30 AM`;
  };

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

  // Helper function to check if an area matches the officer's assigned area
  function getOfficerAreaMatch(complaintArea: string, officerData: any): boolean {
    const officerArea = getOfficerArea(officerData);
    
    // Check for exact match
    if (complaintArea && complaintArea.toLowerCase() === officerArea.toLowerCase()) {
      return true;
    }
    
    // Check for substring match (more lenient)
    if (complaintArea && officerArea && 
        (complaintArea.toLowerCase().includes(officerArea.toLowerCase()) || 
         officerArea.toLowerCase().includes(complaintArea.toLowerCase()))) {
      return true;
    }
    
    return false;
  }

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
      <div className="flex flex-col gap-8 animate-in">
        {/* Welcome section */}
        <section className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="glass-morphism rounded-lg p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">Welcome, {officerName}</h1>
                <p className="text-muted-foreground">You are assigned to the {officerArea} area.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link to="/reports">Generate Reports</Link>
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Monthly resolution rate</span>
                </div>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats[1].value} of {parseInt(stats[0].value) + parseInt(stats[1].value)} assigned cases resolved this month
              </p>
            </div>
          </motion.div>
        </section>

        {/* Statistics */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Case Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover-scale">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                      <div className={cn("p-2 rounded-full", stat.bgColor)}>
                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assigned Cases Section */}
          <section className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Cases</TabsTrigger>
                    <TabsTrigger value="critical">Critical</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="space-y-4">
                    {assignedComplaints.length > 0 ? (
                      assignedComplaints.map((complaint, index) => (
                      <motion.div
                        key={complaint.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className="hover-scale">
                          <CardContent className="p-0">
                            <div className="flex items-center p-4">
                              <div 
                                  className={cn("w-1.5 h-full rounded-full mr-4", priorityColors[complaint.priority])} 
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{complaint.title}</p>
                                        <p className="text-xs text-muted-foreground">#{complaint.id.slice(0, 8)}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{complaint.location}</span>
                                    </div>
                                  </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <div className={cn("px-2 py-1 rounded-full text-xs", statusColors[complaint.status]?.bg, statusColors[complaint.status]?.color)}>
                                      {complaint.status}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">{complaint.date}</span>
                                        {/* Show due date with appropriate color */}
                                        <span className={cn("text-xs", 
                                          complaint.dueBy === 'Overdue' ? 'text-red-500' : 
                                          complaint.dueBy === 'Today' ? 'text-amber-500' : 
                                          'text-muted-foreground'
                                        )}>
                                          Due: {complaint.dueBy}
                                        </span>
                                      </div>
                                    </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                      ))
                    ) : (
                      <div className="text-center p-8 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">No assigned cases yet.</p>
                      </div>
                    )}
                    
                    {assignedComplaints.length > 0 && (
                      <div className="flex justify-center">
                        <Button variant="outline" asChild>
                          <Link to="/complaints">View All Assigned Cases</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="critical" className="space-y-4">
                    {assignedComplaints.filter(c => c.priority === 'critical').length > 0 ? (
                      assignedComplaints
                      .filter(c => c.priority === 'critical')
                      .map((complaint, index) => (
                          <motion.div
                            key={complaint.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <Card className="hover-scale">
                          <CardContent className="p-0">
                            <div className="flex items-center p-4">
                              <div 
                                    className={cn("w-1.5 h-full rounded-full mr-4", priorityColors.critical)} 
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{complaint.title}</p>
                                          <p className="text-xs text-muted-foreground">#{complaint.id.slice(0, 8)}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{complaint.location}</span>
                                    </div>
                                  </div>
                                      <div className="flex flex-col items-end gap-1">
                                        <div className={cn("px-2 py-1 rounded-full text-xs", statusColors[complaint.status]?.bg, statusColors[complaint.status]?.color)}>
                                      {complaint.status}
                                        </div>
                                        <span className="text-xs text-red-500">Due: {complaint.dueBy}</span>
                                      </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                          </motion.div>
                        ))
                    ) : (
                      <div className="text-center p-8 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">No critical cases assigned.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="pending" className="space-y-4">
                    {assignedComplaints.filter(c => c.status === 'pending').length > 0 ? (
                      assignedComplaints
                      .filter(c => c.status === 'pending')
                      .map((complaint, index) => (
                          <motion.div
                            key={complaint.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <Card className="hover-scale">
                          <CardContent className="p-0">
                            <div className="flex items-center p-4">
                              <div 
                                    className={cn("w-1.5 h-full rounded-full mr-4", priorityColors[complaint.priority])} 
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{complaint.title}</p>
                                          <p className="text-xs text-muted-foreground">#{complaint.id.slice(0, 8)}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{complaint.location}</span>
                                    </div>
                                  </div>
                                      <div className="flex flex-col items-end gap-1">
                                        <div className={cn("px-2 py-1 rounded-full text-xs", statusColors.pending.bg, statusColors.pending.color)}>
                                          pending
                                        </div>
                                        <span className="text-xs text-muted-foreground">Due: {complaint.dueBy}</span>
                                      </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                          </motion.div>
                        ))
                    ) : (
                      <div className="text-center p-8 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">No pending cases assigned.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>
          
          {/* Today's Schedule Section */}
          <section className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {scheduleItems.length > 0 ? (
                  <div className="space-y-4">
                    {scheduleItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="p-2 rounded-full bg-blue-50 text-blue-500 mt-1">
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div>
                        <h3 className="font-medium text-sm">{item.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{item.location}</span>
                      </div>
                                <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                      {item.complaintId && (
                                  <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs" asChild>
                                    <Link to={`/complaints/${item.complaintId}`}>View Case</Link>
                                  </Button>
                                )}
                              </div>
                        </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    <div className="flex justify-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/schedule">View Full Schedule</Link>
                      </Button>
                    </div>
                </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-muted-foreground text-sm">No schedule items for today.</p>
                    <Button className="mt-4" size="sm" asChild>
                      <Link to="/schedule">Create Schedule</Link>
                  </Button>
                </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Response Time</p>
                    <p className="text-sm text-muted-foreground">Good</p>
                  </div>
                  <Progress value={80} className="h-2 mt-2" />
                  </div>
                  
                <div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Resolution Rate</p>
                    <p className="text-sm text-muted-foreground">Excellent</p>
                  </div>
                  <Progress value={progress} className="h-2 mt-2" />
                  </div>
                  
                <div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Citizen Satisfaction</p>
                    <p className="text-sm text-muted-foreground">Average</p>
                  </div>
                  <Progress value={65} className="h-2 mt-2" />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Area Complaints Section */}
        {areaComplaints.length > 0 && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Your Area Complaints
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These complaints match your area ({officerArea})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {areaComplaints.map((complaint) => (
                  <div 
                    key={complaint.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="space-y-1 mb-2 sm:mb-0">
                      <div className="flex items-center">
                        <h3 className="font-medium">{complaint.title}</h3>
                        <div className={cn(
                          "ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium",
                          complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        )}>
                          {complaint.status}
                        </div>
                        <div className={cn(
                          "ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium",
                          complaint.assigned === 'Assigned' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        )}>
                          {complaint.assigned}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {complaint.location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reported {complaint.date}
                      </p>
                    </div>
                    <Button asChild className="mt-2 sm:mt-0" size="sm">
                      <Link to={`/complaints/${complaint.id}`}>
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
                
                {areaComplaints.length > 0 && (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/complaints">View All Area Complaints</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default OfficerDashboard;
