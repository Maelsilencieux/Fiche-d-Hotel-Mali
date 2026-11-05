import AuthGuard from "@/components/client/AuthGuard";
import HotelShell from "@/components/hotel/HotelShell";

export default function HotelLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard role="hotel"><HotelShell>{children}</HotelShell></AuthGuard>;
}
