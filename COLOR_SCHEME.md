# Color Scheme Update - SMB Tool

## New Color Palette (Inspired by Modern Scheduling Interface)

### Primary Colors
- **Primary Dark**: `#1e3a5f` - Deep blue for headers and important elements
- **Primary Blue**: `#2c5282` - Main brand color for buttons and accents

### Accent Colors
- **Cyan**: `#4299e1` - Active states, links, highlights
- **Green**: `#48bb78` - Success states, "Done" status, submit buttons
- **Orange**: `#ed8936` - Warning states, "InProd" status
- **Yellow**: `#ecc94b` - Pending states, "Planned" status
- **Purple**: `#9f7aea` - Special states, "Invoiced" status

### Background Colors
- **Light Background**: `#f7fafc` - Page background
- **White**: `#ffffff` - Card backgrounds
- **Text Dark**: `#2d3748` - Main text
- **Text Muted**: `#718096` - Secondary text
- **Border Light**: `#e2e8f0` - Borders and dividers

## Key Design Changes

### 1. **Header Bar**
- Gradient background from Primary Dark to Primary Blue
- White text on dark background
- Glassmorphic buttons with backdrop blur
- Responsive layout that stacks on mobile

### 2. **Status Badges**
- Color-coded circular badges
- Each status has its own distinct color:
  - **New/Nowe** → Cyan
  - **Planned/Planowane** → Yellow
  - **InProd/W produkcji** → Orange
  - **Done/Gotowe** → Green
  - **Invoiced/Zafakturowane** → Purple

### 3. **Cards & Panels**
- Elevated with medium shadows
- Hover effect increases shadow depth
- Rounded corners (12px)
- Light border for definition

### 4. **Buttons**
- Primary buttons → Primary Blue background
- Submit buttons → Green background
- Header buttons → Semi-transparent white
- Hover effect with slight lift animation
- Active state with press-down animation

### 5. **Form Elements**
- Cyan focus ring (3px glow)
- Light gray borders
- Smooth transitions
- Forms have light background panels

### 6. **Order List**
- Cyan left border appears on hover
- Full-width clickable areas
- Status badges integrated inline
- Smooth hover transition to cyan background

### 7. **Finance Panel**
- Dark blue background
- Cyan monospace text
- Sticky positioning on desktop
- Scrollable content area

### 8. **Error & Success Messages**
- Error → Red background with dark red text
- Success → Green background with dark green text
- Both have border, padding, and rounded corners

## Component Files Updated

1. **`frontend/src/styles.css`**
   - Complete color system with CSS variables
   - All component styling
   - Responsive breakpoints
   - Hover and animation effects

2. **`frontend/src/components/StatusBadge.jsx`** (NEW)
   - Reusable status badge component
   - Maps status strings to color classes
   - Supports both Polish and English

3. **`frontend/src/App.jsx`**
   - Restructured header with gradient bar
   - Integrated StatusBadge component
   - Added semantic class names
   - Improved layout structure

## Visual Hierarchy

1. **Top Level**: Gradient header bar (most prominent)
2. **Section Headers**: Blue with cyan underline
3. **Cards**: White elevated panels
4. **Interactive Elements**: Blue buttons, cyan on hover
5. **Status Indicators**: Color-coded badges
6. **Finance Data**: Dark panel with cyan text

## Accessibility Features

- High contrast color combinations
- Clear focus indicators (cyan glow)
- Readable font sizes
- Proper spacing and padding
- Responsive design for all screen sizes

## Usage

The app now has a modern, professional appearance matching the aesthetic of the scheduling interface in the provided screenshot, with:
- Cohesive color scheme
- Clear visual hierarchy
- Intuitive status indicators
- Smooth animations and transitions
- Responsive layout

All colors are defined as CSS variables in `:root` for easy theme customization in the future.

