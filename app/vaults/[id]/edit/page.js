"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useUser } from "@/hooks/useUser";
import { useVaults } from "@/hooks/useVaults";

const DESCRIPTION_LIMIT = 240;

export default function VaultEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const { vaults, updateVault } = useVaults();
  const { user } = useUser();

  const vault = useMemo(() => vaults.find((v) => v.id === id), [vaults, id]);
  const userIsOrganiser =
    vault?.members?.some(
      (m) => m.userId === user.id && m.id === vault.organiserId,
    ) ?? false;

  const [name, setName] = useState(vault?.name ?? "");
  const [description, setDescription] = useState(vault?.description ?? "");

  if (!vault) {
    return (
      <PageWrapper title="Vault not found" showBack>
        <Button variant="outline" asChild>
          <Link href="/vaults">Back to vaults</Link>
        </Button>
      </PageWrapper>
    );
  }

  if (!userIsOrganiser) {
    return (
      <PageWrapper title="Edit vault" showBack>
        <p className="text-sm text-[#6B7280]">
          Only the organiser of <strong>{vault.name}</strong> can edit its
          rules. Contact{" "}
          <span className="font-medium text-[#1A1A1A]">{vault.createdBy}</span>{" "}
          for changes.
        </p>
      </PageWrapper>
    );
  }

  const save = () => {
    updateVault(vault.id, {
      name: name.trim() || vault.name,
      description: description.slice(0, DESCRIPTION_LIMIT),
    });
    toast("Vault rules updated.");
    router.push(`/vaults/${vault.id}`);
  };

  return (
    <PageWrapper title="Edit vault" showBack>
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Vault name</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={48}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-desc">Description / rules</Label>
          <Textarea
            id="edit-desc"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, DESCRIPTION_LIMIT))
            }
            rows={5}
          />
          <p className="text-right text-[11px] text-[#6B7280]">
            {description.length} / {DESCRIPTION_LIMIT}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            type="button"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button className="flex-1" type="button" onClick={save}>
            Save changes
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
