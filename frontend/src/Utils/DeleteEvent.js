import apiService from '../Utils/apiService';

const deleteEvent = async ({ eventId }) => {
    try {
        const response = await apiService.delete(`/api/events/${eventId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
}


    export default deleteEvent;