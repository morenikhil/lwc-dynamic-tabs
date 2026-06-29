# Dynamic Tabs — Salesforce LWC Reusable Component

A production-ready, fully accessible tab bar component for Salesforce Lightning Experience. Supports **lazy-loaded panels**, **badge counts**, **SLDS icons**, and **close buttons** per tab.

---

## Component Architecture

<img width="4100" height="3100" alt="Dynamic Tabs Aarchitecture" src="https://github.com/user-attachments/assets/1472201a-b812-47b6-9e55-378752a0b4e3" />

| Component | Purpose | `isExposed` |
|-----------|---------|-------------|
| `c-dynamic-tabs` | Renders tab navigation bar, manages active state, keyboard nav | `true` |
| `c-dynamic-tab-panel` | Panel wrapper with lazy-load gate and show/hide | `false` |
| `c-dynamic-tabs-demo` | Reference implementation / playground | `true` |

---

## Features

| Feature | Detail |
|---------|--------|
| **Lazy loading** | Panel slot content only mounts on first activation; subsequent tab switches use CSS show/hide — zero re-render cost |
| **Badge counts** | Per-tab numeric badge; auto-caps at `99+`; updated programmatically via `updateBadge()` |
| **SLDS icons** | Any `lightning-icon` icon name accepted per tab |
| **Close buttons** | Per-tab opt-in; fires `tabclose` event for parent to handle removal |
| **Keyboard navigation** | Full ARIA tablist: `←` `→` `Home` `End` keys; focus managed |
| **Variants** | `default`, `scoped`, `vertical` SLDS tab styles |
| **Accessibility** | `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-disabled`, `aria-hidden` |
| **Programmatic API** | `switchTab(value)`, `updateBadge(value, count)`, `activeTab` getter |

---

## Quick Start

### 1. Deploy to Org

```bash
sf org login web --alias my-org
sf project deploy start --source-dir force-app --target-org my-org
```

### 2. Basic Usage

```html
<!-- myPage.html -->
<c-dynamic-tabs
    variant="default"
    default-tab="accounts"
    ontabchange={handleTabChange}
    ontabclose={handleTabClose}>

    <c-dynamic-tab-panel
        value="accounts"
        label="Accounts"
        icon-name="standard:account"
        badge-count={openCount}>
        <!-- Panel content — rendered lazily on first tab activation -->
        <c-account-list></c-account-list>
    </c-dynamic-tab-panel>

    <c-dynamic-tab-panel
        value="contacts"
        label="Contacts"
        icon-name="standard:contact"
        closeable>
        <c-contact-list></c-contact-list>
    </c-dynamic-tab-panel>

</c-dynamic-tabs>
```

```javascript
// myPage.js
import { LightningElement, track } from 'lwc';

export default class MyPage extends LightningElement {
    @track openCount = 4;

    handleTabChange(event) {
        const { value, previousValue } = event.detail;
        console.log(`Switched from "${previousValue}" to "${value}"`);
    }

    handleTabClose(event) {
        // Parent is responsible for removing the tab panel from the DOM
        const { value } = event.detail;
        // e.g. filter your tabs array
    }
}
```

---

## `c-dynamic-tabs` Reference

### `@api` Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `String` | `'default'` | SLDS tab variant: `'default'` \| `'scoped'` \| `'vertical'` |
| `defaultTab` | `String` | `''` | `value` of the tab to activate on first render |

### `@api` Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `switchTab` | `switchTab(value: string): void` | Programmatically activate a tab by value |
| `updateBadge` | `updateBadge(value: string, count: number): void` | Update a tab's badge count at runtime |
| `activeTab` | `get activeTab(): string` | Returns the currently active tab value |

### Events Fired

| Event | `detail` shape | Bubbles | Description |
|-------|---------------|---------|-------------|
| `tabchange` | `{ value, previousValue }` | Yes | Fires when the active tab changes |
| `tabclose` | `{ value }` | Yes | Fires when a close button is clicked (parent removes panel) |

---

## `c-dynamic-tab-panel` Reference

### `@api` Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `String` | `''` | **Required.** Unique identifier — must be unique within a tab set |
| `label` | `String` | `''` | Tab label text shown in the tab bar |
| `iconName` | `String` | `''` | SLDS icon name, e.g. `'standard:account'` |
| `badgeCount` | `Number` | `0` | Badge count (0 = hidden) |
| `closeable` | `Boolean` | `false` | Show a close (×) button on this tab |
| `disabled` | `Boolean` | `false` | Disable this tab (unclickable, skipped in keyboard nav) |

