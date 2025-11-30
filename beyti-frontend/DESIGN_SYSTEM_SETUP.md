# Beyti Design System - Quick Start Guide

Your design system has been successfully implemented! Here's everything you need to know to start using it.

## What Was Created

### 1. **Design Tokens** ([`src/styles/design-tokens.css`](src/styles/design-tokens.css))
All your colors, typography, and effects defined as CSS custom properties.

### 2. **Tailwind Configuration** ([`src/index.css`](src/index.css))
Extended Tailwind v4 with your design tokens as utilities.

### 3. **Button Component** ([`src/components/Button.jsx`](src/components/Button.jsx))
Example React component showing status color usage.

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

### Button Component

```jsx
import Button from './components/Button';

// Status buttons
<Button variant="success" onClick={handleApprove}>Review</Button>
<Button variant="error" onClick={handleReject}>Reject</Button>
<Button variant="danger" onClick={handleArchive}>Archive</Button>

// Other variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Ghost Button</Button>

// Sizes
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

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

| File | Purpose |
|------|---------|
| [`src/styles/design-tokens.css`](src/styles/design-tokens.css) | All design tokens (colors, typography, effects) |
| [`src/index.css`](src/index.css) | Tailwind imports + theme extensions + custom utilities |
| [`src/components/Button.jsx`](src/components/Button.jsx) | Example component using design tokens |
| [`src/components/DesignSystemDemo.jsx`](src/components/DesignSystemDemo.jsx) | Interactive showcase of all tokens |
| [`DESIGN_SYSTEM_ARCHITECTURE.md`](DESIGN_SYSTEM_ARCHITECTURE.md) | How the system works and how to extend it |
| [`Design_System.md`](../Design_System.md) | Original design specification |

---

## Support

If you need help:
1. Check the **DesignSystemDemo** component for usage examples
2. Read the **Architecture Guide** for how things work
3. Refer to the original **Design_System.md** for color values

Happy building! 🎨
