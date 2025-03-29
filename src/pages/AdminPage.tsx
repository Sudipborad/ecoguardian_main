import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  BarChart3,
  MapPin,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/hooks/useSupabase';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  const { fetchData } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { 
      title: 'Total Users', 
      value: '0', 
      icon: Users, 
      color: 'text-blue-500', 
      bgColor: 'bg-blue-50' 
    },
    { 
      title: 'Active Officers', 
      value: '0', 
      icon: ShieldCheck, 
      color: 'text-green-500', 
      bgColor: 'bg-green-50' 
    },
    { 
      title: 'Open Complaints', 
      value: '0', 
      icon: Clock, 
      color: 'text-amber-500', 
      bgColor: 'bg-amber-50' 
    },
    { 
      title: 'Critical Cases', 
      value: '0', 
      icon: AlertTriangle, 
      color: 'text-red-500', 
      bgColor: 'bg-red-50' 
    },
  ]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [issueDistribution, setIssueDistribution] = useState([]);
  const [totalIssues, setTotalIssues] = useState(0);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const users = await fetchData('users');
        
        // Fetch complaints
        const complaints = await fetchData('complaints');
        
        if (Array.isArray(users) && Array.isArray(complaints)) {
          console.log("Admin Page - Users:", users);
          console.log("Admin Page - Complaints:", complaints);
          
          // Count users with different roles
          const totalUsers = users.length;
          const officers = users.filter(user => user.role === 'officer').length;
          
          // Count open and critical complaints
          const openComplaints = complaints.filter(c => c.status !== 'resolved').length;
          const criticalCases = complaints.filter(c => c.priority === 'critical').length;
          
          // Update stats
          setStats([
            { 
              title: 'Total Users', 
              value: totalUsers.toString(), 
              icon: Users, 
              color: 'text-blue-500', 
              bgColor: 'bg-blue-50' 
            },
            { 
              title: 'Active Officers', 
              value: officers.toString(), 
              icon: ShieldCheck, 
              color: 'text-green-500', 
              bgColor: 'bg-green-50' 
            },
            { 
              title: 'Open Complaints', 
              value: openComplaints.toString(), 
              icon: Clock, 
              color: 'text-amber-500', 
              bgColor: 'bg-amber-50' 
            },
            { 
              title: 'Critical Cases', 
              value: criticalCases.toString(), 
              icon: AlertTriangle, 
              color: 'text-red-500', 
              bgColor: 'bg-red-50' 
            },
          ]);
          
          // Create recent activities
          const activities = [];
          
          // Add recent resolved complaints
          const resolvedComplaints = complaints
            .filter(c => c.status === 'resolved' && c.resolved_by)
            .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
            .slice(0, 2);
            
          for (const complaint of resolvedComplaints) {
            const resolver = users.find(u => u.clerk_id === complaint.resolved_by);
            
            activities.push({
              id: `resolved-${complaint.id}`,
              action: 'Complaint Resolved',
              detail: `Complaint #${complaint.id.slice(0, 8)} resolved by ${resolver?.first_name || 'an officer'}`,
              time: formatDate(complaint.updated_at || complaint.created_at),
              icon: CheckCircle2,
              color: 'text-green-500'
            });
          }
          
          // Add recently assigned complaints with proper officer name
          const assignedComplaints = complaints
            .filter(c => c.status === 'in-progress' && c.assigned_to)
            .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
            .slice(0, 2);
            
          for (const complaint of assignedComplaints) {
            // Find officer by clerk_id, not by id
            const officer = users.find(u => u.clerk_id === complaint.assigned_to);
            console.log(`Assigned complaint: ${complaint.id}, assigned_to: ${complaint.assigned_to}, found officer:`, officer);
            
            activities.push({
              id: `assigned-${complaint.id}`,
              action: 'Complaint Assigned',
              detail: `Complaint #${complaint.id.slice(0, 8)} assigned to ${officer ? (officer.first_name + ' ' + officer.last_name) : 'an officer'}`,
              time: formatDate(complaint.updated_at || complaint.created_at),
              icon: ShieldCheck,
              color: 'text-blue-500'
            });
          }
          
          // Add recent user registrations (based on created_at)
          const recentUsers = users
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 2);
            
          for (const user of recentUsers) {
            activities.push({
              id: `user-${user.id}`,
              action: 'New User Registered',
              detail: `${user.first_name} ${user.last_name} registered as ${user.role}`,
              time: formatDate(user.created_at),
              icon: Users,
              color: 'text-green-500'
            });
          }
          
          // Add critical issues
          const criticalIssues = complaints
            .filter(c => c.priority === 'critical' && c.status !== 'resolved')
            .slice(0, 2);
            
          for (const issue of criticalIssues) {
            activities.push({
              id: `critical-${issue.id}`,
              action: 'Critical Issue',
              detail: `${issue.title} reported at ${issue.location || 'unknown location'}`,
              time: formatDate(issue.created_at),
              icon: AlertTriangle,
              color: 'text-red-500'
            });
          }
          
          // Sort by time and limit to recent activities
          activities.sort((a, b) => {
            // Convert relative time to a sortable value
            const timeValueMap = { 'Today': 0, 'Yesterday': 1 };
            const timeA = timeValueMap[a.time] !== undefined ? timeValueMap[a.time] : 2;
            const timeB = timeValueMap[b.time] !== undefined ? timeValueMap[b.time] : 2;
            return timeA - timeB;
          });
          
          setRecentActivities(activities.slice(0, 4));
          
          // Calculate issue distribution based on categories
          const categories = {};
          
          // Combine complaints and recyclable items for category distribution
          const allIssues = [...complaints, ...recyclableItems];
          
          for (const issue of allIssues) {
            const category = issue.category || (issue.name ? 'Recyclable' : 'General');
            if (!categories[category]) {
              categories[category] = 0;
            }
            categories[category]++;
          }
          
          const distribution = Object.entries(categories).map(([category, count], index) => {
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-purple-500'];
            return {
              category,
              count: count as number,
              color: colors[index % colors.length]
            };
          }).sort((a, b) => b.count - a.count);
          
          setIssueDistribution(distribution);
          setTotalIssues(allIssues.length);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
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
      <div className="flex flex-col gap-8 animate-in">
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of system performance and activity
          </p>
          
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
          <section className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complaint Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="monthly">
                  <TabsList className="mb-4">
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="weekly" className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Weekly complaint statistics chart would appear here</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="monthly" className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Monthly complaint statistics chart would appear here</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="yearly" className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Yearly complaint statistics chart would appear here</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>
          
          <section className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Issue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {issueDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {issueDistribution.map((issue, index) => (
                      <div key={issue.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{issue.category}</span>
                          <span className="text-sm font-medium">{issue.count} ({((issue.count / totalIssues) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className={cn("h-full", issue.color)}
                            initial={{ width: "0%" }}
                            animate={{ width: `${(issue.count / totalIssues) * 100}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">No complaint data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Complaint Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-[200px] rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Heat map of complaint locations would appear here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
        
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start gap-4 pb-4 border-b last:border-0"
                    >
                      <div className={cn("p-2 rounded-full bg-primary/10", activity.color)}>
                        <activity.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">{activity.action}</h4>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{activity.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
              <div className="mt-4 flex justify-center">
                <Button variant="outline">View All Activity</Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
};

export default AdminPage;
