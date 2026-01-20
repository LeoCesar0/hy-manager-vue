# Future Implementations

This document outlines planned features and enhancements for the Personal Finance Manager application.

## Investment Management Module

A comprehensive investment tracking system to complement the existing transaction management.

### Features

- **Investment Accounts**
  - Support for various investment types: stocks, bonds, crypto, real estate
  - Multiple portfolio tracking
  - Cost basis and acquisition date tracking
  - Integration with existing bank accounts

- **Portfolio Tracking**
  - Real-time market value updates via API integrations
  - Historical performance charts
  - Asset allocation visualization (pie/donut charts by asset class)
  - Dividend/income tracking

- **Performance Metrics**
  - ROI (Return on Investment) calculations
  - Time-weighted returns
  - Money-weighted returns
  - Benchmark comparisons (S&P 500, etc.)
  - Gain/loss reports (realized and unrealized)

- **API Integrations**
  - Yahoo Finance API for stock prices
  - Alpha Vantage for detailed market data
  - CoinGecko/CoinMarketCap for cryptocurrency prices
  - Manual price updates for real estate and other illiquid assets

### Implementation Notes

- Create new collections: `investments`, `portfolios`
- Add new schemas in `src/@schemas/models/`
- Leverage existing analytics services for calculations
- Use ApexCharts for portfolio visualization

## CSV Bank Statement Reader

Automate transaction imports from bank statement CSV files.

### Core Features

- **File Upload**
  - Upload CSV files to Firebase Storage
  - Support for multiple file formats
  - Drag-and-drop interface
  - File validation and preview

- **Parsing Engine**
  - Plugin architecture for different bank formats
  - Base reader interface at `src/services/csv-readers/base-reader.ts`
  - Bank-specific implementations (e.g., `nubank-reader.ts`)

- **Nubank Format Support**
  CSV headers: `Data,Valor,Identificador,Descrição`
  
  Example:
  ```csv
  Data,Valor,Identificador,Descrição
  2024-01-15,50.00,ABC123,Mercado ABC
  2024-01-16,-120.50,XYZ789,Restaurante XYZ
  ```

- **Mapping Interface**
  - Visual column mapper
  - Map CSV columns to transaction fields
  - Handle date format variations
  - Currency conversion support
  - Save mapping profiles per bank

- **Smart Import**
  - Duplicate detection (by date, amount, description)
  - Automatic creditor matching
  - Category suggestions based on description
  - Review screen before final import
  - Bulk edit capabilities

- **Transaction Creation**
  - Batch create transactions
  - Auto-create creditors as needed
  - Link to existing categories
  - Import summary report

### Implementation Path

1. Create `src/services/csv-readers/` directory
2. Implement base reader interface
3. Create Nubank reader plugin
4. Build upload component with Firebase Storage
5. Develop mapping UI
6. Implement duplicate detection logic
7. Add import review/confirmation flow

## Budget Management

Set and track budgets to control spending and achieve financial goals.

### Features

- **Budget Creation**
  - Set monthly budgets per category
  - Overall monthly budget
  - Recurring vs one-time budgets
  - Custom date ranges

- **Budget Tracking**
  - Real-time spending vs budget
  - Visual progress bars
  - Percentage used indicators
  - Projected overspending alerts

- **Alerts and Notifications**
  - Email/in-app notifications
  - Threshold alerts (e.g., 80% of budget used)
  - Weekly budget summaries
  - Customizable alert preferences

- **Budget Features**
  - Rollover unused budget to next month
  - Split budgets across categories
  - Budget templates for quick setup
  - Historical budget performance

### Technical Considerations

- New collection: `budgets`
- Schema with category ID, amount, period
- Composable: `useBudget` for tracking logic
- Dashboard widget showing budget status
- Alert system using Firebase Cloud Functions

## Recurring Transactions

Automate regular income and expense tracking.

### Features

- **Pattern Configuration**
  - Frequency: daily, weekly, bi-weekly, monthly, quarterly, yearly
  - Custom intervals (every N days/weeks/months)
  - End date or number of occurrences
  - Skip weekends/holidays option

- **Auto-Creation**
  - Scheduled transaction generation
  - Firebase Cloud Functions or client-side cron
  - Notification before auto-creation
  - Manual approval option

- **Management**
  - Edit upcoming occurrences
  - Pause/resume recurring transactions
  - Delete with option to keep/remove history
  - View all upcoming transactions

- **Use Cases**
  - Rent/mortgage payments
  - Salary deposits
  - Subscription services
  - Utility bills
  - Loan payments

### Implementation

