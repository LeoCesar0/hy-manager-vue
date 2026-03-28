import z from "zod";
import type { CategoryIcon, ICreateCategory } from "~/@schemas/models/category";

export const zDefaultCategory = z.enum(
    [
        "Salário",
        "Alimentação",
        "Supermercado",
        "Transporte",
        "Saúde",
        "Educação",
        "Vestuário",
        "Comprinhas",
        "Lazer",
        "Pet",
        "Despesas",
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
    "Salário": "work",
    "Alimentação": "restaurant",
    "Supermercado": "supermarket",
    "Transporte": "transport",
    "Saúde": "health",
    "Educação": "education",
    "Vestuário": "clothes",
    "Comprinhas": "shopping",
    "Lazer": "entertainment",
    "Pet": "pet",
    "Despesas": "bills",
    "Investimentos": "investments",
    "Cartão de Crédito": "card",
    "Moradia": "home",
    "Água": "water",
    "Energia": "electricity",
    "Outros": "others",
}
export const DEFAULT_CATEGORY_COLORS: Record<DefaultCategory, CategoryIcon> = {
    "Salário": "work",
    "Alimentação": "food",
    "Supermercado": "supermarket",
    "Transporte": "transport",
    "Saúde": "health",
    "Educação": "education",
    "Vestuário": "clothes",
    "Comprinhas": "shopping",
    "Lazer": "entertainment",
    "Pet": "pet",
    "Despesas": "bank",
    "Investimentos": "investments",
    "Cartão de Crédito": "card",
    "Moradia": "home",
    "Água": "water",
    "Energia": "electricity",
    "Outros": "others",
}

export const DEFAULT_CATEGORY_COLORS_MAP: Record<DefaultCategory, string> = {
    "Alimentação": "#ef4444",
    "Supermercado": "#f97316",
    "Transporte": "#7c3aed",
    "Saúde": "#166534",
    "Educação": "#14b8a6",
    "Vestuário": "#8b5cf6",
    "Comprinhas": "#f472b6",
    "Lazer": "#ec4899",
    "Pet": "#0d9488",
    "Despesas": "#3b82f6",
    "Investimentos": "#16a34a",
    "Cartão de Crédito": "#dc2626",
    "Moradia": "#854d0e",
    "Água": "#2563eb",
    "Energia": "#ca8a04",
    "Outros": "#000000",
    "Salário": "#22c55e",
}

type ITemplate = Omit<ICreateCategory, "userId">

const POSITIVE_EXPENSE_CATEGORIES: DefaultCategory[] = ["Investimentos", "Salário"];

const getCategory = (category: DefaultCategory): ITemplate => {
    return {
        name: category,
        icon: DEFAULT_CATEGORY_ICONS[category],
        color: DEFAULT_CATEGORY_COLORS_MAP[category],
        ...(POSITIVE_EXPENSE_CATEGORIES.includes(category) && { isPositiveExpense: true }),
    }
}

export const DEFAULT_CATEGORIES: (ITemplate)[] = zDefaultCategory.options.map(getCategory);