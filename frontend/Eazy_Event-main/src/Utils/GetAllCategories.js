import apiService from '../Utils/apiService';

const getAllCategories = async () => {
    try {
        const categoriesResponse = await apiService.get(`/api/categories`);
        const categories = categoriesResponse.data;
        return categories;
    
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

export default getAllCategories;
