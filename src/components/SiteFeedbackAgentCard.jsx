import { MessageSquare, Lightbulb } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function SiteFeedbackAgentCard() {
  return (
    <div className="rounded-lg border border-border bg-card/80 p-3 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Feedback Agent</h3>
            <Lightbulb className="w-3.5 h-3.5 text-accent" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Share comments about the site and suggest new features.
          </p>
          <div className="mt-3">
            <a
              href={base44.agents.getWhatsAppConnectURL("site_feedback")}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="outline" className="text-xs">
                Open on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}