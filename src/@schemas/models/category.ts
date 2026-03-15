import { z } from "zod";
import { zCommonDoc } from "./@common";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";

export const zCategoryIcon = z.enum([
  // Alimentação
  'food', 'supermarket', 'fastFood', 'restaurant',
  // Moradia
  'home', 'rent', 'electricity', 'water', 'gas',
  // Transporte
  'transport', 'fuel', 'taxi', 'publicTransport', 'parking',
  // Comunicação
  'phone', 'internet', 'streaming',
  // Saúde
  'health', 'pharmacy', 'dentist', 'optical',
  // Educação
  'education', 'books', 'schoolSupplies',
  // Vestuário
  'clothes', 'shoes', 'beauty',
  // Lazer
  'entertainment', 'cinema', 'music', 'travel', 'vacation',
  // Fitness
  'gym', 'sports',
  // Pet
  'pet', 'veterinary',
  // Casa
  'cleaning', 'maintenance', 'furniture','bills',
  // Tecnologia
  'technology', 'electronics',
  // Financeiro
  'bank', 'investments', 'card', 'business', 'work',
  // Outros
  'gifts', 'parties', 'onlineShopping', 'taxes', 'insurance', 'legal', 'documents',
  // Geral
  'others', 'miscellaneous',
]);


export const zCategoryBase = z.object({
  name: z.string(),
  color: z.string().nullish(),
  icon: zCategoryIcon.nullish(),
  isPositiveExpense: z.boolean().optional(),
  userId: zStringNotEmpty,
});

export const zCreateCategory = zCategoryBase.extend({
  id: z.string().optional(),
});

export const zUpdateCategory = zCategoryBase;

export const zCategory = zCategoryBase.extend(zCommonDoc.shape);

export type ICategoryBase = z.infer<typeof zCategoryBase>;
export type ICategory = z.infer<typeof zCategory>;
export type ICreateCategory = z.infer<typeof zCreateCategory>;
export type IUpdateCategory = z.infer<typeof zUpdateCategory>;

export type CategoryIcon = z.infer<typeof zCategoryIcon>;
