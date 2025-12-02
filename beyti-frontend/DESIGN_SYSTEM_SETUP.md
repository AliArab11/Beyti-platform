# Beyti Design System - Quick Start Guide

Your design system has been successfully implemented! Here's everything you need to know to start using it.

## What Was Created

### 1. **Design Tokens** ([`src/styles/design-tokens.css`](src/styles/design-tokens.css))
All your colors, typography, and effects defined as CSS custom properties.

### 2. **Tailwind Configuration** ([`src/index.css`](src/index.css))
Extended Tailwind v4 with your design tokens as utilities.

### 3. **Core Components** (Ready to use in your pages)
- **[Button](src/components/Button.jsx)** - Flexible buttons with semantic variants
- **[CRUDButton](src/components/CRUDButton.jsx)** - Fixed-size buttons for CRUD operations
- **[NavigationButton](src/components/NavigationButton.jsx)** - Sidebar navigation with selected states
- **[StatusChip](src/components/StatusChip.jsx)** - Pill-shaped status indicators
- **[AnalyticsCard](src/components/AnalyticsCard.jsx)** - Display metrics and analytics
- **[CardChecklist](src/components/CardChecklist.jsx)** - Checklist cards with completed/pending items
- **[FilterDropdown](src/components/FilterDropdown.jsx)** - Dropdown filters for tables
- **[Table](src/components/Table.jsx)** - Complete table system with headers and rows
- **[PageHeader](src/components/PageHeader.jsx)** - Top page header with search and user menu
- **[SidebarProfile](src/components/SidebarProfile.jsx)** - User profile section for sidebar

### 4. **Design System Demo** ([`src/components/DesignSystemDemo.jsx`](src/components/DesignSystemDemo.jsx))
Interactive showcase of all design tokens and components.

### 5. **Architecture Documentation** ([`DESIGN_SYSTEM_ARCHITECTURE.md`](DESIGN_SYSTEM_ARCHITECTURE.md))
Comprehensive guide on how the system works and how to extend it.

---

## Quick Start

### View the Design System

Add the demo to your app to see everything in action:

```jsx
// In App.jsx or your router
import DesignSystemDemo from './components/DesignSystemDemo';

function App() {
  return <DesignSystemDemo />;
}
```

Then run your dev server:
```bash
npm run dev
```

---

## Using the Design System

### Colors

```jsx
// Brand colors
<div className="bg-sage-500 text-white">Sidebar</div>
<div className="bg-cream-50">Page background</div>

// Status colors - Buttons
<button className="bg-success-btn text-white">Approve</button>
<button className="bg-error-btn text-white">Reject</button>
<button className="bg-danger-btn text-danger-text">Archive</button>

// Status colors - Alerts
<div className="bg-success-bg text-success-text">Success message</div>
<div className="bg-error-bg text-error-text">Error message</div>
```

### Typography

```jsx
// Display headers (Merriweather)
<h1 className="text-display-h1 text-charcoal-600">Page Title</h1>
<h2 className="text-display-h2 text-charcoal-600">Section Title</h2>

// Card headers
<h2 className="text-card-h2 text-charcoal-600">Card Title</h2>

// Metrics
<p className="text-metric-h3 text-sage-700">1,234</p>

// Body text (Inter)
<p className="text-body-medium text-charcoal-600">Medium body text</p>
<p className="text-body-regular text-charcoal-600">Regular body text</p>

// Labels
<span className="text-label-medium text-charcoal-400">LABEL</span>
```

---

## Component Library Guide

### Button Component

**Use for:** General-purpose buttons with flexible sizing and semantic variants.

```jsx
import Button from './components/Button';

// Status variants
<Button variant="success" onClick={handleApprove}>Review</Button>
<Button variant="error" onClick={handleReject}>Reject</Button>
<Button variant="danger" onClick={handleArchive}>Archive</Button>

// Other variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Ghost Button</Button>

// Sizes
<Button size="small">Small</Button>
<Button size="medium">Medium (default)</Button>
<Button size="large">Large</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

**Props:**
- `variant`: 'success' | 'error' | 'danger' | 'primary' | 'secondary' | 'ghost'
- `size`: 'small' | 'medium' | 'large'
- `fullWidth`: boolean
- `disabled`: boolean
- `onClick`: function
- `type`: 'button' | 'submit' | 'reset'

---

### CRUDButton Component

**Use for:** Fixed-size buttons for CRUD operations in tables and forms (150px x 42px).

```jsx
import CRUDButton from './components/CRUDButton';

