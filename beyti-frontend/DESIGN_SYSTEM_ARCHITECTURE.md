# Design System Architecture Guide

## Overview

This document explains the architecture of the Beyti Design System implementation in React + Tailwind v4. Understanding this architecture will help you extend the design system and create new components consistently.

---

## Architecture Layers

### 1. Design Tokens Layer (Primitive Values)

**File:** [`src/styles/design-tokens.css`](src/styles/design-tokens.css)

This is the foundation of the design system. It defines all primitive values as CSS custom properties (variables).

```css
:root {
  /* Brand Colors */
  --sage-500: #556B5C;
  --success-btn: #5D755D;

  /* Typography */
  --display-h1-size: 32px;
  --display-h1-family: 'Merriweather', serif;

  /* Effects */
  --soft-lift: 0px 4px 10px rgba(53, 53, 53, 0.1);
}
```

**Key Concepts:**
- These are raw values that never change
- Organized by category (colors, typography, effects)
- Can be referenced directly in CSS or through Tailwind utilities

---

### 2. Tailwind Theme Extensions Layer

**File:** [`src/index.css`](src/index.css) (within `@theme` block)

This layer maps design tokens to Tailwind's utility class system using Tailwind v4's `@theme` directive.

```css
@theme {
  --color-sage-500: var(--sage-500);
  --color-success-btn: var(--success-btn);
  --shadow-soft-lift: var(--soft-lift);
}
```

**Result:** Creates utilities like:
- `bg-sage-500` → background-color: var(--sage-500)
- `text-success-btn` → color: var(--success-btn)
- `shadow-soft-lift` → box-shadow: var(--soft-lift)

---

### 3. Custom Utilities Layer

**File:** [`src/index.css`](src/index.css) (within `@layer utilities` block)

This layer creates composite utilities that combine multiple CSS properties for common patterns like typography.

```css
@layer utilities {
  .text-display-h1 {
    font-family: var(--display-h1-family);
    font-size: var(--display-h1-size);
    font-weight: var(--display-h1-weight);
    line-height: var(--display-h1-line-height);
  }
}
```

**Usage:**
```jsx
<h1 className="text-display-h1">Page Title</h1>
```

This single class applies all typography properties at once instead of:
```jsx
<h1 className="font-display text-[32px] font-bold leading-tight">Title</h1>
```

---

### 4. Component Layer

**Files:** [`src/components/Button.jsx`](src/components/Button.jsx), etc.

React components that combine Tailwind utilities with component logic.

```jsx
const Button = ({ variant = 'primary' }) => {
  const variantStyles = {
    success: 'bg-success-btn text-white hover:bg-success-text',
    error: 'bg-error-btn text-white hover:bg-error-text',
    primary: 'bg-sage-500 text-white hover:bg-sage-700',
  };

  return <button className={variantStyles[variant]}>...</button>
};
```

---

## Semantic Naming System

### Understanding the Token Hierarchy

The design system uses a three-tier naming approach:

#### Tier 1: Primitive Color Values
Raw color definitions with descriptive names:
```css
--sage-500: #556B5C;
--charcoal-600: #353535;
```

#### Tier 2: Semantic Color Tokens
Purpose-driven tokens that reference primitive values:
```css
--success-btn: #5D755D;  /* Button background for success actions */
--success-bg: #D7E6D7;   /* Background for success alerts/badges */
--success-text: #3C5243; /* Text color for success messages */
```

#### Tier 3: Component-Level Usage
Components use semantic tokens through Tailwind utilities:
```jsx
<Button variant="success">  // Uses bg-success-btn
<div className="bg-success-bg text-success-text">  // Alert styling
```

### Why This Matters

**Example: Success Color System**

```
Primitive → Semantic → Usage
#5D755D  → success-btn → Button background (clickable)
#D7E6D7  → success-bg  → Alert background (informational)
#3C5243  → success-text → Text in success contexts
```

