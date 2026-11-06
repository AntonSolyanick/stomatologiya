import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, servicesQuery } from "@/lib/clinic";

export const Route = createFileRoute("/admin/services")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Управление услугами — Стоматология" },
      { name: "description", content: "Панель администратора: добавление услуг и цен." },
      { property: "og:title", content: "Управление услугами" },
      { property: "og:description", content: "Панель администратора стоматологии." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminServices,
});

function AdminServices() {
  const { loading, user, isAdmin } = useProfile();
  const qc = useQueryClient();
  const { data: services = [] } = useQuery(servicesQuery);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" />;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return undefined;
    const p = price.trim() === "" ? null : Number(price);
    if (p !== null && (!Number.isFinite(p) || p < 0)) { toast.error("Некорректная цена"); return; }
    setBusy(true);
    const { error } = await supabase.from("services").insert({
      name: name.trim(),
      description: description.trim(),
      price: p === null ? null : Math.round(p),
      sort_order: services.length + 1,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setName(""); setDescription(""); setPrice("");
    toast.success("Услуга добавлена");
    qc.invalidateQueries({ queryKey: ["services"] });
  };

  const hide = async (id: string) => {
    if (!confirm("Убрать услугу из списка?")) return undefined;
    const { error } = await supabase.from("services").update({ is_active: false }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["services"] });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold">Управление услугами</h1>
      <form onSubmit={add} className="mt-8 grid gap-3 p-6 surface-card">
        <Input placeholder="Название услуги" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input placeholder="Описание (необязательно)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input type="number" min={0} placeholder="Цена, ₽ (необязательно)" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Button type="submit" disabled={busy}>Добавить услугу</Button>
      </form>
      <ul className="mt-8 grid gap-3">
        {services.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-4 p-4 surface-card">
            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-muted-foreground">{formatPrice(s.price)}</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Убрать" onClick={() => hide(s.id)}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
