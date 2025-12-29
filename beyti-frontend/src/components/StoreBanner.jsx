import React, { useState } from 'react';
import { X, Palette } from '@phosphor-icons/react';

// Inject styles with CREATIVE professional themes
const styles = `
  .store-banner {
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .banner-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: rgba(0, 0, 0, 0.3);
    padding: 20px;
  }

  .store-logo {
    border-radius: 50%;
    background: white;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    flex-shrink: 0;
  }

  .store-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .store-name {
    color: white;
    font-weight: 700;
    margin: 0;
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
    text-align: center;
    line-height: 1.2;
  }

  /* ============================================
     THEME 1: Sunset Waves
     ============================================ */
  .theme-sunset-waves {
    background: linear-gradient(45deg, 
      var(--accent, #FF6B6B) 0%, 
      #FFE66D 50%, 
      var(--accent, #FF6B6B) 100%);
  }

  /* ============================================
     THEME 2: Ocean Depth (Layered)
     ============================================ */
  .theme-ocean-depth {
    background: 
      radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.4) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.4) 0%, transparent 50%),
      linear-gradient(135deg, var(--accent, #667eea) 0%, #764ba2 100%);
  }

  /* ============================================
     THEME 3: Forest Mist (Soft Gradient)
     ============================================ */
  .theme-forest-mist {
    background: linear-gradient(to bottom right,
      var(--accent, #134E5E) 0%,
      #1a6b7a 30%,
      #71B280 70%,
      #a8e6a1 100%);
  }

  /* ============================================
     THEME 4: Royal Velvet (Rich Texture)
     ============================================ */
  .theme-royal-velvet {
    background: 
      repeating-linear-gradient(45deg,
        transparent,
        transparent 10px,
        rgba(255,255,255,0.05) 10px,
        rgba(255,255,255,0.05) 20px),
      linear-gradient(135deg, #1e3c72 0%, var(--accent, #2a5298) 50%, #7e22ce 100%);
  }

  /* ============================================
     THEME 5: Warm Flame
     ============================================ */
  .theme-warm-flame {
    background: linear-gradient(-45deg, 
      var(--accent, #f12711) 0%, 
      #f5af19 50%, 
      var(--accent, #f12711) 100%);
  }

  /* ============================================
     THEME 6: Cool Breeze (Diagonal Stripes)
     ============================================ */
  .theme-cool-breeze {
    background: 
      repeating-linear-gradient(135deg,
        var(--accent, #00d2ff) 0px,
        var(--accent, #00d2ff) 10px,
        #3a7bd5 10px,
        #3a7bd5 20px);
  }

  /* ============================================
     THEME 7: Rose Garden (Floral Radial)
     ============================================ */
  .theme-rose-garden {
    background: 
      radial-gradient(circle at 50% 0%, var(--accent, #ED4264) 0%, transparent 50%),
      radial-gradient(circle at 0% 100%, #ED4264 0%, transparent 50%),
      radial-gradient(circle at 100% 100%, #FFEDBC 0%, transparent 50%),
      linear-gradient(135deg, var(--accent, #ED4264) 0%, #FFEDBC 100%);
  }

  /* ============================================
     THEME 8: Midnight Galaxy (Stars Effect)
     ============================================ */
  .theme-midnight-galaxy {
    background: 
      radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 2%),
      radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 2%),
      radial-gradient(circle at 40% 20%, rgba(255,255,255,0.1) 0%, transparent 2%),
      radial-gradient(circle at 90% 30%, rgba(255,255,255,0.1) 0%, transparent 2%),
      linear-gradient(135deg, #000428 0%, var(--accent, #004e92) 100%);
  }

  /* ============================================
     THEME 9: Peach Sherbet (Soft Waves)
     ============================================ */
  .theme-peach-sherbet {
    background: 
      linear-gradient(110deg, 
        var(--accent, #FFE259) 0%, 
        #FFA751 50%, 
        var(--accent, #FFE259) 100%);
  }

  /* ============================================
     THEME 10: Emerald Shine (Metallic)
     ============================================ */
  .theme-emerald-shine {
    background: 
      linear-gradient(145deg, 
        var(--accent, #11998e) 0%, 
        #38ef7d 33%, 
        var(--accent, #11998e) 66%, 
        #38ef7d 100%);
  }

  /* ============================================
     THEME 11: Cotton Candy Sky (Dreamy)
     ============================================ */
  .theme-cotton-candy-sky {
    background: 
      radial-gradient(circle at 30% 40%, rgba(251, 194, 235, 0.5) 0%, transparent 50%),
      radial-gradient(circle at 70% 60%, rgba(166, 193, 238, 0.5) 0%, transparent 50%),
      linear-gradient(180deg, var(--accent, #fbc2eb) 0%, #a6c1ee 100%);
  }

  /* ============================================
     THEME 12: Lava Stream (Bold)
     ============================================ */
  .theme-lava-stream {
    background: 
      linear-gradient(90deg, 
        var(--accent, #C33764) 0%, 
        #1D2671 50%, 
        var(--accent, #C33764) 100%);
  }

  /* ============================================
     THEME 13: Arctic Frost (Clean Minimal)
     ============================================ */
  .theme-arctic-frost {
    background: 
      linear-gradient(to bottom, 
        #e0eafc 0%, 
        #cfdef3 50%, 
        var(--accent, #e0eafc) 100%);
    border: 2px solid rgba(30, 58, 138, 0.2);
  }

  .theme-arctic-frost .banner-overlay {
    background: rgba(0, 0, 0, 0.1);
  }

  .theme-arctic-frost .store-name {
    color: #1e3a8a;
    text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.8);
  }

  /* ============================================
     THEME 14: Tropical Burst (Vibrant)
     ============================================ */
  .theme-tropical-burst {
    background: 
      radial-gradient(circle at 0% 0%, var(--accent, #f093fb) 0%, transparent 50%),
      radial-gradient(circle at 100% 100%, #f5576c 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, var(--accent, #f093fb) 0%, transparent 70%),
      linear-gradient(135deg, var(--accent, #f093fb) 0%, #f5576c 100%);
  }

  /* ============================================
     THEME 15: Golden Sunrise (Warm Glow)
     ============================================ */
  .theme-golden-sunrise {
    background: 
      radial-gradient(ellipse at top, var(--accent, #FDBB2D) 0%, transparent 60%),
      linear-gradient(135deg, var(--accent, #FDBB2D) 0%, #22C1C3 100%);
  }

  /* ============================================
     THEME 16: Deep Cosmos (Space)
     ============================================ */
  .theme-deep-cosmos {
    background: 
      radial-gradient(circle at 10% 20%, rgba(99, 0, 128, 0.8) 0%, transparent 40%),
      radial-gradient(circle at 90% 80%, rgba(111, 0, 0, 0.8) 0%, transparent 40%),
      linear-gradient(135deg, #200122 0%, var(--accent, #6f0000) 100%);
  }

  /* ============================================
     THEME 17: Lime Energy (Electric)
     ============================================ */
  .theme-lime-energy {
    background: 
      repeating-linear-gradient(90deg,
        var(--accent, #56ab2f) 0px,
        var(--accent, #56ab2f) 20px,
        #a8e063 20px,
        #a8e063 40px);
  }

  /* ============================================
     THEME 18: Berry Fusion (Rich Blend)
     ============================================ */
  .theme-berry-fusion {
    background: 
      radial-gradient(circle at 20% 30%, rgba(142, 45, 226, 0.6) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(74, 0, 224, 0.6) 0%, transparent 50%),
      linear-gradient(135deg, var(--accent, #8E2DE2) 0%, #4A00E0 100%);
  }

  /* ============================================
     THEME 19: Coral Paradise (Organic)
     ============================================ */
  .theme-coral-paradise {
    background: 
      linear-gradient(120deg, 
        var(--accent, #ff9a56) 0%, 
        #ff6a88 50%, 
        var(--accent, #ff9a56) 100%);
  }

  /* ============================================
     THEME 20: Minimal Elegance (Simple)
     ============================================ */
  .theme-minimal-elegance {
    background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
    border: 3px solid var(--accent, #e0e0e0);
  }

  .theme-minimal-elegance .banner-overlay {
    background: transparent;
  }

  .theme-minimal-elegance .store-name {
    color: var(--accent, #333333);
    text-shadow: none;
  }

  /* Modal Styles */
  .banner-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 70;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .banner-modal {
    background: white;
    border-radius: 24px;
    width: 100%;
    max-width: 1100px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .dark .banner-modal {
    background: #2A2A2A;
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  .theme-card {
    border: 3px solid #E5E7EB;
    border-radius: 12px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .theme-card:hover {
    border-color: #9CA3AF;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .theme-card.selected {
    border-color: #F97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
  }

  .theme-preview {
    margin-bottom: 12px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
  }

  .color-palette {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .color-swatch {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    border: 3px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-swatch:hover {
    transform: scale(1.1);
  }

  .color-swatch.selected {
    border-color: #111827;
    box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.2);
  }

  .color-swatch .check {
    color: white;
    font-size: 24px;
    font-weight: bold;
    text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  }

  @media (max-width: 768px) {
    .theme-grid {
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
  }
`;

