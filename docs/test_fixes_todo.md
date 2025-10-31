# Test Fixes TODO List

## Overview
This document tracks all failing tests that need to be fixed. Each test is categorized by type and includes the file path, test name, and the issue to resolve.

---

## 🔴 High Priority - CRUD Operations (3 tests)

### 1. Admin Posts - Delete Flow
- **File**: `tests/dashboard/content/admin-posts.flows.dom.test.tsx`
- **Test**: `Admin Posts CRUD flows > deletes an existing post`
- **Issue**: Unable to find "Edit" button text
- **Root Cause**: The Edit button is not rendering or has different text
- **Fix Required**: 
  - [ ] Verify PostsTable component renders Edit button for each row
  - [ ] Check if button text is "Edit" or uses an icon/aria-label
  - [ ] Update test selector to use proper role/aria-label if needed
- **Status**: ❌ Not Started

---

## 🟡 Medium Priority - UI Components (8 tests)

### 2. EditableField - Password Masking
- **File**: `tests/components/editable-field.test.tsx`
- **Test**: `EditableField Component > shows masked value for password fields`
- **Issue**: Unable to find text "••••••" (expecting 6 bullets, rendering 8)
- **Root Cause**: Password masking renders 8 bullets instead of 6
- **Fix Required**:
  - [ ] Update test expectation from "••••••" (6) to "••••••••" (8)
  - [ ] OR fix component to render correct number of bullets matching password length
- **Status**: ❌ Not Started

### 3. System Health Hook - Polling Interval
- **File**: `src/hooks/admin/__tests__/useSystemHealth.test.tsx`
- **Test**: `useSystemHealth hook > uses configured polling interval in SWR options`
- **Issue**: Expected polling interval 12345 but got undefined
- **Root Cause**: SWR configuration not passing through polling interval
- **Fix Required**:
  - [ ] Check useSystemHealth hook implementation
  - [ ] Ensure refreshInterval is properly set in SWR config
  - [ ] Verify test mock setup is correct
- **Status**: ❌ Not Started

### 4. Communication Settings - Export/Import UI
- **File**: `tests/components/communication-settings.export-import.ui.test.tsx`
- **Test**: `Communication Settings Export/Import UI > shows Export/Import and posts import`
- **Issue**: Expected true but got false (element not found)
- **Root Cause**: Export/Import buttons not rendering or not visible
- **Fix Required**:
  - [ ] Verify CommunicationSettings component includes Export/Import UI
  - [ ] Check if feature is behind a feature flag or permission
  - [ ] Add missing Export/Import functionality if not present
- **Status**: ❌ Not Started

### 5. Analytics Settings - Duplicate Import Buttons
- **File**: `tests/components/analytics-settings.export-import.ui.test.tsx`
- **Test**: `Analytics Settings Export/Import UI > shows Export/Import and posts import`
- **Issue**: Found multiple elements with text "Import" (one in header, one in modal)
- **Root Cause**: Test query is too broad, not specific enough
- **Fix Required**:
  - [ ] Update test to use more specific selector (getByRole with name)
  - [ ] Use getAllByText and select the correct one by index
  - [ ] Add test-id or aria-label to differentiate the buttons
- **Status**: ❌ Not Started

### 6. Data Table - Selection Count Display
- **File**: `tests/dashboard/tables/dom/advanced-data-table.interactions.dom.test.tsx`
- **Test**: `AdvancedDataTable interactions > select all toggles selection count and calls onSelectionChange`
- **Issue**: Expected "3 selected" not found in text
- **Root Cause**: Selection count text format different or not rendering
- **Fix Required**:
  - [ ] Check AdvancedDataTable selection counter implementation
  - [ ] Verify format matches expectation (e.g., "3 selected" vs "{{count}} selected")
  - [ ] Fix template string rendering or update test expectation
- **Status**: ❌ Not Started

