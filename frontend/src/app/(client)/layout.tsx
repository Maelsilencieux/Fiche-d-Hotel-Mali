import ClientHeader from "@/components/client/ClientHeader";
import AuthGuard from "@/components/client/AuthGuard";
import Footer from "@/components/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (<><ClientHeader /><main className="min-h-[70vh]"><AuthGuard role="client">{children}</AuthGuard></main><Footer /></>);
}
