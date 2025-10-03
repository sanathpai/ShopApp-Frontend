# ZambiaShoppe — Frontend (React) 

This is the React frontend for ZambiaShoppe, a comprehensive retail and inventory platform. It integrates with a Node.js/Express backend (running on a separate machine) that provides authentication, product management, AI-powered product recognition (CLIP), MySQL persistence, and S3 image storage.

If you're looking for the backend README, see "Backend Overview" below for environment variables and run instructions.

## ✨ Highlights

- **Product Management**: Add, edit, view, and delete products with images
- **Inventory Management**: Track stock, reconcile inventory, manage stock entries
- **Sales & Purchases**: Record and manage sales transactions and purchase orders
- **Shop Management**: Manage multiple shop locations and details
- **Supplier & Market Management**: Maintain suppliers and track markets
- **Units & Customers**: Define measurement units and manage customer transactions
- **Analytics Dashboard**: Chart.js-based insights and reporting
- **PWA**: Offline support, installable, background sync, network status monitoring
- **Images**: S3 and base64 uploads with compression and fallbacks
- **RBAC**: Admin/user roles with protected routes
- **Responsive UI**: Material-UI (MUI) components and theme

## 🛠️ Tech Stack (Frontend)

- React 18.3.1, React Router DOM 6.24.0
- MUI 5.15.20
- Axios 1.7.2
- Chart.js 4.4.3
- Formik 2.4.6 + Yup 1.4.0
- jwt-decode 4.0.0
- Moment.js 2.30.1
- React Quill 2.0.0
- File Saver 2.0.5, XLSX 0.18.5
- Workbox (service worker), Web Vitals

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── DashboardLayout.js
│   ├── InsightsNotificationBox.js
│   ├── ListItems.js
│   └── PrivateRoute.js
├── context/              # React Context for app state
│   └── ShopContext.js
├── pages/                # Application pages/routes
│   ├── admin/            # Admin-specific pages
│   ├── Add*.js           # Creation pages
│   ├── Edit*.js          # Update pages
│   ├── View*.js          # Listing pages
│   ├── Login.js
│   ├── Register.js
│   └── ...
├── services/             # API and business logic services
│   ├── api.js
│   └── insightsService.js
├── App.js                # Main application component
├── AxiosInstance.js      # HTTP client configuration
├── theme.js              # MUI theme configuration
└── index.js              # Application entry point
```

## ⚙️ Environment Variables (Frontend)

Create a `.env` in the project root:

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

Notes:
- For a remote backend, set `REACT_APP_API_BASE_URL=http://<backend-host>:8000/api`.
- Only variables prefixed with `REACT_APP_` are exposed to the frontend.

## 🚀 Getting Started (Frontend)

### Prerequisites
- Node.js 14+ and npm or yarn
- Running backend API (see Backend Overview below)

### Install and Run
```bash
git clone <repository-url>
cd ShopApp-Frontend
npm install
npm start
```
Open `http://localhost:3000` in your browser.

### Production Build
```bash
npm run build
```
Outputs to `build/`.

## 🔐 Authentication & Security (Frontend)

- JWT-based auth; tokens stored and attached to API requests via `AxiosInstance.js`
- Automatic logout on token expiration; role-based route protection using `PrivateRoute.js`
- Form validation with Yup; inputs sanitized; HTTPS recommended in production

## 🧰 API Usage from Frontend

- Base URL: `REACT_APP_API_BASE_URL`
- Common backend endpoints (consumed by this frontend):
  - Auth: `POST /api/auth/login`, `POST /api/auth/register`
  - Products: `GET/POST/PUT/DELETE /api/products`
  - CLIP Search: `POST /api/clip/search`, `POST /api/enhanced-clip/search`, `POST /api/optimized-clip/search`
  - Admin: `GET /api/admin/users`

## 📱 PWA Features

- Offline caching via Workbox service worker
- Installable on mobile/desktop
- Network status monitoring and background sync for queued actions

## 🖼️ Images

- Supports S3-backed URLs and base64 uploads
- Client-side compression before upload; fallback image handling

## 🧪 Testing

```bash
npm test
```
Runs tests in interactive watch mode.

## 🚀 Deployment (Frontend)

### Nginx
- Serve static files from the `build/` directory
- Proxy `/api` to the backend on port `8000`
- Example production base URL in frontend: `https://your-frontend-domain/api` (proxied)

This repository includes example nginx configs:
- `nginx-config.txt` — Basic config
- `nginx-config-with-proxy.txt` — With `/api` proxy
- `working-nginx-config.txt` — Known working variant
- `minimal-nginx-fix.txt` — Minimal fixes

### Docker
- You can containerize the frontend and serve it behind nginx using the above configs.

## 🏗️ Backend Overview (Separate Repository/Machine)

The backend is a Node.js/Express API with MySQL, JWT auth, S3 integration, email via Nodemailer, and AI/ML CLIP search. A Python environment is used for CLIP management. Typical environment variables:

```env
# Database
DB_HOST=localhost
DB_USER=<mysql_user>
DB_PASSWORD=<mysql_password>
DB_NAME=zambiashoppe
DB_PORT=3306

# Auth
JWT_SECRET=<jwt_secret>
SESSION_SECRET=<session_secret>

# Email
EMAIL_USER=<email>
EMAIL_PASS=<app_password>
EMAIL_RECEIVER=admin@zambiashoppe.com

# AWS S3
AWS_ACCESS_KEY_ID=<aws_access_key>
AWS_SECRET_ACCESS_KEY=<aws_secret_key>
AWS_REGION=<aws_region>
AWS_S3_BUCKET_NAME=<bucket_name>

# Server
PORT=8000
```

Backend run commands (illustrative):
```bash
cd backend
npm install
npm start              # development
npm run start:prod     # production
pm2 start ecosystem.config.js  # with PM2
```

CLIP (Python) setup (illustrative):
```bash
python3 -m venv clip_env
source clip_env/bin/activate
pip install torch transformers pillow numpy requests
```

## 🔌 API Base URLs

- Development: `http://localhost:8000/api`
- Production: Serve frontend via nginx and proxy `/api` to the backend

## 🧭 Troubleshooting

- 401/403 errors: Verify JWT validity and role permissions; re-login if expired
- Network errors: Check `REACT_APP_API_BASE_URL`, CORS on backend, and nginx proxy rules
- Images not loading: Ensure S3 credentials and bucket CORS are correct; verify `AWS_S3_BUCKET_NAME`
- PWA caching issues after deploy: Hard refresh or bump service worker cache version

## 📝 Scripts

- `npm start` — Start dev server
- `npm run build` — Create production build
- `npm test` — Run test suite
- `npm run eject` — Eject from CRA (irreversible)

## 🤝 Contributing

1) Fork the repo
2) Create a branch: `git checkout -b feature/your-change`
3) Commit: `git commit -m "feat: your change"`
4) Push and open a PR

## 📄 License

MIT/ISC style. See repository license file for details.

---
Built with React, Express, MySQL, and CLIP.
