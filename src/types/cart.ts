export interface CartItem {
  slug: string;
  category: string;
  name: string;
  price: number;
  image?: string | null;
  quantity: number;
  /** e.g. { Size: "Medium (4–6 People)", "Heater option": "Electric Heater" }. */
  selectedOptions?: Record<string, string>;
}
