import z from "zod";
import type { CategoryIcon, ICreateCategory } from "~/@schemas/models/category";

export const zDefaultCategory = z.enum(
    [
        "Alimentação",
        "Supermercado",
        "Transporte",
        "Saúde",
        "Educação",
        "Vestuário",
        "Lazer",
        "Pet",
        "Casa",
        "Contas",
        "Investimentos",
        "Cartão de Crédito",
        "Moradia",
        "Água",
        "Energia",
        "Outros"
    ]
)
export type DefaultCategory = z.infer<typeof zDefaultCategory>;

export const DEFAULT_CATEGORY_ICONS: Record<DefaultCategory, CategoryIcon> = {
    "Alimentação": "food",
    "Supermercado": "supermarket",
    "Transporte": "transport",
    "Saúde": "health",
    "Educação": "education",
    "Vestuário": "clothes",
    "Lazer": "entertainment",
    "Pet": "pet",
    "Casa": "home",
    "Contas": "bank",
    "Investimentos": "investments",
    "Cartão de Crédito": "card",
    "Moradia": "home",
    "Água": "water",
    "Energia": "electricity",
    "Outros": "others",
}
export const DEFAULT_CATEGORY_COLORS: Record<DefaultCategory, CategoryIcon> = {
    "Alimentação": "food",
    "Supermercado": "supermarket",
    "Transporte": "transport",
    "Saúde": "health",
    "Educação": "education",
    "Vestuário": "clothes",
    "Lazer": "entertainment",
    "Pet": "pet",
    "Casa": "home",
    "Contas": "bank",
    "Investimentos": "investments",
    "Cartão de Crédito": "card",
    "Moradia": "home",
    "Água": "water",
    "Energia": "electricity",
    "Outros": "others",
}

type ITemplate = Omit<ICreateCategory, "userId">

const getCategory = (category: DefaultCategory): ITemplate => {
    return {
        name: category,
        icon: DEFAULT_CATEGORY_ICONS[category],
        color: null,
    }
}

export const DEFAULT_CATEGORIES: (ITemplate)[] = zDefaultCategory.options.map(getCategory);