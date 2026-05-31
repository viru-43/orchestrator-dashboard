# Orchestrator Dashboard - Modern Design System

## Color Palette

### Primary Colors
- **Primary Blue**: `#0066FF` - Main brand color for CTAs and interactive elements
- **Primary Blue Hover**: `#0052CC` - Hover state
- **Primary Blue Active**: `#003D99` - Active/pressed state

### Semantic Colors
- **Success Green**: `#00C853` - Success states, positive metrics
- **Warning Orange**: `#FF9800` - Warning states, attention needed
- **Error Red**: `#F44336` - Error states, critical alerts
- **Info Blue**: `#2196F3` - Informational messages

### Neutral Colors (Light Mode)
- **Background**: `#FFFFFF`
- **Surface**: `#F8F9FA`
- **Surface Elevated**: `#FFFFFF`
- **Border**: `#E0E0E0`
- **Border Subtle**: `#F0F0F0`
- **Text Primary**: `#1A1A1A`
- **Text Secondary**: `#666666`
- **Text Tertiary**: `#999999`

### Neutral Colors (Dark Mode)
- **Background**: `#0A0A0A`
- **Surface**: `#1A1A1A`
- **Surface Elevated**: `#242424`
- **Border**: `#2A2A2A`
- **Border Subtle**: `#1F1F1F`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#B3B3B3`
- **Text Tertiary**: `#808080`

## Typography

### Font Stack
- **Sans-serif**: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Monospace**: 'JetBrains Mono', 'Fira Code', monospace

### Type Scale
- **Display**: 48px / 1.2 / 700
- **H1**: 36px / 1.2 / 700
- **H2**: 30px / 1.3 / 600
- **H3**: 24px / 1.4 / 600
- **H4**: 20px / 1.4 / 600
- **Body Large**: 16px / 1.6 / 400
- **Body**: 14px / 1.6 / 400
- **Body Small**: 13px / 1.5 / 400
- **Caption**: 12px / 1.4 / 400

## Spacing Scale
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px

## Border Radius
- **sm**: 4px
- **md**: 8px
- **lg**: 12px
- **xl**: 16px
- **full**: 9999px

## Shadows
- **sm**: 0 1px 2px rgba(0,0,0,0.05)
- **md**: 0 4px 6px rgba(0,0,0,0.07)
- **lg**: 0 10px 15px rgba(0,0,0,0.1)
- **xl**: 0 20px 25px rgba(0,0,0,0.15)

## Component Specifications

### Cards
- Background: Surface color
- Border: 1px solid Border color
- Border Radius: 12px
- Padding: 24px
- Shadow: sm (hover: md)
- Transition: all 200ms ease

### Buttons
- **Primary**: Background Primary, Text White, Height 40px, Padding 16px 24px
- **Secondary**: Background transparent, Border 1.5px Primary, Text Primary
- **Ghost**: Background transparent, Text Primary
- Border Radius: 8px
- Font Weight: 500
- Transition: all 200ms ease

### Inputs
- Height: 40px
- Padding: 12px 16px
- Border: 1.5px solid Border
- Border Radius: 8px
- Focus: Border Primary, Shadow 0 0 0 3px Primary/10%

### Tables
- Row Height: 56px
- Cell Padding: 16px
- Border: 1px solid Border Subtle
- Hover: Background Surface
- Active Row: Border-left 3px Primary

## Animation Guidelines
- **Duration**: 200-300ms for most interactions
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **Hover**: Scale 1.02, translateY(-2px)
- **Focus**: Ring 3px Primary/20%
- **Page Transitions**: Fade + Slide (300ms)