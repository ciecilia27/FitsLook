export interface Brand {
  name: string;
  slug: string;
  description: string;
  logo: string;
  darkBg?: boolean;
  storeUrl?: string;
}

export const defaultBrands: Brand[] = [
  { 
    name: "Evara", 
    slug: "evara", 
    description: "Contemporary fashion with clean silhouettes and versatile styling.",
    logo: "/images/Evara/evara.jpg",
    storeUrl: "https://www.evara.id"
  },
  { 
    name: "UNIT", 
    slug: "unit", 
    description: "Street-inspired designs with bold graphics and urban edge.",
    logo: "/images/Unit/UNIT.jpg",
    darkBg: true,
    storeUrl: "https://www.unitofficial.com"
  },
  { 
    name: "Reapin", 
    slug: "reapin", 
    description: "Casual comfort meets modern streetwear aesthetics.",
    logo: "/images/Reapin/Reapin.jpg",
    storeUrl: "https://www.reapin.co.id"
  },
  { 
    name: "Luna Luv", 
    slug: "luna-luv", 
    description: "Elegant feminine designs with refined details.",
    logo: "/images/Luna Luv/Luna Luv.jpeg",
    storeUrl: "https://www.lunaluv.com"
  },
  { 
    name: "Angelique Attire", 
    slug: "angelique-attire", 
    description: "Sophisticated womenswear with a touch of glamour.",
    logo: "/images/Angelique Attire/Logo Angelic.jpeg",
    storeUrl: "https://www.angeliqueattire.com"
  },
  { 
    name: "Cozy Cults", 
    slug: "cozy-cults", 
    description: "Relaxed fit essentials for everyday comfort.",
    logo: "/images/Cozy Cults/Logo Cozy Cults.jpeg",
    storeUrl: "https://www.cozycults.com"
  },
  { 
    name: "Dandels", 
    slug: "dandels", 
    description: "Classic menswear with contemporary cuts.",
    logo: "/images/Dandels/Logo_Dandels.jpeg",
    storeUrl: "https://www.dandels.com"
  },
  { 
    name: "Imperia Culverin", 
    slug: "imperia-culverin", 
    description: "Bold statement pieces with distinctive character.",
    logo: "/images/Imperia Culverin/Logo Imperia Culverin.jpeg",
    storeUrl: "https://www.imperiaculverin.com"
  },
  { 
    name: "Wear On Street", 
    slug: "wear-on-street", 
    description: "Street-ready fashion for the modern urbanite.",
    logo: "/images/Wear on Street/Logo Wear on Street.PNG",
    darkBg: true,
    storeUrl: "https://www.wearonstreet.com"
  },
  { 
    name: "Madfo.U", 
    slug: "madfo-u", 
    description: "Unique, avant-garde pieces for the fashion-forward.",
    logo: "/images/Madfo.u/Logo Madfo.u",
    storeUrl: "https://www.madfo.u.com"
  },
];

export const brands = defaultBrands;

export function getClientBrands(): Brand[] {
  if (typeof window === 'undefined') return defaultBrands;
  const stored = localStorage.getItem('brandsCatalog');
  if (!stored) {
    localStorage.setItem('brandsCatalog', JSON.stringify(defaultBrands));
    return defaultBrands;
  }
  return JSON.parse(stored);
}

export function saveClientBrands(updated: Brand[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('brandsCatalog', JSON.stringify(updated));
  }
}

export function getBrandByName(name: string): Brand | undefined {
  return getClientBrands().find(b => b.name.toLowerCase() === name.toLowerCase());
}
