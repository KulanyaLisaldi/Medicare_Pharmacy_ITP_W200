# MediCare Pharmacy

A comprehensive pharmacy management system with role-based access for admins, doctors, pharmacists, delivery agents, and customers.

## Features

- **Role-based Authentication**: Secure login system with different dashboards for each user type
- **Admin Dashboard**: Complete system management with user management, inventory, orders, and analytics
- **Doctor Dashboard**: Patient management, appointments, prescriptions, and consultations
- **Pharmacist Dashboard**: Order processing, inventory management, and prescription fulfillment
- **Delivery Dashboard**: Delivery tracking, route management, and status updates
- **Customer Portal**: Profile management and order tracking
- **Email Notifications**: Automated verification emails on staff creation, welcome emails after verification

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MediCare_Pharmacy
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # In backend directory, create .env file
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Seed admin user**
   ```bash
   cd backend
   npm run seed:admin
   ```

5. **Set up email functionality (optional)**
   ```bash
   # Create .env file in backend directory
   cd backend
   # See EMAIL_SETUP.md for detailed instructions
   # Add SMTP configuration for real email sending
   ```

6. **Start the application**
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # Start frontend (in new terminal)
   cd frontend
   npm run dev
   ```

## Admin Access

### Default Admin Credentials
- **Email**: admin@medicare.com
- **Password**: Admin@12345

### How to Login as Admin

1. Navigate to the login page: `http://localhost:5173/login`
2. Enter the admin credentials:
   - Email: `admin@medicare.com`
   - Password: `Admin@12345`
3. Click "Sign In"
4. You will be automatically redirected to the Admin Dashboard

### Admin Dashboard Features

The admin dashboard provides comprehensive system management:

- **Overview**: System statistics and quick actions
- **User Management**: Create, edit, and manage all user accounts
  - **Staff Creation**: Create doctors, pharmacists, and delivery agents with comprehensive forms
  - **Doctor Profiles**: Include specialization, experience, achievements, memberships, and more
  - **Email Notifications**: Automatic verification emails on creation, welcome emails after verification
- **Inventory Management**: Manage pharmacy inventory (coming soon)
- **Order Management**: View and manage all orders (coming soon)
- **Appointment Management**: Manage doctor appointments (coming soon)
- **Delivery Management**: Track delivery status (coming soon)
- **Sales Analytics**: View sales reports and analytics (coming soon)

### Navigation Flow

When an admin logs in:
1. Login form validates credentials
2. System checks user role
3. Admin users are automatically redirected to `/admin/dashboard`
4. Admin dashboard loads with role-based access control

### Troubleshooting

If admin login doesn't work:

1. **Check if admin user exists**:
   ```bash
   cd backend
   npm run seed:admin
   ```

2. **Verify database connection**:
   - Ensure MongoDB is running
   - Check backend server is running on port 5001

3. **Check browser console**:
   - Open developer tools (F12)
   - Look for any error messages in the console

4. **Verify environment variables**:
   - Ensure all required environment variables are set
   - Check database connection string

## Development

### Project Structure
```
MediCare_Pharmacy/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── scripts/        # Database scripts
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context
│   │   └── layouts/       # Layout components
│   └── package.json
└── README.md
```

### Available Scripts

**Backend:**
- `npm run dev` - Start development server
- `npm run seed:admin` - Create admin user
- `npm start` - Start production server

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