This separation allows:
1. **Color changes** without component changes
2. **Consistent semantics** across the app
3. **Clear intent** in component code

---

## How to Extend the System

### Adding New Colors

1. **Add to design-tokens.css:**
```css
:root {
  --info-btn: #4A90E2;
  --info-bg: #E3F2FD;
  --info-text: #1565C0;
}
```

2. **Register in Tailwind theme (index.css):**
```css
@theme {
  --color-info-btn: var(--info-btn);
  --color-info-bg: var(--info-bg);
  --color-info-text: var(--info-text);
}
```

3. **Use in components:**
```jsx
<Button variant="info">Info Action</Button>

const variantStyles = {
  info: 'bg-info-btn text-white hover:bg-info-text',
};
```

### Adding New Typography Styles

1. **Define tokens in design-tokens.css:**
```css
:root {
  --caption-size: 14px;
  --caption-family: var(--font-body);
  --caption-weight: 400;
  --caption-line-height: 1.5;
}
```

2. **Create utility in index.css:**
```css
@layer utilities {
  .text-caption {
    font-family: var(--caption-family);
    font-size: var(--caption-size);
    font-weight: var(--caption-weight);
    line-height: var(--caption-line-height);
  }
}
```

3. **Use in components:**
```jsx
<p className="text-caption text-charcoal-400">Caption text here</p>
```

### Creating New Components

Follow this pattern:

```jsx
// src/components/Alert.jsx
const Alert = ({ variant = 'success', children }) => {
  const variantStyles = {
    success: 'bg-success-bg border-success-btn text-success-text',
    error: 'bg-error-bg border-error-btn text-error-text',
    danger: 'bg-danger-bg border-danger-btn text-danger-text',
  };

  return (
    <div className={`
      ${variantStyles[variant]}
      border-l-4 p-4 rounded-md
      text-body-regular
    `}>
      {children}
    </div>
  );
};
```

**Key principles:**
1. Use semantic variant names (success, error, not green, red)
2. Map variants to semantic color tokens
3. Combine with typography utilities
4. Add component-specific styling as needed

---

## Common Patterns

### Page Layouts

```jsx
function PageLayout() {
  return (
    <div className="min-h-screen bg-cream-50">
      <aside className="bg-sage-500">
        <nav className="text-body-medium text-white">
          {/* Sidebar content */}
        </nav>
      </aside>

      <main className="bg-cream-50">
        <h1 className="text-display-h1 text-charcoal-600">
          Page Title
        </h1>
        {/* Main content */}
      </main>
    </div>
  );
}
```

### Cards

```jsx
function Card({ title, children }) {
  return (
    <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift border border-grey-stroke">
      <h2 className="text-card-h2 text-charcoal-600 mb-4">
        {title}
      </h2>
      <div className="text-body-regular text-charcoal-600">
        {children}
      </div>
    </div>
  );
}
```

### Metrics Display

```jsx
function MetricCard({ label, value, description }) {
  return (
    <div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift">
      <p className="text-light-h3 text-charcoal-400 mb-2">{label}</p>
      <p className="text-metric-h3 text-sage-700">{value}</p>
      <p className="text-body-regular text-charcoal-400 mt-2">{description}</p>
    </div>
  );
}
```

### Forms

```jsx
function Input({ label, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-label-medium text-charcoal-600">
        {label}
      </label>
      <input
        className="
          w-full px-4 py-2
          bg-grey-200 border border-charcoal-400
          text-body-regular text-charcoal-600
          rounded-md
          focus:outline-none focus:ring-2 focus:ring-sage-500
        "
        {...props}
      />
    </div>
  );
}
```

---

## Design Mapping Reference

### UI Structure → Tokens

| UI Element | Token/Class | Example |
|------------|-------------|---------|
| Page Background | `bg-cream-50` | Main content area |
| Card Background | `bg-grey-200` | Data cards, containers |
| Sidebar Background | `bg-sage-500` | Navigation sidebar |
| Active Sidebar Item | `bg-sage-700` | Selected nav item |
| Dividers | `border-grey-stroke` | Table rows, separators |
| Card Shadow | `shadow-soft-lift` | Elevated elements |

