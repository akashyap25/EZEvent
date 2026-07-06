import apiService from '../Utils/apiService';

const getUser = async (userId) => {
  try {
    // Try to get user by ID first
    const userResponse = await apiService.get(`/api/users/${userId}`);
    return userResponse.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    
    // If user not found by ID, try to get by clerkId
    if (error.response?.status === 404) {
      try {
        const clerkResponse = await apiService.get(`/api/users/clerk/${userId}`);
        return clerkResponse.data;
      } catch (clerkError) {
        console.error('Error fetching user by clerkId:', clerkError);
        return null;
      }
    }
    
    return null;
  }
};

export default getUser;
