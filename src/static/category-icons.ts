import type { ISelectOption } from "~/@schemas/select";
import { zCategoryIcon, type CategoryIcon } from "~/@schemas/models/category";

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
    food: "Alimentação",
    supermarket: "Supermercado",
    fastFood: "Fast Food",
    restaurant: "Restaurante",
    // Moradia
    home: "Casa",
    rent: "Aluguel",
    electricity: "Energia",
    water: "Água",
    gas: "Gás",
    // Transporte
    transport: "Transporte",
    fuel: "Combustível",
    taxi: "Táxi/Uber",
    publicTransport: "Transporte Público",
    parking: "Estacionamento",
    // Comunicação
    phone: "Telefone",
    internet: "Internet",
    streaming: "TV/Streaming",
    // Saúde
    health: "Saúde",
    pharmacy: "Farmácia",
    dentist: "Dentista",
    optical: "Ótica",
    // Educação
    education: "Educação",
    books: "Livros/Cursos",
    schoolSupplies: "Material Escolar",
    // Vestuário
    clothes: "Roupas",
    shoes: "Calçados",
    beauty: "Beleza/Salão",
    // Lazer
    entertainment: "Entretenimento",
    cinema: "Cinema",
    music: "Música",
    travel: "Viagens",
    vacation: "Férias",
    // Fitness
    gym: "Academia",
    sports: "Esportes",
    // Pet
    pet: "Pet",
    veterinary: "Veterinário",
    // Casa
    cleaning: "Limpeza",
    maintenance: "Manutenção",
    furniture: "Móveis",
    // Tecnologia
    technology: "Tecnologia",
    electronics: "Eletrônicos",
    // Financeiro
    bank: "Banco/Taxas",
    investments: "Investimentos",
    card: "Cartão",
    business: "Negócios",
    work: "Trabalho",
    // Outros
    gifts: "Presentes",
    parties: "Festas/Eventos",
    onlineShopping: "Compras Online",
    taxes: "Impostos",
    insurance: "Seguros",
    legal: "Jurídico",
    documents: "Documentos",
    // Geral
    others: "Outros",
    miscellaneous: "Diversos",
};

const getOption = (icon: CategoryIcon): ISelectOption => {
    return {
        value: icon,
        label: `${CATEGORY_ICON[icon]} ${CATEGORY_ICON_LABEL[icon]}`,
    };
};

export const CATEGORY_ICONS_OPTIONS: ISelectOption[] = zCategoryIcon.options.map(getOption);

export const getCategoryIcon = (icon: CategoryIcon): string => {
    return CATEGORY_ICON[icon] || '';
};