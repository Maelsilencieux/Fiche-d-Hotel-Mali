import AuthGuard from "@/components/client/AuthGuard";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard role="superadmin"><AdminShell>{children}</AdminShell></AuthGuard>;
}
