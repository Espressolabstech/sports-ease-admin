import { useState } from "react";
import { cn } from "../../../utils/twMerge";
import RewardsOverviewSubTab from "./rewards/RewardsOverviewSubTab";
import PlayersAndTiersSubTab from "./rewards/PlayersAndTiersSubTab";
import TierConfigSubTab from "./rewards/TierConfigSubTab";
import CreditPackagesSubTab from "./rewards/CreditPackagesSubTab";
import FeatureSettingsSubTab from "./rewards/FeatureSettingsSubTab";


const SUB_TABS = [
  { key: "overview", label: "Overview" },
  { key: "players", label: "Players & Tiers" },
  { key: "tier-config", label: "Tier Configuration" },
  { key: "packages", label: "Credit Packages" },
  { key: "features", label: "Feature Settings" },
];

interface RewardsTabProps {
  venueId: string;
}

export default function RewardsTab({ venueId }: RewardsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeSubTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {activeSubTab === "overview" && <RewardsOverviewSubTab venueId={venueId} />}
      {activeSubTab === "players" && <PlayersAndTiersSubTab venueId={venueId} />}
      {activeSubTab === "tier-config" && <TierConfigSubTab venueId={venueId} />}
      {activeSubTab === "packages" && <CreditPackagesSubTab venueId={venueId} />}
      {activeSubTab === "features" && <FeatureSettingsSubTab venueId={venueId} />}
    </div>
  );
}
