import { Product, Category } from '@/types';

export const mockCategories: Category[] = [];

export const mockProducts: Product[] = [];

export function getMockProducts(): Product[] {
	return mockProducts;
}

export function getMockCategories(): Category[] {
	return mockCategories;
}

export function getMockProductById(id: string): Product | undefined {
	return mockProducts.find((product) => product.id.toString() === id);
}
