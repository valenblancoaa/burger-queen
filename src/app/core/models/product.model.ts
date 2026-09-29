/** Categorías que usa la API. */
export type ProductType = 'Breakfast' | 'Lunch' | 'Combos' | 'Sides' | 'Beverages';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  type: ProductType;
  dateEntry?: string;
}

export const PRODUCT_TYPES: ProductType[] = ['Breakfast', 'Lunch', 'Combos', 'Sides', 'Beverages'];

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  Breakfast: 'Desayuno',
  Lunch: 'Almuerzo',
  Combos: 'Combos',
  Sides: 'Acompañamientos',
  Beverages: 'Bebidas',
};

/** Los dos menús que ve la mesera: desayuno y resto del día. */
export type Menu = 'breakfast' | 'allday';

export const MENU_LABEL: Record<Menu, string> = {
  breakfast: 'Desayuno',
  allday: 'Resto del día',
};

export function belongsToMenu(product: Product, menu: Menu): boolean {
  return menu === 'breakfast' ? product.type === 'Breakfast' : product.type !== 'Breakfast';
}
