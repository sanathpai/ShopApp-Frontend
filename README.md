# ShopApp Frontend

A comprehensive React-based frontend application for managing retail business operations, including inventory, sales, purchases, suppliers, and business insights.

## 🚀 Features

### Core Business Management
- **Product Management**: Add, edit, and view products with detailed information
- **Inventory Management**: Track stock levels, add inventory entries, and reconcile discrepancies
- **Sales Management**: Record and manage sales transactions
- **Purchase Management**: Track purchases from suppliers
- **Supplier Management**: Manage supplier information and relationships
- **Shop Management**: Handle multiple shop locations
- **Market Management**: Organize products by markets
- **Unit Management**: Define and manage measurement units

### Advanced Features
- **Business Insights**: AI-powered analytics and business recommendations
- **Customer Transactions**: Track customer purchase history
- **User Authentication**: Secure login/register with JWT tokens
- **Role-based Access**: Admin and regular user roles
- **Data Export**: Export data to Excel format
- **Responsive Design**: Mobile-friendly interface using Material-UI

### Admin Features
- **User Management**: View and manage all users
- **User Activity Tracking**: Monitor user purchases and sales
- **System Administration**: Administrative dashboard and controls

## 🛠️ Technology Stack

- **Frontend Framework**: React 18.3.1
- **UI Library**: Material-UI (MUI) 5.15.20
- **Routing**: React Router DOM 6.24.0
- **HTTP Client**: Axios 1.7.2
- **Form Management**: Formik 2.4.6 with Yup validation
- **Charts**: Chart.js 4.4.3 with React Chart.js 2
- **Rich Text Editor**: React Quill 2.0.0
- **Authentication**: JWT with automatic token refresh
- **Date Handling**: Moment.js 2.30.1
- **File Operations**: File-saver 2.0.5, XLSX 0.18.5
- **PWA Support**: Workbox for service workers

## 📋 Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- Modern web browser with JavaScript enabled

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ShopApp-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - The application connects to the backend API at `https://shoppeappnow.com/api`
   - Ensure you have proper network access to the backend service

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - The application will automatically reload when you make changes

## 🏗️ Build and Deployment

### Development Build
```bash
npm run build
```

### Production Deployment
The application is configured for deployment with Nginx. Use the provided nginx configuration files:

- `nginx-config.txt` - Full production configuration with SSL
- `working-nginx-config.txt` - Simplified working configuration
- `nginx-config-with-proxy.txt` - Configuration with proxy settings

### Deployment Steps
1. Build the application: `npm run build`
2. Copy the `build` folder contents to your web server directory
3. Configure Nginx using one of the provided configuration files
4. Set up SSL certificates (Let's Encrypt recommended)
5. Restart Nginx service

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── DashboardLayout.js
│   ├── InsightsNotificationBox.js
│   ├── ListItems.js
│   └── PrivateRoute.js
├── pages/               # Application pages
│   ├── admin/          # Admin-specific pages
│   ├── Add*.js         # Add/Create pages
│   ├── Edit*.js        # Edit/Update pages
│   ├── View*.js        # List/View pages
│   ├── Login.js
│   ├── Register.js
│   └── ...
├── services/           # API services
│   └── api.js         # Axios configuration
├── context/           # React Context providers
├── theme.js           # Material-UI theme configuration
└── App.js            # Main application component
```

## 🔐 Authentication

The application uses JWT-based authentication:

- **Login**: Users authenticate with email/password
- **Token Storage**: JWT tokens stored in localStorage
- **Auto-refresh**: Automatic token refresh on API calls
- **Logout**: Automatic logout on token expiration (401 errors)
- **Protected Routes**: Private routes require authentication

## 🎨 UI/UX Features

- **Material Design**: Clean, modern interface using Material-UI
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Consistent theming throughout the application
- **Loading States**: Proper loading indicators for better UX
- **Error Handling**: User-friendly error messages and validation
- **Data Tables**: Sortable, filterable data tables with pagination

## 📊 Business Insights

The application includes an AI-powered insights feature that provides:
- Sales performance analysis
- Inventory optimization recommendations
- Business trend identification
- Custom insights based on user data

## 🔧 Configuration

### API Configuration
The API base URL is configured in `src/services/api.js`:
```javascript
baseURL: 'https://shoppeappnow.com/api'
```

### Theme Configuration
Customize the application theme in `src/theme.js`:
- Primary and secondary colors
- Typography settings
- Component styling overrides

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📝 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App (irreversible)

## 🚀 Performance Optimizations

- **Code Splitting**: Automatic code splitting with React Router
- **Service Workers**: PWA capabilities with Workbox
- **Asset Optimization**: Gzip compression and caching headers
- **Bundle Analysis**: Use `npm run build` to analyze bundle size

## 🔒 Security Features

- **HTTPS Only**: Production deployment uses SSL/TLS
- **Security Headers**: XSS protection, content type options, frame options
- **Input Validation**: Client-side validation with Yup schemas
- **Token Security**: Secure JWT token handling
- **CORS Configuration**: Proper cross-origin resource sharing

## 📱 Progressive Web App (PWA)

The application includes PWA features:
- Service worker for offline functionality
- App manifest for installation
- Background sync capabilities
- Cache strategies for improved performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Check the application logs for error details
- Verify API connectivity to `https://shoppeappnow.com/api`
- Ensure proper authentication tokens are present
- Review browser console for client-side errors

## 🔄 Version History

- **v0.1.0** - Initial release with core business management features
- Features include: Product management, inventory tracking, sales/purchase management, business insights, and admin panel

---

**Note**: This application requires a backend API service running at `https://shoppeappnow.com/api` for full functionality.
