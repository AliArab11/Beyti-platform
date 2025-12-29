import React, { useState } from 'react';
import Button from '../../../components/Button';
import ConfirmModal from '../../../components/ConfirmModal';
import { createStoreSection, updateStoreSection, deleteStoreSection } from '../../../services/api';

const SectionsManager = ({ sellerId, sections, onSectionsChange }) => {
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ name: '', sortOrder: 0 });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingSection) {
        await updateStoreSection(editingSection.id, sectionForm);
      } else {
        await createStoreSection(sellerId, sectionForm);
      }
      
      setSectionForm({ name: '', sortOrder: 0 });
      setEditingSection(null);
      onSectionsChange();
    } catch (err) {
      alert(err.message || 'Failed to save section');
    }
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setSectionForm({ name: section.name, sortOrder: section.sortOrder });
  };

  const handleDelete = async (id) => {
    await new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title: 'Delete Section',
        message: 'Are you sure you want to delete this section? Products in this section will not be deleted, but will lose their section assignment.',
        variant: 'danger',
        onConfirm: () => {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
          resolve(true);
        }
      });
    });

    try {
      await deleteStoreSection(id);
      onSectionsChange();
    } catch (err) {
      alert(err.message || 'Failed to delete section');
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setSectionForm({ name: '', sortOrder: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border-2 border-grey-stroke">
        <h3 className="text-card-h2 text-charcoal-600 mb-4">
          {editingSection ? 'Edit Section' : 'Add New Section'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
              Section Name *
            </label>
            <input
              type="text"
              required
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              placeholder="e.g., Cookies, Cakes, Offers"
              className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-label-medium text-charcoal-600 mb-2 font-semibold">
              Sort Order *
            </label>
            <input
              type="number"
              required
              min="0"
              value={sectionForm.sortOrder}
              onChange={(e) => setSectionForm({ ...sectionForm, sortOrder: parseInt(e.target.value) })}
              placeholder="0"
              className="w-full border-2 border-grey-stroke rounded-lg p-3 bg-white text-body-regular text-charcoal-600 focus:outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-100 transition-all"
            />
            <p className="text-xs text-charcoal-400 mt-1">Lower numbers appear first</p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          {editingSection && (
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" fullWidth={!editingSection}>
            {editingSection ? 'Update Section' : 'Add Section'}
          </Button>
        </div>
      </form>

      {/* Sections List */}
      <div>
        <h3 className="text-card-h2 text-charcoal-600 mb-4">
          Existing Sections ({sections.length})
        </h3>

        {sections.length === 0 ? (
          <div className="bg-grey-200 rounded-lg p-8 text-center border border-grey-stroke">
            <p className="text-body-medium text-charcoal-400">No sections yet</p>
            <p className="text-body-regular text-charcoal-400 mt-1">
              Add your first section using the form above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sections
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((section) => (
                <div
                  key={section.id}
                  className="bg-white rounded-lg p-4 border-2 border-grey-stroke hover:border-sage-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center font-bold text-sage-700">
                        {section.sortOrder}
                      </div>
                      <div>
                        <h4 className="text-body-large font-bold text-charcoal-600">
                          {section.name}
                        </h4>
                        <p className="text-body-regular text-charcoal-400">
                          {section.productCount || 0} products
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(section)}
                        className="text-sage-600 hover:text-sage-700 transition-colors p-2"
                        title="Edit section"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(section.id)}
                        className="text-error-btn hover:text-error-text transition-colors p-2"
                        title="Delete section"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant || 'danger'}
      />
    </div>
  );
};

export default SectionsManager;