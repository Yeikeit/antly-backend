import type { CategoryType } from './entities/category.entity';

interface TemplateCategory {
  name: string;
  type: CategoryType;
  sortOrder: number;
  subcategories: { name: string; type: CategoryType; sortOrder: number }[];
}

export const CATEGORY_TEMPLATE: TemplateCategory[] = [
  {
    name: 'Vivienda',
    type: 'EXPENSE',
    sortOrder: 1,
    subcategories: [
      { name: 'Arriendo', type: 'EXPENSE', sortOrder: 1 },
      { name: 'Servicios', type: 'EXPENSE', sortOrder: 2 },
    ],
  },
  {
    name: 'Alimentos',
    type: 'EXPENSE',
    sortOrder: 2,
    subcategories: [
      { name: 'Supermercado', type: 'EXPENSE', sortOrder: 1 },
      { name: 'Restaurantes', type: 'EXPENSE', sortOrder: 2 },
    ],
  },
  {
    name: 'Transporte',
    type: 'EXPENSE',
    sortOrder: 3,
    subcategories: [
      { name: 'Transporte público', type: 'EXPENSE', sortOrder: 1 },
    ],
  },
  {
    name: 'Ahorro',
    type: 'SAVING',
    sortOrder: 4,
    subcategories: [
      { name: 'Fondo de emergencia', type: 'SAVING', sortOrder: 1 },
    ],
  },
  {
    name: 'Ingresos',
    type: 'INCOME',
    sortOrder: 5,
    subcategories: [
      { name: 'Salario mensual', type: 'INCOME', sortOrder: 1 },
    ],
  },
];
