import { WidgetBlock } from "../../domain/entities/GenericWidget";

export const ecommerceMock = {
  title: "AuraStyle Apparel",
  subtitle: "Search results for 'premium active noise cancelling headphones'",
  layout: "grid",
  blocks: [
    {
      type: "list",
      title: "Catalog",
      listItems: [
        {
          image:
            "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          title: "SoundMax Studio 4",
          description:
            "Studio grade active noise cancellation with 45h runtime and premium leather ear cups.",
          meta: "$199.99",
        },
        {
          image:
            "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          title: "Buds Gold Premium",
          description:
            "Waterproof true wireless earbuds with adaptive touch controls and instant charging case.",
          meta: "$119.50",
        },
        {
          image:
            "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          title: "BassPulse Portable",
          description:
            "Rugged waterproof outdoor speaker with Bluetooth 5.3 and 360-degree stereo sound pairing.",
          meta: "$79.00",
        },
        {
          image:
            "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          title: "Acoustic Over-Ear Wired",
          description:
            "Classic studio monitoring headphones with oxygen-free copper core audio cable.",
          meta: "$299.00",
        },
      ],
    },
  ] as WidgetBlock[],
};

export const PRODUCTS_MOCK: any[] = [
  {
    id: "prod-1",
    title: "SoundMax Studio 4",
    category: "Headphones",
    description: "Studio grade active noise cancellation with 45h runtime and premium memory foam ear cups.",
    price: 199.99,
    salePrice: 179.99,
    rating: 4.8,
    reviewsCount: 142,
    colors: ["#090d16", "#ffffff", "#4f46e5"],
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=600&auto=format&fit=crop",
    ],
    bullets: [
      "Hybrid Active Noise Cancellation (up to 40dB)",
      "45-Hour Battery Life with Fast Charging Support",
      "Hi-Res Wireless Audio with LDAC Codec Support",
      "Ultra-soft Memory Foam Earcups for Extended Comfort",
    ],
    inStock: true,
    sizes: ["S", "M", "L"],
  },
  {
    id: "prod-2",
    title: "Buds Gold Premium",
    category: "Audio",
    description: "Waterproof true wireless earbuds with adaptive touch controls and instant charging case.",
    price: 119.50,
    rating: 4.5,
    reviewsCount: 89,
    colors: ["#d4af37", "#090d16"],
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
    ],
    bullets: [
      "IPX7 Fully Waterproof and Sweatproof Nanocoating",
      "Smart Adaptive Touch Control Gestures",
      "Qi-certified Wireless Charging Case",
      "Dual Beamforming Microphones for Crystal Clear Calls",
    ],
    inStock: true,
    sizes: ["Standard"],
  },
  {
    id: "prod-3",
    title: "BassPulse Portable",
    category: "Audio",
    description: "Rugged waterproof outdoor speaker with Bluetooth 5.3 and 360-degree stereo sound pairing.",
    price: 79.00,
    rating: 4.2,
    reviewsCount: 64,
    colors: ["#ef4444", "#3b82f6", "#10b981"],
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=600&auto=format&fit=crop",
    ],
    bullets: [
      "360-Degree Surround Sound with Dual Passive Radiators",
      "Up to 15 Hours of Playback Time on a Single Charge",
      "IPX6 Dustproof & Splashproof Structural Frame",
      "One-click Stereo Sync Dual Speaker Pairing",
    ],
    inStock: true,
    sizes: ["Standard", "Plus"],
  },
  {
    id: "prod-4",
    title: "Acoustic Over-Ear Wired",
    category: "Headphones",
    description: "Classic studio monitoring headphones with oxygen-free copper core audio cable.",
    price: 299.00,
    salePrice: 249.00,
    rating: 4.9,
    reviewsCount: 204,
    colors: ["#090d16", "#7e838f"],
    images: [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?q=80&w=600&auto=format&fit=crop",
    ],
    bullets: [
      "50mm Large-aperture Neodymium Magnet Drivers",
      "Pure Oxygen-free Copper Detachable Coil Cable",
      "Professional-grade Soundstage and Imaging Response",
      "90-Degree Swiveling Earcups for Single-ear Monitoring",
    ],
    inStock: true,
    sizes: ["S", "M", "L"],
  },
  {
    id: "prod-5",
    title: "Solar Charge Watch",
    category: "Wearables",
    description: "Solar powered smartwatch with continuous health tracking and offline maps support.",
    price: 149.00,
    rating: 4.4,
    reviewsCount: 73,
    colors: ["#090d16", "#f59e0b"],
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&auto=format&fit=crop",
    ],
    bullets: [
      "Unlimited Battery Life in Watch Mode via Solar Charging",
      "24/7 Heart Rate and Blood Oxygen Saturation Monitoring",
      "Preloaded Offline TopoActive Mapping Profiles",
      "IP68 Rated Water Resistance up to 50 Meters",
    ],
    inStock: true,
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "prod-6",
    title: "Pro Focus Web Cam",
    category: "Accessories",
    description: "Ultra HD 4K webcam with dual noise-reduction microphones and tripod stand.",
    price: 89.99,
    salePrice: 69.99,
    rating: 4.6,
    reviewsCount: 112,
    colors: ["#090d16"],
    images: [
      "https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
    ],
    bullets: [
      "Ultra HD 4K Resolution at Smooth 30fps Stream",
      "Smart Auto-Focus and Auto-Light Correction Algorithms",
      "Dual Integrated Noise-cancelling Omnidirectional Mics",
      "Integrated Privacy Shutter and Secure Monitor Mount",
    ],
    inStock: false,
    sizes: ["Standard"],
  },
];
