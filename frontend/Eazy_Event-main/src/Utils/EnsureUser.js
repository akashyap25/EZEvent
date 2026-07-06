import axios from 'axios';
import { SERVER_URL } from './Constants';

const ensureUser = async () => {
  try {
    const response = await axios.post(`${SERVER_URL}/api/users/ensure`, {}, {
      withCredentials: true,
    });
    return response.data.user;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return null;
  }
};

export default ensureUser;