import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const SettingsModal = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const themeOptions = [
    {
      id: 'light',
      name: 'Light Mode',
      icon: '☀️',
      description: 'Bright and clean interface'
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      icon: '🌙',
      description: 'Easy on the eyes'
    },
    {
      id: 'system',
      name: 'System Default',
      icon: '💻',
      description: 'Follow system preferences'
    }
  ];

  const handleThemeChange = (selectedTheme) => {
    if (selectedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
      localStorage.setItem('beyti-theme-preference', 'system');
    } else {
      setTheme(selectedTheme);
      localStorage.setItem('beyti-theme-preference', selectedTheme);
    }
  };

  const getCurrentPreference = () => {
    return localStorage.getItem('beyti-theme-preference') || theme;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-grey-200 dark:bg-charcoal-600 rounded-lg shadow-soft-lift w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-grey-stroke dark:border-charcoal-400">
            <h2 className="text-display-h2 text-charcoal-600 dark:text-cream-50">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-cream-100 dark:hover:bg-charcoal-500 rounded-md transition-colors"
            >
              <X size={20} className="text-charcoal-600 dark:text-cream-50" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Theme Section */}
            <div className="mb-6">
              <h3 className="text-body-large font-semibold text-charcoal-600 dark:text-cream-50 mb-3">
                Appearance
              </h3>
              <p className="text-body-small text-charcoal-500 dark:text-charcoal-300 mb-4">
                Choose how Beyti looks to you. Select a single theme, or sync with your system.
              </p>

              <div className="space-y-2">
                {themeOptions.map((option) => {
                  const isSelected = getCurrentPreference() === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleThemeChange(option.id)}
                      className={`
                        w-full p-4 rounded-lg border-2 transition-all
                        flex items-start gap-3 text-left
                        ${
                          isSelected
                            ? 'border-sage-500 bg-sage-50 dark:bg-sage-900/20'
                            : 'border-grey-stroke dark:border-charcoal-400 bg-cream-50 dark:bg-charcoal-500 hover:border-sage-300 dark:hover:border-sage-600'
                        }
                      `}
                    >
                      <div
                        className={`
                          p-2 rounded-md text-xl
                          ${
                            isSelected
                              ? 'bg-sage-500'
                              : 'bg-grey-stroke dark:bg-charcoal-400'
                          }
                        `}
                      >
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`
                            text-body-regular font-semibold
                            ${
                              isSelected
                                ? 'text-charcoal-600 dark:text-cream-50'
                                : 'text-charcoal-600 dark:text-cream-50'
                            }
                          `}
                        >
                          {option.name}
                        </div>
                        <div
                          className={`
                            text-label-small
                            ${
                              isSelected
                                ? 'text-charcoal-500 dark:text-charcoal-300'
                                : 'text-charcoal-400 dark:text-charcoal-300'
                            }
                          `}
                        >
                          {option.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-sage-500">
                          <div className="w-2 h-2 rounded-full bg-sage-100" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Future Settings Sections */}
            <div className="pt-4 border-t border-grey-stroke dark:border-charcoal-400">
              <p className="text-label-small text-charcoal-400 dark:text-charcoal-300 text-center">
                More settings coming soon
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-grey-stroke dark:border-charcoal-400">
            <button
              onClick={onClose}
              className="px-4 py-2 text-body-regular text-charcoal-600 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-500 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsModal;
