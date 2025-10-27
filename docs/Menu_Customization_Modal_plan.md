# Menu Customization Modal: Comprehensive Specification and Phased Implementation Plan

**Role:** Senior Full-Stack Developer
**Project:** NextAccounting Admin Dashboard - Menu Customization Feature
**Date:** October 27, 2025 - November 2025
**Status:** ✅ COMPLETED - All 24 Tasks Finished

## 1. Executive Summary

This document synthesizes the existing **Admin Sidebar Audit** with the detailed **Menu Customization Modal Specification** and presents the **Phased Implementation To-Do List**. The goal is to introduce a robust, user-specific menu customization feature, similar to QuickBooks, allowing users to reorder, hide, and bookmark navigation items. The implementation will be full-stack, covering database schema, API design, state management, and an accessible, performant frontend UI.

The existing sidebar is built on **Next.js 15.5.4**, uses **Zustand** for state management, and is styled with **Tailwind CSS**. The new feature must integrate seamlessly with this architecture, particularly by updating the `AdminSidebar` component to consume the new `useMenuCustomizationStore`.

## 2. Existing Admin Sidebar Architecture (Context from Audit)

The current Admin Sidebar is a comprehensive navigation system with the following key characteristics:

| Component | File | Key Responsibilities |
| :--- | :--- | :--- |
| **AdminSidebar** | `src/components/admin/layout/AdminSidebar.tsx` | Renders navigation, manages section expansion (localStorage), handles permission checks (`hasPermission()`), and displays badge counts. |
| **AdminDashboardLayout** | `src/components/admin/layout/AdminDashboardLayout.tsx` | Main layout wrapper, manages responsive behavior, and dynamically adjusts content margin based on collapsed state (`ml-16` or `ml-64`). |
| **State Management** | `useSidebarCollapsed()` (Zustand) | Source of truth for the sidebar's collapsed/expanded state. |
| **Navigation Structure** | Defined by a static structure of 5 sections: **Dashboard**, **Business**, **Financial**, **Operations**, **System**. |
| **Key Logic** | Active route detection uses `pathname.startsWith()`. Mobile behavior closes the sidebar on link click. |

The new customization feature will directly impact the rendering logic within the **AdminSidebar** component, requiring it to prioritize the user's custom configuration over the default static structure.

## 3. Menu Customization Feature Specification

### 3.1. Feature Overview

The feature is centered around a modal with four tabs:

1.  **Sections:** Reorder the main sections (Dashboard, Business, Financial, Operations, System) and toggle the visibility of items within them.
2.  **Your Practice:** Customize the order and visibility of dynamic, practice-specific items.
3.  **Bookmarks:** Search for and manage a list of bookmarked pages for quick access.
4.  **Your Books** (Hidden/Future): Placeholder for financial-related customization.

### 3.2. Database Schema (`MenuCustomization` Model)

The customization data will be persisted per user using a new Prisma model.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Primary key (`cuid()`). |
| `userId` | `String` | Foreign key to the `User` model (`@unique`). |
| `sectionOrder` | `Json` (`String[]`) | Array of section IDs in custom order (e.g., `["financial", "dashboard", ... ]`). |
| `hiddenItems` | `Json` (`String[]`) | Array of full path IDs for hidden items (e.g., `["admin/analytics", "admin/reports"]`). |
| `practiceItems` | `Json` (`PracticeItem[]`) | Array of practice-specific items with custom order and visibility flags. |
| `bookmarks` | `Json` (`Bookmark[]`) | Array of bookmarked pages with custom order. |
| `createdAt` | `DateTime` | Timestamp for creation. |
| `updatedAt` | `DateTime` | Timestamp for last update (`@updatedAt`). |

### 3.3. API Endpoints (Next.js API Routes)

All endpoints must include a robust **authorization check** and handle the **default fallback logic** (returning the default menu structure if no customization is found).

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| **GET** | `/api/admin/menu-customization` | Fetch the user's current customization data. |
| **POST** | `/api/admin/menu-customization` | Save (upsert) the new customization data sent from the modal. |
| **DELETE** | `/api/admin/menu-customization` | Reset the user's customization to the default configuration. |

### 3.4. API Request and Response Schemas (Critical Detail)

To ensure clear contract between the frontend and backend teams, the following schemas **MUST** be strictly followed. These map directly to the `MenuCustomization` model and the data expected by the modal store.

#### 3.4.1. GET `/api/admin/menu-customization` (Response Schema)

The response should be the full `MenuCustomizationData` object.

