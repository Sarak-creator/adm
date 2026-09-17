"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminToken, getAdminSecretPath } from "@/lib/admin-auth";
import { setConfig, getAllMaskedSettings, deleteConfig, SettingItem } from "@/lib/config-service";

/**
 * Validates that current caller has an authenticated ADMIN role
 */
async function requireAdminAuth(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const payload = await verifyAdminToken(token);

  if (!payload || payload.role !== "ADMIN") {
    throw new Error("Unauthorized: អ្នកមិនមានសិទ្ធិកែប្រែការកំណត់ប្រព័ន្ធឡើយ (Admin access required)");
  }
}

/**
 * Server Action: Update or create a dynamic system setting
 */
export async function updateSystemConfigAction(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await requireAdminAuth();

    const key = (formData.get("key") as string)?.trim();
    const value = (formData.get("value") as string)?.trim() || "";
    const isEncrypted = formData.get("isEncrypted") === "true" || formData.get("isEncrypted") === "on";
    const description = (formData.get("description") as string)?.trim() || undefined;

    if (!key) {
      return { success: false, error: "កូនសោការកំណត់ (Key) មិនអាចទទេបានទេ" };
    }

    await setConfig(key, value, isEncrypted, description);

    // Revalidate admin paths
    const secretPath = getAdminSecretPath();
    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    revalidatePath(`/${secretPath}`);
    revalidatePath(`/${secretPath}/settings`);

    return {
      success: true,
      message: `បានរក្សាទុក '${key}' ដោយជោគជ័យ${isEncrypted ? " (Encrypted with AES-256-GCM)" : ""}!`,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

/**
 * Server Action: Fetch all masked settings for Admin UI display
 */
export async function getMaskedSettingsAction(): Promise<{
  success: boolean;
  settings: SettingItem[];
  error?: string;
}> {
  try {
    await requireAdminAuth();
    const settings = await getAllMaskedSettings();
    return { success: true, settings };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, settings: [], error: error.message };
  }
}

/**
 * Server Action: Delete a setting
 */
export async function deleteSystemConfigAction(key: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await requireAdminAuth();
    await deleteConfig(key);

    const secretPath = getAdminSecretPath();
    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    revalidatePath(`/${secretPath}`);

    return { success: true, message: `បានលុប '${key}' រួចរាល់!` };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}
