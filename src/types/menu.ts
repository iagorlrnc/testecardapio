export type CategoryId = 'todos' | 'entradas' | 'principais' | 'sobremesas' | 'bebidas';

export interface Category {
  id: CategoryId;
  name: string;
  description?: string;
  icon?: string;
}

export interface Allergen {
  id: string;
  label: string;
  icon?: string;
}

export interface NutritionInfo {
  calories: number;
  serves: string;
  prepTime: string;
  chefSpecial?: boolean;
}

export interface Dish {
  id: string;
  name: string;
  subtitle?: string;
  category: CategoryId;
  price: number;
  description: string;
  longDescription: string;
  ingredients: string[];
  allergens: string[];
  tags: string[];
  thumbnail: string;
  poster: string;
  glbUrl: string;
  usdzUrl: string;
  featured?: boolean;
  modelScale?: string;
  shadowIntensity?: number;
  environmentImage?: string;
  exposure?: number;
  nutrition: NutritionInfo;
  pairingRecommendation?: {
    drinkName: string;
    description: string;
  };
  // 3D Generation fields
  sourcePhotos?: string[];
  tripoTaskId?: string;
  modelStatus?: 'pending' | 'processing' | 'ready' | 'failed';
  plateWidthCm?: number;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
  notes?: string;
}