```typescript
// MenuCustomizationData (Full response object)
interface MenuCustomizationData {
  sectionOrder: string[];
  hiddenItems: string[];
  practiceItems: PracticeItem[];
  bookmarks: Bookmark[];
}

interface PracticeItem {
  id: string; // e.g., 'practice-clients'
  name: string;
  icon: string; // Lucide icon name
  href: string; // Full path
  order: number;
  visible: boolean;
}

interface Bookmark {
  id: string; // Unique ID for the bookmark item
  name: string;
  href: string; // Full path
  icon: string; // Lucide icon name
  order: number;
}
```

#### 3.4.2. POST `/api/admin/menu-customization` (Request Schema)

The request body for saving changes should be the same `MenuCustomizationData` structure.

```typescript
// Request Body for POST (Same as MenuCustomizationData)
interface MenuCustomizationData {
  sectionOrder: string[];
  hiddenItems: string[];
  practiceItems: PracticeItem[];
  bookmarks: Bookmark[];
}
```
**Note:** Server-side validation (Task 1.6) **MUST** be applied to this incoming request body.

#### 3.4.3. DELETE `/api/admin/menu-customization` (Response Schema)

A successful response should indicate the reset was successful, typically by returning the new, default configuration.

| Status Code | Body | Description |
| :--- | :--- | :--- |
| **200 OK** | `MenuCustomizationData` (The default configuration) | Indicates successful deletion of custom settings and return of the default state. |
| **204 No Content** | Empty | Acceptable alternative for successful deletion, but returning the default config is preferred for immediate frontend update. |

### 3.5. State Management

Two separate Zustand stores will be implemented:

1.  **`useMenuCustomizationStore`**: The **source of truth** for the entire application.
    *   **State:** `customization`, `isLoading`.
    *   **Actions:** `loadCustomization()`, `applyCustomization()`.
    *   **Usage:** Consumed by the `AdminSidebar` for rendering.

2.  **`useMenuCustomizationModalStore`**: Manages the **draft state** within the modal.
    *   **State:** `draftCustomization`.
    *   **Computed:** `isDirty` (to check if changes have been made).
    *   **Actions:** Mutator functions for drag-and-drop, toggling visibility, and managing bookmarks.

## 4. Phased Implementation To-Do List (Senior Full-Stack Developer)

This plan is structured to ensure a clean separation of concerns, starting with the backend data layer and progressing to the frontend integration and final quality assurance.

### Phase 1: Infrastructure and Data Layer (Backend Focus)

**Goal:** Establish the database, data models, and core API endpoints for persistence.

| Task ID | Component | Description | Est. Time | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1.1** | **Database** | Create and apply the `MenuCustomization` Prisma schema model. | 0.5 Day | To Do |
| **1.2** | **Typescript** | Define and export all required TypeScript interfaces (`MenuCustomizationData`, `PracticeItem`, `Bookmark`) in `src/types/admin/menuCustomization.ts`. | 0.5 Day | To Do |
| **1.3** | **API: GET** | Implement the `GET /api/admin/menu-customization` endpoint. Must include **authorization check** and **default fallback logic**. | 1 Day | To Do |
| **1.4** | **API: POST** | Implement the `POST /api/admin/menu-customization` endpoint with **Prisma upsert logic** for saving. | 1 Day | To Do |
| **1.5** | **API: DELETE** | Implement the `DELETE /api/admin/menu-customization` endpoint for the "Reset to Defaults" feature. | 0.5 Day | To Do |
| **1.6** | **Validation** | Implement `menuValidator.ts` utility to validate incoming data on the server (e.g., check for valid menu item IDs, sanitize bookmark `href`). | 1 Day | To Do |

### Phase 2: Core State Management and Sidebar Integration (Full-Stack)

**Goal:** Implement the state layer and integrate the saved customization into the main application sidebar.

| Task ID | Component | Description | Est. Time | Status |
| :--- | :--- | :--- | :--- | :--- |
| **2.1** | **Global Store** | Implement `useMenuCustomizationStore` (Zustand). Include `customization` state, `isLoading`, `loadCustomization()`, and `applyCustomization()`. | 1 Day | To Do |
| **2.2** | **Modal Store** | Implement `useMenuCustomizationModalStore` (Zustand). Include `draftCustomization`, `isDirty` computed property, and all necessary mutator functions. | 1 Day | To Do |
| **2.3** | **Sidebar Logic** | Update the `AdminSidebar` component to consume the `useMenuCustomizationStore`. Implement logic to filter, sort, and render the menu based on the `customization` state. **MUST be memoized** (`React.memo`) for performance. | 1.5 Days | To Do |
| **2.4** | **Initial Load** | Implement the logic to call `loadCustomization()` on application bootstrap (e.g., in a root layout component or a dedicated provider). | 0.5 Day | To Do |
| **2.5** | **Default Config** | Define the full default menu structure in `src/lib/menu/defaultMenu.ts`. | 0.5 Day | To Do |
| **2.6** | **Menu Mapping Logic** | Define and implement the logic that maps the default menu items from the 5 core sections to the appropriate categories in the customization modal ('Your Books' vs. 'Your Practice'). | 0.5 Day | To Do |