### 7. Realtime Data Revalidation
- **File**: `tests/dashboard/realtime/revalidate-on-event.test.tsx`
- **Test**: `useUnifiedData revalidates on realtime events > updates data when an interested event is triggered`
- **Issue**: Expected "n:1" but got "n:0" (data not updating)
- **Root Cause**: Realtime event not triggering revalidation
- **Fix Required**:
  - [ ] Check useUnifiedData hook's event subscription
  - [ ] Verify realtime provider is properly broadcasting events
  - [ ] Ensure SWR mutate/revalidate is called on event
  - [ ] Add await/waitFor in test for async update
- **Status**: ❌ Not Started

### 8. Automated Billing - Currency Formatting
- **File**: `tests/invoicing/automated-billing.dom.test.tsx`
- **Test**: `AutomatedBillingSequences UI > renders form fields and preview list with defaults`
- **Issue**: Unable to find "USD 500.00" text
- **Root Cause**: Currency formatting different from expected
- **Fix Required**:
  - [ ] Check actual rendered format (likely "USD 500.00" with extra spaces)
  - [ ] Update test to match actual format or use regex matcher
  - [ ] Verify currency formatter output in component
- **Status**: ❌ Not Started

---

## 🟠 Medium Priority - Navigation & A11y (5 tests)

### 9. Admin Footer - Settings Link Missing
- **File**: `tests/admin/layout/AdminFooter.test.tsx`
- **Test**: `AdminFooter > renders admin footer with system information and quick links`
- **Issue**: Unable to find link with role "link" and name matching /Settings/
- **Root Cause**: Quick links section rendering empty or missing Settings link
- **Fix Required**:
  - [ ] Add quick links array to AdminFooter component
  - [ ] Ensure Settings link is included with proper href and text
  - [ ] Verify links are rendering with role="link" (check if using Link component)
- **Status**: ❌ Not Started

### 10. Data Table - Focusability Issue
- **File**: `tests/dashboard/tables/dom/advanced-data-table.a11y-focus.dom.test.tsx`
- **Test**: `AdvancedDataTable a11y focusability > header sort button and pagination buttons are focusable`
- **Issue**: Expected button elements don't match (different structure)
- **Root Cause**: Button DOM structure mismatch between test expectation and actual render
- **Fix Required**:
  - [ ] Review AdvancedDataTable header sort button structure
  - [ ] Check if extra wrapper elements are being added
  - [ ] Update test to match actual accessible structure
- **Status**: ❌ Not Started

### 11. Sidebar - Toggle Button A11y
- **File**: `tests/dashboard/nav/sidebar-keyboard.dom.test.tsx`
- **Test**: `Sidebar a11y and keyboard support > exposes navigation landmark and supports toggle via accessible button`
- **Issue**: Expected true but got false (landmark or button not accessible)
- **Root Cause**: Missing navigation landmark or toggle button not accessible
- **Fix Required**:
  - [ ] Add `<nav>` element or role="navigation" to Sidebar
  - [ ] Ensure toggle button has proper aria-label or accessible name
  - [ ] Check that button is in accessibility tree
- **Status**: ❌ Not Started

### 12. Navigation - useRouter Mock Issue
- **File**: `tests/ui/navigation.a11y.dom.test.tsx`
- **Test**: `Navigation a11y > has nav landmark, aria-current on active link, and accessible mobile toggle`
- **Issue**: No "useRouter" export defined on "next/navigation" mock
- **Root Cause**: Mock setup incomplete for Next.js navigation
- **Fix Required**:
  - [ ] Update test setup to properly mock next/navigation
  - [ ] Use vi.importActual for partial mock
  - [ ] Export useRouter in mock with required methods
- **Status**: ❌ Not Started

