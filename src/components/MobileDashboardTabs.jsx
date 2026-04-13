import { Plane, Map, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "flights", label: "Flights", icon: Plane },
  { id: "map", label: "Map", icon: Map },
  { id: "messages", label: "Messages", icon: Radio },
];

export default function MobileDashboardTabs({ activeTab, onTabChange }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-border bg-card/90 p-2 md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Button
            key={tab.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="h-10 text-xs"
            onClick={() => onTabChange(tab.id)}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}