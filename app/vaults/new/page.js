import { PageWrapper } from "@/components/layout/PageWrapper";
import { VaultCreateWizard } from "@/components/vaults/VaultCreateWizard";

export default function NewVaultPage() {
  return (
    <PageWrapper title="Create Vault" showBack>
      <VaultCreateWizard />
    </PageWrapper>
  );
}