// CRUD action buttons
<CRUDButton variant="success" onClick={handleAccept}>Accept</CRUDButton>
<CRUDButton variant="error" onClick={handleReject}>Reject</CRUDButton>
<CRUDButton variant="danger" onClick={handlePending}>Pending</CRUDButton>
<CRUDButton variant="neutral" onClick={handleView}>View Details</CRUDButton>
<CRUDButton variant="outline" onClick={handleEdit}>Edit</CRUDButton>
```

**Props:**
- `variant`: 'success' | 'error' | 'danger' | 'neutral' | 'outline'
- `onClick`: function
- `disabled`: boolean

**Best for:** Table action columns, form submit/cancel buttons, consistent spacing.

---

### NavigationButton Component

**Use for:** Sidebar navigation items with selected states (220px x 44px).

```jsx
import NavigationButton from './components/NavigationButton';
import { House, Users, Package } from '@phosphor-icons/react';

// Navigation menu
<NavigationButton
  icon={<House size={20} />}
  selected={true}
  onClick={() => navigate('/dashboard')}
>
  Dashboard
</NavigationButton>

<NavigationButton
  icon={<Users size={20} />}
  onClick={() => navigate('/users')}
>
  Users
</NavigationButton>

<NavigationButton
  icon={<Package size={20} />}
  onClick={() => navigate('/products')}
>
  Products
</NavigationButton>
```

**Props:**
- `icon`: React element (Phosphor icon recommended)
- `selected`: boolean
- `onClick`: function
- `disabled`: boolean

**Best for:** Sidebar navigation menus on sage-500 background.

---

### StatusChip Component

**Use for:** Role badges, status indicators, and labels (pill-shaped).

```jsx
import StatusChip from './components/StatusChip';

// Role indicators
<StatusChip variant="brand">Admin</StatusChip>
<StatusChip variant="brand">Seller</StatusChip>

// Status indicators
<StatusChip variant="success">Active</StatusChip>
<StatusChip variant="error">Suspended</StatusChip>
<StatusChip variant="danger">Pending</StatusChip>
<StatusChip variant="neutral">Inactive</StatusChip>
```

**Props:**
- `variant`: 'brand' | 'success' | 'error' | 'danger' | 'neutral'

**Best for:** User roles, account status, tag labels in tables.

---

### AnalyticsCard Component

**Use for:** Displaying metrics, statistics, and analytics data.

```jsx
import AnalyticsCard from './components/AnalyticsCard';

// Single metric
<AnalyticsCard
  title="Total Orders"
  metrics={[{ value: '1,234', label: '+12% from last month' }]}
/>

// Multiple metrics side by side
<AnalyticsCard
  title="User Statistics"
  metrics={[
    { value: '567', label: 'Active Users' },
    { value: '89', label: 'New Today' }
  ]}
/>

// Without title
<AnalyticsCard
  metrics={[{ value: '$24,567', label: 'Revenue' }]}
/>
```

**Props:**
- `title`: string (optional)
- `metrics`: array of `{ value, label }` objects
- `description`: string (alternative to metric label)

**Best for:** Dashboard stats, KPI displays, metric cards.

---

### CardChecklist Component

**Use for:** Displaying checklists with completed/pending items.

```jsx
import CardChecklist from './components/CardChecklist';

<CardChecklist
  title="Onboarding Progress"
  subheading="Complete your setup"
  items={[
    { text: 'Create account', completed: true },
    { text: 'Verify email', completed: true },
    { text: 'Add business details', completed: false },
    { text: 'Upload documents', completed: false }
  ]}
/>
```

**Props:**
- `title`: string (optional)
- `subheading`: string (optional)
- `items`: array of `{ text, completed }` objects

**Best for:** Task lists, onboarding flows, feature checklists.

---

### FilterDropdown Component

**Use for:** Filter controls for tables and lists (140px x 42px).

```jsx
import FilterDropdown from './components/FilterDropdown';

