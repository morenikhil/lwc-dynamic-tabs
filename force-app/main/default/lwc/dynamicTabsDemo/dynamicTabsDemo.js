import { LightningElement, track } from 'lwc';

const ICONS = [
    'standard:task', 'standard:case', 'standard:lead',
    'standard:campaign', 'standard:product', 'standard:report'
];

export default class DynamicTabsDemo extends LightningElement {
    @track variant        = 'default';
    @track accountBadge   = 3;
    @track contactBadge   = 7;
    @track dynamicTabs    = [];
    @track eventLog       = [];

    _tabCounter  = 0;
    _logCounter  = 0;

    // ─── Static Data ─────────────────────────────────────────────────────────

    variantOptions = [
        { label: 'Default', value: 'default' },
        { label: 'Scoped',  value: 'scoped'  }
    ];

    accountColumns = [
        { label: 'Name',     fieldName: 'name'     },
        { label: 'Industry', fieldName: 'industry' },
        { label: 'Revenue',  fieldName: 'revenue', type: 'currency' }
    ];

    accountData = [
        { id: '1', name: 'Acme Corp',      industry: 'Technology', revenue: 4500000 },
        { id: '2', name: 'Globex Inc',     industry: 'Finance',    revenue: 2100000 },
        { id: '3', name: 'Initech LLC',    industry: 'Consulting', revenue: 890000  },
        { id: '4', name: 'Umbrella Corp',  industry: 'Healthcare', revenue: 7800000 }
    ];

    contactData = [
        { id: 'c1', name: 'Alice Johnson', email: 'alice@acme.com'    },
        { id: 'c2', name: 'Bob Martinez',  email: 'bob@globex.com'    },
        { id: 'c3', name: 'Carol White',   email: 'carol@initech.com' }
    ];

    get noEvents() {
        return this.eventLog.length === 0;
    }

    // ─── Event Handlers ───────────────────────────────────────────────────────

    handleTabChange(event) {
        const { value, previousValue } = event.detail;
        this._log(`tabchange → "${value}" (was "${previousValue}")`);
    }

    handleTabClose(event) {
        const { value } = event.detail;
        this._log(`tabclose → "${value}"`);
        // Remove from dynamic tabs if it is one
        this.dynamicTabs = this.dynamicTabs.filter(t => t.value !== value);
    }

    handleAddTab() {
        this._tabCounter++;
        const idx = (this._tabCounter - 1) % ICONS.length;
        this.dynamicTabs = [
            ...this.dynamicTabs,
            {
                value:   `dynamic-${this._tabCounter}`,
                label:   `Tab ${this._tabCounter}`,
                iconName: ICONS[idx],
                content: `This is dynamically added tab #${this._tabCounter}. Content is lazy-loaded on first activation.`
            }
        ];
        this._log(`Tab added: "Tab ${this._tabCounter}"`);
    }

    handleIncrementBadge() {
        this.accountBadge = this.accountBadge + 1;
        this._log(`Badge updated → Accounts: ${this.accountBadge}`);
    }

    handleVariantChange(event) {
        this.variant = event.detail.value;
        this._log(`Variant changed to "${this.variant}"`);
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    _log(message) {
        const now  = new Date();
        const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
        this.eventLog = [
            { id: ++this._logCounter, time, message },
            ...this.eventLog
        ].slice(0, 10); // keep last 10 entries
    }
}
