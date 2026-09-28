import Portal from "@/components/Portal";
import AdminLogin from "@/components/AdminLogin";
import { getAllClients } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAuth = await isAdminAuthenticated();

  if (!isAuth) {
    return <AdminLogin />;
  }

  const clients = await getAllClients();

  return (
    <Portal
      initialRole="equipe"
      fixedRole={false}
      fixedClient={false}
      availableClients={clients}
    />
  );
}
