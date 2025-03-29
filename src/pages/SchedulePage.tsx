import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Check,
  AlarmClock,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Trash2,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';

const SchedulePage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchData } = useSupabase();
  const { userId, userRole } = useAuth();
  
  // Fetch real schedule data from Supabase
  useEffect(() => {
    const fetchScheduleData = async () => {
      setLoading(true);
      try {
        // For officers: Fetch assigned complaints and recyclable items
        if (userRole === 'officer' && userId) {
          console.log("Fetching officer schedule data for:", userId);
          
          // Fetch complaints assigned to this officer
          const complaints = await fetchData('complaints');
          
          if (Array.isArray(complaints)) {
            const officerComplaints = complaints.filter(c => 
              c.assigned_to === userId && c.status !== 'resolved'
            );
            
            console.log("Officer assigned complaints:", officerComplaints);
            
            // Fetch recyclable items for officer's area
            const recyclableItems = await fetchData('recyclable_items');
            
            // Get the officer's area
            const { data: officerData } = await fetchData('users', { 
              filter: { clerk_id: userId },
              single: true
            });
            
            const officerArea = officerData?.area || 'bopal';
            
            // Only include recyclable items from the officer's area
            const areaRecyclableItems = Array.isArray(recyclableItems) 
              ? recyclableItems.filter(item => 
                  item.area === officerArea && item.status !== 'collected'
                )
              : [];
            
            console.log("Recyclable items in officer's area:", areaRecyclableItems);
            
            // Format complaints for schedule
            const scheduledComplaints = officerComplaints.map(complaint => ({
              id: `complaint-${complaint.id}`,
              title: `Inspect ${complaint.title}`,
              description: complaint.description || 'No description provided',
              location: complaint.location || 'No location specified',
              time: `${9 + Math.floor(Math.random() * 8)}:00 - ${10 + Math.floor(Math.random() * 8)}:00`,
              type: 'complaint',
              complaintId: complaint.id,
              date: complaint.assigned_at || complaint.created_at || new Date().toISOString(),
              area: complaint.area || 'Unknown'
            }));
            
            // Format recyclable items for schedule
            const scheduledRecycling = areaRecyclableItems.map(item => ({
              id: `recycling-${item.id}`,
              title: `Collect ${item.name}`,
              description: item.description || 'Recyclable item collection',
              location: item.location || 'No location specified',
              time: `${12 + Math.floor(Math.random() * 5)}:00 - ${13 + Math.floor(Math.random() * 5)}:00`,
              type: 'recycling',
              recyclingId: item.id,
              date: item.created_at || new Date().toISOString(),
              area: item.area || 'Unknown'
            }));
            
            // Combine all schedule items
            setScheduleData([...scheduledComplaints, ...scheduledRecycling]);
          }
        } else {
          // For users, fetch their complaints and recyclable items
          if (userId) {
            // Fetch user's complaints
            const complaints = await fetchData('complaints', {
              filter: { user_id: userId }
            });
            
            // Fetch user's recyclable items
            const recyclableItems = await fetchData('recyclable_items', {
              filter: { user_id: userId }
            });
            
            // Format user's schedule
            const userSchedule = [];
            
            if (Array.isArray(complaints)) {
              const scheduledComplaints = complaints.map(complaint => ({
                id: `complaint-${complaint.id}`,
                title: `Complaint: ${complaint.title}`,
                description: complaint.description || 'No description provided',
                location: complaint.location || 'No location specified',
                time: `${9 + Math.floor(Math.random() * 8)}:00`, // Just need a time
                type: 'complaint',
                complaintId: complaint.id,
                date: complaint.created_at || new Date().toISOString(),
                status: complaint.status
              }));
              
              userSchedule.push(...scheduledComplaints);
            }
            
            if (Array.isArray(recyclableItems)) {
              const scheduledRecycling = recyclableItems.map(item => ({
                id: `recycling-${item.id}`,
                title: `Recycling: ${item.name}`,
                description: item.description || 'Recyclable item collection',
                location: item.location || 'No location specified',
                time: `${12 + Math.floor(Math.random() * 5)}:00`, // Just need a time
                type: 'recycling',
                recyclingId: item.id,
                date: item.created_at || new Date().toISOString(),
                status: item.status
              }));
              
              userSchedule.push(...scheduledRecycling);
            }
            
            setScheduleData(userSchedule);
          }
        }
      } catch (error) {
        console.error("Error fetching schedule data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScheduleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userRole]);

  // Filter schedule items based on selected date
  const filteredSchedule = scheduleData.filter(item => 
    isSameDay(parseISO(item.date), selectedDate)
  );

  // Type color mapping
  const typeColors = {
    complaint: { color: 'text-amber-500', bg: 'bg-amber-50', icon: Trash2 },
    recycling: { color: 'text-green-500', bg: 'bg-green-50', icon: PackageCheck },
    meeting: { color: 'text-blue-500', bg: 'bg-blue-50', icon: AlarmClock }
  };

  // Handle marking a complaint as resolved or recycling as collected
  const handleCompleteTask = async (item) => {
    try {
      const { supabase } = useSupabase();
      let response;

      if (item.type === 'complaint' && item.complaintId) {
        response = await supabase
          .from('complaints')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('id', item.complaintId);
      } else if (item.type === 'recycling' && item.recyclingId) {
        response = await supabase
          .from('recyclable_items')
          .update({ status: 'collected', collected_at: new Date().toISOString() })
          .eq('id', item.recyclingId);
      }

      if (response?.error) {
        console.error('Error updating item:', response.error);
        return;
      }

      // Update local state
      setScheduleData(prev => prev.filter(i => i.id !== item.id));
      
      console.log(`${item.type === 'complaint' ? 'Complaint' : 'Recyclable item'} marked as ${item.type === 'complaint' ? 'resolved' : 'collected'}`);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  return (
    <Layout title="My Schedule">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Schedule for {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
                  <h3 className="text-lg font-medium mb-2">Loading schedule...</h3>
                </div>
              ) : filteredSchedule.length > 0 ? (
                <div className="space-y-4">
                  <Tabs defaultValue="all">
                    <TabsList className="mb-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="complaint">Complaints</TabsTrigger>
                      <TabsTrigger value="recycling">Recycling</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all">
                      <div className="space-y-3">
                        {filteredSchedule.map(item => (
                          <ScheduleItem key={item.id} item={item} typeColors={typeColors} onComplete={handleCompleteTask} />
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="complaint">
                      <div className="space-y-3">
                        {filteredSchedule
                          .filter(item => item.type === 'complaint')
                          .map(item => (
                            <ScheduleItem key={item.id} item={item} typeColors={typeColors} onComplete={handleCompleteTask} />
                          ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="recycling">
                      <div className="space-y-3">
                        {filteredSchedule
                          .filter(item => item.type === 'recycling')
                          .map(item => (
                            <ScheduleItem key={item.id} item={item} typeColors={typeColors} onComplete={handleCompleteTask} />
                          ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-xl font-medium text-muted-foreground mb-4">
                    No scheduled items for this date
                  </p>
                  <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
                    View Today's Schedule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
              <div className="mt-4 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setSelectedDate(new Date())}
                >
                  <span>Today</span>
                  <CalendarIcon className="h-4 w-4" />
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="ml-1">Previous</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  >
                    <span className="mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

// Schedule item component
const ScheduleItem = ({ item, typeColors, onComplete }) => {
  const Icon = typeColors[item.type]?.icon || CalendarIcon;
  
  const handleClick = () => {
    if (item.type === 'complaint' && item.complaintId) {
      // Link to complaint details handled via React Router Link component
    } else if (item.type === 'recycling' && item.recyclingId) {
      // Handle recyclable item view action if needed
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow",
        typeColors[item.type]?.bg || "bg-gray-50"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Icon className={cn("mr-2 h-5 w-5", typeColors[item.type]?.color || "text-gray-500")} />
            <h3 className="font-medium">
              {item.type === 'complaint' && item.complaintId ? (
                <Link to={`/complaints/${item.complaintId}`} className="hover:underline">
                  {item.title}
                </Link>
              ) : (
                item.title
              )}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{item.time}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{item.location}</span>
            </div>
            {item.area && (
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                <span>Area: {item.area}</span>
              </div>
            )}
            {item.status && (
              <div className="flex items-center">
                <Check className="h-3 w-3 mr-1" />
                <span>Status: {item.status}</span>
              </div>
            )}
          </div>
        </div>
        
        {(userRole === 'officer' && 
         ((item.type === 'complaint' && item.complaintId) || 
          (item.type === 'recycling' && item.recyclingId))) && (
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={() => onComplete(item)}
          >
            <Check className="h-4 w-4 mr-1" />
            Mark Complete
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default SchedulePage;
