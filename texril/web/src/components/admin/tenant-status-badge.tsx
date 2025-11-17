import { Badge } from "@/components/ui/badge";
import { TenantStatus } from "@prisma/client";

const STATUS_STYLES: Record<TenantStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-rose-100 text-rose-700",
  TRIAL: "bg-amber-100 text-amber-700",
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return <Badge className={STATUS_STYLES[status]}>{status.toLowerCase()}</Badge>;
}
