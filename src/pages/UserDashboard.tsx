import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  MapPin,
  ArrowRight,
  FileText,
  Upload,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/lib/AuthContext';
import { useUser } from '@clerk/clerk-react';

const UserDashboard = () => {
  const [progress, setProgress] = useState(0);
  const { fetchData } = useSupabase();
  const { userId } = useAuth();
  const { user } = useUser();
  const [stats, setStats] = useState([
    { 
      title: 'My Complaints', 
      value: '0', 
      icon: MessageSquare, 
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
  ]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        try {
          // Fetch user complaints
          const complaints = await fetchData('complaints', {
            filter: { user_id: userId },
          });
          
          if (complaints) {
            // Count total complaints
            const totalComplaints = complaints.length;
            
            // Count resolved complaints
            const resolvedComplaints = complaints.filter(
              (c) => c.status === 'resolved'
            ).length;
            
            // Count pending complaints
            const pendingComplaints = complaints.filter(
              (c) => c.status === 'pending'
            ).length;
            
            // Update stats
            setStats([
              { 
                title: 'My Complaints', 
                value: totalComplaints.toString(), 
                icon: MessageSquare, 
                color: 'text-blue-500', 
                bgColor: 'bg-blue-50' 
              },
              { 
                title: 'Resolved', 
                value: resolvedComplaints.toString(), 
                icon: CheckCircle2, 
                color: 'text-green-500', 
                bgColor: 'bg-green-50' 
              },
              { 
                title: 'Pending', 
                value: pendingComplaints.toString(), 
                icon: Clock, 
                color: 'text-amber-500', 
                bgColor: 'bg-amber-50' 
              },
            ]);
            
            // Calculate progress
            if (totalComplaints > 0) {
              setProgress(Math.round((resolvedComplaints / totalComplaints) * 100));
            }
            
            // Get recent complaints (latest 3)
            const recent = complaints
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 3)
              .map(complaint => ({
                id: complaint.id,
                title: complaint.title,
                location: complaint.location || 'No location specified',
                status: complaint.status,
                date: formatDate(complaint.created_at),
                priority: getPriority(complaint.status)
              }));
              
            setRecentComplaints(recent);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
  }, [userId, fetchData]);

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
  
  // Helper function to determine priority based on status
  const getPriority = (status) => {
    switch (status) {
      case 'pending': return 'medium';
      case 'assigned': return 'low';
      case 'inProgress': return 'high';
      case 'resolved': return 'low';
      default: return 'medium';
    }
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

  // Card hover animation variant
  const cardVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  // Heading animation variant
  const headingVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.5 }
    }
  };

  // Container animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  // Child animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
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
      <motion.div 
        className="flex flex-col gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Welcome section */}
        <section className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="bg-white/50 backdrop-blur-md border border-white/20 shadow-lg rounded-lg p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">Welcome, {user?.firstName || 'User'}</h1>
                <p className="text-muted-foreground">Track your waste management complaints</p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link to="/new-complaint">Report New Issue</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Statistics */}
        <section className="space-y-4">
          <motion.div 
            className="flex items-center justify-between"
            variants={headingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-xl font-semibold">Your Complaints Overview</h2>
          </motion.div>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.title}
                variants={itemVariants}
              >
                <motion.div 
                  className="h-full"
                  variants={cardVariants}
                  initial="initial"
                  whileHover="hover"
                >
                  <Card>
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
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-4">
          <motion.h2 
            className="text-xl font-semibold"
            variants={headingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            Quick Actions
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div 
              variants={itemVariants}
            >
              <motion.div
                variants={cardVariants}
                initial="initial"
                whileHover="hover"
              >
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-500">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium">View Complaints</h3>
                    <p className="text-sm text-muted-foreground">Check status of your reported issues</p>
                    <Button variant="outline" className="mt-2" asChild>
                      <Link to="/complaints">View All</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
            >
              <motion.div
                variants={cardVariants}
                initial="initial"
                whileHover="hover"
              >
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="p-3 rounded-full bg-amber-50 text-amber-500">
                      <Upload className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium">Recyclable Items</h3>
                    <p className="text-sm text-muted-foreground">Submit items for recycling pickup</p>
                    <Button variant="outline" className="mt-2" asChild>
                      <Link to="/recyclable-item">Submit Item</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
            >
              <motion.div
                variants={cardVariants}
                initial="initial"
                whileHover="hover"
              >
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="p-3 rounded-full bg-red-50 text-red-500">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium">Report Urgent Issue</h3>
                    <p className="text-sm text-muted-foreground">Submit high priority problems</p>
                    <Button variant="outline" className="mt-2" asChild>
                      <Link to="/new-complaint?priority=high">Report</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Recent Complaints */}
        <section className="space-y-4">
          <motion.h2 
            className="text-xl font-semibold"
            variants={headingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            Recent Complaints
          </motion.h2>
          
          {recentComplaints.length > 0 ? (
            <motion.div 
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {recentComplaints.map((complaint, index) => (
                <motion.div
                  key={complaint.id}
                  variants={itemVariants}
                >
                  <motion.div
                    variants={cardVariants}
                    initial="initial"
                    whileHover="hover"
                  >
                    <Card>
                      <CardContent className="p-0">
                        <div className="flex items-center p-4">
                          <div 
                            className={cn("w-1.5 h-full rounded-full mr-4", priorityColors[complaint.priority as keyof typeof priorityColors])} 
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
                              <div className="flex items-center gap-2">
                                <div className={cn("rounded-full px-2 py-1 text-xs", statusColors[complaint.status]?.bg, statusColors[complaint.status]?.color)}>
                                  {complaint.status}
                                </div>
                                <span className="text-xs text-muted-foreground">{complaint.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
              
              <div className="flex justify-center mt-6">
                <Button variant="outline" asChild>
                  <Link to="/complaints" className="flex items-center gap-2">
                    <span>View All Complaints</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={itemVariants}
              className="text-center p-8 bg-muted/50 rounded-lg"
            >
              <p className="text-muted-foreground">You haven't submitted any complaints yet.</p>
              <Button className="mt-4" asChild>
                <Link to="/new-complaint">Submit Your First Complaint</Link>
              </Button>
            </motion.div>
          )}
        </section>
      </motion.div>
    </Layout>
  );
};

export default UserDashboard;
