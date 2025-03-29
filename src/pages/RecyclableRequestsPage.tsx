import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PackageCheck, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Scale,
  Ruler,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/Spinner';
import { format, formatDistance } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

// Interface for recyclable request data
interface RecyclableRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  image_url?: string;
  weight: string;
  size: string;
  user_id: string;
  userName?: string;
}

const RecyclableRequestsPage = () => {
  const { fetchData, updateData } = useSupabase();
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RecyclableRequest[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // Status color mapping
  const statusColors = {
    pending: { color: 'text-amber-500', bg: 'bg-amber-50' },
    scheduled: { color: 'text-blue-500', bg: 'bg-blue-50' },
    inProgress: { color: 'text-purple-500', bg: 'bg-purple-50' },
    completed: { color: 'text-green-500', bg: 'bg-green-50' },
    cancelled: { color: 'text-red-500', bg: 'bg-red-50' }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        
        // Fetch recyclable requests from Supabase
        const recyclableData = await fetchData('recyclable_items');
        
        if (!recyclableData || !Array.isArray(recyclableData)) {
          console.error('Failed to fetch recyclable items or invalid data format');
          return;
        }

        // Fetch users to get names
        const users = await fetchData('users');

        // Format the requests data
        const formattedRequests = recyclableData.map((request: any) => {
          const user = users.find((u: any) => u.clerk_id === request.user_id);
          
          return {
            id: request.id,
            title: request.name || 'Recyclable Item',
            description: request.description || 'No description provided',
            location: request.location || 'No location specified',
            status: request.status || 'pending',
            created_at: request.created_at,
            image_url: request.image_url || '/placeholder.svg',
            weight: request.quantity ? `${request.quantity} kg` : 'Unknown',
            size: 'Standard', // Default size since it's not in the database
            user_id: request.user_id,
            userName: user ? `${user.first_name} ${user.last_name}` : 'Unknown User'
          };
        });

        setRequests(formattedRequests);
      } catch (error) {
        console.error('Error fetching recyclable items:', error);
        toast({
          title: "Error",
          description: "Failed to load recyclable items. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      console.log(`Updating request ${requestId} status to ${newStatus}`);
      
      // First check if the request exists
      const result = await updateData('recyclable_items', requestId, { 
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      
      console.log(`Update result:`, result);
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: newStatus as any } : req
      ));
      
      toast({
        title: "Status Updated",
        description: `Request has been marked as ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch (e) {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8 animate-in">
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">Recyclable Item Requests</h1>
          <p className="text-muted-foreground">
            Manage and track recyclable item collection requests
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>Collection Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Requests</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  {requests.length > 0 ? (
                    requests.map((request, index) => (
                      <RequestCard 
                        key={request.id} 
                        request={request} 
                        index={index} 
                        statusColors={statusColors} 
                        onUpdateStatus={handleUpdateStatus}
                        userRole={userRole}
                        formatDate={formatDate}
                      />
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">No recyclable items found</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="pending" className="space-y-4">
                  {requests.filter(r => r.status === 'pending').length > 0 ? (
                    requests
                      .filter(r => r.status === 'pending')
                      .map((request, index) => (
                        <RequestCard 
                          key={request.id} 
                          request={request} 
                          index={index} 
                          statusColors={statusColors} 
                          onUpdateStatus={handleUpdateStatus}
                          userRole={userRole}
                          formatDate={formatDate}
                        />
                      ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">No pending requests found</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="scheduled" className="space-y-4">
                  {requests.filter(r => r.status === 'scheduled').length > 0 ? (
                    requests
                      .filter(r => r.status === 'scheduled')
                      .map((request, index) => (
                        <RequestCard 
                          key={request.id} 
                          request={request} 
                          index={index} 
                          statusColors={statusColors} 
                          onUpdateStatus={handleUpdateStatus}
                          userRole={userRole}
                          formatDate={formatDate}
                        />
                      ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">No scheduled requests found</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="space-y-4">
                  {requests.filter(r => r.status === 'completed').length > 0 ? (
                    requests
                      .filter(r => r.status === 'completed')
                      .map((request, index) => (
                        <RequestCard 
                          key={request.id} 
                          request={request} 
                          index={index} 
                          statusColors={statusColors} 
                          onUpdateStatus={handleUpdateStatus}
                          userRole={userRole}
                          formatDate={formatDate}
                        />
                      ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">No completed requests found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
};

// Component for individual request card
const RequestCard = ({ 
  request, 
  index, 
  statusColors, 
  onUpdateStatus,
  userRole,
  formatDate
}: {
  request: RecyclableRequest;
  index: number;
  statusColors: any;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  userRole?: string;
  formatDate: (date: string) => string;
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleViewDetails = () => {
    // Navigate to the details page
    navigate(`/recyclable-requests/${request.id}`);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Image preview */}
            <div className="w-full md:w-40 h-40 bg-muted flex items-center justify-center">
              <img 
                src={request.image_url || '/placeholder.svg'} 
                alt={request.title} 
                className="h-full w-full object-cover"
              />
            </div>
            
            {/* Item details */}
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{request.title}</h3>
                    <span className="text-xs text-muted-foreground">#{request.id}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{request.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{request.userName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Scale className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Weight: {request.weight}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Ruler className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Size: {request.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div 
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium capitalize",
                      statusColors[request.status]?.bg || 'bg-gray-100',
                      statusColors[request.status]?.color || 'text-gray-500'
                    )}
                  >
                    {request.status}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(request.created_at)}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                {(userRole === 'admin' || userRole === 'officer') && (
                  <>
                    {request.status === 'pending' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onUpdateStatus(request.id, 'cancelled')}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => onUpdateStatus(request.id, 'scheduled')}
                        >
                          Schedule Pickup
                        </Button>
                      </>
                    )}
                    
                    {request.status === 'scheduled' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onUpdateStatus(request.id, 'pending')}
                        >
                          Reschedule
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => onUpdateStatus(request.id, 'completed')}
                        >
                          Mark Collected
                        </Button>
                      </>
                    )}
                  </>
                )}
                
                <Button variant="secondary" size="sm" onClick={handleViewDetails}>View Details</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecyclableRequestsPage;
