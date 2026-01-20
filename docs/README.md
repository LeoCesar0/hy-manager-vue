# Documentation

Welcome to the Personal Finance Manager documentation. This directory contains comprehensive guides for developing and designing the application.

## 📚 Documentation Index

### [CONSTITUTION.md](./CONSTITUTION.md)
**Code Architecture & Development Standards**

The constitution defines how we write code, organize files, and maintain consistency across the application.

**What's inside:**
- ✅ Core principles (DRY, single object parameters, one function per file)
- ✅ Project structure and naming conventions
- ✅ Function design patterns
- ✅ Component reusability guidelines
- ✅ State management patterns
- ✅ Anti-patterns to avoid
- ✅ Code examples and checklist

**Read this when:**
- Starting development on any feature
- Writing new services or components
- Refactoring existing code
- Code review process
- Onboarding new developers

---

### [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
**Visual Design & UI/UX Guidelines**

The design system establishes our visual language and user experience principles.

**What's inside:**
- 🎨 Technology stack (Tailwind CSS, shadcn/ui, Unovis)
- 🎨 Color palette (soft pink primary, soft green secondary)
- 🎨 Typography system with Tailwind classes
- 🎨 Spacing, borders, and shadows
- 🎨 Animation and transition patterns
- 🎨 Component patterns (cards, buttons, forms)
- 🎨 Data visualization with Unovis
- 🎨 Accessibility guidelines

**Read this when:**
- Designing new features or pages
- Choosing colors or styling components
- Creating animations and transitions
- Working with forms or data visualizations
- Ensuring consistent UI/UX

---

### [FUTURE_IMPLEMENTATIONS.md](./FUTURE_IMPLEMENTATIONS.md)
**Roadmap & Planned Features**

A comprehensive list of planned features and enhancements for future development.

**What's inside:**
- 🚀 Investment management module
- 🚀 CSV bank statement reader
- 🚀 Budget management system
- 🚀 Recurring transactions
- 🚀 Multi-currency support
- 🚀 Reports and exports
- 🚀 Mobile application
- 🚀 Additional features (debt tracking, goals, etc.)

**Read this when:**
- Planning the roadmap
- Prioritizing features
- Understanding the vision
- Contributing new ideas
- Exploring enhancement opportunities

---

## 🎯 Quick Start Guide

### For Developers

1. **Read [CONSTITUTION.md](./CONSTITUTION.md)** first
   - Understand code organization
   - Learn naming conventions
   - Review component patterns
   - Study anti-patterns to avoid

2. **Review [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**
   - Familiarize with Tailwind classes
   - Understand shadcn/ui components
   - Learn color palette
   - Review component styling patterns

3. **Check [FUTURE_IMPLEMENTATIONS.md](./FUTURE_IMPLEMENTATIONS.md)**
   - See what's planned
   - Understand long-term vision
   - Identify enhancement opportunities

### For Designers

1. **Start with [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**
   - Review color palette and typography
   - Understand spacing and layout
   - Study component patterns
   - Learn animation guidelines

2. **Reference [CONSTITUTION.md](./CONSTITUTION.md)** for:
   - Understanding component structure
   - Available UI components
   - Form system capabilities

3. **Review [FUTURE_IMPLEMENTATIONS.md](./FUTURE_IMPLEMENTATIONS.md)**
   - Upcoming features to design for
   - Future UI/UX considerations

---

## 🛠️ Technology Stack

### Core Technologies
- **Framework**: Nuxt 3 (Vue 3)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (utility-first)
- **UI Components**: shadcn/ui (`/components/ui/`)
- **Form System**: Custom components (`/components/Form/`)
- **Charts**: Unovis + shadcn/ui wrappers
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **State Management**: Pinia

### Key Dependencies
- `@unovis/vue` - Data visualization
- `reka-ui` - Accessible primitives (used by shadcn/ui)
- `zod` - Schema validation
- `vee-validate` - Form validation
- `vue-sonner` - Toast notifications

---

## 📋 Development Workflow

### Before Starting a Feature

1. ✅ **Check CONSTITUTION.md** for code patterns
2. ✅ **Check DESIGN_SYSTEM.md** for styling guidelines
3. ✅ **Check FUTURE_IMPLEMENTATIONS.md** if related to roadmap
4. ✅ Create feature branch
5. ✅ Use shadcn/ui components from `/components/ui/`
6. ✅ Style with Tailwind CSS only
7. ✅ Use Form components for complex forms
8. ✅ Follow naming conventions
9. ✅ Use single object parameters
10. ✅ One primary function per file

### During Development

- **Use Tailwind classes** - No custom CSS
- **Use shadcn/ui components** - No custom buttons/inputs
- **Use Form system** - For all forms
- **Follow DRY principle** - Extract reusable components/functions
- **Separate concerns** - Services (data) vs logic (transformations)
- **Test responsiveness** - Mobile-first approach

### Before Submitting

- ✅ Run linter and type checker
- ✅ Review checklist in CONSTITUTION.md
- ✅ Verify design system compliance
- ✅ Test on mobile and desktop
- ✅ Check accessibility (focus states, ARIA labels)
- ✅ Update documentation if needed

---

## 🎨 Design Philosophy

### Core Values

**Cosy & Welcoming**
- Soft pastel colors (pink + green)
- Generous spacing and rounded corners
- Friendly language and helpful hints

**Delightful Interactions**
- Smooth transitions (200ms default)
- Subtle hover effects
- Meaningful animations
- Micro-interactions

**Clarity & Confidence**
- Clear visual hierarchy
- Self-documenting interfaces
- Helpful empty states
- Obvious action paths

---

## 📖 Additional Resources

### Official Documentation
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Unovis](https://unovis.dev)
- [Nuxt 3](https://nuxt.com)
- [Vue 3](https://vuejs.org)
- [Firebase](https://firebase.google.com)

### Design Inspiration
- [Notion](https://notion.so) - Clean, friendly UI
- [Linear](https://linear.app) - Smooth interactions
- [Daybridge](https://daybridge.com) - Cosy aesthetic

---

## 🤝 Contributing

When contributing to this project:

1. Read all three documentation files
2. Follow the established patterns
3. Use the technology stack as specified
4. Maintain consistency with existing code
5. Update documentation when adding new patterns
6. Ask questions if anything is unclear

---

## 📞 Questions?

If you have questions about:
- **Code patterns** → See CONSTITUTION.md
- **Design decisions** → See DESIGN_SYSTEM.md
- **Feature plans** → See FUTURE_IMPLEMENTATIONS.md
- **Something else** → Open a discussion or ask the team

---

**Last Updated:** January 2026
**Version:** 1.0.0
