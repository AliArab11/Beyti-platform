/**
 * Dashboard Template Page
 *
 * Complete dashboard implementation using all components from the design system.
 * Based on the specifications from Components_Updated_dashTemplate.pdf
 */

import React from 'react';
import { House, Users, ShieldCheck, FileText, Gear } from '@phosphor-icons/react';
import NavigationButton from '../components/NavigationButton';
import SidebarProfile from '../components/SidebarProfile';
import PageHeader from '../components/PageHeader';
import AnalyticsCard from '../components/AnalyticsCard';
import { Table, TableHeader, TableBody, TableRow } from '../components/Table';
import CRUDButton from '../components/CRUDButton';
import StatusChip from '../components/StatusChip';
import CardChecklist from '../components/CardChecklist';

const DashboardTemplate = () => {
  return (
    <div className="flex min-h-screen bg-cream-50">
      {/* Sidebar */}
      <aside className="w-[250px] bg-sage-500 flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <h1 className="text-display-h1 text-cream-200">Beyti Logo</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          <NavigationButton
            icon={<House size={20} weight="fill" />}
          >
            Dashboard
          </NavigationButton>
          <NavigationButton
            icon={<Users size={20} />}
          >
            User Management
          </NavigationButton>
          <NavigationButton
            selected
            icon={<ShieldCheck size={20} weight="fill" />}
          >
            Seller Approvals
          </NavigationButton>
          <NavigationButton
            icon={<FileText size={20} />}
          >
            Financials
          </NavigationButton>
          <NavigationButton
            icon={<Gear size={20} />}
          >
            Settings
          </NavigationButton>
        </nav>

        {/* Profile Section */}
        <SidebarProfile userName="Ali" userRole="Super Admin" />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Page Header */}
        <PageHeader
          title="Page Title"
          withSearch
          searchPlaceholder="Search Business name, contact..."
          notificationCount={5}
          userName="Ali"
          userRole="Super Admin"
        />

        {/* Content Area */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Top Row - Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 - Single metric with description */}
              <AnalyticsCard
                title="Card title"
                metrics={[{ value: '0', label: 'Last 30 Days' }]}
              />

              {/* Card 2 - Multiple metrics side by side */}
              <AnalyticsCard
                title="Card title"
                metrics={[
                  { value: '0', label: 'Confirmed' },
                  { value: '0', label: 'Pending' }
                ]}
              />

              {/* Card 3 - Single metric without label */}
              <AnalyticsCard
                title="Card title"
                metrics={[{ value: '0' }]}
              />
            </div>

            {/* Middle Row - Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Table
                  title="Table Title"
                  filters={[
                    {
                      label: 'Filter:',
                      value: 'All',
                      options: ['All', 'Active', 'Inactive', 'Pending']
                    },
                    {
                      label: 'Status:',
                      value: 'All',
                      options: ['All', 'Approved', 'Rejected', 'Pending']
                    }
                  ]}
                  actionButton={<CRUDButton variant="success">Add New User</CRUDButton>}
                >
                  <TableHeader
                    columns={[
                      'Column name 1',
                      'Column name 2',
                      'Column name 3',
                      'Status',
                      'Document',
                      'Action'
                    ]}
                  />
                  <TableBody>
                    <TableRow
                      data={[
                        'Data name 1',
                        'Data name 2',
                        'Data name 3',
                        <StatusChip variant="success">Active</StatusChip>,
                        'Data name 4'
                      ]}
                      actions={
                        <>
                          <CRUDButton variant="success">Review</CRUDButton>
                          <CRUDButton variant="error">Reject</CRUDButton>
                        </>
                      }
                    />
                    <TableRow
                      data={[
                        'Data name 1',
                        'Data name 2',
                        'Data name 3',
                        <StatusChip variant="danger">Pending</StatusChip>,
                        'Data name 4'
                      ]}
                      actions={
                        <>
                          <CRUDButton variant="success">Review</CRUDButton>
                          <CRUDButton variant="error">Reject</CRUDButton>
                        </>
                      }
                    />
                    <TableRow
                      data={[
                        'Data name 1',
                        'Data name 2',
                        'Data name 3',
                        <StatusChip variant="error">Suspended</StatusChip>,
                        'Data name 4'
                      ]}
                      actions={
                        <>
                          <CRUDButton variant="success">Review</CRUDButton>
                          <CRUDButton variant="error">Reject</CRUDButton>
                        </>
                      }
                    />
                  </TableBody>
                </Table>
              </div>

              {/* Right Column - Checklist Card */}
              <div>
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardTemplate;