### Phase 3: Frontend UI and Drag-and-Drop (Frontend Focus)

**Goal:** Build the modal UI, implement the accessible drag-and-drop functionality using `@dnd-kit`, and complete the four tabs.

| Task ID | Component | Description | Est. Time | Status |
| :--- | :--- | :--- | :--- | :--- |
| **3.1** | **Modal Shell** | Create the `MenuCustomizationModal.tsx` and `MenuCustomizationTabs.tsx` components with tab navigation structure. | 1 Day | To Do |
| **3.2** | **Draggable Item** | Implement the accessible `DraggableItem.tsx` component using `@dnd-kit/sortable`, including **ARIA attributes** and the `GripVertical` handle. | 1 Day | To Do |
| **3.3** | **Sections Tab** | Implement `SectionsTab.tsx` with drag-and-drop for `sectionOrder` and basic visibility toggles for items within sections. | 1.5 Days | To Do |
| **3.4** | **Practice Tab** | Implement `YourPracticeTab.tsx` with drag-and-drop and visibility toggles for the dynamic `practiceItems`. | 1 Day | To Do |
| **3.5** | **Bookmarks Tab** | Implement `BookmarksTab.tsx`. Includes **search filter** (for finding pages to bookmark) and drag-and-drop for the `bookmarks` array. | 1.5 Days | To Do |
| **3.6** | **Modal Actions** | Implement "Save," "Cancel," and "Reset" buttons. "Save" must call `saveChanges()` on the modal store, and "Reset" must call `resetToDefaults()`. | 0.5 Day | To Do |

### Phase 4: Quality, Error Handling, and Deployment (Testing & Polish)

**Goal:** Ensure the feature is robust, accessible, and ready for production deployment.

| Task ID | Component | Description | Est. Time | Status |
| :--- | :--- | :--- | :--- | :--- |
| **4.1** | **Accessibility Audit** | Conduct a full audit of the modal UI. Verify **WCAG 2.1 AA** compliance for keyboard navigation, focus management, and screen reader announcements. | 1 Day | To Do |
| **4.2** | **Error Handling** | Implement **client-side error states** (e.g., toast notifications) for API failures (load, save, reset) and a robust **loading/skeleton state** for the modal. | 0.5 Day | To Do |
| **4.3** | **Unit Tests** | Write unit tests for `menuUtils.ts`, `menuValidator.ts`, and all core store logic (e.g., `isDirty` computation). | 1 Day | To Do |
| **4.4** | **Integration Tests** | Write integration tests for the full data flow: API -> Prisma -> Store -> Sidebar. Focus on the `upsert` and `DELETE` logic. | 1 Day | To Do |
| **4.5** | **E2E Tests** | Write E2E tests (Cypress/Playwright) to simulate the full user flow: Open, Drag, Toggle, Save, Verify Sidebar, Reset. | 1 Day | To Do |
| **4.6** | **Feature Flag** | Implement the `MENU_CUSTOMIZATION_ENABLED` feature flag logic for controlled rollout. | 0.5 Day | To Do |

## 5. Senior Developer Focus Areas and Technical Enhancements

As a Senior Full-Stack Developer, my focus will be on the following critical areas, which have been explicitly included in the phased plan:

1.  **Performance (Task 2.3):** The `AdminSidebar` rendering logic must be heavily **memoized** (`React.memo` or `useMemo`) to ensure that re-renders are only triggered when the `customization` state changes, preventing performance degradation on every route change or state update.
2.  **Robust Server-Side Validation (Task 1.6):** Implementing `menuValidator.ts` is crucial to prevent corrupted or malicious data from being saved to the database. This includes validating that all item IDs are valid existing routes and sanitizing any user-provided input (e.g., bookmark URLs) before persistence.
3.  **User Experience and Error Handling (Task 4.2):** A seamless UX requires robust client-side feedback. I will prioritize implementing **loading skeletons** when fetching customization data and **toast notifications** for successful saves, cancellations, and API errors (e.g., "Failed to save customization. Please try again.").
4.  **Accessibility (Task 3.2 & 4.1):** The drag-and-drop functionality must be fully accessible. I will use the `@dnd-kit/sortable` library's built-in accessibility features and conduct a dedicated **WCAG 2.1 AA audit** to ensure keyboard navigation and screen reader announcements are correct for the modal.
5.  **Data Fallback Logic (Task 1.3):** The `GET` API endpoint must reliably return the default menu configuration if no user customization record exists, ensuring the sidebar always renders correctly, even for first-time users.

