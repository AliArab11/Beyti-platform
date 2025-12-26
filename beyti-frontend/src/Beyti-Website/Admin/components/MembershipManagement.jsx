/**
 * Membership Management Component - Content Only
 *
 * Manages membership plans within the admin dashboard
 * Renders only the content area (no sidebar/header - handled by AdminView)
 */

import React, { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Table, TableHeader, TableBody, TableRow } from '../../../components/Table';
import CRUDButton from '../../../components/CRUDButton';
import StatusChip from '../../../components/StatusChip';
import {
  getMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  toggleMembershipPlanStatus
} from '../../../services/api';

const MembershipManagement = ({ renderContentOnly = true }) => {
  // State management
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    Name: '',
    Description: '',
    MonthlyPrice: '',
    DurationDays: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch membership plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await getMembershipPlans();
      setPlans(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Form handlers
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.Name.trim()) {
      setError('Plan name is required');
      return;
    }
    if (!formData.Description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.MonthlyPrice || formData.MonthlyPrice <= 0) {
      setError('Monthly price must be greater than 0');
      return;
    }
    if (!formData.DurationDays || formData.DurationDays <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const planData = {
        Name: formData.Name.trim(),
        Description: formData.Description.trim(),
        MonthlyPrice: parseFloat(formData.MonthlyPrice),
        DurationDays: parseInt(formData.DurationDays, 10)
      };

      if (editingId) {
        // Update existing plan - include IsActive status
        const existingPlan = plans.find(p => p.id === editingId);
        planData.IsActive = existingPlan?.isActive ?? true;
        await updateMembershipPlan(editingId, planData);
        setSuccess('Membership plan updated successfully');
      } else {
        // Create new plan
        await createMembershipPlan(planData);
        setSuccess('Membership plan created successfully');
      }

      // Reset form and close modal
      handleCloseModal();
      fetchPlans();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving plan:', err);
      setError(err.message || 'Failed to save membership plan');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setFormData({
      Name: plan.name || '',
      Description: plan.description || '',
      MonthlyPrice: plan.monthlyPrice || '',
      DurationDays: plan.durationDays || ''
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      Name: '',
      Description: '',
      MonthlyPrice: '',
      DurationDays: ''
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      Name: '',
      Description: '',
      MonthlyPrice: '',
      DurationDays: ''
    });
    setError(null);
  };

  const handleToggleStatus = async (plan) => {
    if (!confirm(`Are you sure you want to ${plan.isActive ? 'deactivate' : 'activate'} the "${plan.name}" plan?`)) {
      return;
    }

    try {
      await toggleMembershipPlanStatus(plan.id);
      setSuccess(`Plan "${plan.name}" ${plan.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error toggling status:', err);
      setError('Failed to toggle plan status');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error on input
  };

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Active' && plan.isActive) ||
      (statusFilter === 'Inactive' && !plan.isActive);

    const matchesSearch =
      plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Map status to StatusChip variant
  const getStatusVariant = (isActive) => isActive ? 'success' : 'neutral';

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-success-bg border-l-4 border-success-btn p-4 rounded">
          <p className="text-body-regular text-success-text font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
            {success}
          </p>
        </div>
      )}

      {error && !showModal && (
        <div className="bg-error-bg border-l-4 border-error-btn p-4 rounded">
          <p className="text-body-regular text-error-text font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
            {error}
          </p>
        </div>
      )}

      {/* Plans Table */}
      <Table
        title="All Membership Plans"
        filters={[
          {
            label: 'Status:',
            value: statusFilter,
            options: ['All', 'Active', 'Inactive'],
            onChange: setStatusFilter
          }
        ]}
        actionButton={
          <CRUDButton variant="success" onClick={handleAdd}>
            Add New Plan
          </CRUDButton>
        }
      >
        <TableHeader
          columns={['Plan Name', 'Description', 'Price', 'Duration', 'Status', 'Actions']}
        />
        <TableBody>
          {loading && filteredPlans.length === 0 ? (
            <TableRow
              data={[
                <div className="col-span-6 text-center py-8 text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Loading plans...
                </div>
              ]}
            />
          ) : filteredPlans.length === 0 ? (
            <TableRow
              data={[
                <div className="col-span-6 text-center py-8 text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  No membership plans found
                </div>
              ]}
            />
          ) : (
            filteredPlans.map((plan) => (
              <TableRow
                key={plan.id}
                data={[
                  // Plan Name
                  <div>
                    <p className="text-body-regular text-charcoal-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {plan.name || 'N/A'}
                    </p>
                    <p className="text-label-medium text-charcoal-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                      ID: {plan.id}
                    </p>
                  </div>,

                  // Description
                  <p className="text-body-regular text-charcoal-600 max-w-xs truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {plan.description || 'No description'}
                  </p>,

                  // Price
                  <p className="text-body-regular text-success-text font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    ${plan.monthlyPrice ? plan.monthlyPrice.toFixed(2) : '0.00'}/mo
                  </p>,

                  // Duration
                  <StatusChip variant="brand">
                    {plan.durationDays || 0} days
                  </StatusChip>,

                  // Status
                  <StatusChip variant={getStatusVariant(plan.isActive)}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </StatusChip>
                ]}
                actions={
                  <>
                    <CRUDButton variant="neutral" onClick={() => handleEdit(plan)}>
                      Edit
                    </CRUDButton>
                    <CRUDButton
                      variant={plan.isActive ? 'error' : 'success'}
                      onClick={() => handleToggleStatus(plan)}
                    >
                      {plan.isActive ? 'Deactivate' : 'Activate'}
                    </CRUDButton>
                  </>
                }
              />
            ))
          )}
        </TableBody>
      </Table>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-charcoal-600/50 flex items-center justify-center p-4 z-50">
          <div className="bg-grey-200 rounded-lg shadow-soft-lift max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-card-h2 text-charcoal-600" style={{ fontFamily: 'Merriweather, serif' }}>
                  {editingId ? 'Edit Membership Plan' : 'Add New Membership Plan'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="text-charcoal-400 hover:text-charcoal-600 transition-colors disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X size={24} weight="bold" />
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-error-bg border-l-4 border-error-btn p-4 rounded">
                  <p className="text-body-regular text-error-text" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Plan Name */}
                <div>
                  <label className="text-label-medium text-charcoal-600 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                    PLAN NAME *
                  </label>
                  <input
                    type="text"
                    name="Name"
                    value={formData.Name}
                    onChange={handleChange}
                    placeholder="e.g., Beyti Premium"
                    className="
                      w-full h-[42px] px-4
                      border border-charcoal-400 rounded-md
                      text-body-regular text-charcoal-600
                      placeholder:text-charcoal-400
                      focus:outline-none focus:ring-2 focus:ring-sage-500
                      bg-cream-50
                    "
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-label-medium text-charcoal-600 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                    DESCRIPTION *
                  </label>
                  <textarea
                    name="Description"
                    value={formData.Description}
                    onChange={handleChange}
                    placeholder="Describe the features and benefits..."
                    rows="4"
                    className="
                      w-full px-4 py-2
                      border border-charcoal-400 rounded-md
                      text-body-regular text-charcoal-600
                      placeholder:text-charcoal-400
                      focus:outline-none focus:ring-2 focus:ring-sage-500
                      bg-cream-50
                      resize-none
                    "
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Price and Duration Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Monthly Price */}
                  <div>
                    <label className="text-label-medium text-charcoal-600 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                      MONTHLY PRICE ($) *
                    </label>
                    <input
                      type="number"
                      name="MonthlyPrice"
                      value={formData.MonthlyPrice}
                      onChange={handleChange}
                      placeholder="35.00"
                      step="0.01"
                      min="0"
                      className="
                        w-full h-[42px] px-4
                        border border-charcoal-400 rounded-md
                        text-body-regular text-charcoal-600
                        placeholder:text-charcoal-400
                        focus:outline-none focus:ring-2 focus:ring-sage-500
                        bg-cream-50
                      "
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-label-medium text-charcoal-600 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                      DURATION (DAYS) *
                    </label>
                    <input
                      type="number"
                      name="DurationDays"
                      value={formData.DurationDays}
                      onChange={handleChange}
                      placeholder="30"
                      min="1"
                      className="
                        w-full h-[42px] px-4
                        border border-charcoal-400 rounded-md
                        text-body-regular text-charcoal-600
                        placeholder:text-charcoal-400
                        focus:outline-none focus:ring-2 focus:ring-sage-500
                        bg-cream-50
                      "
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-2">
                  <CRUDButton
                    type="submit"
                    variant="success"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingId ? 'Update Plan' : 'Create Plan')}
                  </CRUDButton>
                  <CRUDButton
                    type="button"
                    variant="neutral"
                    onClick={handleCloseModal}
                    disabled={loading}
                  >
                    Cancel
                  </CRUDButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipManagement;
