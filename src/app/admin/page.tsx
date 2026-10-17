import { AdminApp } from "@/components/admin/admin-app";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="py-2">
      <AdminApp />
    </div>
  );
}
