import Portal from "@/components/Portal";
import { getAllClients } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
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