### `@api` Methods / Getters

| Member | Description |
|--------|-------------|
| `activate()` | Called by `c-dynamic-tabs` — activates and lazy-loads this panel |
| `deactivate()` | Called by `c-dynamic-tabs` — hides this panel (keeps content mounted) |
| `get isActive()` | `boolean` — whether this panel is currently visible |
| `get isLoaded()` | `boolean` — whether this panel has been activated at least once |

---

## Lazy Loading — How It Works

```
First tab activation:
  activate() called
    → _isActivating = true   (spinner shown for one microtask tick)
    → Promise.resolve().then(...)
    → _isLoaded = true       (lwc:if gate opens → slot content mounts)
    → _isActive = true       (slds-show applied)

Subsequent tab switches:
  activate()  → _isActive = true   (slds-show, content already mounted)
  deactivate()→ _isActive = false  (slds-hide, content stays in DOM)
```

This means each panel's child components are created **once** and never destroyed during tab switching — preserving their internal state (form values, scroll positions, etc.).

---

## Programmatic Usage Examples

### Switch tab from JavaScript

```javascript
// Get a reference to the tab container
const tabs = this.template.querySelector('c-dynamic-tabs');
tabs.switchTab('contacts');
```

### Update badge count dynamically (e.g. from a wire)

```javascript
@wire(getOpenCasesCount)
wiredCases({ data }) {
    if (data !== undefined) {
        const tabs = this.template.querySelector('c-dynamic-tabs');
        tabs?.updateBadge('cases', data);
    }
}
```

### Dynamically add and remove tabs

```javascript
@track myTabs = [{ value: 'tab1', label: 'Tab 1', iconName: 'standard:account', closeable: true }];

addTab() {
    this.myTabs = [...this.myTabs, { value: 'tab2', label: 'New Tab', iconName: 'standard:task', closeable: true }];
}

handleTabClose(event) {
    this.myTabs = this.myTabs.filter(t => t.value !== event.detail.value);
}
```

---

## Accessibility Checklist

- [x] `role="tablist"` on `<ul>`
- [x] `role="tab"` on each `<a>` inside `<li role="presentation">`
- [x] `role="tabpanel"` on each panel `<div>`
- [x] `aria-selected` on each tab anchor
- [x] `aria-controls` links tab anchor to its panel by ID
- [x] `aria-disabled` on disabled tabs
- [x] `aria-hidden` on inactive panels
- [x] `aria-label` on badge and close button
- [x] Full keyboard navigation: `←` `→` `Home` `End`
- [x] Focus management on keyboard nav

---

## Running Tests

```bash
# Install dependencies
npm install

# Run Jest tests
npm run test:unit

# Run with coverage
npm run test:unit -- --coverage
```

---

## Browser / Platform Support

| Platform | Support |
|----------|---------|
| Salesforce Lightning Experience | ✅ Full |
| Salesforce Mobile App | ✅ Full |
| Experience Cloud (LWR) | ✅ Full |
| Salesforce Flow Screens | ✅ Full |

---

## File Structure

```
force-app/main/default/lwc/
├── dynamicTabs/
│   ├── dynamicTabs.html            ← Tab bar + slot
│   ├── dynamicTabs.js              ← Tab state, keyboard nav, slot registration
│   ├── dynamicTabs.css             ← Badge, close button, responsive styles
│   ├── dynamicTabs.js-meta.xml     ← Exposed to App/Record/Home pages
│   └── __tests__/
│       └── dynamicTabs.test.js     ← Jest unit tests (rendering, events, keyboard)
├── dynamicTabPanel/
│   ├── dynamicTabPanel.html        ← Panel wrapper with lazy-load gate
│   ├── dynamicTabPanel.js          ← activate/deactivate, isLoaded gate
│   ├── dynamicTabPanel.css         ← show/hide animation
│   └── dynamicTabPanel.js-meta.xml ← Internal component (not exposed)
└── dynamicTabsDemo/
    ├── dynamicTabsDemo.html        ← Reference implementation
    ├── dynamicTabsDemo.js          ← Demo data + event log
    ├── dynamicTabsDemo.css
    └── dynamicTabsDemo.js-meta.xml
```
