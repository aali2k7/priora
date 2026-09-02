import { ProductivityInsightsView } from "@/components/dashboard/productivity-insights-view";

export const metadata = {
  title: "Executive Velocity & Insights — Priora",
  description: "Privacy-preserving communication velocity and focus analytics.",
};

export default function InsightsPage() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <ProductivityInsightsView />
    </div>
  );
}
