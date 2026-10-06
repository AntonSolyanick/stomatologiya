import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  birthdate: string | null;
  role: "patient" | "doctor" | "admin";
};

/** Загружает профиль и роль текущего пользователя. Роль хранится отдельно и меняется только вручную. */
export async function fetchProfile(userId: string): Promise<Profile> {
  const [{ data: roles }, { data: prof }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, birthdate")
      .eq("id", userId)
      .maybeSingle(),
  ]);
  let profile = prof;
  if (!profile) {
    const { data: u } = await supabase.auth.getUser();
    const meta = u.user?.user_metadata ?? {};
    const row = {
      id: userId,
      full_name: (meta["full_name"] as string) ?? "",
      email: u.user?.email ?? "",
      phone: (meta["phone"] as string) ?? "",
      birthdate: (meta["birthdate"] as string) || null,
    };
    await supabase.from("profiles").upsert(row);
    profile = row;
  }
  const list = (roles ?? []).map((r) => r.role as string);
  const role = list.includes("doctor") ? "doctor" : list.includes("admin") ? "admin" : "patient";
  return { ...profile, role } as Profile;
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const q = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: () => fetchProfile(user!.id),
    staleTime: 60_000,
  });
  const profile = user ? (q.data ?? null) : null;
  return {
    user,
    profile,
    loading: authLoading || (!!user && q.isLoading),
    isDoctor: profile?.role === "doctor",
    isPatient: !!profile && profile.role === "patient",
  };
}
