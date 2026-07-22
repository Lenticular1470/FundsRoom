# ERP CRM System

A comprehensive Enterprise Resource Planning and Customer Relationship Management system built with Next.js 16, React 19, and Framer Motion. The system features role-based access control with four different user roles, each with their own customized dashboards and feature sets.

## Features

### Authentication & Authorization
- **Role-Based Access Control**: Four distinct user roles with specialized dashboards
  - **Admin**: Full system access and management
  - **Sales**: Customer and order management
  - **Warehouse**: Inventory and stock management
  - **Accounts**: Financial reporting and invoicing
- **Secure Login System**: Form validation with React Hook Form and Zod
- **Demo Credentials**: Use any name and email for demo purposes

### Admin Dashboard
- **Overview Analytics**: Key performance indicators and metrics
- **Customer Management**: Full CRUD operations for customer database with search and filtering
- **Product Management**: Product catalog with stock level monitoring and low-stock alerts
- **Inventory Management**: Complete stock movement tracking with inbound/outbound logs
- **Sales Challans**: Delivery challan management with printing capabilities
- **Reports**: Comprehensive business analytics and report generation
- **Settings**: System configuration and user preferences

### Sales Dashboard
- **Weekly Performance**: Sales orders and revenue tracking
- **Customer Management**: Personalized customer list for sales representatives
- **Order Management**: Track and manage sales orders
- **Reports**: Sales-specific analytics and metrics
- **Settings**: Sales user preferences

### Warehouse Dashboard
- **Stock Status**: Visual representation of inventory levels by category
- **Low Stock Alerts**: Critical alerts for items below minimum stock levels
- **Stock Movements**: Track all inbound and outbound inventory transfers
- **Inventory Management**: Category-wise stock level monitoring
- **Reports**: Warehouse performance analytics
- **Settings**: Warehouse operation preferences

### Accounts Dashboard
- **Financial Overview**: Revenue, expenses, and profit margin tracking
- **Profit Trends**: Profit margin analysis over time
- **Invoice Management**: Track customer invoices and payment status
- **Transaction History**: Complete financial transaction records
- **Reports**: Detailed financial reports
- **Settings**: Accounting preferences

## Design & UX

### Color Scheme
- **Primary Color**: Golden Amber (oklch(0.65 0.18 70))
- **Accent Color**: Warm Orange (oklch(0.7 0.15 35))
- **Background**: Warm Beige (oklch(0.98 0.01 70))
- **Neutral Tones**: Carefully balanced grays for readability

### Animations & Interactions
- **Framer Motion Integration**: Smooth page transitions and component animations
- **Micro-interactions**: Button hover effects, form transitions, and loading states
- **Responsive Design**: Mobile-first approach with responsive grid layouts
- **Accessibility**: Semantic HTML, ARIA labels, and screen reader support

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod Validation
- **Animations**: Framer Motion
- **Charts**: Recharts for data visualization
- **Tables**: TanStack React Table
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Type Safety**: TypeScript

## Project Structure

```
/vercel/share/v0-project
├── app/
│   ├── page.tsx                    # Login page
│   ├── layout.tsx                  # Root layout with AuthProvider
│   ├── globals.css                 # Global styles and design tokens
│   └── dashboard/
│       ├── [role]/
│       │   ├── layout.tsx          # Dashboard layout with sidebar
│       │   ├── page.tsx            # Role-specific dashboard
│       │   ├── customers/          # Customer management
│       │   ├── products/           # Product management
│       │   ├── inventory/          # Inventory management
│       │   ├── challan/            # Sales challans
│       │   ├── reports/            # Reports
│       │   └── settings/           # Settings
│       ├── admin/                  # Admin dashboard pages
│       ├── sales/                  # Sales dashboard pages
│       ├── warehouse/              # Warehouse dashboard pages
│       └── accounts/               # Accounts dashboard pages
├── components/
│   ├── login-form.tsx              # Login form component
│   ├── sidebar.tsx                 # Dashboard sidebar
│   └── dashboard-header.tsx        # Dashboard header
├── lib/
│   ├── auth-context.tsx            # Authentication context
│   ├── types.ts                    # TypeScript types
│   └── utils.ts                    # Utility functions
└── package.json
```

## Getting Started

### Installation

1. **Install Dependencies**
   ```bash
   cd /vercel/share/v0-project
   pnpm install
   ```

2. **Run Development Server**
   ```bash
   pnpm dev
   ```

3. **Open in Browser**
   Navigate to `http://localhost:3000`

### Demo Login

The login form accepts any name and email combination. Select your desired role (Admin, Sales, Warehouse, or Accounts) and click Sign In.

**Demo Credentials:**
- **Name**: Demo User (or any name)
- **Email**: demo@example.com (or any email)
- **Role**: Select from the four role cards

## Features by Role

### Admin Role
- Full access to all modules
- Customer management with CRUD operations
- Product inventory management
- Complete inventory tracking
- Sales challan management
- Comprehensive reporting
- System settings configuration

### Sales Role
- Customer relationship management
- Sales order tracking
- Performance metrics
- Sales-specific reports
- Personal settings

### Warehouse Role
- Stock level monitoring
- Inbound/outbound tracking
- Low stock alerts
- Inventory reports
- Warehouse settings

### Accounts Role
- Invoice management
- Financial transaction tracking
- Profit margin analysis
- Revenue and expense tracking
- Financial reports
- Accounting settings

## Key Components

### Login Form
- Form validation using Zod schema
- Four animated role selection cards
- Gradient backgrounds for visual appeal
- Responsive grid layout

### Dashboard Layout
- Persistent sidebar navigation
- Role-specific menu items
- User profile display
- Quick logout button
- Smooth animations

### Data Tables
- Searchable and filterable
- Hover effects and transitions
- Action buttons (view, edit, delete)
- Responsive design

### Charts & Analytics
- Bar charts for comparison data
- Line charts for trends
- Pie charts for distribution
- Tooltip interactions
- Responsive containers

## Authentication Flow

1. User lands on login page
2. Enters name and email
3. Selects their role from four options
4. Clicks "Sign In"
5. Redirected to role-specific dashboard
6. Session persists in localStorage
7. Sidebar shows role-based navigation
8. User can logout to return to login

## Customization

### Adding New Users
- Update `/lib/auth-context.tsx` to add more authentication logic
- Extend the User interface in `/lib/types.ts`
- Add additional user fields as needed

### Extending Modules
- Create new pages in `/app/dashboard/[role]/[module]/`
- Follow the existing component patterns
- Reuse DashboardHeader and motion components
- Update sidebar navigation in `/components/sidebar.tsx`

### Changing Colors
- Edit design tokens in `/app/globals.css`
- Update the oklch color values in `:root` and `.dark` sections
- Colors automatically apply throughout the app

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Features

- Server-side rendering with Next.js
- Optimized images with next/image
- Code splitting and lazy loading
- CSS-in-JS with Tailwind for minimal bundle
- Framer Motion for GPU-accelerated animations

## Accessibility Features

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance
- Focus indicators on interactive elements

## Future Enhancements

- Database integration (Supabase, Neon)
- Real-time updates with WebSockets
- Advanced reporting with export to PDF/Excel
- Multi-language support
- Two-factor authentication
- User role management interface
- Audit logs
- API integrations

## License

MIT License - Feel free to use this project for your needs.

## Support

For issues or feature requests, please refer to the documentation or contact the development team.
