import { LightningElement, api, track } from 'lwc';

const ANCHOR_PREFIX = 'tab-anchor-';
const PANEL_PREFIX  = 'tab-panel-';

export default class DynamicTabPanel extends LightningElement {
    // ─── Public Properties ───────────────────────────────────────────────────

    /** Unique identifier — must match the value in parent tabs config */
    @api value = '';

    /** Tab label displayed in the tab bar */
    @api label = '';

    /** SLDS icon name, e.g. "standard:account" */
    @api iconName = '';

    /** Numeric badge count shown on the tab (0 hides the badge) */
    @api badgeCount = 0;

    /** Whether this tab shows a close (×) button */
    @api closeable = false;

    /** Disables the tab; prevents activation */
    @api disabled = false;

    // ─── Internal State ──────────────────────────────────────────────────────

    @track _isActive    = false; // tab is currently selected
    @track _isLoaded    = false; // panel has been rendered at least once (lazy gate)
    @track _isActivating = false; // brief spinner before first load

    // ─── Public Methods (called by c-dynamic-tabs) ───────────────────────────

    @api
    activate() {
        if (this.disabled) return;

        if (!this._isLoaded) {
            // First activation: briefly show spinner, then reveal slot content
            this._isActivating = true;
            // Allow one microtask tick so spinner renders before slot hydrates
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            Promise.resolve().then(() => {
                this._isActivating = false;
                this._isLoaded     = true;
                this._isActive     = true;
            });
        } else {
            this._isActive = true;
        }
    }

    @api
    deactivate() {
        this._isActive = false;
    }

    /** Whether this panel is currently visible */
    @api
    get isActive() {
        return this._isActive;
    }

    /** Whether this panel has been loaded at least once */
    @api
    get isLoaded() {
        return this._isLoaded;
    }

    // ─── Computed ────────────────────────────────────────────────────────────

    get panelId() {
        return `${PANEL_PREFIX}${this.value}`;
    }

    get anchorId() {
        return `${ANCHOR_PREFIX}${this.value}`;
    }

    get isHiddenStr() {
        return String(!this._isActive);
    }

    get panelClass() {
        let cls = 'slds-tabs_default__content';
        cls += this._isActive ? ' slds-show' : ' slds-hide';
        return cls;
    }
}
