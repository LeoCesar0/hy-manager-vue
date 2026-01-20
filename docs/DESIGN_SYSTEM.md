# Design System & UI Guidelines

This document defines the visual language, user experience principles, and design standards for the Personal Finance Manager application.

## Design Philosophy

### Core Values

**Cosy & Welcoming**
- The app should feel like a comfortable, trusted companion for managing finances
- Avoid corporate coldness - we're helping people, not auditing them
- Use soft, friendly language and visual elements
- Create a sense of calm, not stress

**Friendly & Approachable**
- Finance can be intimidating - our UI should break down those barriers
- Use clear, jargon-free language
- Provide helpful hints and guidance
- Celebrate user successes (e.g., saving goals reached)

**Delightful Interactions**
- Smooth, meaningful animations that provide feedback
- Micro-interactions that make the app feel alive
- Thoughtful empty states and loading experiences
- Subtle personality without being distracting

**Clarity & Confidence**
- Financial data must be crystal clear
- Good visual hierarchy guides users naturally
- Important actions are obvious, dangerous ones are protected
- Users should always know where they are and what they can do

## Technology Stack

### UI Framework: Tailwind CSS

We use **Tailwind CSS** as our primary styling solution for maximum flexibility and consistency.

**Why Tailwind:**
- Utility-first approach for rapid development
- Consistent design tokens out of the box
- Easy to maintain and customize
- Excellent performance with PurgeCSS
- Great IntelliSense support

**Configuration:**
Our Tailwind config extends the default palette with our custom colors.

### Component Library: shadcn/ui

We use **shadcn/ui** components located in `/components/ui/` for all UI elements.

**Why shadcn/ui:**
- Accessible by default (Radix UI primitives)
- Fully customizable with Tailwind
- Copy-paste approach (we own the code)
- Beautiful, modern design system
- TypeScript support

