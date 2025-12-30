# Design System Guidelines

## Spacing Scale
Use consistent spacing based on 4px increments:
- `gap-1` = 4px
- `gap-2` = 8px
- `gap-3` = 12px
- `gap-4` = 16px
- `gap-6` = 24px
- `gap-8` = 32px

## Border Radius
- **Small**: `rounded` (4px) - buttons, badges
- **Medium**: `rounded-lg` (8px) - cards, inputs
- **Large**: `rounded-xl` (12px) - modals, large cards
- **Avoid**: `rounded-2xl`, `rounded-3xl` (too inconsistent)

## Shadows
- **Subtle**: `shadow-sm` - cards, inputs
- **Medium**: `shadow-md` - hover states, elevated cards
- **Large**: `shadow-lg` - modals, dropdowns
- **Avoid**: `shadow-xl`, `shadow-2xl` (too heavy)

## Colors
Always use design tokens from CSS variables:
- `text-primary` not `text-blue-600`
- `bg-primary` not `bg-blue-500`
- `border-gray-200` for subtle borders
- `text-gray-600` for secondary text
- `text-gray-900` for primary text

## Typography Scale
- **Display (h1)**: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`
- **Heading (h2)**: `text-2xl sm:text-3xl md:text-4xl`
- **Subheading (h3)**: `text-xl sm:text-2xl`
- **Body**: `text-sm sm:text-base`
- **Small**: `text-xs sm:text-sm`
- **Caption**: `text-xs`

## Button Heights
- **Default**: `min-h-[40px]` or `min-h-10`
- **Large**: `min-h-[44px]` or `min-h-11`
- **Touch targets**: Always minimum 44px for mobile

## Focus States
All interactive elements must have:
```css
focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2
```

