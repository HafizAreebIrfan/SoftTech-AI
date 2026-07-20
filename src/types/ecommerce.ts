export interface Product {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  salePrice?: number;
  rating: number;
  reviewsCount: number;
  colors: string[];
  images: string[];
  bullets: string[];
  inStock: boolean;
  sizes?: string[];
}