### 13. Sidebar IA - Invoice Link Missing
- **File**: `tests/dashboard/nav/sidebar-ia.test.tsx`
- **Test**: `Sidebar IA > renders nav links for all groups when collapsed`
- **Issue**: Expected link for /admin/invoices but got null
- **Root Cause**: Invoices link not in navigation config or not rendering
- **Fix Required**:
  - [ ] Add /admin/invoices to Sidebar navigation items
  - [ ] Verify navigation config includes all required routes
  - [ ] Check if link is conditionally rendered based on permissions
- **Status**: ❌ Not Started

---

## 🟢 Low Priority - Test Configuration (4 tests)

### 14. Localization Save Component
- **File**: `tests/components/localization-save.test.tsx`
- **Test**: No tests found (0 tests)
- **Issue**: Test file exists but contains no test cases
- **Fix Required**:
  - [ ] Add test cases for localization save functionality
  - [ ] OR remove empty test file if not needed
- **Status**: ❌ Not Started

### 15. Communication Settings Page
- **File**: `tests/components/communication-settings.page.test.tsx`
- **Test**: No tests found (0 tests)
- **Issue**: Test file exists but contains no test cases
- **Fix Required**:
  - [ ] Implement page-level tests for communication settings
  - [ ] OR remove empty test file if not needed
- **Status**: ❌ Not Started

### 16. Service Requests Table
- **File**: `tests/components/service-requests.table.test.tsx`
- **Test**: No tests found (0 tests)
- **Issue**: Test file exists but contains no test cases
- **Fix Required**:
  - [ ] Add tests for service requests table component
  - [ ] OR remove empty test file if not needed
- **Status**: ❌ Not Started

### 17. Multiple Empty Test Files (8 files)
- **Files**: 
  - `tests/components/kpi-grid.smoke.test.tsx`
  - `tests/components/services-list.smoke.test.tsx`
  - `tests/home/services-section.loading.a11y.dom.test.tsx`
  - `tests/components/settings-shell.test.tsx`
  - `tests/providers/route-announcer.dom.test.tsx`
  - `tests/admin/providers/admin-providers.test.tsx`
  - `tests/components/org-general-tab.test.tsx`
- **Issue**: Test files exist but contain no test cases
- **Fix Required**:
  - [ ] Implement tests for each component
  - [ ] OR remove empty test files to clean up codebase
- **Status**: ❌ Not Started

---

## ⚠️ Warnings to Address

### React Act Warnings (4 occurrences)
- **File**: `tests/admin/settings/SettingsOverview.test.tsx`
- **Issue**: State updates not wrapped in act()
- **Components Affected**: 
  - PinnedSettingsList
  - SettingsOverviewInner
- **Fix Required**:
  - [ ] Wrap state-triggering actions in act()
  - [ ] Use waitFor() for async updates
  - [ ] Add proper async handling in tests
- **Status**: ❌ Not Started

---

## Summary Statistics

- **Total Failing Tests**: 13 actual test failures
- **Empty Test Files**: 11 files with no tests
- **Warnings**: 4 React act warnings

### By Priority
- 🔴 High Priority (Critical): 1 test
- 🟡 Medium Priority (UI/Logic): 8 tests
- 🟠 Medium Priority (A11y/Nav): 5 tests
- 🟢 Low Priority (Config): 12 items

### By Category
- CRUD Operations: 1
- UI Components: 7
- Navigation/A11y: 5
- Test Configuration: 11
- Warnings: 4

---

## Next Steps

1. **Start with High Priority** - Fix the delete flow test
2. **UI Component Fixes** - Address medium priority UI tests
3. **Navigation/A11y** - Fix accessibility and navigation issues
4. **Clean Up** - Remove or implement empty test files
5. **Address Warnings** - Wrap state updates properly

---

## Progress Tracker

- [ ] **Week 1**: High Priority + 4 UI tests
- [ ] **Week 2**: Remaining UI tests + Navigation tests
- [ ] **Week 3**: Empty test files + Warnings
- [ ] **Week 4**: Review and regression testing

**Last Updated**: October 31, 2025
**Total Progress**: 0/28 items completed (0%)