if (typeof document !== 'undefined') {
  // Remove old styles if they exist
  const oldStyle = document.head.querySelector('style[data-banner-styles]');
  if (oldStyle) {
    oldStyle.remove();
  }
  
  // Add new styles
  const styleSheet = document.createElement('style');
  styleSheet.setAttribute('data-banner-styles', 'true');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export const StoreBanner = ({ 
  storeName, 
  storeImageUrl, 
  bannerThemeKey = 'sunset-waves', 
  bannerAccentColor = '#FF6B6B',
  onClick,
  variant = 'profile'
}) => {
  // CARD variant - Compact display (128px)
  if (variant === 'card') {
    return (
      <div 
        className={`store-banner theme-${bannerThemeKey}`}
        style={{ '--accent': bannerAccentColor, height: '128px' }}
        onClick={onClick}
      />
    );
  }

// HEADER variant - Medium display (180px)
if (variant === 'header') {
  return (
    <div 
      className={`store-banner theme-${bannerThemeKey}`}
      style={{ '--accent': bannerAccentColor, height: '180px' }}
      onClick={onClick}
    />
  );
}


// PROFILE variant - Large display (240px)
return (
  <div 
    className={`store-banner theme-${bannerThemeKey}`}
    style={{ '--accent': bannerAccentColor, height: '240px' }}
    onClick={onClick}
  />
);
};

// NEW: 20 Creative Themes
const THEMES = [
  { key: 'sunset-waves', name: 'Sunset Waves', description: 'Warm gradient blend' },
  { key: 'ocean-depth', name: 'Ocean Depth', description: 'Layered deep blue' },
  { key: 'forest-mist', name: 'Forest Mist', description: 'Natural gradient' },
  { key: 'royal-velvet', name: 'Royal Velvet', description: 'Textured luxury' },
  { key: 'warm-flame', name: 'Warm Flame', description: 'Fiery diagonal' },
  { key: 'cool-breeze', name: 'Cool Breeze', description: 'Diagonal stripes' },
  { key: 'rose-garden', name: 'Rose Garden', description: 'Floral radial design' },
  { key: 'midnight-galaxy', name: 'Midnight Galaxy', description: 'Starry night sky' },
  { key: 'peach-sherbet', name: 'Peach Sherbet', description: 'Soft peachy waves' },
  { key: 'emerald-shine', name: 'Emerald Shine', description: 'Metallic shimmer' },
  { key: 'cotton-candy-sky', name: 'Cotton Candy Sky', description: 'Dreamy pastels' },
  { key: 'lava-stream', name: 'Lava Stream', description: 'Bold lava tones' },
  { key: 'arctic-frost', name: 'Arctic Frost', description: 'Clean winter theme' },
  { key: 'tropical-burst', name: 'Tropical Burst', description: 'Vibrant explosion' },
  { key: 'golden-sunrise', name: 'Golden Sunrise', description: 'Warm morning glow' },
  { key: 'deep-cosmos', name: 'Deep Cosmos', description: 'Space nebula' },
  { key: 'lime-energy', name: 'Lime Energy', description: 'Electric stripes' },
  { key: 'berry-fusion', name: 'Berry Fusion', description: 'Rich purple blend' },
  { key: 'coral-paradise', name: 'Coral Paradise', description: 'Organic coral tones' },
  { key: 'minimal-elegance', name: 'Minimal Elegance', description: 'Simple & clean' }
];

// Expanded Color Palette - Now with 16 colors!
const ACCENT_COLORS = [
  { hex: '#FF6B6B', name: 'Coral Red' },
  { hex: '#F97316', name: 'Vibrant Orange' },
  { hex: '#FBBF24', name: 'Sunny Yellow' },
  { hex: '#84CC16', name: 'Lime Green' },
  { hex: '#10B981', name: 'Emerald Green' },
  { hex: '#14B8A6', name: 'Teal' },
  { hex: '#06B6D4', name: 'Sky Blue' },
  { hex: '#3B82F6', name: 'Bright Blue' },
  { hex: '#6366F1', name: 'Indigo' },
  { hex: '#8B5CF6', name: 'Royal Purple' },
  { hex: '#A855F7', name: 'Violet' },
  { hex: '#EC4899', name: 'Hot Pink' },
  { hex: '#F43F5E', name: 'Rose' },
  { hex: '#64748B', name: 'Slate Gray' },
  { hex: '#334155', name: 'Charcoal' },
  { hex: '#0F172A', name: 'Dark Navy' }
];

export const BannerThemeModal = ({ 
  isOpen,
  onClose,
  currentTheme = 'sunset-waves', 
  currentAccentColor = '#FF6B6B',
  storeName,
  storeImageUrl,
  onSave 
}) => {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [selectedColor, setSelectedColor] = useState(currentAccentColor);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedTheme, selectedColor);
    } catch (error) {
      console.error('Error saving banner:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="banner-modal-overlay">
      <div className="banner-modal">
        <div className="p-6 border-b border-grey-stroke dark:border-charcoal-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-charcoal-600 dark:text-white">Choose Your Store Theme</h3>
              <p className="text-sm text-gray-500 mt-1">Select from 20 creative designs • 16 accent colors</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-grey-100 dark:hover:bg-charcoal-600 rounded-full transition-colors"
            >
              <X size={24} weight="bold" className="text-charcoal-600 dark:text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Live Preview */}
          <div>
            <h4 className="text-lg font-semibold text-charcoal-600 dark:text-white mb-3">Live Preview</h4>
            <div style={{ height: '200px' }}>
              <StoreBanner 
                storeName={storeName}
                storeImageUrl={storeImageUrl}
                bannerThemeKey={selectedTheme}
                bannerAccentColor={selectedColor}
              />
            </div>
          </div>

          {/* Accent Color Selection */}
          <div>
            <h4 className="text-lg font-semibold text-charcoal-600 dark:text-white mb-3">
              Accent Color (Changes theme colors)
            </h4>
            <div className="color-palette">
              {ACCENT_COLORS.map(color => (
                <button
                  key={color.hex}
                  className={`color-swatch ${selectedColor === color.hex ? 'selected' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => setSelectedColor(color.hex)}
                  title={color.name}
                >
                  {selectedColor === color.hex && <span className="check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <h4 className="text-lg font-semibold text-charcoal-600 dark:text-white mb-3">
              Select Theme ({THEMES.length} options)
            </h4>
            <div className="theme-grid">
              {THEMES.map(theme => (
                <div
                  key={theme.key}
                  className={`theme-card ${selectedTheme === theme.key ? 'selected' : ''}`}
                  onClick={() => setSelectedTheme(theme.key)}
                >
                  <div className="theme-preview">
                    <div 
                      className={`store-banner theme-${theme.key}`}
                      style={{ 
                        '--accent': selectedColor,
                        height: '100px',
                        width: '100%'
                      }}
                    />
                  </div>
                  <div>
                    <h5 className="font-semibold text-charcoal-600 dark:text-white text-sm mb-1">{theme.name}</h5>
                    <p className="text-xs text-charcoal-400 dark:text-gray-400">{theme.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-grey-stroke dark:border-charcoal-500 text-charcoal-600 dark:text-white rounded-lg hover:bg-grey-100 dark:hover:bg-charcoal-600 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Palette size={20} weight="bold" />
                  Save Theme
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};