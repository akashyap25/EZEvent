import apiService from '../Utils/apiService';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_KEY } from './Constants';

const stripePromise = loadStripe(STRIPE_KEY);

const CheckoutOrder = async (order) => {
  try {
    const response = await apiService.post(`/api/orders/checkout`, order);
    const stripe = await stripePromise;
    const { url } = response.data;

    
    window.location.href = url;
  } catch (error) {
    console.error('Error creating order:', error.response?.data?.message || error.message);
  }
}

export default CheckoutOrder;