**Available Components:**
All shadcn/ui components are in `/components/ui/`:
- `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, etc.
- `Card`, `Dialog`, `Sheet`, `Drawer`, `Popover`
- `Table`, `Form`, `Tabs`, `Accordion`
- Full list in `/components/ui/` directory

### Form System

Use existing Form components from `/components/Form/` for all form implementations.

**Available Form Components:**
- `/components/Form/index.vue` - Main form wrapper
- `/components/Form/Field/index.vue` - Generic field wrapper
- `/components/Form/Field/Address.vue`
- `/components/Form/Field/CardSelect.vue`
- `/components/Form/Field/FileUploaderMultiple.vue`
- `/components/Form/Field/ImageUploader.vue`
- `/components/Form/Field/InputWithOptions.vue`
- `/components/Form/Field/MultipleSelect.vue`
- `/components/Form/actions.vue` - Form action buttons

**When to create new Field components:**
- When you need a specialized input type not covered
- When a field pattern is used 3+ times
- Place new fields in `/components/Form/Field/`

### Chart Library: Unovis + shadcn/ui

We use **Unovis** (`@unovis/vue` and `@unovis/ts`) with shadcn/ui chart components for data visualization.

**Why Unovis:**
- Already installed and configured
- Excellent TypeScript support
- Highly customizable
- Works seamlessly with Vue 3
- Lightweight and performant

**Chart Components:**
Use shadcn/ui chart wrappers in `/components/ui/chart/`:
- `ChartContainer.vue`, `ChartTooltip.vue`, `ChartLegend.vue`
- These wrap Unovis components with our design system

## Color Palette

### Tailwind Color Classes

Our color palette uses soft pastels implemented via Tailwind. Configure in `tailwind.config.ts`.

**Primary - Soft Pink (Tailwind: pink-400 to pink-500)**
```
bg-pink-50    #fdf2f8   (Lightest backgrounds)
bg-pink-100   #fce7f3   (Hover states)
bg-pink-200   #fbcfe8   (Borders)
bg-pink-300   #f9a8d4   (Medium light)
bg-pink-400   #f472b6   (Primary actions) ⭐ PRIMARY
bg-pink-500   #ec4899   (Base primary)
bg-pink-600   #db2777   (Hover on primary)
bg-pink-700   #be185d   (Darker)
bg-pink-800   #9d174d   (Very dark)
bg-pink-900   #831843   (Darkest)
```

**Secondary - Soft Green (Tailwind: green-500 to green-600)**
```
bg-green-50   #f0fdf4   (Success backgrounds)
bg-green-100  #dcfce7   (Very light)
bg-green-200  #bbf7d0   (Positive indicators)
bg-green-300  #86efac   (Medium light)
bg-green-400  #4ade80   (Medium)
bg-green-500  #22c55e   (Success actions) ⭐ SECONDARY
bg-green-600  #16a34a   (Income, positive) ⭐ INCOME
bg-green-700  #15803d   (Darker)
bg-green-800  #166534   (Very dark)
bg-green-900  #14532d   (Darkest)
```

### Semantic Tailwind Classes

Use these Tailwind utility classes throughout the app:

**Success/Positive (Green):**
```html
<div class="bg-green-50 text-green-700 border-green-200">Success!</div>
<span class="text-green-600 font-semibold">$1,234.56</span>
```

**Income (Green):**
```html
<span class="text-green-600">+$500.00</span>
<div class="bg-green-50 border-green-200">Income transaction</div>
```

**Expense (Soft Red):**
```html
<span class="text-red-400">-$150.00</span>
<div class="bg-red-50 border-red-200">Expense transaction</div>
```

**Warning (Amber):**
```html
<div class="bg-amber-50 text-amber-700 border-amber-200">Warning</div>
```

**Error (Red):**
```html
<div class="bg-red-50 text-red-600 border-red-200">Error message</div>
```

**Info (Blue):**
```html
<div class="bg-blue-50 text-blue-700 border-blue-200">Info tip</div>
```

**Neutrals (Gray/Slate):**
```html
<p class="text-gray-600">Body text</p>
<p class="text-gray-500">Secondary text</p>
<div class="bg-gray-50 border-gray-200">Card background</div>
```

### Usage Guidelines

**Do's:**
- ✅ Use Tailwind utility classes: `bg-pink-400`, `text-green-600`
- ✅ Use `hover:`, `focus:`, `active:` prefixes for states
- ✅ Use `dark:` prefix when adding dark mode
- ✅ Ensure sufficient contrast (text-gray-900 on bg-white, etc.)
- ✅ Use semantic meanings: green = positive/income, red = negative/expense

**Don'ts:**
- ❌ Don't write custom CSS unless absolutely necessary
- ❌ Don't use inline styles (use Tailwind classes)
- ❌ Don't mix more than 3 colors in a single component
- ❌ Don't use colors alone to convey meaning (add icons/text)

## Typography

### Tailwind Typography Classes

Use Tailwind's built-in typography utilities for all text styling.

**Font Families (Tailwind classes):**
```html
<!-- Sans-serif (default) - for UI text -->
<p class="font-sans">User interface text</p>

<!-- Monospace - for numbers and data -->
<span class="font-mono">$1,234.56</span>

