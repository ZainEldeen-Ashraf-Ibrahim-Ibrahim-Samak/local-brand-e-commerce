import { getThemeSettings } from "@/services/settings.service";
import { ThemeEditor, type ThemeInitial } from "@/components/admin/theme/ThemeEditor";

export const dynamic = "force-dynamic";

/** Admin theme editor UI (FR-027). */
export default async function AdminThemePage() {
  const t = await getThemeSettings();
  const initial: ThemeInitial = {
    primaryColor: t.primaryColor,
    secondaryColor: t.secondaryColor,
    fontFamily: t.fontFamily,
    baseFontSizePx: t.baseFontSizePx,
    layout: t.layout as ThemeInitial["layout"],
    defaultMode: t.defaultMode as ThemeInitial["defaultMode"],
    defaultLanguage: t.defaultLanguage as ThemeInitial["defaultLanguage"],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">Theme</h1>
      <ThemeEditor initial={initial} />
    </div>
  );
}
