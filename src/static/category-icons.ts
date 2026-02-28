import type { ISelectOption } from "~/@schemas/select";
import { zCategoryIcon, type CategoryIcon } from "~/@schemas/models/category";
import type { Nullish } from "~/@types/helpers";

export const CATEGORY_ICON: Record<CategoryIcon, string> = {
    // Alimentação
    food: "🥗",
    supermarket: "🛒",
    fastFood: "🍕",
    restaurant: "🍽️",
    // Moradia
    home: "🏠",
    rent: "🔑",
    electricity: "⚡",
    water: "💧",
    gas: "🔥",
    // Transporte
    transport: "🚗",
    fuel: "⛽",
    taxi: "🚕",
    publicTransport: "🚌",
    parking: "🅿️",
    // Comunicação
    phone: "📱",
    internet: "🌐",
    streaming: "📺",
    // Saúde
    health: "🏥",
    pharmacy: "💊",
    dentist: "🦷",
    optical: "👓",
    // Educação
    education: "🎓",
    books: "📚",
    schoolSupplies: "✏️",
    // Vestuário
    clothes: "👕",
    shoes: "👟",
    beauty: "💇",
    // Lazer
    entertainment: "🎮",
    cinema: "🎬",
    music: "🎵",
    travel: "✈️",
    vacation: "🏖️",
    // Fitness
    gym: "🏋️",
    sports: "⚽",
    // Pet
    pet: "🐶",
    veterinary: "🐱",
    // Casa
    cleaning: "🧹",
    maintenance: "🔧",
    furniture: "🛋️",
    bills: "🧾",
    // Tecnologia
    technology: "💻",
    electronics: "📱",
    // Financeiro
    bank: "🏦",
    investments: "💰",
    card: "💳",
    business: "📊",
    work: "💼",
    // Outros
    gifts: "🎁",
    parties: "🎉",
    onlineShopping: "📦",
    taxes: "🏛️",
    insurance: "📋",
    legal: "⚖️",
    documents: "📄",
    // Geral
    others: "📁",
    miscellaneous: "❓",
} as const;

export const CATEGORY_ICON_LABEL: Record<CategoryIcon, string> = {
    // Alimentação
    food: "Salada",
    supermarket: "Carrinho de Compras",
    fastFood: "Pizza",
    restaurant: "Restaurante",
    // Moradia
    home: "Casa",
    rent: "Chave",
    electricity: "Raio",
    water: "Gota d'Água",
    gas: "Fogo",
    // Transporte
    transport: "Carro",
    fuel: "Combustível",
    taxi: "Táxi",
    publicTransport: "Ônibus",
    parking: "Estacionamento",
    // Comunicação
    phone: "Celular",
    internet: "Globo",
    streaming: "TV",
    // Saúde
    health: "Hospital",
    pharmacy: "Remédio",
    dentist: "Dente",
    optical: "Óculos",
    // Educação
    education: "Formatura",
    books: "Livros",
    schoolSupplies: "Lápis",
    // Vestuário
    clothes: "Camiseta",
    shoes: "Tênis",
    beauty: "Corte de Cabelo",
    // Lazer
    entertainment: "Videogame",
    cinema: "Claquete",
    music: "Música",
    travel: "Avião",
    vacation: "Praia",
    // Fitness
    gym: "Musculação",
    sports: "Futebol",
    // Pet
    pet: "Cachorro",
    veterinary: "Gato",
    // Casa
    cleaning: "Vassoura",
    maintenance: "Chave Inglesa",
    furniture: "Sofá",
    // Tecnologia
    technology: "Notebook",
    electronics: "Celular",
    // Financeiro
    bank: "Banco",
    investments: "Dinheiro",
    card: "Cartão",
    business: "Gráfico",
    work: "Maleta",
    bills: "Despesas",
    // Outros
    gifts: "Presente",
    parties: "Festa",
    onlineShopping: "Pacote",
    taxes: "Governo",
    insurance: "Prancheta",
    legal: "Balança",
    documents: "Documento",
    // Geral
    others: "Pasta",
    miscellaneous: "Interrogação",
};

const getOption = (icon: CategoryIcon): ISelectOption => {
    return {
        value: icon,
        label: `${CATEGORY_ICON[icon]} ${CATEGORY_ICON_LABEL[icon]}`,
    };
};

export const CATEGORY_ICONS_OPTIONS: ISelectOption[] = zCategoryIcon.options.map(getOption);

export const getCategoryIcon = (icon: Nullish<CategoryIcon>): string => {
    if (!icon) return ''
    return CATEGORY_ICON[icon] || '';
};