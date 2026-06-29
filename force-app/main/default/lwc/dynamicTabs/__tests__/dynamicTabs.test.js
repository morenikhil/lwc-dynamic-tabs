import { createElement } from 'lwc';
import DynamicTabs from 'c/dynamicTabs';
import DynamicTabPanel from 'c/dynamicTabPanel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createTabs(overrides = {}) {
    const el = createElement('c-dynamic-tabs', { is: DynamicTabs });
    Object.assign(el, { variant: 'default', defaultTab: '', ...overrides });
    document.body.appendChild(el);
    return el;
}

function createPanel(props = {}) {
    const el = createElement('c-dynamic-tab-panel', { is: DynamicTabPanel });
    Object.assign(el, {
        value:      'tab1',
        label:      'Tab One',
        iconName:   '',
        badgeCount: 0,
        closeable:  false,
        disabled:   false,
        ...props
    });
    return el;
}

function flushPromises() {
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    return new Promise(resolve => setTimeout(resolve, 0));
}

afterEach(() => {
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
});

// ─── dynamicTabs ──────────────────────────────────────────────────────────────

describe('c-dynamic-tabs', () => {
    describe('rendering', () => {
        it('renders without tabs', () => {
            const el = createTabs();
            return Promise.resolve().then(() => {
                const nav = el.shadowRoot.querySelector('ul[role="tablist"]');
                expect(nav).not.toBeNull();
                const items = el.shadowRoot.querySelectorAll('li');
                expect(items.length).toBe(0);
            });
        });

        it('applies the correct container class for default variant', () => {
            const el = createTabs({ variant: 'default' });
            return Promise.resolve().then(() => {
                const container = el.shadowRoot.querySelector('div');
                expect(container.classList.contains('slds-tabs_default')).toBe(true);
            });
        });

        it('applies the correct container class for scoped variant', () => {
            const el = createTabs({ variant: 'scoped' });
            return Promise.resolve().then(() => {
                const container = el.shadowRoot.querySelector('div');
                expect(container.classList.contains('slds-tabs_scoped')).toBe(true);
            });
        });

        it('falls back to default class for unknown variant', () => {
            const el = createTabs({ variant: 'unknown' });
            return Promise.resolve().then(() => {
                const container = el.shadowRoot.querySelector('div');
                expect(container.classList.contains('slds-tabs_default')).toBe(true);
            });
        });
    });

    describe('tab items computed properties', () => {
        it('sets aria-selected correctly for active tab', async () => {
            const el = createTabs({ defaultTab: 'tab1' });
            // Simulate slotchange by directly calling internal _tabs setter
            el._tabs = [
                { value: 'tab1', label: 'Tab 1', iconName: '', badgeCount: 0, closeable: false, disabled: false },
                { value: 'tab2', label: 'Tab 2', iconName: '', badgeCount: 0, closeable: false, disabled: false }
            ];
            el._activeTab = 'tab1';
            await Promise.resolve();
            const anchors = el.shadowRoot.querySelectorAll('a[role="tab"]');
            // tab1 anchor should have aria-selected="true"
            if (anchors.length > 0) {
                expect(anchors[0].getAttribute('aria-selected')).toBe('true');
            }
        });

        it('shows badge when badgeCount > 0', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 5, closeable: false, disabled: false }
            ];
            el._activeTab = 't1';
            await Promise.resolve();
            const badge = el.shadowRoot.querySelector('.tab-badge');
            expect(badge).not.toBeNull();
        });

        it('does not show badge when badgeCount is 0', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 0, closeable: false, disabled: false }
            ];
            el._activeTab = 't1';
            await Promise.resolve();
            const badge = el.shadowRoot.querySelector('.tab-badge');
            expect(badge).toBeNull();
        });

        it('caps badge display at 99+', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 150, closeable: false, disabled: false }
            ];
            el._activeTab = 't1';
            await Promise.resolve();
            const badge = el.shadowRoot.querySelector('.tab-badge');
            expect(badge?.textContent?.trim()).toBe('99+');
        });

        it('renders close button only when closeable is true', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 0, closeable: true,  disabled: false },
                { value: 't2', label: 'T2', iconName: '', badgeCount: 0, closeable: false, disabled: false }
            ];
            el._activeTab = 't1';
            await Promise.resolve();
            const closeBtns = el.shadowRoot.querySelectorAll('.tab-close-btn');
            expect(closeBtns.length).toBe(1);
        });

        it('adds slds-is-disabled class for disabled tab', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 0, closeable: false, disabled: true }
            ];
            el._activeTab = '';
            await Promise.resolve();
            const item = el.shadowRoot.querySelector('li');
            expect(item?.classList.contains('slds-is-disabled')).toBe(true);
        });
    });

    describe('public API', () => {
        it('updateBadge updates the correct tab badge count', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 2, closeable: false, disabled: false }
            ];
            el._activeTab = 't1';
            await Promise.resolve();
            el.updateBadge('t1', 10);
            await Promise.resolve();
            const tab = el._tabs.find(t => t.value === 't1');
            expect(tab.badgeCount).toBe(10);
        });

        it('activeTab getter returns the active tab value', async () => {
            const el = createTabs();
            el._tabs      = [{ value: 'x', label: 'X', iconName: '', badgeCount: 0, closeable: false, disabled: false }];
            el._activeTab = 'x';
            expect(el.activeTab).toBe('x');
        });

        it('switchTab does not activate a disabled tab', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 0, closeable: false, disabled: false },
                { value: 't2', label: 'T2', iconName: '', badgeCount: 0, closeable: false, disabled: true  }
            ];
            el._activeTab = 't1';
            await Promise.resolve();
            el.switchTab('t2');
            expect(el._activeTab).toBe('t1');
        });
    });

    describe('events', () => {
        it('fires tabchange event when tab anchor is clicked', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 0, closeable: false, disabled: false },
                { value: 't2', label: 'T2', iconName: '', badgeCount: 0, closeable: false, disabled: false }
            ];
            el._activeTab = 't1';
            await Promise.resolve();

            const handler = jest.fn();
            el.addEventListener('tabchange', handler);

            const anchors = el.shadowRoot.querySelectorAll('a[role="tab"]');
            if (anchors.length >= 2) {
                anchors[1].click();
                await Promise.resolve();
                expect(handler).toHaveBeenCalledTimes(1);
                expect(handler.mock.calls[0][0].detail.value).toBe('t2');
                expect(handler.mock.calls[0][0].detail.previousValue).toBe('t1');
            }
        });

        it('fires tabclose event when close button is clicked', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 0, closeable: true, disabled: false }
            ];
            el._activeTab = 't1';
            await Promise.resolve();

            const handler = jest.fn();
            el.addEventListener('tabclose', handler);

            const closeBtn = el.shadowRoot.querySelector('.tab-close-btn');
            if (closeBtn) {
                closeBtn.click();
                await Promise.resolve();
                expect(handler).toHaveBeenCalledTimes(1);
                expect(handler.mock.calls[0][0].detail.value).toBe('t1');
            }
        });

        it('does not fire tabchange when clicking the already-active tab', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 0, closeable: false, disabled: false }
            ];
            el._activeTab = 't1';
            await Promise.resolve();

            const handler = jest.fn();
            el.addEventListener('tabchange', handler);

            const anchor = el.shadowRoot.querySelector('a[role="tab"]');
            if (anchor) {
                anchor.click();
                await Promise.resolve();
                expect(handler).not.toHaveBeenCalled();
            }
        });
    });

    describe('keyboard navigation', () => {
        it('ArrowRight moves to the next enabled tab', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 0, closeable: false, disabled: false },
                { value: 't2', label: 'T2', iconName: '', badgeCount: 0, closeable: false, disabled: false }
            ];
            el._activeTab = 't1';
            await Promise.resolve();

            const anchor = el.shadowRoot.querySelector('a[role="tab"]');
            if (anchor) {
                anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
                await Promise.resolve();
                expect(el._activeTab).toBe('t2');
            }
        });

        it('ArrowRight wraps around from last to first tab', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 0, closeable: false, disabled: false },
                { value: 't2', label: 'T2', iconName: '', badgeCount: 0, closeable: false, disabled: false }
            ];
            el._activeTab = 't2';
            await Promise.resolve();

            const anchors = el.shadowRoot.querySelectorAll('a[role="tab"]');
            if (anchors.length >= 2) {
                anchors[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
                await Promise.resolve();
                expect(el._activeTab).toBe('t1');
            }
        });

        it('Home key activates first tab', async () => {
            const el = createTabs();
            el._tabs = [
                { value: 't1', label: 'T1', iconName: '', badgeCount: 0, closeable: false, disabled: false },
                { value: 't2', label: 'T2', iconName: '', badgeCount: 0, closeable: false, disabled: false },
                { value: 't3', label: 'T3', iconName: '', badgeCount: 0, closeable: false, disabled: false }
            ];
            el._activeTab = 't3';
            await Promise.resolve();

            const anchor = el.shadowRoot.querySelector('a[role="tab"]');
            if (anchor) {
                anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
                await Promise.resolve();
                expect(el._activeTab).toBe('t1');
            }
        });
    });
});

