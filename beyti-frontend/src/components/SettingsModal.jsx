import { useState, useEffect } from 'react';
import { X, Moon, Sun, Bell, GlobeHemisphereWest, FloppyDisk, SquaresFour, CheckCircle } from '@phosphor-icons/react';

export default function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: {
      email: true,
      push: true,
      bookingUpdates: true,
      serviceReminders: true,
    },
    language: 'en',
    autoSaveData: true,
    compactView: false,
  });

  const [saveMessage, setSaveMessage] = useState(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('beyti-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [isOpen]);

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNotificationToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleLanguageChange = (e) => {
    setSettings(prev => ({
      ...prev,
      language: e.target.value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem('beyti-settings', JSON.stringify(settings));
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => {
      setSaveMessage(null);
      onClose();
    }, 1500);
  };

  const handleReset = () => {
    const defaultSettings = {
      darkMode: false,
      notifications: {
        email: true,
        push: true,
        bookingUpdates: true,
        serviceReminders: true,
      },
      language: 'en',
      autoSaveData: true,
      compactView: false,
    };
    setSettings(defaultSettings);
    localStorage.setItem('beyti-settings', JSON.stringify(defaultSettings));
    setSaveMessage('Settings reset to defaults!');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-600 bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-charcoal-600 rounded-lg shadow-soft-lift w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-grey-stroke dark:border-charcoal-500">
            <h2 className="text-display-h2 text-charcoal-600 dark:text-cream-50 font-semibold">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-grey-200 dark:hover:bg-charcoal-500 rounded-md transition-colors"
            >
              <X size={24} className="text-charcoal-500 dark:text-cream-100" />
            </button>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className="mx-6 mt-4 flex items-center gap-3 p-4 rounded-md bg-success-bg text-success-text">
              <CheckCircle size={24} weight="fill" />
              <span className="text-body-regular font-medium">{saveMessage}</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Appearance Section */}
              <div className="space-y-4">
                <h3 className="text-display-h3 text-charcoal-600 dark:text-cream-50 font-semibold flex items-center gap-2">
                  {settings.darkMode ? <Moon size={24} weight="fill" /> : <Sun size={24} weight="fill" />}
                  Appearance
                </h3>

                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-cream-50 dark:bg-charcoal-500 rounded-lg border border-grey-stroke dark:border-charcoal-400">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      settings.darkMode ? 'bg-charcoal-600 dark:bg-charcoal-400' : 'bg-sage-100'
                    }`}>
                      {settings.darkMode ? (
                        <Moon size={20} weight="fill" className="text-sage-100" />
                      ) : (
                        <Sun size={20} weight="fill" className="text-sage-700" />
                      )}
                    </div>
                    <div>
                      <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">Dark Mode</p>
                      <p className="text-label-small text-charcoal-400 dark:text-cream-200">
                        {settings.darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('darkMode')}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                      settings.darkMode ? 'bg-sage-500' : 'bg-grey-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        settings.darkMode ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Compact View */}
                <div className="flex items-center justify-between p-4 bg-cream-50 dark:bg-charcoal-500 rounded-lg border border-grey-stroke dark:border-charcoal-400">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-sage-100 dark:bg-charcoal-400 flex items-center justify-center">
                      <SquaresFour size={20} className="text-sage-700 dark:text-sage-100" />
                    </div>
                    <div>
                      <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">Compact View</p>
                      <p className="text-label-small text-charcoal-400 dark:text-cream-200">Reduce spacing for more content</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('compactView')}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                      settings.compactView ? 'bg-sage-500' : 'bg-grey-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        settings.compactView ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Notifications Section */}
              <div className="space-y-4">
                <h3 className="text-display-h3 text-charcoal-600 dark:text-cream-50 font-semibold flex items-center gap-2">
                  <Bell size={24} weight="fill" />
                  Notifications
                </h3>

                <div className="space-y-3">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-4 bg-cream-50 dark:bg-charcoal-500 rounded-lg border border-grey-stroke dark:border-charcoal-400">
                    <div>
                      <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">Email Notifications</p>
                      <p className="text-label-small text-charcoal-400 dark:text-cream-200">Receive updates via email</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('email')}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                        settings.notifications.email ? 'bg-sage-500' : 'bg-grey-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings.notifications.email ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between p-4 bg-cream-50 dark:bg-charcoal-500 rounded-lg border border-grey-stroke dark:border-charcoal-400">
                    <div>
                      <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">Push Notifications</p>
                      <p className="text-label-small text-charcoal-400 dark:text-cream-200">Receive browser notifications</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('push')}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                        settings.notifications.push ? 'bg-sage-500' : 'bg-grey-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings.notifications.push ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Booking Updates */}
                  <div className="flex items-center justify-between p-4 bg-cream-50 dark:bg-charcoal-500 rounded-lg border border-grey-stroke dark:border-charcoal-400">
                    <div>
                      <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">Booking Updates</p>
                      <p className="text-label-small text-charcoal-400 dark:text-cream-200">Get notified about new bookings</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('bookingUpdates')}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                        settings.notifications.bookingUpdates ? 'bg-sage-500' : 'bg-grey-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings.notifications.bookingUpdates ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Service Reminders */}
                  <div className="flex items-center justify-between p-4 bg-cream-50 dark:bg-charcoal-500 rounded-lg border border-grey-stroke dark:border-charcoal-400">
                    <div>
                      <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">Service Reminders</p>
                      <p className="text-label-small text-charcoal-400 dark:text-cream-200">Reminders for upcoming services</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('serviceReminders')}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                        settings.notifications.serviceReminders ? 'bg-sage-500' : 'bg-grey-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings.notifications.serviceReminders ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preferences Section */}
              <div className="space-y-4">
                <h3 className="text-display-h3 text-charcoal-600 dark:text-cream-50 font-semibold flex items-center gap-2">
                  <GlobeHemisphereWest size={24} weight="fill" />
                  Preferences
                </h3>

                {/* Language Selection */}
                <div className="p-4 bg-cream-50 dark:bg-charcoal-500 rounded-lg border border-grey-stroke dark:border-charcoal-400">
                  <label className="block mb-2">
                    <span className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">Language</span>
                    <p className="text-label-small text-charcoal-400 dark:text-cream-200 mt-1">Choose your preferred language</p>
                  </label>
                  <select
                    value={settings.language}
                    onChange={handleLanguageChange}
                    className="w-full mt-2 px-3 py-2 border border-charcoal-400 dark:border-charcoal-300 rounded-md text-body-regular text-charcoal-600 dark:text-cream-50 dark:bg-charcoal-400 focus:outline-none focus:ring-2 focus:ring-sage-500"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic (العربية)</option>
                    <option value="fr">French (Français)</option>
                    <option value="es">Spanish (Español)</option>
                  </select>
                </div>

                {/* Auto Save Data */}
                <div className="flex items-center justify-between p-4 bg-cream-50 dark:bg-charcoal-500 rounded-lg border border-grey-stroke dark:border-charcoal-400">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-sage-100 dark:bg-charcoal-400 flex items-center justify-center">
                      <FloppyDisk size={20} className="text-sage-700 dark:text-sage-100" />
                    </div>
                    <div>
                      <p className="text-body-regular text-charcoal-600 dark:text-cream-50 font-medium">Auto-Save Data</p>
                      <p className="text-label-small text-charcoal-400 dark:text-cream-200">Automatically save form changes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('autoSaveData')}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                      settings.autoSaveData ? 'bg-sage-500' : 'bg-grey-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        settings.autoSaveData ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-grey-stroke dark:border-charcoal-500 bg-cream-50 dark:bg-charcoal-500">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-body-regular text-error-text hover:bg-error-bg rounded-md transition-colors font-medium"
            >
              Reset to Defaults
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-grey-stroke dark:border-charcoal-400 text-charcoal-600 dark:text-cream-50 rounded-md hover:bg-grey-200 dark:hover:bg-charcoal-400 transition-colors text-body-regular font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-sage-500 text-white rounded-md hover:bg-sage-700 transition-colors text-body-regular font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