- Collection: `recurringTransactions`
- Cron job to generate transactions
- Calendar view of upcoming transactions
- Template system for quick creation

## Multi-Currency Support

Handle transactions in multiple currencies for international users.

### Features

- **Currency Management**
  - Set base currency per user
  - Support for 100+ currencies
  - Assign currency per bank account
  - Display amounts in account currency or base currency

- **Exchange Rates**
  - Daily exchange rate updates via API
  - Historical rate storage
  - Manual rate overrides
  - Rate effective date tracking

- **Reporting**
  - Consolidated reports in base currency
  - Foreign exchange gain/loss tracking
  - Multi-currency transaction views
  - Currency conversion history

- **API Integration**
  - Open Exchange Rates
  - Fixer.io
  - ECB (European Central Bank)
  - Fallback to manual rates

### Technical Notes

- Add `currency` field to bank accounts
- Add `exchangeRate` field to transactions
- Create `exchangeRates` collection
- Update all analytics to handle currency conversion
- Format amounts with appropriate currency symbols

## Reports & Exports

Generate detailed financial reports and export data.

### Report Types

- **Transaction Reports**
  - Custom date range
  - Filter by categories, creditors, accounts
  - Detailed vs summary views
  - Include/exclude specific transactions

- **Tax Reports**
  - Income summary by category
  - Deductible expenses
  - Charitable contributions
  - Business expense reports
  - Year-end summaries

- **Spending Analysis**
  - Category breakdown
  - Month-over-month trends
  - Year-over-year comparisons
  - Average spending per category
  - Top spending merchants

- **Cash Flow**
  - Income vs expenses over time
  - Net cash flow
  - Running balance
  - Projection based on trends

### Export Formats

- **PDF Reports**
  - Professional formatting
  - Charts and graphs
  - Customizable branding
  - Email delivery option

- **Excel/CSV**
  - Raw transaction data
  - Pivot-ready format
  - Multiple sheets for different views
  - Import into accounting software

- **JSON Export**
  - Complete data backup
  - API-friendly format
  - Import into other systems

### Implementation

- Use `jsPDF` for PDF generation
- `xlsx` library already installed
- Create report templates
- Background job for large exports
- Email service integration

## Mobile Application

Native mobile app for on-the-go finance management.

### Platform

- **React Native** or **Flutter**
  - Single codebase for iOS and Android
  - Shared Firebase backend
  - Code reuse from web app (business logic)

### Mobile-Specific Features

- **Receipt Scanning**
  - Camera integration
  - OCR (Optical Character Recognition)
  - Extract amount, date, merchant
  - Attach photo to transaction
  - Cloud Vision API or Tesseract.js

- **Quick Entry**
  - Simplified transaction form
  - Voice input for descriptions
  - GPS-based merchant suggestions
  - Recent transactions quick add

- **Notifications**
  - Push notifications for budgets
  - Reminders for recurring transactions
  - Daily/weekly summaries
  - Custom alerts

- **Offline Mode**
  - Cache transactions locally
  - Sync when online
  - Offline transaction creation
  - Conflict resolution

- **Biometric Auth**
  - Face ID / Touch ID
  - Secure login
  - Quick access with biometrics

### Development Path

1. Set up React Native/Flutter project
2. Configure Firebase for mobile
3. Implement authentication
4. Build core transaction flows
5. Add camera and OCR
6. Implement offline sync
7. Deploy to App Store and Play Store

## Additional Features

### Debt Tracking
- Loans and mortgages
- Payment schedules
- Interest calculations
- Payoff projections

### Goal Setting
- Savings goals
- Progress tracking
- Goal-based budgeting
- Milestone notifications

### Expense Splitting
- Share expenses with others
- Group transactions
- Settlement tracking
- Integration with Splitwise-like features

### Financial Insights
- AI-powered spending insights
- Anomaly detection
- Saving recommendations
- Personalized tips

### Integration with Accounting Software
- QuickBooks export
- Xero integration
- FreshBooks compatibility
- Standard accounting formats

### Multi-User Households
- Shared accounts
- Permission levels
- Individual and household views
- Expense approval workflows

## Technology Considerations

### Performance Optimization
- Implement pagination for large datasets
- Add caching strategies
- Optimize Firebase queries
- Lazy load components

### Security Enhancements
- Two-factor authentication
- Session management
- Audit logs
- Data encryption at rest

### Backup and Recovery
- Automated backups
- Point-in-time recovery
- Export all data
- Import from backup

### Internationalization
- Multi-language support
- Date/number format localization
- Right-to-left language support
- Currency symbol placement