<FilterDropdown
  label="Status:"
  value="All"
  options={['All', 'Active', 'Pending', 'Suspended']}
  onChange={(value) => handleFilter(value)}
/>

<FilterDropdown
  label="Role:"
  value="Admin"
  options={['All', 'Admin', 'Seller', 'Customer']}
  onChange={(value) => setRoleFilter(value)}
/>
```

**Props:**
- `label`: string (e.g., "Filter:", "Status:")
- `value`: string (current selected value)
- `options`: array of strings
- `onChange`: function (receives selected value)

**Best for:** Table filters, search refinement, category selection.

---

### Table Component System

**Use for:** Complete table layouts with headers, rows, and actions.

```jsx
import { Table, TableHeader, TableBody, TableRow } from './components/Table';
import CRUDButton from './components/CRUDButton';
import FilterDropdown from './components/FilterDropdown';
import StatusChip from './components/StatusChip';

<Table
  title="User Management"
  filters={[
    {
      label: 'Status:',
      value: 'All',
      options: ['All', 'Active', 'Suspended'],
      onChange: (val) => setStatusFilter(val)
    }
  ]}
  actionButton={
    <CRUDButton variant="success" onClick={handleAddUser}>
      Add User
    </CRUDButton>
  }
>
  <TableHeader columns={['Name', 'Email', 'Role', 'Status', 'Actions']} />

  <TableBody>
    <TableRow
      data={[
        'Ali Arab',
        'ali@example.com',
        <StatusChip variant="brand">Admin</StatusChip>,
        <StatusChip variant="success">Active</StatusChip>
      ]}
      actions={
        <>
          <CRUDButton variant="neutral" onClick={() => handleView(1)}>
            View
          </CRUDButton>
          <CRUDButton variant="error" onClick={() => handleDelete(1)}>
            Delete
          </CRUDButton>
        </>
      }
    />

    {/* More rows... */}
  </TableBody>
</Table>
```

**Components:**
- `<Table>` - Main container with title, filters, and action button
- `<TableHeader>` - Column headers
- `<TableBody>` - Wrapper for rows
- `<TableRow>` - Individual row with data and actions

**Props:**

**Table:**
- `title`: string
- `filters`: array of filter objects (see FilterDropdown)
- `actionButton`: React element (typically CRUDButton)

**TableHeader:**
- `columns`: array of column names

**TableRow:**
- `data`: array of cell content (can be JSX)
- `actions`: React element with action buttons

**Best for:** User management, product lists, order history, any tabular data.

---

### PageHeader Component

**Use for:** Top page header with title, search, notifications, and user menu.

```jsx
import PageHeader from './components/PageHeader';

// Simple header
<PageHeader title="Dashboard" />

// With search
<PageHeader
  title="User Management"
  withSearch={true}
  searchPlaceholder="Search users..."
  onSearch={(value) => handleSearch(value)}
/>

// Full featured
<PageHeader
  title="Dashboard"
  withSearch={true}
  notificationCount={5}
  userName="Ali Arab"
  userRole="Super Admin"
  onUserMenuClick={(action) => handleUserAction(action)}
/>
```

**Props:**
- `title`: string (required)
- `withSearch`: boolean (shows search bar)
- `searchPlaceholder`: string
- `onSearch`: function (receives search value)
- `notificationCount`: number (badge on bell icon)
- `userName`: string
- `userRole`: string

**Best for:** Top of every page for consistent navigation.

---

### SidebarProfile Component

**Use for:** User profile section at bottom of sidebar.

```jsx
import SidebarProfile from './components/SidebarProfile';

<SidebarProfile
  userName="Ali Arab"
  userRole="Super Admin"
  avatarUrl="/path/to/avatar.jpg"
  onProfileClick={() => navigate('/profile')}
/>

// Without avatar (uses default icon)
<SidebarProfile
  userName="Ali Arab"
  userRole="Super Admin"
