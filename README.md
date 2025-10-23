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
