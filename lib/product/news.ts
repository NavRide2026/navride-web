import newsJson from "./news_v1.json";

export type NewsEntry = {
  id: string;
  title: string;
  summary: string;
  date: string;
  platforms: ("app" | "web")[];
  featureIds: string[];
  version?: string;
  public: boolean;
};

export const NEWS_ENTRIES: NewsEntry[] = (
  (newsJson as { entries: NewsEntry[] }).entries ?? []
).filter((e) => e.public);

export function newsSorted(): NewsEntry[] {
  return [...NEWS_ENTRIES].sort((a, b) => b.date.localeCompare(a.date));
}
