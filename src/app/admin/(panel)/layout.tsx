import { AdminShell } from "@/components/admin/AdminShell";
import { requireOwner } from "@/lib/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  return <AdminShell email={owner.email}>{children}</AdminShell>;
}
