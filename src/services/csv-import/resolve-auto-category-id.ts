import type { ICategory } from "~/@schemas/models/category";
import type { DefaultCategory } from "~/static/default-categories";
import { slugify } from "~/helpers/slugify";
import { NUBANK_AUTO_CATEGORY_MAP, NUBANK_KEYWORD_CATEGORY_MAP } from "~/static/nubank-auto-category-map";

type IProps = {
  counterpartyName: string;
  userCategories: ICategory[];
  enableKeywordMatch?: boolean;
};

const findCategoryByName = ({ name, userCategories }: { name: DefaultCategory; userCategories: ICategory[] }): string[] => {
  const matched = userCategories.find(cat => slugify(cat.name) === slugify(name));
  return matched ? [matched.id] : [];
};

export const resolveAutoCategoryId = ({ counterpartyName, userCategories, enableKeywordMatch = false }: IProps): string[] => {
  const slug = slugify(counterpartyName);

  const exactMatch = NUBANK_AUTO_CATEGORY_MAP.get(slug);
  if (exactMatch) return findCategoryByName({ name: exactMatch, userCategories });

  if (!enableKeywordMatch) return [];

  const keywordMatch = NUBANK_KEYWORD_CATEGORY_MAP.find(
    entry => entry.keywords.some(keyword => slug.includes(keyword))
  );
  if (keywordMatch) return findCategoryByName({ name: keywordMatch.category, userCategories });

  return [];
};
