import { LightningElement, api, track } from 'lwc';

const VARIANT_CLASS_MAP = {
    default: 'slds-tabs_default',
    scoped: 'slds-tabs_scoped',
    vertical: 'slds-vertical-tabs'
};
const BADGE_MAX = 99;
const ANCHOR_PREFIX = 'tab-anchor-';
const PANEL_PREFIX  = 'tab-panel-';

export default class DynamicTabs extends LightningElement {
    /** Tab variant: 'default' | 'scoped' | 'vertical' */
    @api variant = 'default';

    /** Value of the tab to activate on initial render */
    @api defaultTab = '';

    @track _tabs      = [];   // [{value, label, iconName, badgeCount, closeable, disabled}]
    @track _activeTab = '';

    _panelMap = new Map(); // value → c-dynamic-tab-panel DOM ref

    // ─── Public API ──────────────────────────────────────────────────────────

    /** Programmatically switch to a tab by value */
    @api
    switchTab(value) {
        const tab = this._tabs.find(t => t.value === value);
        if (tab && !tab.disabled) {
            this._activateTab(value);
        }
    }

    /** Dynamically update a tab's badge count */
    @api
    updateBadge(value, count) {
        this._tabs = this._tabs.map(t =>
            t.value === value ? { ...t, badgeCount: Number(count) } : t
        );
    }

    /** Return the currently active tab value */
    @api
    get activeTab() {
        return this._activeTab;
    }

    // ─── Computed ────────────────────────────────────────────────────────────

    get containerClass() {
        return VARIANT_CLASS_MAP[this.variant] ?? VARIANT_CLASS_MAP.default;
    }

    get navClass() {
        const base = VARIANT_CLASS_MAP[this.variant] ?? VARIANT_CLASS_MAP.default;
        return `${base}__nav`;
    }

    get _tabItems() {
        return this._tabs.map(tab => {
            const isActive   = tab.value === this._activeTab;
            const isDisabled = !!tab.disabled;
            const count      = Number(tab.badgeCount) || 0;
            const showBadge  = count > 0;

            return {
                ...tab,
                isActive,
                isActiveStr:   String(isActive),
                isDisabledStr: String(isDisabled),
                tabIndex:      isActive ? '0' : '-1',
                itemClass:     this._buildItemClass(isActive, isDisabled),
                panelId:       `${PANEL_PREFIX}${tab.value}`,
                anchorId:      `${ANCHOR_PREFIX}${tab.value}`,
                showBadge,
                badgeDisplay:  showBadge ? (count > BADGE_MAX ? `${BADGE_MAX}+` : count) : '',
                badgeClass:    isActive
                                   ? 'slds-badge slds-col_bump-left tab-badge tab-badge_active'
                                   : 'slds-badge slds-col_bump-left tab-badge',
                badgeAriaLabel: `${tab.label}: ${count} items`,
                closeTitle:    `Close ${tab.label}`
            };
        });
    }

    _buildItemClass(isActive, isDisabled) {
        let cls = 'slds-tabs_default__item';
        if (isActive)   cls += ' slds-is-active';
        if (isDisabled) cls += ' slds-is-disabled';
        return cls;
    }

    // ─── Slot Change Handler ──────────────────────────────────────────────────

    handleSlotChange(event) {
        const assignedEls = event.target.assignedElements
            ? event.target.assignedElements()
            : [];

        const panels = assignedEls.filter(
            el => el.tagName?.toLowerCase() === 'c-dynamic-tab-panel'
        );

        // Rebuild tab list from current panel props
        const newTabs = panels.map(panel => ({
            value:      panel.value      ?? '',
            label:      panel.label      ?? '',
            iconName:   panel.iconName   ?? '',
            badgeCount: panel.badgeCount ?? 0,
            closeable:  panel.closeable  ?? false,
            disabled:   panel.disabled   ?? false
        }));

        // Sync panel map
        this._panelMap.clear();
        panels.forEach(panel => this._panelMap.set(panel.value, panel));

        this._tabs = newTabs;

        // Determine initial active tab
        if (!this._activeTab && newTabs.length > 0) {
            const target = this.defaultTab && newTabs.find(t => t.value === this.defaultTab)
                ? this.defaultTab
                : newTabs[0].value;
            this._activateTab(target, true);
        } else if (this._activeTab && !this._panelMap.has(this._activeTab)) {
            // Active tab was removed — fall back to first
            if (newTabs.length > 0) {
                this._activateTab(newTabs[0].value, true);
            } else {
                this._activeTab = '';
            }
        } else {
            // Re-apply active state to existing panel (handles re-render)
            this._applyPanelStates();
        }
    }

    // ─── Tab Click / Keyboard ────────────────────────────────────────────────

    handleTabClick(event) {
        event.preventDefault();
        const value = event.currentTarget.dataset.value;
        const tab   = this._tabs.find(t => t.value === value);
        if (tab && !tab.disabled && value !== this._activeTab) {
            this._activateTab(value);
        }
    }

    handleKeyDown(event) {
        const enabledTabs = this._tabs.filter(t => !t.disabled);
        if (!enabledTabs.length) return;

        const currentIdx = enabledTabs.findIndex(t => t.value === this._activeTab);

        let nextIdx = currentIdx;
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                nextIdx = (currentIdx + 1) % enabledTabs.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                nextIdx = (currentIdx - 1 + enabledTabs.length) % enabledTabs.length;
                break;
            case 'Home':
                event.preventDefault();
                nextIdx = 0;
                break;
            case 'End':
                event.preventDefault();
                nextIdx = enabledTabs.length - 1;
                break;
            default:
                return;
        }

        this._activateTab(enabledTabs[nextIdx].value);
        // Move focus to the newly active tab anchor
        this._focusTabAnchor(enabledTabs[nextIdx].value);
    }

    // ─── Close Tab ───────────────────────────────────────────────────────────

    handleTabClose(event) {
        event.stopPropagation();
        const value = event.currentTarget.dataset.value;

        this.dispatchEvent(new CustomEvent('tabclose', {
            detail:   { value },
            bubbles:  true,
            composed: true
        }));
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    _activateTab(value, silent = false) {
        const prev = this._activeTab;
        this._activeTab = value;
        this._applyPanelStates();

        if (!silent && prev !== value) {
            this.dispatchEvent(new CustomEvent('tabchange', {
                detail:   { value, previousValue: prev },
                bubbles:  true,
                composed: true
            }));
        }
    }

    _applyPanelStates() {
        this._panelMap.forEach((panel, value) => {
            if (value === this._activeTab) {
                panel.activate?.();
            } else {
                panel.deactivate?.();
            }
        });
    }

    _focusTabAnchor(value) {
        const anchor = this.template.querySelector(`[data-value="${value}"]`);
        anchor?.focus();
    }
}
