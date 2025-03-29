
// Mock MongoDB service implementation since real API is unavailable
// This service uses localStorage to simulate a database

class MongoDBService {
  private storageKey = 'eco_guardian_mock_db';
  
  constructor() {
    // Initialize local storage if empty
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({
        complaints: [],
        users: [],
        officers: []
      }));
    }
  }
  
  private getStore() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '{"complaints":[],"users":[],"officers":[]}');
  }
  
  private setStore(store: any) {
    localStorage.setItem(this.storageKey, JSON.stringify(store));
  }
  
  async getComplaints() {
    try {
      console.log('Fetching complaints from mock store');
      const store = this.getStore();
      return store.complaints;
    } catch (error) {
      console.error('Error fetching complaints:', error);
      return [];
    }
  }

  async getComplaintById(id: string) {
    try {
      console.log(`Fetching complaint with ID: ${id}`);
      const store = this.getStore();
      const complaint = store.complaints.find((c: any) => c.id === id);
      return complaint || null;
    } catch (error) {
      console.error('Error fetching complaint:', error);
      return null;
    }
  }

  async createComplaint(complaint: any) {
    try {
      console.log('Creating new complaint:', complaint);
      
      const store = this.getStore();
      const newComplaint = {
        ...complaint,
        id: `complaint_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      store.complaints.push(newComplaint);
      this.setStore(store);
      
      return newComplaint;
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  }

  async updateComplaint(id: string, updates: any) {
    try {
      console.log(`Updating complaint ${id} with:`, updates);
      
      const store = this.getStore();
      const index = store.complaints.findIndex((c: any) => c.id === id);
      
      if (index !== -1) {
        store.complaints[index] = {
          ...store.complaints[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        this.setStore(store);
        return store.complaints[index];
      }
      
      throw new Error('Complaint not found');
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
  }

  async deleteComplaint(id: string) {
    try {
      console.log(`Deleting complaint with ID: ${id}`);
      
      const store = this.getStore();
      const updatedComplaints = store.complaints.filter((c: any) => c.id !== id);
      
      store.complaints = updatedComplaints;
      this.setStore(store);
      
      return { success: true, id };
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  }

  // User-related methods
  async getUsers() {
    try {
      console.log('Fetching users from mock store');
      const store = this.getStore();
      return store.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUserById(id: string) {
    try {
      console.log(`Fetching user with ID: ${id}`);
      const store = this.getStore();
      const user = store.users.find((u: any) => u.id === id);
      return user || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async updateUserStatus(id: string, status: string) {
    try {
      console.log(`Updating user ${id} status to: ${status}`);
      
      const store = this.getStore();
      const index = store.users.findIndex((u: any) => u.id === id);
      
      if (index !== -1) {
        store.users[index].status = status;
        store.users[index].updatedAt = new Date().toISOString();
        
        this.setStore(store);
        return store.users[index];
      }
      
      throw new Error('User not found');
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async getOfficers() {
    try {
      console.log('Fetching officers from mock store');
      const store = this.getStore();
      return store.officers;
    } catch (error) {
      console.error('Error fetching officers:', error);
      return [];
    }
  }
}

// Export as singleton
const mongoDBService = new MongoDBService();
export default mongoDBService;
