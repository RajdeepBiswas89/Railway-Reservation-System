export interface MealItem {
  id: string;
  name: string;
  category: 'VEG' | 'NON_VEG' | 'JAIN' | 'BREAKFAST' | 'BEVERAGE';
  description: string;
  price: number;
  calories: string;
  partnerBrand: string;
  rating: number;
  availableStations: string[];
}

export const CATERING_MEALS: MealItem[] = [
  {
    id: 'meal-1',
    name: 'Royal Heritage Veg Thali',
    category: 'VEG',
    description: 'Paneer butter masala, yellow dal tadka, 3 butter rotis, jeera rice, gulab jamun, pickle & curd.',
    price: 240,
    calories: '680 kcal',
    partnerBrand: "Haldiram's Rail Care",
    rating: 4.8,
    availableStations: ['HWH', 'KGP', 'BBS', 'VSKP', 'SBC'],
  },
  {
    id: 'meal-2',
    name: 'Chicken Dum Biryani Combo',
    category: 'NON_VEG',
    description: 'Fragrant dum biryani with 2 tender chicken pieces, spiced mirchi ka salan, and onion raita.',
    price: 310,
    calories: '750 kcal',
    partnerBrand: 'Paradise Biryani Express',
    rating: 4.9,
    availableStations: ['VSKP', 'BZA', 'SBC'],
  },
  {
    id: 'meal-3',
    name: 'Satvik Jain Deluxe Meal',
    category: 'JAIN',
    description: 'Prepared without onion or garlic: Shahi paneer, dal fry, phulkas, basmati rice & sweet treat.',
    price: 220,
    calories: '620 kcal',
    partnerBrand: 'Bikanervala Express',
    rating: 4.7,
    availableStations: ['HWH', 'KGP', 'BBS', 'SBC'],
  },
  {
    id: 'meal-4',
    name: 'South Indian Tiffin Platter',
    category: 'BREAKFAST',
    description: '2 steamed idlis, 1 crispy medu vada, mini masala dosa, coconut chutney & piping hot sambar.',
    price: 160,
    calories: '480 kcal',
    partnerBrand: 'MTR 1924',
    rating: 4.9,
    availableStations: ['BZA', 'MAS', 'SBC'],
  },
  {
    id: 'meal-5',
    name: 'Continental Breakfast Box',
    category: 'BREAKFAST',
    description: 'Scrambled eggs on buttered toast, chicken cocktail sausages, hash brown, and packaged fruit juice.',
    price: 210,
    calories: '520 kcal',
    partnerBrand: 'RailChef Premium',
    rating: 4.6,
    availableStations: ['HWH', 'NDLS', 'CSMT'],
  },
];

export const cateringService = {
  async getMealsForStation(stationCode?: string): Promise<MealItem[]> {
    if (!stationCode) return [...CATERING_MEALS];
    return CATERING_MEALS.filter(
      (m) => m.availableStations.includes(stationCode) || m.availableStations.length === 0
    );
  },
};
