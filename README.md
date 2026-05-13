# Vitalia Frontend

Healthcare management system built with Vue 3, Vite, and a modular architecture.

## Tech Stack

- **Vue 3** - Composition API
- **Vite** - Build tool
- **Pinia** - State management
- **Vue I18n** - Internationalization
- **Axios** - HTTP client
- **json-server** - Mock REST API

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the mock API server**
   ```bash
   npm run server
   ```
   API will run at `http://localhost:3000`

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Frontend will run at `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── assets/              # Static assets
├── locales/             # i18n translations (en.json, es.json)
├── modules/             # Bounded contexts
│   ├── analytics/       # Admin dashboard, billing, users management
│   ├── billing/         # Billing context
│   ├── clinical/        # Doctor/Patient clinical records
│   ├── scheduling/      # Appointments management
│   ├── tenant/          # User profiles, healthcare centers
│   └── shared/          # Common layouts and components
├── router/              # Vue Router configuration
├── style.css            # Global styles
└── main.js              # Application entry point

server/
├── db.json              # Mock database
└── routes.json          # API routes configuration
```

## Module Architecture

### Analytics Module
- **AdminUsersView.vue** - User management with CRUD operations
- **AdminBillingView.vue** - Billing claims oversight
- **AdminUserModal.vue** - User creation/edit form
- **CustomSelect.vue** - Styled select component

### Tenant Module
- User profiles (Admin, Doctor, Patient)
- Healthcare centers management
- Appointment fees

### Clinical Module
- Doctor patient records
- Medical history
- Prescription management

### Scheduling Module
- Appointment management
- Doctor agenda
- Patient appointments

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run server` | Start mock JSON server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run deploy` | Deploy to Firebase |

## Environment Variables

- `.env.development` - Development settings
- `.env.production` - Production settings

## API Configuration

The frontend proxies API requests to `http://localhost:3000/api/v1` via Vite config.

## Internationalization

Translations are stored in `src/locales/`:
- `en.json` - English
- `es.json` - Spanish

## Features

- Dark theme UI with custom design system
- Responsive layouts
- Real-time data management
- Multi-role support (Admin, Doctor, Patient)
- CRUD operations for users, appointments, and records
- Localization support

## License

Private - Kinetia UPC