/>
```

**Props:**
- `userName`: string
- `userRole`: string
- `avatarUrl`: string (optional, defaults to icon)
- `onProfileClick`: function

**Best for:** Bottom of sidebar on sage-500 background, displays user info and quick actions.

---

## How to Use Components in Your Existing Pages

### Step 1: Import the Components You Need

```jsx
// At the top of your page file
import PageHeader from '../components/PageHeader';
import SidebarProfile from '../components/SidebarProfile';
import NavigationButton from '../components/NavigationButton';
import { Table, TableHeader, TableBody, TableRow } from '../components/Table';
import CRUDButton from '../components/CRUDButton';
import StatusChip from '../components/StatusChip';
import AnalyticsCard from '../components/AnalyticsCard';
import FilterDropdown from '../components/FilterDropdown';
```

### Step 2: Replace Existing Elements

**Before (Old Code):**
```jsx
<div className="header">
  <h1>Dashboard</h1>
  <input type="text" placeholder="Search..." />
</div>
```

**After (Using Design System):**
```jsx
<PageHeader
  title="Dashboard"
  withSearch={true}
  searchPlaceholder="Search..."
  userName="Ali Arab"
  userRole="Admin"
/>
```

### Step 3: Complete Page Example

Here's a full admin dashboard page using the design system:

```jsx
import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import SidebarProfile from '../components/SidebarProfile';
import NavigationButton from '../components/NavigationButton';
import { Table, TableHeader, TableBody, TableRow } from '../components/Table';
import CRUDButton from '../components/CRUDButton';
import StatusChip from '../components/StatusChip';
import AnalyticsCard from '../components/AnalyticsCard';
import { House, Users, Package, Gear } from '@phosphor-icons/react';

function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[260px] bg-sage-500 flex flex-col">
        <div className="p-6">
          <h1 className="text-display-h1 text-white">Beyti</h1>
        </div>

        <nav className="flex-1 px-5 space-y-2">
          <NavigationButton
            icon={<House size={20} />}
            selected={currentPage === 'dashboard'}
            onClick={() => setCurrentPage('dashboard')}
          >
            Dashboard
          </NavigationButton>
          <NavigationButton
            icon={<Users size={20} />}
            selected={currentPage === 'users'}
            onClick={() => setCurrentPage('users')}
          >
            Users
          </NavigationButton>
          <NavigationButton
            icon={<Package size={20} />}
            selected={currentPage === 'products'}
            onClick={() => setCurrentPage('products')}
          >
            Products
          </NavigationButton>
          <NavigationButton
            icon={<Gear size={20} />}
            selected={currentPage === 'settings'}
            onClick={() => setCurrentPage('settings')}
          >
            Settings
          </NavigationButton>
        </nav>

        <SidebarProfile
          userName="Ali Arab"
          userRole="Super Admin"
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 bg-cream-50">
        <PageHeader
          title="Dashboard"
          notificationCount={3}
          userName="Ali Arab"
          userRole="Super Admin"
        />

        <main className="p-6 space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-3 gap-6">
            <AnalyticsCard
              metrics={[{ value: '1,234', label: 'Total Users' }]}
            />
            <AnalyticsCard
              metrics={[{ value: '567', label: 'Active Sellers' }]}
            />
            <AnalyticsCard
              metrics={[{ value: '$24,567', label: 'Revenue' }]}
            />
          </div>

          {/* Users Table */}
          <Table
            title="Recent Users"
            filters={[
              {
                label: 'Status:',
                value: 'All',
                options: ['All', 'Active', 'Suspended'],
                onChange: (val) => console.log(val)
              }
            ]}
            actionButton={
              <CRUDButton variant="success" onClick={() => console.log('Add user')}>
                Add User
              </CRUDButton>
            }
          >
            <TableHeader columns={['Name', 'Email', 'Role', 'Status', 'Actions']} />
            <TableBody>
              <TableRow
                data={[
                  'Ali Arab',
                  'ali@example.com',
                  <StatusChip variant="brand">Admin</StatusChip>,
                  <StatusChip variant="success">Active</StatusChip>
                ]}
                actions={
                  <>
                    <CRUDButton variant="neutral" onClick={() => {}}>
                      View
                    </CRUDButton>
                    <CRUDButton variant="error" onClick={() => {}}>
                      Suspend
                    </CRUDButton>
                  </>
                }
              />
            </TableBody>
          </Table>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
