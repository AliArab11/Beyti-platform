# Design System

## Color Variables

| Brand | **Value (Hex)** |
| --- | --- |
| sage-100 | EEF0EF |
| sage-500 | 556B5C |
| sage-700 | 3C5243 |

| **Neutrals** | **Value (Hex)** |
| --- | --- |
| charcoal-600 | 353535 |
| charcoal-400 | 8B8A88 |
| cream-200 | F8F4E9 |
| cream-100 | F6F2EB |
| cream-50 | F8F5F1 |
| grey-200 | FEFDFB |
| grey-stroke | D2D2D2 |

| Status | **Value (Hex)** |
| --- | --- |
| success-btn | 5D755D |
| success-bg | D7E6D7 |
| success-text | 3C5243 |
| error-btn | A45B58 |
| error-bg | FFCACA |
| error-text | 792E2B |
| danger-btn | F8CC8E |
| danger-bg | FFE6B1 |
| danger-text | 714C18 |

---

## Typography

| **Font Family** | **Token Name** | **Size** |
| --- | --- | --- |
| **Merriweather** | `--display--h1` | 32px |
| **Merriweather** | `--metric--h3` | 36px |
| **Merriweather** | `--display--h2` | 24px |
| **Merriweather** | `--card--h2` | 20px |
| **Merriweather** | `--light--h3` | 18px |
| **Inter** | `--body--medium` | 18px |
| **Inter** | `--body--regular` | 16px |
| **Inter** | `--button--text` | 14px |
| **Inter** | `--label--medium` | 12px |

---

## Effects

| **Token Name** | **Value (CSS)** | **Visual Description** |
| --- | --- | --- |
| `--soft--lift` | `0px 4px 10px rgba(53, 53, 53, 0.1)` | Subtle elevation with a soft, dark grey shadow. |

---

## Design Mapping

### 1. Structure & Backgrounds

| **UI Component** | **Design Token / Color** | **Notes** |
| --- | --- | --- |
| **Sidebar Background** | `sage-500` | The primary navigation container. |
| **Sidebar Active Item** | `sage-700` | The background of the "Seller Approvals" tab. |
| **Main Page Background** | `cream-50` | The warm, organic background color behind all cards. |
| **Card / Container Bg** | `grey-200` | The white/off-white background of the data cards and table. |
| **Dividers / Strokes** | `grey-stroke` | Used in the table rows and under the "Card title" in the bottom right. |
| **Card Shadows** | `--soft--lift` | The drop shadow applied to the 3 top cards and the table. |

---

### 2. Typography Mapping

*Distinguishing between the Serif (Merriweather) for headers and Sans-serif (Inter) for UI text.*

| **UI Text Element** | **Font Family** | **Token Estimation** |
| --- | --- | --- |
| **"Beyti Logo"** | **Merriweather** | `--display--h1` (32px) |
| **"Page Title"** | **Merriweather** | `--display--h1` (32px) |
| **Metric Numbers ("0")** | **Merriweather** | `--metric--h3` (36px) |
| **Card Headers** | **Merriweather** | `--card--h2` (20px) |
| **Table Title** | **Merriweather** | `--display--h2` (24px) |
| **Sidebar Links** | **Inter** | `--body--medium` (18px) |
| **Table Data / Buttons** | **Inter** | `--body--regular` (16px) |
| **Subheadings / Labels** | **Inter** | `--light--h3` (18px) |

---

### 3. Action & Status Colors

| **UI Element** | **Color Token** | **Usage** |
| --- | --- | --- |
| **"Review" Button** | `success-btn` | Primary positive action. |
| **"Reject" Button** | `error-btn` | Destructive/negative action. |
| **Checkmark Icons** | `sage-500` | Used in the bottom right list (matches brand color). |
| **Search Bar Border** | `charcoal-400` | The outline of the search input field. |
| **Primary Text** | `charcoal-600` | High contrast text (Titles, sidebar active text). |