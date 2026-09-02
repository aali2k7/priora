import { AutomationAuditLogView } from "@/components/automation/automation-audit-log";

export const metadata = {
  title: "Automation Audit Log | Priora",
  description: "Enterprise transparency and safety audit trail for email automation rules.",
};

export default function AutomationPage() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <AutomationAuditLogView />
    </div>
  );
}
