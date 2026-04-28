import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
import CashLedgerTab from '../../components/ledger/CashLedgerTab';
import WalletLedgerTab from '../../components/ledger/WalletLedgerTab';


type ViewMode = 'super_admin' | 'venue_manager';
type LedgerTab = 'cash' | 'wallet';

export default function AdminLedgerPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('super_admin');
    const [activeTab, setActiveTab] = useState<LedgerTab>('cash');

    const isManager = viewMode === 'venue_manager';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Platform Ledger
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Financial audit trail of all money movements
                    </p>
                </div>
                <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(v) => v && setViewMode(v as ViewMode)}
                    className="rounded-lg border border-border bg-muted p-1"
                >
                    <ToggleGroupItem
                        value="super_admin"
                        className="rounded-md px-4 py-1.5 text-xs font-medium data-[state=on]:bg-card data-[state=on]:shadow-sm"
                    >
                        Super-Admin
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="venue_manager"
                        className="rounded-md px-4 py-1.5 text-xs font-medium data-[state=on]:bg-card data-[state=on]:shadow-sm"
                    >
                        Venue Manager
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            {/* Tab Switcher */}
            <ToggleGroup
                type="single"
                value={activeTab}
                onValueChange={(v) => v && setActiveTab(v as LedgerTab)}
                className="rounded-lg border border-border bg-muted p-1 w-fit"
            >
                <ToggleGroupItem
                    value="cash"
                    className="rounded-md px-5 py-1.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
                >
                    Cash Ledger
                </ToggleGroupItem>
                <ToggleGroupItem
                    value="wallet"
                    className="rounded-md px-5 py-1.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
                >
                    Wallet Ledger
                </ToggleGroupItem>
            </ToggleGroup>

            {activeTab === 'cash' ? (
                <CashLedgerTab isManager={isManager} />
            ) : (
                <WalletLedgerTab isManager={isManager} />
            )}
        </div>
    );
}