```

### Step 4: Update Existing Components Gradually

You don't have to update everything at once! Replace components one at a time:

1. **Start with buttons:**
   - Replace `<button>` with `<Button>` or `<CRUDButton>`

2. **Add page headers:**
   - Add `<PageHeader>` to the top of each page

3. **Update tables:**
   - Replace custom table markup with `<Table>` components

4. **Add metrics:**
   - Use `<AnalyticsCard>` for dashboard stats

5. **Update sidebar:**
   - Use `<NavigationButton>` for navigation
   - Add `<SidebarProfile>` at the bottom

---

## Quick Migration Checklist

Use this checklist when updating an existing page:

- [ ] Import required components at the top
- [ ] Replace page header with `<PageHeader>`
- [ ] Update sidebar navigation with `<NavigationButton>`
- [ ] Add `<SidebarProfile>` to sidebar bottom
- [ ] Replace custom buttons with `<Button>` or `<CRUDButton>`
- [ ] Update status badges with `<StatusChip>`
- [ ] Replace tables with `<Table>` component system
- [ ] Add `<AnalyticsCard>` for metrics
- [ ] Apply design token classes (`bg-sage-500`, `text-display-h1`, etc.)
- [ ] Test all interactive elements (clicks, hovers, etc.)

---

### Shadows & Effects

```jsx
<div className="shadow-soft-lift rounded-lg">
  Card with elevation
</div>
```

---

## Semantic Naming Explained

### Status Colors Have Three Variants

Each status (success, error, danger) has three color tokens:

**Success:**
- `success-btn` (#5D755D) → Button backgrounds (clickable)
- `success-bg` (#D7E6D7) → Alert/badge backgrounds (informational)
- `success-text` (#3C5243) → Text in success contexts

**Error:**
- `error-btn` (#A45B58) → Button backgrounds
- `error-bg` (#FFCACA) → Alert/badge backgrounds
- `error-text` (#792E2B) → Text in error contexts

**Danger/Warning:**
- `danger-btn` (#F8CC8E) → Button backgrounds
- `danger-bg` (#FFE6B1) → Alert/badge backgrounds
- `danger-text` (#714C18) → Text in danger contexts

### When to Use Each

```jsx
// ✅ Correct
<button className="bg-success-btn">Approve</button>  // Action
<div className="bg-success-bg">Success alert</div>   // Message

// ❌ Incorrect
<button className="bg-success-bg">Approve</button>   // Too light
<div className="bg-success-btn">Success alert</div>  // Too dark
```

---

## Common Patterns

### Dashboard Card
```jsx
<div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
  <h2 className="text-card-h2 text-charcoal-600 mb-4">Card Title</h2>
  <p className="text-body-regular text-charcoal-600">Content here</p>
</div>
```

### Metric Display
```jsx
<div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift">
  <p className="text-light-h3 text-charcoal-400 mb-2">Total Sales</p>
  <p className="text-metric-h3 text-sage-700">127</p>
  <p className="text-body-regular text-charcoal-400 mt-2">+12% from last month</p>
</div>
```

### Success Alert
```jsx
<div className="bg-success-bg border-l-4 border-success-btn p-4 rounded">
  <p className="text-body-medium text-success-text">
    Application approved successfully!
  </p>
</div>
```

### Sidebar Navigation
```jsx
<aside className="bg-sage-500 min-h-screen p-4">
  <h1 className="text-display-h1 text-white mb-8">Beyti</h1>
  <nav className="space-y-2">
    <a className="text-body-medium text-white hover:bg-sage-700 p-2 rounded block">
      Dashboard
    </a>
    <a className="text-body-medium text-sage-100 hover:bg-sage-700 p-2 rounded block">
      Settings
    </a>
  </nav>
