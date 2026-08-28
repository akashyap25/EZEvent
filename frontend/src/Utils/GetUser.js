import apiService from '../Utils/apiService';

const getUser = async (userId) => {
  try {
    const userResponse = await apiService.get(`/api/users/${userId}`);
    return userResponse.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export default getUser;
