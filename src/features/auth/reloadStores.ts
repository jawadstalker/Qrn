import { reloadPracticeStore } from "@/features/quran/state/practiceStore";
import { reloadScopeStore } from "@/features/quran/state/scopeStore";
import { reloadSectionStore } from "@/features/quran/state/sectionStore";

/** Re-reads every module-level store from AsyncStorage after a sync replaced local data. */
export async function reloadStores(): Promise<void> {
  await Promise.all([
    reloadPracticeStore(),
    reloadScopeStore(),
    reloadSectionStore(),
  ]);
}