</aside>
```

---

## Design Token Reference

### All Available Color Utilities

**Brand:**
- `bg-sage-100`, `text-sage-100`, `border-sage-100`
- `bg-sage-500`, `text-sage-500`, `border-sage-500`
- `bg-sage-700`, `text-sage-700`, `border-sage-700`

**Neutrals:**
- `bg-charcoal-600`, `text-charcoal-600`
- `bg-charcoal-400`, `text-charcoal-400`
- `bg-cream-200`, `bg-cream-100`, `bg-cream-50`
- `bg-grey-200`, `bg-grey-stroke`

**Status:**
- `bg-success-btn/bg/text`, `text-success-btn/bg/text`
- `bg-error-btn/bg/text`, `text-error-btn/bg/text`
- `bg-danger-btn/bg/text`, `text-danger-btn/bg/text`

### All Typography Utilities

- `text-display-h1` - Page titles (Merriweather 32px)
- `text-display-h2` - Section titles (Merriweather 24px)
- `text-metric-h3` - Large numbers (Merriweather 36px)
- `text-card-h2` - Card headers (Merriweather 20px)
- `text-light-h3` - Light headers (Merriweather 18px)
- `text-body-medium` - Body text (Inter 18px)
- `text-body-regular` - Body text (Inter 16px)
- `text-button` - Button text (Inter 14px, uppercase)
- `text-label-medium` - Labels (Inter 12px, uppercase)

---

## Next Steps

1. **Explore the demo:**
   ```jsx
   import DesignSystemDemo from './components/DesignSystemDemo';
   // Add to your app to see all components
   ```

2. **Read the architecture guide:**
   See [`DESIGN_SYSTEM_ARCHITECTURE.md`](DESIGN_SYSTEM_ARCHITECTURE.md) to understand how to extend the system.

3. **Create new components:**
   Follow the Button component pattern in [`src/components/Button.jsx`](src/components/Button.jsx).

4. **Update existing components:**
   Replace hardcoded colors/fonts with design token utilities.

---

## Files Overview

### Design System Core
| File | Purpose |
|------|---------|
| [`src/styles/design-tokens.css`](src/styles/design-tokens.css) | All design tokens (colors, typography, effects) |
| [`src/index.css`](src/index.css) | Tailwind imports + theme extensions + custom utilities |
| [`DESIGN_SYSTEM_ARCHITECTURE.md`](DESIGN_SYSTEM_ARCHITECTURE.md) | How the system works and how to extend it |
| [`Design_System.md`](../Design_System.md) | Original design specification |

### Components Library
| Component | File | Purpose |
|-----------|------|---------|
| Button | [`src/components/Button.jsx`](src/components/Button.jsx) | Flexible buttons with semantic variants |
| CRUDButton | [`src/components/CRUDButton.jsx`](src/components/CRUDButton.jsx) | Fixed-size buttons for CRUD operations |
| NavigationButton | [`src/components/NavigationButton.jsx`](src/components/NavigationButton.jsx) | Sidebar navigation with selected states |
| StatusChip | [`src/components/StatusChip.jsx`](src/components/StatusChip.jsx) | Pill-shaped status indicators |
| AnalyticsCard | [`src/components/AnalyticsCard.jsx`](src/components/AnalyticsCard.jsx) | Display metrics and analytics |
| CardChecklist | [`src/components/CardChecklist.jsx`](src/components/CardChecklist.jsx) | Checklist cards with completed/pending items |
| FilterDropdown | [`src/components/FilterDropdown.jsx`](src/components/FilterDropdown.jsx) | Dropdown filters for tables |
| Table | [`src/components/Table.jsx`](src/components/Table.jsx) | Complete table system with headers and rows |
| PageHeader | [`src/components/PageHeader.jsx`](src/components/PageHeader.jsx) | Top page header with search and user menu |
| SidebarProfile | [`src/components/SidebarProfile.jsx`](src/components/SidebarProfile.jsx) | User profile section for sidebar |
| Demo | [`src/components/DesignSystemDemo.jsx`](src/components/DesignSystemDemo.jsx) | Interactive showcase of all tokens and components |

---

## Support

If you need help:
1. Check the **DesignSystemDemo** component for usage examples
2. Read the **Architecture Guide** for how things work
3. Refer to the original **Design_System.md** for color values

---

**Last Updated:** 2025-12-01
**Version:** 2.0.0 - Complete Component Library with Usage Guide

Happy building!