### Text Elements → Typography Classes

| Element | Class | Font |
|---------|-------|------|
| Page Title | `text-display-h1` | Merriweather 32px |
| Section Title | `text-display-h2` | Merriweather 24px |
| Metric Numbers | `text-metric-h3` | Merriweather 36px |
| Card Headers | `text-card-h2` | Merriweather 20px |
| Sidebar Links | `text-body-medium` | Inter 18px |
| Body Text | `text-body-regular` | Inter 16px |
| Buttons | `text-button` | Inter 14px |
| Labels | `text-label-medium` | Inter 12px |

### Actions → Button Variants

| Action Type | Variant | Color Token |
|-------------|---------|-------------|
| Approve, Review | `success` | `success-btn` |
| Reject, Delete | `error` | `error-btn` |
| Archive, Warn | `danger` | `danger-btn` |
| Primary Action | `primary` | `sage-500` |
| Secondary Action | `secondary` | `grey-200` |

---

## Best Practices

### DO:
- ✅ Use semantic token names (success, error) instead of color names (green, red)
- ✅ Apply typography utility classes (`text-display-h1`) for consistent styling
- ✅ Reference design tokens through Tailwind utilities
- ✅ Keep components simple and focused
- ✅ Use the `-btn`, `-bg`, `-text` suffix pattern for status colors

### DON'T:
- ❌ Use arbitrary values like `text-[18px]` when a token exists
- ❌ Hardcode hex colors in components
- ❌ Mix different typography approaches (use utilities consistently)
- ❌ Create new tokens without documenting them
- ❌ Use `success-bg` for buttons (that's for alerts/badges)

---

## File Structure

```
beyti-frontend/
├── src/
│   ├── styles/
│   │   └── design-tokens.css        # All design tokens (colors, typography, effects)
│   ├── components/
│   │   ├── Button.jsx               # Example component using design tokens
│   │   └── DesignSystemDemo.jsx     # Interactive showcase
│   └── index.css                     # Tailwind imports + theme extensions
├── Design_System.md                  # Original design spec
└── DESIGN_SYSTEM_ARCHITECTURE.md     # This file
```

---

## Viewing the Design System

To see all components and tokens in action:

1. Import the demo component in your app:
```jsx
import DesignSystemDemo from './components/DesignSystemDemo';
```

2. Add it to your router or App.jsx:
```jsx
<Route path="/design-system" element={<DesignSystemDemo />} />
```

3. Navigate to `/design-system` to see the full showcase

---

## Quick Reference: Common Class Combinations

### Hero Section
```jsx
<section className="bg-sage-500 py-16">
  <h1 className="text-display-h1 text-white">Welcome to Beyti</h1>
  <p className="text-body-medium text-sage-100">Your marketplace awaits</p>
</section>
```

### Dashboard Stats Card
```jsx
<div className="bg-grey-200 rounded-lg p-6 shadow-soft-lift">
  <h3 className="text-card-h2 text-charcoal-600 mb-2">Total Orders</h3>
  <p className="text-metric-h3 text-sage-700">1,234</p>
</div>
```

### Action Row
```jsx
<div className="flex gap-4">
  <Button variant="success">Approve</Button>
  <Button variant="error">Reject</Button>
  <Button variant="secondary">View Details</Button>
</div>
```

### Success Message
```jsx
<div className="bg-success-bg border-l-4 border-success-btn p-4 rounded">
  <p className="text-body-medium text-success-text">Operation completed!</p>
</div>
```

---

## Support & Questions

For questions about the design system:
1. Review this architecture guide
2. Check the [`DesignSystemDemo.jsx`](src/components/DesignSystemDemo.jsx) for examples
3. Refer to the original [`Design_System.md`](../Design_System.md) specification

---

**Last Updated:** 2025-11-30
**Version:** 1.0.0