<!-- Default font is already sans, no need to specify -->
<p>This uses the default sans font</p>
```

**Font Sizes (Tailwind scale):**
```html
<p class="text-xs">12px - Helper text, labels</p>
<p class="text-sm">14px - Secondary text</p>
<p class="text-base">16px - Body text (default)</p>
<p class="text-lg">18px - Emphasized text</p>
<p class="text-xl">20px - Small headings</p>
<p class="text-2xl">24px - Headings</p>
<p class="text-3xl">30px - Page titles</p>
<p class="text-4xl">36px - Hero text</p>
```

**Font Weights (Tailwind):**
```html
<p class="font-normal">Normal (400)</p>
<p class="font-medium">Medium (500)</p>
<p class="font-semibold">Semibold (600)</p>
<p class="font-bold">Bold (700)</p>
```

**Line Heights (Tailwind):**
```html
<p class="leading-tight">Tight (1.25) - for headings</p>
<p class="leading-normal">Normal (1.5) - for body text</p>
<p class="leading-relaxed">Relaxed (1.75) - spacious text</p>
```

### Typography Guidelines with Tailwind

**Headings:**
```vue
<h1 class="text-3xl font-bold text-gray-900">Page Title</h1>
<h2 class="text-2xl font-semibold text-gray-800">Section Title</h2>
<h3 class="text-xl font-medium text-gray-700">Subsection Title</h3>
```

**Body Text:**
```vue
<p class="text-base text-gray-600">Regular paragraph text</p>
<p class="text-sm text-gray-500">Secondary or helper text</p>
<p class="text-xs text-gray-400">Helper or caption text</p>
```

**Financial Data:**
```vue
<!-- Use monospace + tabular numbers for alignment -->
<span class="font-mono tabular-nums text-lg font-semibold">$1,234.56</span>
<span class="font-mono tabular-nums text-green-600">+$500.00</span>
<span class="font-mono tabular-nums text-red-400">-$150.00</span>
```

**Text Colors:**
```vue
<!-- Primary text -->
<p class="text-gray-900">Primary content</p>

<!-- Secondary text -->
<p class="text-gray-600">Secondary content</p>

<!-- Muted/helper text -->
<p class="text-gray-500">Muted helper text</p>

<!-- Interactive text -->
<a class="text-pink-500 hover:text-pink-600">Link text</a>
```

## Spacing System

Use Tailwind's spacing scale based on a 4px (0.25rem) base unit.

**Tailwind Spacing Classes:**
```html
<div class="p-1">0.25rem (4px)</div>
<div class="p-2">0.5rem (8px)</div>
<div class="p-3">0.75rem (12px)</div>
<div class="p-4">1rem (16px)</div>
<div class="p-5">1.25rem (20px)</div>
<div class="p-6">1.5rem (24px)</div>
<div class="p-8">2rem (32px)</div>
<div class="p-10">2.5rem (40px)</div>
<div class="p-12">3rem (48px)</div>
<div class="p-16">4rem (64px)</div>
<div class="p-20">5rem (80px)</div>
```

**Spacing Utilities:**
- `p-{size}` - Padding on all sides
- `px-{size}` - Horizontal padding (left + right)
- `py-{size}` - Vertical padding (top + bottom)
- `m-{size}` - Margin on all sides
- `gap-{size}` - Gap in flex/grid layouts
- `space-x-{size}` - Horizontal spacing between children
- `space-y-{size}` - Vertical spacing between children

**Component Spacing Patterns:**

**Cards:**
```vue
<UiCard class="p-6"><!-- 24px padding --></UiCard>
```

**Forms:**
```vue
<form class="space-y-4"><!-- 16px gap between fields -->
  <div class="space-y-2"><!-- 8px gap within field group -->
    <UiLabel />
    <UiInput />
  </div>
</form>
```

**Layouts:**
```vue
<!-- Section spacing -->
<div class="space-y-6"><!-- 24px between sections --></div>

<!-- Grid spacing -->
<div class="grid grid-cols-3 gap-4"><!-- 16px gaps --></div>
```

**Buttons:**
```vue
<UiButton class="px-4 py-2"><!-- 16px horizontal, 8px vertical --></UiButton>
```

## Border Radius

Use Tailwind's rounded utilities for soft, friendly corners.

**Tailwind Radius Classes:**
```html
<div class="rounded-sm">0.125rem (2px) - very subtle</div>
<div class="rounded">0.25rem (4px) - small elements</div>
<div class="rounded-md">0.375rem (6px) - buttons, inputs</div>
<div class="rounded-lg">0.5rem (8px) - cards</div>
<div class="rounded-xl">0.75rem (12px) - large cards</div>
<div class="rounded-2xl">1rem (16px) - modal dialogs</div>
<div class="rounded-3xl">1.5rem (24px) - very large cards</div>
<div class="rounded-full">9999px - fully rounded (avatars, pills)</div>
```

**Component Radius Patterns:**
```vue
<!-- Buttons and inputs -->
<UiButton class="rounded-md" />
<UiInput class="rounded-md" />