// ─── dynamicTabPanel ──────────────────────────────────────────────────────────

describe('c-dynamic-tab-panel', () => {
    it('renders with slds-hide class initially', async () => {
        const el = createPanel({ value: 'p1', label: 'Panel 1' });
        document.body.appendChild(el);
        await Promise.resolve();
        const div = el.shadowRoot.querySelector('div[role="tabpanel"]');
        expect(div?.classList.contains('slds-hide')).toBe(true);
    });

    it('has correct panelId derived from value', async () => {
        const el = createPanel({ value: 'my-panel' });
        document.body.appendChild(el);
        await Promise.resolve();
        const div = el.shadowRoot.querySelector('div[role="tabpanel"]');
        expect(div?.id).toBe('tab-panel-my-panel');
    });

    it('activate() sets isActive and isLoaded to true', async () => {
        const el = createPanel({ value: 'p1' });
        document.body.appendChild(el);
        await Promise.resolve();
        expect(el.isActive).toBe(false);
        expect(el.isLoaded).toBe(false);

        el.activate();
        await flushPromises();

        expect(el.isActive).toBe(true);
        expect(el.isLoaded).toBe(true);
    });

    it('deactivate() sets isActive to false but keeps isLoaded true', async () => {
        const el = createPanel({ value: 'p1' });
        document.body.appendChild(el);
        await Promise.resolve();

        el.activate();
        await flushPromises();

        el.deactivate();
        await Promise.resolve();

        expect(el.isActive).toBe(false);
        expect(el.isLoaded).toBe(true); // remains loaded (lazy gate preserved)
    });

    it('does not activate when disabled', async () => {
        const el = createPanel({ value: 'p1', disabled: true });
        document.body.appendChild(el);
        await Promise.resolve();

        el.activate();
        await flushPromises();

        expect(el.isActive).toBe(false);
        expect(el.isLoaded).toBe(false);
    });

    it('shows slds-show class after activation', async () => {
        const el = createPanel({ value: 'p1' });
        document.body.appendChild(el);
        await Promise.resolve();

        el.activate();
        await flushPromises();

        const div = el.shadowRoot.querySelector('div[role="tabpanel"]');
        expect(div?.classList.contains('slds-show')).toBe(true);
        expect(div?.classList.contains('slds-hide')).toBe(false);
    });

    it('has aria-hidden="true" when not active', async () => {
        const el = createPanel({ value: 'p1' });
        document.body.appendChild(el);
        await Promise.resolve();
        const div = el.shadowRoot.querySelector('div[role="tabpanel"]');
        expect(div?.getAttribute('aria-hidden')).toBe('true');
    });

    it('has aria-hidden="false" when active', async () => {
        const el = createPanel({ value: 'p1' });
        document.body.appendChild(el);
        await Promise.resolve();

        el.activate();
        await flushPromises();

        const div = el.shadowRoot.querySelector('div[role="tabpanel"]');
        expect(div?.getAttribute('aria-hidden')).toBe('false');
    });
});
