# Eazy Event

## Overview

Welcome to **Eazy Event**, a full-stack event management application built with modern web technologies. This application provides a comprehensive platform for creating, managing, and attending events with advanced features like task management, payment processing, and real-time updates.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - Secure login/registration with Clerk
- **Event Management** - Create, update, delete, and manage events
- **Event Registration** - Users can register for events with payment processing
- **Task Management** - Assign and track tasks for events
- **Payment Processing** - Integrated Stripe payment system
- **Real-time Updates** - Live notifications and updates
- **Responsive Design** - Mobile-first, responsive UI

### Advanced Features
- **Event Chat** - Real-time event chat (owner, collaborators, and registered attendees); role badges (Owner / Collaborator / Attendee); message history persisted
- **Create Event Wizard** - 5-step flow: Basic Information → Event Details → Pricing & Media → Advanced Settings → Review & Publish
- **Image Upload** - Cloudinary integration for event images
- **Search & Filtering** - Advanced event search and filtering
- **Category Management** - Organize events by categories
- **User Profiles** - Comprehensive user profile management
- **Email Notifications** - Automated email notifications
- **Error Handling** - Comprehensive error handling and logging
- **Security** - Rate limiting, input validation, and security headers

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Material-UI** - React component library
- **React Router** - Client-side routing
- **Formik + Yup** - Form handling and validation
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time chat
- **Stripe** - Payment processing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens
- **Joi** - Data validation
- **Winston** - Logging library
- **Helmet** - Security middleware
- **Rate Limiting** - API rate limiting

### DevOps & Tools
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

## 📋 Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js** (v18.x or later)
- **npm** (v9.x or later) or **yarn**
- **MongoDB Atlas** account or local MongoDB instance
- **Clerk** account for authentication
- **Stripe** account for payments
- **Cloudinary** account for image storage

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/akashyap25/Eazy_Event.git
cd Eazy_Event
```

### 2. Backend Setup

The backend runs in a **separate repository**. Clone and run it first:

```bash
git clone https://github.com/akashyap25/eazy_event_server.git
cd eazy_event_server
npm install
cp .env.example .env
# Edit .env (MONGO_URI, JWT_SECRET, etc.)
npm start
```

See [eazy_event_server](https://github.com/akashyap25/eazy_event_server) for full backend setup and environment variables.

### 3. Frontend Setup

Install dependencies:
```bash
npm install
```

Create environment file:
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
VITE_SERVER_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

Start the frontend development server:
```bash
npm run dev
```

## 🧪 Testing

Backend tests are in the [eazy_event_server](https://github.com/akashyap25/eazy_event_server) repo (`npm test` there).

## 📚 API Documentation

### Authentication
All protected routes require authentication via Clerk.

### Events API
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events/create` - Create new event (protected)
- `PUT /api/events/:id` - Update event (protected)
- `DELETE /api/events/:id` - Delete event (protected)
- `GET /api/events/user/:id` - Get user's events (protected)

### Users API
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:clerkId` - Update user
- `DELETE /api/users/:clerkId` - Delete user

## 🔒 Security Features

- **Authentication** - Clerk-based authentication
- **Authorization** - Role-based access control
- **Input Validation** - Joi schema validation
- **Rate Limiting** - API rate limiting
- **Security Headers** - Helmet.js security headers
- **CORS** - Configured CORS policy
- **Error Handling** - Comprehensive error handling

## 🚀 Deployment

### Backend Deployment (Railway/Heroku)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Frontend Deployment (Vercel/Netlify)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

## 📱 Screenshots

### Home Page
![Home Page](https://drive.google.com/file/d/1AheU7_Hpg_7IYi2AI-ycJySScDgvSz3Z/view?usp=sharing)

### Event Management
![Event Management](https://drive.google.com/file/d/1DA0k_ZtStlToqs0LSvAlVPdoDfwWgsc4/view?usp=sharing)

### Task Management
![Task Management](https://drive.google.com/file/d/1kd4Dl66apz4vY1DU8xi4tcTfR3Iua7gR/view?usp=sharing)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Anurag Kumar** - [anuragkashyap026@gmail.com](mailto:anuragkashyap026@gmail.com)

## 🙏 Acknowledgments

- Clerk for authentication services
- Stripe for payment processing
- Cloudinary for image storage
- Material-UI for UI components
- All contributors and users