<!-- Cards -->
<UiCard class="rounded-lg" />

<!-- Large containers -->
<div class="rounded-xl" />

<!-- Avatars and badges -->
<UiBadge class="rounded-full" />
<UiAvatar class="rounded-full" />
```

**Individual Corners:**
```html
<div class="rounded-t-lg">Top corners only</div>
<div class="rounded-l-lg">Left corners only</div>
<div class="rounded-tr-lg">Top-right corner only</div>
```

## Shadows

Use Tailwind's shadow utilities for subtle, soft elevation.

**Tailwind Shadow Classes:**
```html
<div class="shadow-sm">Subtle shadow</div>
<div class="shadow">Small shadow (default)</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-xl">Extra large shadow</div>
<div class="shadow-2xl">Very large shadow</div>
<div class="shadow-inner">Inner shadow</div>
<div class="shadow-none">No shadow</div>
```

**Component Shadow Patterns:**
```vue
<!-- Cards at rest -->
<UiCard class="shadow-sm hover:shadow-md transition-shadow" />

<!-- Elevated cards -->
<UiCard class="shadow-md" />

<!-- Floating elements (dialogs, popovers) -->
<UiDialog class="shadow-lg" />
<UiPopover class="shadow-lg" />

<!-- Dropdowns -->
<UiDropdownMenu class="shadow-lg" />
```

**Hover Effects:**
```vue
<!-- Lift on hover -->
<div class="shadow-sm hover:shadow-md transition-shadow duration-200" />

<!-- Interactive cards -->
<UiCard class="shadow hover:shadow-lg transition-shadow cursor-pointer" />
```

**Custom Shadows (if needed):**
For pink-tinted shadows, configure in `tailwind.config.ts`:
```javascript
theme: {
  extend: {
    boxShadow: {
      'pink-sm': '0 1px 2px 0 rgba(236, 72, 153, 0.05)',
      'pink-md': '0 4px 6px -1px rgba(236, 72, 153, 0.08)',
    }
  }
}
```

## Animation & Transitions

Use Tailwind's transition and animation utilities for smooth, meaningful motion.

### Transition Utilities

**Duration:**
```html
<div class="transition duration-75">75ms - quick</div>
<div class="transition duration-100">100ms - very fast</div>
<div class="transition duration-150">150ms - fast</div>
<div class="transition duration-200">200ms - normal</div>
<div class="transition duration-300">300ms - slow</div>
<div class="transition duration-500">500ms - slower</div>
<div class="transition duration-700">700ms - very slow</div>
```

**Timing Functions:**
```html
<div class="ease-linear">Linear</div>
<div class="ease-in">Ease in</div>
<div class="ease-out">Ease out</div>
<div class="ease-in-out">Ease in-out</div>
```

**Transition Properties:**
```html
<div class="transition-all">All properties</div>
<div class="transition-colors">Colors only</div>
<div class="transition-opacity">Opacity only</div>
<div class="transition-shadow">Shadow only</div>
<div class="transition-transform">Transform only</div>
```

### Common Patterns with Tailwind

**Hover Effects:**
```vue
<!-- Card lift on hover -->
<UiCard class="transition-all duration-200 hover:-translate-y-1 hover:shadow-md" />

<!-- Button hover -->
<UiButton class="transition-colors duration-150 hover:bg-pink-500" />

