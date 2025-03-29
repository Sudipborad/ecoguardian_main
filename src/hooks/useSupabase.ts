import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for Supabase database operations with Clerk authentication
 */
export const useSupabase = () => {
  const { userId } = useAuth();

  /**
   * Generic function to fetch data from a table
   */
  const fetchData = async <T>(
    table: string,
    options?: {
      columns?: string;
      filter?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
    }
  ): Promise<T | T[] | null> => {
    try {
      console.log(`Fetching from ${table} table with options:`, options);
      
      let query = supabase
        .from(table)
        .select(options?.columns || '*');

      // Apply filters if provided
      if (options?.filter) {
        console.log(`Applying filters to ${table}:`, options.filter);
        Object.entries(options.filter).forEach(([key, value]) => {
          console.log(`  Filter: ${key} = ${value}`);
          query = query.eq(key, value);
        });
      }

      // Apply ordering if provided
      if (options?.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending ?? false,
        });
      }

      // Apply limit if provided
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      // Return a single record if requested
      let result;
      if (options?.single) {
        const { data, error } = await query.maybeSingle();
        if (error) {
          console.error(`Error fetching single record from ${table}:`, error);
          throw error;
        }
        result = data as T;
      } else {
        const { data, error } = await query;
        if (error) {
          console.error(`Error fetching records from ${table}:`, error);
          throw error;
        }
        result = data as T[];
      }
      
      console.log(`Fetched from ${table}:`, result);
      return result;
    } catch (error) {
      console.error(`Error in fetchData from ${table}:`, error);
      return null;
    }
  };

  /**
   * Generic function to insert data into a table
   */
  const insertData = async <T>(
    table: string,
    data: Record<string, any>,
    options?: {
      returnData?: boolean;
    }
  ): Promise<T | null> => {
    try {
      console.log(`Inserting into ${table} with data:`, data);
      
      // Automatically add user_id if authenticated
      const dataWithUserId = userId ? { ...data, user_id: userId } : data;
      
      let query = supabase.from(table).insert(dataWithUserId);
      
      if (options?.returnData) {
        query = query.select();
      }
      
      const { data: returnedData, error } = await query;
      if (error) {
        console.error(`Error inserting into ${table}:`, error);
        throw error;
      }
      
      const result = options?.returnData ? (returnedData as T[])[0] || null : null;
      console.log(`Inserted into ${table}, result:`, result);
      return result;
    } catch (error) {
      console.error(`Error in insertData to ${table}:`, error);
      return null;
    }
  };

  /**
   * Generic function to update data in a table
   */
  const updateData = async <T>(
    table: string,
    id: string | number,
    data: Record<string, any>,
    options?: {
      idColumn?: string;
      returnData?: boolean;
    }
  ): Promise<T | null> => {
    try {
      // Sanitize data - remove undefined or null values that might cause issues
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      
      console.log(`Updating ${table} with id ${id}, data:`, cleanedData);
      
      const idColumn = options?.idColumn || 'id';
      
      let query = supabase
        .from(table)
        .update(cleanedData)
        .eq(idColumn, id);
      
      if (options?.returnData) {
        query = query.select();
      }
      
      // Log the raw query for debugging
      console.log(`Raw Supabase query for ${table}:`, JSON.stringify({
        table, 
        id, 
        cleanedData,
        idColumn
      }));
      
      const { data: returnedData, error } = await query;
      if (error) {
        console.error(`Error updating ${table}:`, error);
        console.error(`Error details:`, JSON.stringify(error));
        throw error;
      }
      
      const result = options?.returnData ? (returnedData as T[])[0] || null : null;
      console.log(`Updated ${table}, result:`, result);
      return result;
    } catch (error) {
      console.error(`Error in updateData for ${table}:`, error);
      // Help debug by showing the error in a more readable format
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      return null;
    }
  };

  /**
   * Generic function to delete data from a table
   */
  const deleteData = async (
    table: string,
    id: string | number,
    options?: {
      idColumn?: string;
    }
  ): Promise<boolean> => {
    try {
      console.log(`Deleting from ${table} with id ${id}`);
      
      const idColumn = options?.idColumn || 'id';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(idColumn, id);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        throw error;
      }
      
      console.log(`Deleted from ${table} successfully`);
      return true;
    } catch (error) {
      console.error(`Error in deleteData from ${table}:`, error);
      return false;
    }
  };

  /**
   * Upload a file to Supabase storage
   */
  const uploadFile = async (
    bucket: string,
    path: string,
    file: File
  ): Promise<string | null> => {
    try {
      console.log(`Attempting to upload file to ${bucket}/${path}`);
      
      // First check if the bucket exists by listing all buckets
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error(`Error checking buckets before upload:`, listError);
        throw listError;
      }
      
      // Log available buckets to help debug
      console.log('Available buckets for upload:', buckets?.map(b => b.name));
      
      // Try to find the bucket (case-insensitive)
      const actualBucket = buckets?.find(b => b.name.toLowerCase() === bucket.toLowerCase())?.name;
      
      if (!actualBucket) {
        console.error(`Error: Bucket "${bucket}" not found. Please create it in the Supabase dashboard.`);
        throw new Error(`Bucket "${bucket}" not found`);
      }
      
      console.log(`Found bucket with name: "${actualBucket}". Proceeding with upload...`);
      
      // Use the actual bucket name with correct case
      const { data, error } = await supabase.storage
        .from(actualBucket)
        .upload(path, file, {
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading file to ${actualBucket}:`, error);
        throw error;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(actualBucket)
        .getPublicUrl(data.path);
      
      console.log(`File uploaded successfully, URL:`, publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      return null;
    }
  };

  /**
   * Delete a file from Supabase storage
   */
  const deleteFile = async (
    bucket: string,
    path: string
  ): Promise<boolean> => {
    try {
      console.log(`Deleting file from ${bucket}/${path}`);
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) {
        console.error(`Error deleting file from ${bucket}:`, error);
        throw error;
      }
      
      console.log(`File deleted successfully from ${bucket}/${path}`);
      return true;
    } catch (error) {
      console.error('Error in deleteFile:', error);
      return false;
    }
  };

  return {
    fetchData,
    insertData,
    updateData,
    deleteData,
    uploadFile,
    deleteFile,
    supabase, // Expose the raw supabase client for advanced usage
  };
}; 