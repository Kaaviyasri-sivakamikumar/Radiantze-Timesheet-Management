import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/'); // Redirect non-admin users
    }
  }, [user, router]);

  return <div>Admin Dashboard</div>;
} 