<!-- Link hover -->
<a class="transition-colors duration-150 text-pink-400 hover:text-pink-500" />
```

**Button Press:**
```vue
<UiButton class="active:scale-98 transition-transform duration-100" />
```

**Fade Transitions:**
```vue
<!-- Using Vue transitions -->
<Transition
  enter-active-class="transition-opacity duration-300 ease-out"
  enter-from-class="opacity-0"
  leave-active-class="transition-opacity duration-200 ease-in"
  leave-to-class="opacity-0"
>
  <div v-if="show">Content</div>
</Transition>
```

**Slide Transitions:**
```vue
<Transition
  enter-active-class="transition-all duration-300 ease-out"
  enter-from-class="opacity-0 translate-y-4"
  leave-active-class="transition-all duration-200 ease-in"
  leave-to-class="opacity-0 translate-y-4"
>
  <div v-if="show">Content</div>
</Transition>
```

**Built-in Animations:**
```html
<div class="animate-spin">Spinner</div>
<div class="animate-ping">Ping indicator</div>
<div class="animate-pulse">Loading skeleton</div>
<div class="animate-bounce">Bounce effect</div>
```

### Animation Guidelines

**Do's:**
- ✅ Use animations to provide feedback (button press, form submit)
- ✅ Animate state changes (loading, success, error)
- ✅ Use subtle movements (2-4px, not large jumps)
- ✅ Animate one property at a time when possible
- ✅ Respect user preferences (prefers-reduced-motion)

**Don'ts:**
- ❌ Don't animate constantly (annoying)
- ❌ Don't use long durations (>500ms feels sluggish)
- ❌ Don't animate layout properties unnecessarily (causes reflow)
- ❌ Don't animate on every hover (reserve for interactive elements)

### Micro-interactions

Small delightful touches using Tailwind:

```vue
<!-- Success checkmark with bounce -->
<div class="animate-bounce text-green-500 text-2xl">✓</div>

<!-- Loading dots with staggered pulse -->
<div class="flex gap-1">
  <span class="animate-pulse">•</span>
  <span class="animate-pulse animation-delay-100">•</span>
  <span class="animate-pulse animation-delay-200">•</span>
</div>

<!-- Count up animation -->
<span class="transition-all duration-300 font-mono">{{ animatedValue }}</span>

<!-- Smooth hover state -->
<div class="transition-colors duration-200 hover:bg-pink-50" />

