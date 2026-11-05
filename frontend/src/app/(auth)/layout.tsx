import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (<><Navbar /><main className="min-h-[70vh]">{children}</main><Footer /></>);
}