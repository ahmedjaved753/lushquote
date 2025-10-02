# LushQuote Project Memory Bank

## 🎯 Project Overview

**LushQuote** is a comprehensive web application designed to empower small to medium-sized businesses in generating and managing customer quotes efficiently. It streamlines the quote generation and management process through a customizable, shareable, and trackable system.

## 👥 User Roles

### Business Owner (Authenticated)

- Creates and manages quote templates
- Tracks submissions and manages subscription
- Full dashboard and management access

### Customer (Unauthenticated)

- Interacts with public quote forms
- Submits quote requests
- No authentication required

## 🏠 Core Application Modules

### 1. Dashboard (/Dashboard)

**Key Features:**

- Overview statistics (templates, submissions, revenue, averages)
- Monthly submission counter for free users
- Template list with quick actions (edit, copy link, view submissions)
- Recent submissions sidebar
- Create new template button (upgrade dialog for free users at limit)
- Stripe integration notifications
- Automatic monthly counter reset

### 2. Template Builder (/TemplateBuilder)

**Template Configuration:**

- Business information (name, description)
- Dynamic services with three types:
  - **Fixed Price**: One-time charge
  - **Per Unit**: Price × quantity with custom unit labels
  - **Recurring**: Subscription-based with frequency
- Selection methods: Checkbox, Numeric Stepper, Text Input
- Drag & drop service reordering
- Optional date/time request fields
- Branding editor (header background color)
- Footer branding (premium customizable, free locked)
- Live preview toggle
- Save/delete actions

**Free Tier Enforcement:**

- 1 template maximum
- Non-dismissible upgrade dialog blocks additional creation

### 3. Public Quote Form (/QuoteForm?template={templateId})

**Features:**

- Public access via unique URL
- Dynamic rendering based on template
- Real-time price calculation
- Customer information collection
- Optional date/time requests
- Submission handling with database storage
- Free tier limit enforcement (25 monthly submissions)
- Auto-increment monthly counter
- Status auto-update (new → viewed)
- Success confirmation with total

### 4. Quote Management (/QuoteManagement)

**Functionality:**

- List all submissions for user's templates
- Filters by status and template
- Submission cards with full details
- Status update actions
- View details and delete options
- Total quote value calculation

### 5. Settings (/Settings)

**Profile Settings:**

- Preferred name and time zone
- Default header color
- Notification email and preferences

**Account & Billing:**

- Current subscription display
- Upgrade/manage billing buttons
- Plan limitations clarity

**Data Management:**

- CSV export (premium only)
- Account deletion option

## 💰 Subscription Model

### Free Tier Limitations

- ❌ Limited to 1 template
- ❌ 25 submissions per month per template owner
- ❌ Forced LushQuote branding in footer
- ❌ No CSV export functionality

### Premium Tier Benefits

- ✅ Unlimited templates
- ✅ Unlimited monthly submissions
- ✅ Customizable/removable branding
- ✅ CSV export for all submission data

## 🛠 Technical Stack

### Frontend

- **React** - Component framework
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Lucide React** - Icons

### Backend (Original: Base44 → Migrating to: Supabase)

**Core Entities:**

- User
- QuoteTemplate
- QuoteSubmission

**Backend Functions:**

- `createCheckoutSession` - Stripe checkout initiation
- `createBillingPortalSession` - Stripe portal redirect
- `stripeWebhook` - Handles subscription events
- `incrementSubmissionCounter` - Monthly tracking and resets
- `getTemplatePublicData` - Public template access

### Authentication & Data

- **Google OAuth** for authentication
- **Supabase** for data persistence
- **Stripe** for subscription management
- **JSON Schema** with Row-Level Security

## 🔄 Key Business Logic

### Free Tier Enforcement Points

1. Template creation limit (1 maximum)
2. Monthly submission limit (25 per template owner)
3. Branding customization restrictions
4. Feature access limitations (CSV export)

### Automatic Processes

- Monthly submission counter reset
- Status updates on submission viewing
- Real-time price calculations
- Stripe webhook event handling

### Data Flow

1. Business owner creates template
2. Template generates public URL
3. Customer accesses quote form
4. Real-time price calculation during selection
5. Submission creates database records
6. Business owner manages via dashboard
7. Status tracking through completion

## 📱 Design Requirements

- Fully responsive (desktop + mobile)
- Modern, user-friendly interface
- Optimized UX patterns
- Color-coded status indicators
- Intuitive navigation flow