<!-- Interactive button -->
<UiButton class="transform transition-all duration-150 hover:scale-105 active:scale-95" />
```

**Accessibility Note:**
Always respect `prefers-reduced-motion`:
```html
<div class="motion-safe:animate-bounce motion-reduce:animate-none" />
```

## Component Patterns

All components should use **shadcn/ui** components from `/components/ui/` and styled with **Tailwind**.

### Cards (shadcn/ui)

Cards are the primary container for content groups. Always use `UiCard` from `/components/ui/card/`.

```vue
<script setup lang="ts">
import {
  UiCard,
  UiCardContent,
  UiCardDescription,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";
</script>

<template>
  <UiCard class="hover:shadow-md transition-shadow duration-200">
    <UiCardHeader>
      <UiCardTitle>Friendly Title</UiCardTitle>
      <UiCardDescription class="text-gray-500">
        Helpful description
      </UiCardDescription>
    </UiCardHeader>
    <UiCardContent>
      <!-- Content here -->
    </UiCardContent>
  </UiCard>
</template>
```

**Card Styling Patterns:**
```vue
<!-- Default card -->
<UiCard class="p-6" />

<!-- Interactive card -->
<UiCard class="hover:shadow-lg transition-all duration-200 cursor-pointer" />

<!-- Highlighted card -->
<UiCard class="border-pink-200 bg-pink-50" />
```

### Buttons (shadcn/ui)

Always use `UiButton` from `/components/ui/button/` with Tailwind styling.

```vue
<script setup lang="ts">
import { UiButton } from "~/components/ui/button";
</script>

<template>
  <!-- Primary action - pink -->
  <UiButton class="bg-pink-400 hover:bg-pink-500">
    Save Changes
  </UiButton>

  <!-- Secondary action - outline -->
  <UiButton variant="outline">
    Cancel
  </UiButton>

  <!-- Success action - green -->
  <UiButton class="bg-green-500 hover:bg-green-600">
    Complete
  </UiButton>

  <!-- Destructive action -->
  <UiButton variant="destructive">
    Delete
  </UiButton>

  <!-- With icon -->
  <UiButton class="gap-2">
    <Plus class="w-4 h-4" />
    Add Transaction
  </UiButton>
</template>
```

**Button Variants:**
```vue
<UiButton variant="default">Default</UiButton>
<UiButton variant="secondary">Secondary</UiButton>
<UiButton variant="outline">Outline</UiButton>
<UiButton variant="ghost">Ghost</UiButton>
<UiButton variant="destructive">Destructive</UiButton>
<UiButton variant="link">Link</UiButton>
```

**Button Sizes:**
```vue
<UiButton size="sm">Small</UiButton>
<UiButton size="default">Default</UiButton>
<UiButton size="lg">Large</UiButton>
<UiButton size="icon">Icon only</UiButton>
```

### Forms (Custom Components + shadcn/ui)

**Use Form Components from `/components/Form/`**

For all forms, use the existing form system:

```vue
<script setup lang="ts">
import Form from "~/components/Form/index.vue";
import FormField from "~/components/Form/Field/index.vue";
</script>

<template>
  <Form @submit="handleSubmit">
    <FormField
      name="amount"
      label="Transaction Amount"
      type="number"
      placeholder="0.00"
      required
    />
    
    <FormField
      name="description"
      label="Description"
      type="textarea"
      placeholder="What was this transaction for?"
    />
  </Form>
</template>
```

**Available Form Field Components:**
- `/components/Form/Field/index.vue` - Generic field
- `/components/Form/Field/Address.vue` - Address input
- `/components/Form/Field/CardSelect.vue` - Card selection
- `/components/Form/Field/FileUploaderMultiple.vue` - Multiple file upload
- `/components/Form/Field/ImageUploader.vue` - Image upload
- `/components/Form/Field/InputWithOptions.vue` - Input with suggestions
- `/components/Form/Field/MultipleSelect.vue` - Multi-select

**Using shadcn/ui Form Components Directly:**

When not using the Form system, use shadcn/ui components:

```vue
<script setup lang="ts">
import { UiLabel } from "~/components/ui/label";
import { UiInput } from "~/components/ui/input";
import { UiTextarea } from "~/components/ui/textarea";
import { UiSelect } from "~/components/ui/select";
</script>

<template>
  <form class="space-y-6">
    <div class="space-y-2">
      <UiLabel for="amount" class="text-sm font-medium">
        Transaction Amount
      </UiLabel>
      <UiInput
        id="amount"
        type="number"
        placeholder="0.00"
        class="text-lg font-mono"
      />
      <p class="text-xs text-gray-500">
        💡 Tip: Use negative for expenses, positive for income
      </p>
    </div>

    <!-- Success message -->
    <div v-if="success" class="p-4 bg-green-50 border border-green-200 rounded-lg">
      <p class="text-green-700 flex items-center gap-2">
        <span class="text-xl">✓</span>
        Successfully saved!
      </p>
    </div>
  </form>
</template>
```

**Form Styling Patterns:**
```vue
<!-- Form spacing -->
<form class="space-y-6"><!-- 24px between sections -->
  <div class="space-y-4"><!-- 16px between fields -->
    <div class="space-y-2"><!-- 8px within field -->
      <UiLabel />
      <UiInput />
      <p class="text-xs text-gray-500">Helper text</p>
    </div>
  </div>
</form>
```

### Empty States

Empty states should encourage action, not feel like dead ends.

```vue
<div class="text-center py-12">
  <div class="text-6xl mb-4">📊</div>
  <h3 class="text-xl font-semibold text-neutral-700 mb-2">
    No transactions yet
  </h3>
  <p class="text-neutral-500 mb-6">
    Start tracking your finances by adding your first transaction
  </p>
  <UiButton class="bg-primary-400 hover:bg-primary-500">
    Add Transaction
  </UiButton>
</div>
```

**Empty State Guidelines:**
- Use relevant emoji or illustration (friendly, not corporate)
- Explain why it's empty and what to do next
- Provide clear call-to-action
- Keep tone encouraging, not negative

### Loading States

Loading should feel purposeful, not frustrating.

```vue
<!-- Skeleton loading (preferred) -->
<div class="space-y-4">
  <div class="h-20 bg-neutral-100 rounded-lg animate-pulse" />
  <div class="h-20 bg-neutral-100 rounded-lg animate-pulse" />
</div>

<!-- Spinner with message -->
<div class="flex flex-col items-center gap-3 py-12">
  <UiSpinner class="text-primary-400" />
  <p class="text-sm text-neutral-500">Loading your transactions...</p>
</div>

<!-- Progress indicator for long operations -->
<div class="space-y-2">
  <div class="flex justify-between text-sm">
    <span>Importing transactions...</span>
    <span>45%</span>
  </div>
  <div class="h-2 bg-neutral-100 rounded-full overflow-hidden">
    <div class="h-full bg-primary-400 transition-all duration-300" style="width: 45%" />
  </div>
</div>
```

## Icons & Illustrations

### Icon System

Use emoji for personality, icons for functionality.

```vue
<!-- Emoji for categories and friendly UI -->
<span class="text-2xl">💰</span> Salary
<span class="text-2xl">🏠</span> Housing
<span class="text-2xl">🍔</span> Dining

<!-- Lucide icons for functional UI -->
<Plus class="w-4 h-4" />       <!-- Add button -->
<Search class="w-4 h-4" />     <!-- Search -->
<ChevronDown class="w-4 h-4" /><!-- Dropdown -->
```

**Guidelines:**
- Emoji for content (categories, empty states, celebrations)
- Lucide icons for UI controls
- Keep icon size consistent within context
- Use color to reinforce meaning

### Illustrations

For larger empty states and onboarding, consider:
- Simple, friendly line illustrations
- Soft pastel colors matching our palette
- Hand-drawn style for warmth
- Avoid stock photos (too corporate)

## Responsive Design

Mobile-first approach with friendly touch targets.

```css
/* Breakpoints */
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

**Touch Targets:**
- Minimum 44x44px for all interactive elements
- Generous spacing between tappable items
- Swipe gestures for mobile (delete, archive)

**Layout Patterns:**
```vue
<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Cards -->
</div>

<!-- Responsive sidebar -->
<div class="flex flex-col lg:flex-row gap-6">
  <aside class="lg:w-64"><!-- Sidebar --></aside>
  <main class="flex-1"><!-- Content --></main>
</div>
```

## Accessibility

Beautiful and accessible go hand-in-hand.

### Color Contrast

- Text on background: Minimum 4.5:1 ratio (WCAG AA)
- Large text (18px+): Minimum 3:1 ratio
- Test all color combinations

### Focus States

```css
/* Visible, friendly focus rings */
.focusable:focus-visible {
  outline: 2px solid var(--color-primary-400);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}
```

### Screen Readers

```vue
<!-- Always include aria labels -->
<button aria-label="Delete transaction">
  <Trash class="w-4 h-4" />
</button>

<!-- Descriptive alt text -->
<img src="chart.png" alt="Monthly spending breakdown showing 40% on housing" />

<!-- Loading states -->
<div role="status" aria-live="polite">
  Loading transactions...
</div>
```

## Dark Mode (Future)

Maintain the cosy feel in dark mode:

```css
/* Dark mode colors - still soft and friendly */
--dark-bg: #1a1a1a;
--dark-card: #242424;
--dark-text: #e5e5e5;

/* Adjust pink/green for dark mode */
--dark-primary: #f9a8d4;    /* Lighter pink */
--dark-secondary: #86efac;  /* Lighter green */
```

## Voice & Tone

How we communicate visually and textually.

**Voice Characteristics:**
- Friendly, not formal
- Helpful, not condescending
- Clear, not jargon-filled
- Encouraging, not demanding

**Example Messages:**
```
✅ Good:
"Great! Your transaction has been saved."
"Let's add your first bank account to get started!"
"Oops! That amount doesn't look quite right."

❌ Bad:
"Transaction successfully persisted to database."
"You must complete the onboarding process."
"Error: Invalid input."
```

## Implementation Checklist

When building new features:

- [ ] Uses soft pink (primary) and green (secondary) appropriately
- [ ] Has smooth transitions on interactive elements
- [ ] Includes friendly empty states with emoji
- [ ] Uses generous spacing and rounded corners
- [ ] Provides helpful hints and guidance
- [ ] Works well on mobile (touch targets, responsive)
- [ ] Has proper focus states for accessibility
- [ ] Uses encouraging, friendly language
- [ ] Loading states are clear and purposeful
- [ ] Celebrates user successes

## Data Visualization

Use **Unovis** charts with shadcn/ui wrappers for all data visualization.

### Chart Components (shadcn/ui + Unovis)

Located in `/components/ui/chart/`:
- `ChartContainer.vue` - Wrapper for all charts
- `ChartTooltip.vue` - Chart tooltips
- `ChartLegend.vue` - Chart legends

**Available Chart Types (Unovis):**
- Line charts - Trends over time
- Bar charts - Comparisons
- Area charts - Cumulative values
- Donut/Pie charts - Proportions
- Scatter plots - Relationships

**Example Usage:**

```vue
<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis } from "@unovis/vue";
import { UiCard, UiCardContent, UiCardHeader, UiCardTitle } from "~/components/ui/card";

const data = ref([
  { date: "Jan", income: 5000, expenses: 3000 },
  { date: "Feb", income: 5500, expenses: 3200 },
  { date: "Mar", income: 6000, expenses: 3500 },
]);

const x = (d: any) => d.date;
const y = [(d: any) => d.income, (d: any) => d.expenses];
</script>

<template>
  <UiCard>
    <UiCardHeader>
      <UiCardTitle>Income vs Expenses</UiCardTitle>
    </UiCardHeader>
    <UiCardContent>
      <VisXYContainer :data="data" :height="300">
        <VisLine :x="x" :y="y" />
        <VisAxis type="x" />
        <VisAxis type="y" />
      </VisXYContainer>
    </UiCardContent>
  </UiCard>
</template>
```

**Chart Styling with Tailwind:**
```vue
<!-- Chart container -->
<div class="w-full h-64 sm:h-80 lg:h-96">
  <VisXYContainer />
</div>

<!-- Chart colors matching design system -->
<VisLine :color="['rgb(244, 114, 182)', 'rgb(34, 197, 94)']" />
<!-- Pink and green matching our palette -->
```

**Chart Guidelines:**
- Use soft pink for primary data
- Use soft green for positive/income data
- Use soft red for negative/expense data
- Keep axis labels clear and readable
- Provide tooltips for detailed information
- Use responsive height classes

## Resources

**Official Documentation:**
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Component library documentation
- [Unovis](https://unovis.dev) - Data visualization library
- [Radix UI](https://www.radix-ui.com) - Accessible component primitives

**Tools:**
- [Tailwind Play](https://play.tailwindcss.com) - Playground
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - Verify accessibility

**Design References:**
- [Notion](https://notion.so) - Clean, friendly UI
- [Linear](https://linear.app) - Smooth interactions
- [Daybridge](https://daybridge.com) - Cosy, pastel aesthetic

---

**Remember**: Every design decision should make the user feel more confident and capable of managing their finances. We're not just building an app; we're building a trusted financial companion.

**Version:** 1.0.0
**Last Updated:** January 2026
