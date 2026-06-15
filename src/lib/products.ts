export interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  type: 'top' | 'bottom';
  fit: string[];
  description?: string;
  price?: string;
  shopeeUrl?: string;
  isAvailable?: boolean;
}

export const defaultProducts: Product[] = [
  // ── Evara ──
  { id: "1", name: "Forme Vest Gray", brand: "Evara", image: "/images/Evara/Forme_Vest_Gray-removebg-preview.png", type: "top", fit: ["slim", "athletic"] },
  { id: "2", name: "Forme Pants Gray", brand: "Evara", image: "/images/Evara/Forme_Pants_Gray-removebg-preview.png", type: "bottom", fit: ["slim", "athletic", "regular"] },
  { id: "3", name: "Forme Vest Khaki", brand: "Evara", image: "/images/Evara/Forme_Vest_Khaki-removebg-preview.png", type: "top", fit: ["slim", "athletic"] },
  { id: "4", name: "Forme Pants Khaki", brand: "Evara", image: "/images/Evara/Forme_Pants_Khaki-removebg-preview.png", type: "bottom", fit: ["slim", "athletic", "regular"] },
  { id: "8", name: "Lea Top in White", brand: "Evara", image: "/images/Evara/Lea Top in White.png", type: "top", fit: ["slim", "regular"] },
  { id: "11", name: "Emma Top", brand: "Evara", image: "/images/Evara/WhatsApp_Image_2025-10-24_at_20.42.33_8e300041-removebg-preview.png", type: "top", fit: ["slim", "regular"] },

  // ── UNIT ──
  { id: "5", name: "Orca Shirt", brand: "UNIT", image: "/images/Unit/Orca_UNIT-removebg-preview.png", type: "top", fit: ["slim", "athletic"] },
  { id: "7", name: "Anti Mater", brand: "UNIT", image: "/images/Unit/Anti_Mater_UNIT-removebg-preview.png", type: "top", fit: ["regular", "athletic"] },

  // ── Reapin ──
  { id: "12", name: "Airbrush Boxy T-shirt Horse", brand: "Reapin", image: "/images/Reapin/Airbrush_Boxy_T-shirt_Horse-removebg-preview.png", type: "top", fit: ["regular", "relaxed", "full"] },
  { id: "13", name: "Airbrush Boxy T-shirt Pigeon", brand: "Reapin", image: "/images/Reapin/Airbrush_Boxy_T-shirt_Pigeon-removebg-preview.png", type: "top", fit: ["regular", "relaxed", "full"] },

  // ── Luna Luv ──
  { id: "16", name: "Turquoise Satin Black Blouse", brand: "Luna Luv", image: "/images/Luna Luv/Turquoise_Satin Black_Blouse.png", type: "top", fit: ["slim", "hourglass"] },

  // ── Angelique Attire ──
  { id: "6", name: "Florence — Glitz & Grace", brand: "Angelique Attire", image: "/images/Angelique Attire/Florence - Glitz & Grace.png", type: "top", fit: ["slim", "hourglass"] },
  { id: "14", name: "Kemeja Amore & Marjorie", brand: "Angelique Attire", image: "/images/Angelique Attire/Kemeja Amore & Marjorie.png", type: "top", fit: ["slim", "regular"] },
  { id: "15", name: "Kyrena Blouse", brand: "Angelique Attire", image: "/images/Angelique Attire/Kyrena Blouse.png", type: "top", fit: ["slim", "regular"] },

  // ── Cozy Cults ──
  { id: "17", name: "Cozy Cults Item 1", brand: "Cozy Cults", image: "/images/Cozy Cults/Marcello Half Ziper Black.png", type: "top", fit: ["regular", "relaxed"] },

  // ── Wear On Street ──
  { id: "18", name: "Wear On Street Item 1", brand: "Wear On Street", image: "/images/Wear on Street/Burning_Jaw.png", type: "top", fit: ["regular", "athletic"] },

  // ── Dandels ──
  { id: "19", name: "Dandels Item 1", brand: "Dandels", image: "/images/Dandels/Cline_Overshirt.png", type: "top", fit: ["slim", "regular"] },

  // ── Imperia Culverin ──
  { id: "20", name: "Imperia Culverin Item 1", brand: "Imperia Culverin", image: "/images/Imperia Culverin/Oversize Boxy T-Shirt.png", type: "top", fit: ["athletic", "regular"] },

  // ── Madfo.U ──
  { id: "21", name: "Draped Asymmetric Knit", brand: "Madfo.U", image: "/images/Madfo.u/Button Me Right.png", type: "top", fit: ["regular", "relaxed"] },

  // ── Additional products ──
  { id: "9", name: "Linen Summer Vest", brand: "Evara", image: "/images/Evara/Lea Top in Baby Blue.png", type: "top", fit: ["regular"] },
  { id: "10", name: "Tailored Crop Blazer", brand: "Evara", image: "/images/Evara/Lea Top in Black.png", type: "top", fit: ["regular"] },
  { id: "22", name: "Knit Polo Tee", brand: "Evara", image: "/images/Evara/WhatsApp_Image_2025-10-24_at_20.42.33_8e300041-removebg-preview.png", type: "top", fit: ["regular"] },
  { id: "23", name: "Cyber Print Oversized Hoodie", brand: "UNIT", image: "/images/Unit/Korean_Girl_UNIT-removebg-preview.png", type: "top", fit: ["regular"] },
  { id: "24", name: "Corduroy Trucker Jacket", brand: "Reapin", image: "/images/Reapin/Attachable_Double_Zipper_Boxy_-removebg-preview.png", type: "top", fit: ["regular"] },
  { id: "25", name: "Floral Print Silk Camisole", brand: "Luna Luv", image: "/images/Luna Luv/Sage_Green_Blouse.png", type: "top", fit: ["regular"] },
  { id: "26", name: "Ruched Halter Top", brand: "Angelique Attire", image: "/images/Angelique Attire/Petals.png", type: "top", fit: ["regular"] },
  { id: "27", name: "Cozy Ribbed Loungewear Tee", brand: "Cozy Cults", image: "/images/Cozy Cults/Marcello Half Ziper Blue.png", type: "top", fit: ["regular"] },
  { id: "28", name: "Classic Oxford Cotton Shirt", brand: "Dandels", image: "/images/Dandels/Filament_Overshirt.png", type: "top", fit: ["regular"] },
  { id: "29", name: "Graffiti Print Skate Tee", brand: "Wear On Street", image: "/images/Wear on Street/Melting_Candy.png", type: "top", fit: ["regular"] },
  { id: "30", name: "Embroidered Dragon Bomber", brand: "Imperia Culverin", image: "/images/Imperia Culverin/Oversize Boxy T-Shirt.png", type: "top", fit: ["regular"] },
  { id: "31", name: "Deconstructed Denim Top", brand: "Madfo.U", image: "/images/Madfo.u/Keep Me Tied.png", type: "top", fit: ["regular"] },
  { id: "32", name: "Evara Relaxed Linen Trousers", brand: "Evara", image: "/images/Evara/Forme_Pants_Khaki-removebg-preview.png", type: "bottom", fit: ["regular"] },
  { id: "33", name: "UNIT Heavyweight Cargo Joggers", brand: "UNIT", image: "/images/Unit/Anti_Mater_UNIT-removebg-preview.png", type: "bottom", fit: ["regular"] },
  { id: "34", name: "Reapin Raw Selvedge Jeans", brand: "Reapin", image: "/images/Reapin/Airbrush_Boxy_Tshirt_Fish-removebg-preview.png", type: "bottom", fit: ["regular"] },
  { id: "35", name: "Evara Linen Tailored Shorts", brand: "Evara", image: "/images/Evara/Forme_Pants_Gray-removebg-preview.png", type: "bottom", fit: ["regular"] },
  { id: "36", name: "Luna Luv Pleated Silk Skirt", brand: "Luna Luv", image: "/images/Luna Luv/Turqouise_Satin_Blouse.png", type: "bottom", fit: ["regular"] },
  { id: "38", name: "Angelique Puff Sleeve Top", brand: "Angelique Attire", image: "/images/Angelique Attire/Strivelle Blouse.png", type: "top", fit: ["regular"] },
  { id: "39", name: "Cozy Cults Heavyweight Hoodie", brand: "Cozy Cults", image: "/images/Cozy Cults/Marcello Half Ziper Brown.png", type: "top", fit: ["regular"] },
  { id: "40", name: "Dandels Knit Mockneck Sweater", brand: "Dandels", image: "/images/Dandels/Mile_Jacket.png", type: "top", fit: ["regular"] },
  { id: "41", name: "Wear On Street Windbreaker", brand: "Wear On Street", image: "/images/Wear on Street/Burning_Jaw.png", type: "top", fit: ["regular"] },
  { id: "42", name: "Imperia Velvet Blazer", brand: "Imperia Culverin", image: "/images/Imperia Culverin/Oversize Boxy T-Shirt.png", type: "top", fit: ["regular"] },
  { id: "43", name: "Madfo.U Asymmetric Vest", brand: "Madfo.U", image: "/images/Madfo.u/Lace Me Up.png", type: "top", fit: ["regular"] },
  { id: "44", name: "Evara Knitted Tank Top", brand: "Evara", image: "/images/Evara/Lea Top in White.png", type: "top", fit: ["regular"] },
  { id: "45", name: "UNIT Utility Canvas Vest", brand: "UNIT", image: "/images/Unit/Orca_UNIT-removebg-preview.png", type: "top", fit: ["regular"] },
  { id: "46", name: "Reapin Checked Flannel Shirt", brand: "Reapin", image: "/images/Reapin/Airbrush_Boxy_T-shirt_Horse-removebg-preview.png", type: "top", fit: ["regular"] },
  { id: "47", name: "Luna Luv Organza Blouse", brand: "Luna Luv", image: "/images/Luna Luv/Magenta_Pink_Blouse.png", type: "top", fit: ["regular"] },
  { id: "48", name: "Angelique Ruffle Lace Bodysuit", brand: "Angelique Attire", image: "/images/Angelique Attire/Vlvienne Blouse.png", type: "top", fit: ["regular"] },
  { id: "49", name: "Cozy Cults Sherpa Zip Fleece", brand: "Cozy Cults", image: "/images/Cozy Cults/Marcello Half Ziper Black.png", type: "top", fit: ["regular"] },
];

export const products = defaultProducts;

export function getClientProducts(): Product[] {
  if (typeof window === 'undefined') return defaultProducts;
  
  // Bust old local storage product cache containing broken test-outfit.png paths
  const stored = localStorage.getItem('productsCatalog');
  if (stored && stored.includes('test-outfit.png')) {
    localStorage.removeItem('productsCatalog');
  }

  const storedUpdated = localStorage.getItem('productsCatalog');
  if (!storedUpdated) {
    localStorage.setItem('productsCatalog', JSON.stringify(defaultProducts));
    return defaultProducts;
  }
  return JSON.parse(storedUpdated);
}


export function saveClientProducts(updated: Product[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('productsCatalog', JSON.stringify(updated));
  }
}

export function getProductById(id: string): Product | undefined {
  return getClientProducts().find(p => p.id === id);
}

export function getProductsByBrand(brand: string): Product[] {
  return getClientProducts().filter(p => p.brand.toLowerCase() === brand.toLowerCase());
}

export function getAllBrands(): string[] {
  return [...new Set(getClientProducts().map(p => p.brand))];
}

export function getFeaturedProducts(count: number = 10): Product[] {
  return getClientProducts().slice(0, count);
}
