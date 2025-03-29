// Add debugging for fetch operations to identify causes of infinite loop
const fetchData = async (table: string, options?: any) => {
  console.log(`[DEBUG] fetchData called for ${table} by:`, new Error().stack);
  setLoading(true);
  
  try {
    // ... existing code ...
  } catch (error) {
    console.error(`[ERROR] fetchData failed for ${table}:`, error);
    setError(error);
  } finally {
    setLoading(false);
  }
}; 