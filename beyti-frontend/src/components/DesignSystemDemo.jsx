/**
 * Design System Demo
 *
 * This component showcases all design tokens and how to use them.
 * Use this as a reference for implementing new components.
 */

import React from 'react';
import Button from './Button';
import CRUDButton from './CRUDButton';
import NavigationButton from './NavigationButton';
import AnalyticsCard from './AnalyticsCard';
import StatusChip from './StatusChip';
import FilterDropdown from './FilterDropdown';
import { Table, TableHeader, TableBody, TableRow } from './Table';
import CardChecklist from './CardChecklist';
import PageHeader from './PageHeader';
import SidebarProfile from './SidebarProfile';

const DesignSystemDemo = () => {
  return (
    <div className="min-h-screen bg-cream-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-display-h1 text-charcoal-600">
            Beyti Design System
          </h1>
          <p className="text-body-regular text-charcoal-400">
            A comprehensive showcase of our design tokens and components
          </p>
        </header>

        {/* Typography Section */}
        <section className="bg-grey-200 rounded-lg p-8 shadow-soft-lift">
          <h2 className="text-display-h2 text-charcoal-600 mb-6">Typography</h2>

          <div className="space-y-6">
            <div>
              <p className="text-label-medium text-charcoal-400 mb-2">Display H1 (Merriweather)</p>
              <h1 className="text-display-h1 text-charcoal-600">The quick brown fox jumps over the lazy dog</h1>
            </div>

            <div>
              <p className="text-label-medium text-charcoal-400 mb-2">Display H2 (Merriweather)</p>
              <h2 className="text-display-h2 text-charcoal-600">The quick brown fox jumps over the lazy dog</h2>
            </div>

            <div>
              <p className="text-label-medium text-charcoal-400 mb-2">Metric H3 (Merriweather)</p>
              <h3 className="text-metric-h3 text-charcoal-600">1,234</h3>
            </div>

            <div>
              <p className="text-label-medium text-charcoal-400 mb-2">Card H2 (Merriweather)</p>
              <h2 className="text-card-h2 text-charcoal-600">Recent Activity</h2>
            </div>

            <div>
              <p className="text-label-medium text-charcoal-400 mb-2">Light H3 (Merriweather)</p>
              <h3 className="text-light-h3 text-charcoal-600">Pending Approvals</h3>
            </div>

            <div>
              <p className="text-label-medium text-charcoal-400 mb-2">Body Medium (Inter)</p>
              <p className="text-body-medium text-charcoal-600">The quick brown fox jumps over the lazy dog</p>
            </div>

            <div>
              <p className="text-label-medium text-charcoal-400 mb-2">Body Regular (Inter)</p>
              <p className="text-body-regular text-charcoal-600">The quick brown fox jumps over the lazy dog</p>
            </div>
          </div>
        </section>

        {/* Color Palette Section */}
        <section className="bg-grey-200 rounded-lg p-8 shadow-soft-lift">
          <h2 className="text-display-h2 text-charcoal-600 mb-6">Color Palette</h2>

          <div className="space-y-6">
            {/* Brand Colors */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-3">Brand - Sage</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-20 bg-sage-100 rounded-md border border-grey-stroke"></div>
                  <p className="text-label-medium text-charcoal-600">sage-100</p>
                  <p className="text-body-regular text-charcoal-400">#EEF0EF</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-sage-500 rounded-md"></div>
                  <p className="text-label-medium text-charcoal-600">sage-500</p>
                  <p className="text-body-regular text-charcoal-400">#556B5C</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-sage-700 rounded-md"></div>
                  <p className="text-label-medium text-charcoal-600">sage-700</p>
                  <p className="text-body-regular text-charcoal-400">#3C5243</p>
                </div>
              </div>
            </div>

            {/* Status Colors */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-3">Status Colors</h3>
              <div className="grid grid-cols-3 gap-4">
                {/* Success */}
                <div className="space-y-2">
                  <div className="h-20 bg-success-btn rounded-md"></div>
                  <p className="text-label-medium text-charcoal-600">success-btn</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-success-bg rounded-md"></div>
                  <p className="text-label-medium text-charcoal-600">success-bg</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-success-text rounded-md"></div>
                  <p className="text-label-medium text-charcoal-600">success-text</p>
                </div>

                {/* Error */}
                <div className="space-y-2">
                  <div className="h-20 bg-error-btn rounded-md"></div>
                  <p className="text-label-medium text-charcoal-600">error-btn</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-error-bg rounded-md"></div>
                  <p className="text-label-medium text-charcoal-600">error-bg</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-error-text rounded-md"></div>
                  <p className="text-label-medium text-charcoal-600">error-text</p>
                </div>

                {/* Danger */}
                <div className="space-y-2">
                  <div className="h-20 bg-danger-btn rounded-md"></div>
                  <p className="text-label-medium text-charcoal-600">danger-btn</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-danger-bg rounded-md"></div>
                  <p className="text-label-medium text-charcoal-600">danger-bg</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-danger-text rounded-md"></div>
                  <p className="text-label-medium text-charcoal-600">danger-text</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NEW COMPONENTS - From PDF Specifications */}
        <section className="bg-grey-200 rounded-lg p-8 shadow-soft-lift">
          <h2 className="text-display-h2 text-charcoal-600 mb-6">Component Library - From Specifications</h2>

          <div className="space-y-12">
            {/* 1. CRUD Buttons */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">1. CRUD Buttons</h3>
              <p className="text-body-regular text-charcoal-400 mb-4">
                Fixed-width buttons (150px x 42px) for CRUD operations
              </p>
              <div className="flex flex-wrap gap-4">
                <CRUDButton variant="success">Accept</CRUDButton>
                <CRUDButton variant="error">Reject</CRUDButton>
                <CRUDButton variant="danger">Pending</CRUDButton>
                <CRUDButton variant="neutral">View</CRUDButton>
                <CRUDButton variant="outline">Accept</CRUDButton>
              </div>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto mt-4">
                <code>{`<CRUDButton variant="success">Accept</CRUDButton>
<CRUDButton variant="error">Reject</CRUDButton>
<CRUDButton variant="danger">Pending</CRUDButton>
<CRUDButton variant="neutral">View</CRUDButton>
<CRUDButton variant="outline">Accept</CRUDButton>`}</code>
              </pre>
            </div>

            {/* 2. Navigation Buttons */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">2. Navigation Buttons</h3>
              <p className="text-body-regular text-charcoal-400 mb-4">
                Sidebar navigation buttons (220px x 44px) with selected state
              </p>
              <div className="bg-sage-500 p-6 rounded-lg space-y-2 inline-block">
                <NavigationButton
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  }
                >
                  Dashboard
                </NavigationButton>
                <NavigationButton
                  selected
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  }
                >
                  Dashboard
                </NavigationButton>
              </div>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto mt-4">
                <code>{`<NavigationButton icon={<HomeIcon />}>Dashboard</NavigationButton>
<NavigationButton selected icon={<HomeIcon />}>Dashboard</NavigationButton>`}</code>
              </pre>
            </div>

            {/* 3. Analytics Cards */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">3. Analytics Cards</h3>
              <p className="text-body-regular text-charcoal-400 mb-4">
                Flexible metric display cards with single or multiple values
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                {/* Single metric with description */}
                <AnalyticsCard
                  title="Card title"
                  metrics={[{ value: '0', label: 'Last 30 Days' }]}
                />

                {/* Multiple metrics side by side */}
                <AnalyticsCard
                  title="Card title"
                  metrics={[
                    { value: '0', label: 'Confirmed' },
                    { value: '0', label: 'Pending' }
                  ]}
                />

                {/* Single metric without extra label */}
                <AnalyticsCard
                  title="Card title"
                  metrics={[{ value: '0' }]}
                />

                {/* Real data example */}
                <AnalyticsCard
                  title="Total Orders"
                  metrics={[{ value: '127', label: 'Last 30 Days' }]}
                />
              </div>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto mt-4">
                <code>{`// Single metric
<AnalyticsCard
  title="Card title"
  metrics={[{ value: '0', label: 'Last 30 Days' }]}
/>

// Multiple metrics
<AnalyticsCard
  title="Card title"
  metrics={[
    { value: '0', label: 'Confirmed' },
    { value: '0', label: 'Pending' }
  ]}
/>`}</code>
              </pre>
            </div>

            {/* 4. Status Chips */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">4. Status Chips</h3>
              <p className="text-body-regular text-charcoal-400 mb-4">
                Pill-shaped status indicators (36px height, hug contents width)
              </p>
              <div className="flex flex-wrap gap-3">
                <StatusChip variant="brand">Role</StatusChip>
                <StatusChip variant="success">Active</StatusChip>
                <StatusChip variant="error">Suspended</StatusChip>
                <StatusChip variant="danger">Pending</StatusChip>
                <StatusChip variant="neutral">Inactive</StatusChip>
              </div>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto mt-4">
                <code>{`<StatusChip variant="brand">Role</StatusChip>
<StatusChip variant="success">Active</StatusChip>
<StatusChip variant="error">Suspended</StatusChip>
<StatusChip variant="danger">Pending</StatusChip>
<StatusChip variant="neutral">Inactive</StatusChip>`}</code>
              </pre>
            </div>

            {/* 5. Filter Dropdown */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">5. Filter Dropdown</h3>
              <p className="text-body-regular text-charcoal-400 mb-4">
                Dropdown selector (140px x 42px) for filtering data
              </p>
              <div className="flex flex-wrap gap-3">
                <FilterDropdown label="Filter:" value="All" options={['All', 'Active', 'Inactive', 'Pending']} />
                <FilterDropdown label="Status:" value="Approved" options={['All', 'Approved', 'Rejected']} />
              </div>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto mt-4">
                <code>{`<FilterDropdown
  label="Filter:"
  value="All"
  options={['All', 'Active', 'Inactive']}
  onChange={(value) => console.log(value)}
/>`}</code>
              </pre>
            </div>

            {/* 6. Table */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">6. Table</h3>
              <p className="text-body-regular text-charcoal-400 mb-4">
                Complete table system with header, rows, filters, and actions
              </p>
              <Table
                title="Table Title"
                filters={[
                  { label: 'Filter:', value: 'All', options: ['All', 'Active', 'Inactive'] },
                  { label: 'Status:', value: 'All', options: ['All', 'Approved', 'Pending'] }
                ]}
                actionButton={<CRUDButton variant="success">Add New User</CRUDButton>}
              >
                <TableHeader columns={['Column name 1', 'Column name 2', 'Column name 3', 'Status', 'Action']} />
                <TableBody>
                  <TableRow
                    data={['Data name 1', 'Data name 2', 'Data name 3', <StatusChip variant="success">Active</StatusChip>]}
                    actions={
                      <>
                        <CRUDButton variant="success">Review</CRUDButton>
                        <CRUDButton variant="error">Reject</CRUDButton>
                      </>
                    }
                  />
                  <TableRow
                    data={['Data name 1', 'Data name 2', 'Data name 3', <StatusChip variant="danger">Pending</StatusChip>]}
                    actions={
                      <>
                        <CRUDButton variant="success">Review</CRUDButton>
                        <CRUDButton variant="error">Reject</CRUDButton>
                      </>
                    }
                  />
                </TableBody>
              </Table>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto mt-4">
                <code>{`<Table
  title="Table Title"
  filters={[...]}
  actionButton={<CRUDButton variant="success">Add New</CRUDButton>}
>
  <TableHeader columns={['Name', 'Email', 'Status', 'Action']} />
  <TableBody>
    <TableRow
      data={['John Doe', 'john@example.com', <StatusChip variant="success">Active</StatusChip>]}
      actions={<CRUDButton variant="success">Edit</CRUDButton>}
    />
  </TableBody>
</Table>`}</code>
              </pre>
            </div>

            {/* 7. Card Checklist */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">7. Card Checklist</h3>
              <p className="text-body-regular text-charcoal-400 mb-4">
                Checklist card with completed and pending items
              </p>
              <div className="max-w-md">
                <CardChecklist
                  title="Card title"
                  subheading="Subheading"
                  items={[
                    { text: 'Body Content', completed: true },
                    { text: 'Body Content', completed: true },
                    { text: 'Body Content', completed: true },
                    { text: 'Body Content', completed: false },
                    { text: 'Body Content', completed: false }
                  ]}
                />
              </div>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto mt-4">
                <code>{`<CardChecklist
  title="Card title"
  subheading="Subheading"
  items={[
    { text: 'Complete task 1', completed: true },
    { text: 'Pending task 2', completed: false }
  ]}
/>`}</code>
              </pre>
            </div>

            {/* 8. Page Header */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">8. Page Header</h3>
              <p className="text-body-regular text-charcoal-400 mb-4">
                Top page header with title, search, notifications, and user menu
              </p>
              <div className="border border-grey-stroke rounded-lg overflow-hidden">
                <PageHeader
                  title="Page Title"
                  withSearch
                  notificationCount={3}
                  userName="Ali"
                  userRole="Super Admin"
                />
              </div>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto mt-4">
                <code>{`<PageHeader
  title="Page Title"
  withSearch
  notificationCount={3}
  userName="Ali"
  userRole="Super Admin"
/>`}</code>
              </pre>
            </div>

            {/* 9. Sidebar Profile */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">9. Sidebar Profile</h3>
              <p className="text-body-regular text-charcoal-400 mb-4">
                User profile section for sidebar bottom
              </p>
              <div className="bg-sage-500 p-4 rounded-lg max-w-xs">
                <SidebarProfile userName="Ali" userRole="Super Admin" />
              </div>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto mt-4">
                <code>{`<SidebarProfile
  userName="Ali"
  userRole="Super Admin"
/>`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Button Variants Section */}
        <section className="bg-grey-200 rounded-lg p-8 shadow-soft-lift">
          <h2 className="text-display-h2 text-charcoal-600 mb-6">Button Components</h2>

          <div className="space-y-8">
            {/* Status Buttons */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">Status Action Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="success">Review Application</Button>
                <Button variant="error">Reject Request</Button>
                <Button variant="danger">Archive Item</Button>
              </div>
              <p className="text-body-regular text-charcoal-400 mt-3">
                These buttons use semantic status colors: success-btn, error-btn, and danger-btn
              </p>
            </div>

            {/* Other Variants */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">Other Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="ghost">Ghost Button</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">Button Sizes</h3>
              <div className="flex items-center flex-wrap gap-4">
                <Button variant="primary" size="small">Small Button</Button>
                <Button variant="primary" size="medium">Medium Button</Button>
                <Button variant="primary" size="large">Large Button</Button>
              </div>
            </div>

            {/* Disabled State */}
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-4">Disabled State</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="success" disabled>Disabled Success</Button>
                <Button variant="error" disabled>Disabled Error</Button>
                <Button variant="primary" disabled>Disabled Primary</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Alert/Notification Examples */}
        <section className="bg-grey-200 rounded-lg p-8 shadow-soft-lift">
          <h2 className="text-display-h2 text-charcoal-600 mb-6">Alert Components</h2>
          <p className="text-body-regular text-charcoal-400 mb-6">
            Status background colors (success-bg, error-bg, danger-bg) are used for alerts and badges
          </p>

          <div className="space-y-4">
            {/* Success Alert */}
            <div className="bg-success-bg border-l-4 border-success-btn p-4 rounded">
              <p className="text-body-medium text-success-text">
                Application approved successfully!
              </p>
            </div>

            {/* Error Alert */}
            <div className="bg-error-bg border-l-4 border-error-btn p-4 rounded">
              <p className="text-body-medium text-error-text">
                There was an error processing your request.
              </p>
            </div>

            {/* Danger/Warning Alert */}
            <div className="bg-danger-bg border-l-4 border-danger-btn p-4 rounded">
              <p className="text-body-medium text-danger-text">
                This action requires additional confirmation.
              </p>
            </div>
          </div>
        </section>

        {/* Card Example */}
        <section className="bg-grey-200 rounded-lg p-8 shadow-soft-lift">
          <h2 className="text-display-h2 text-charcoal-600 mb-6">Card Component Example</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metric Card */}
            <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
              <h3 className="text-card-h2 text-charcoal-600 mb-2">Total Sales</h3>
              <p className="text-metric-h3 text-sage-700">127</p>
              <p className="text-body-regular text-charcoal-400 mt-2">+12% from last month</p>
            </div>

            {/* Metric Card */}
            <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
              <h3 className="text-card-h2 text-charcoal-600 mb-2">Pending Reviews</h3>
              <p className="text-metric-h3 text-sage-700">23</p>
              <p className="text-body-regular text-charcoal-400 mt-2">Requires attention</p>
            </div>

            {/* Metric Card */}
            <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
              <h3 className="text-card-h2 text-charcoal-600 mb-2">Active Users</h3>
              <p className="text-metric-h3 text-sage-700">1,042</p>
              <p className="text-body-regular text-charcoal-400 mt-2">Online now</p>
            </div>
          </div>
        </section>

        {/* Usage Documentation */}
        <section className="bg-grey-200 rounded-lg p-8 shadow-soft-lift">
          <h2 className="text-display-h2 text-charcoal-600 mb-6">How to Use</h2>

          <div className="space-y-6 text-body-regular text-charcoal-600">
            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-2">Color Classes</h3>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto">
                <code>{`<div className="bg-sage-500 text-white">Brand background</div>
<p className="text-charcoal-600">Primary text color</p>
<div className="bg-success-bg text-success-text">Success message</div>`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-2">Typography Classes</h3>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto">
                <code>{`<h1 className="text-display-h1">Page Title</h1>
<h2 className="text-card-h2">Card Header</h2>
<p className="text-body-regular">Body text content</p>
<span className="text-label-medium">Label or caption</span>`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-2">Button Component</h3>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto">
                <code>{`import Button from './components/Button';

<Button variant="success" onClick={handleApprove}>
  Approve Request
</Button>

<Button variant="error" size="large" onClick={handleReject}>
  Reject Application
</Button>`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-card-h2 text-charcoal-600 mb-2">Effects & Shadows</h3>
              <pre className="bg-cream-50 p-4 rounded-md overflow-x-auto">
                <code>{`<div className="shadow-soft-lift rounded-md">
  Card with elevation
</div>`}</code>
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignSystemDemo;
