export const MOCK_STOCKS: any[] = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 185.20,
    change: "+1.25%",
    changeTone: "good",
    volume: "52.4M",
    marketCap: "2.90T",
    history: [180, 181.5, 182, 181, 183.2, 184, 185.2],
    rating: "Strong Buy",
    category: "Stocks",
    description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. Its premium brand equity and ecosystem services drive stable long-term yields."
  },
  {
    ticker: "TSLA",
    name: "Tesla Inc.",
    price: 172.90,
    change: "-2.84%",
    changeTone: "bad",
    volume: "94.1M",
    marketCap: "550B",
    history: [185, 182, 178, 179.5, 175, 171.2, 172.9],
    rating: "Hold",
    category: "Stocks",
    description: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems. Known for high market volatility and pioneering sustainable energy."
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corp.",
    price: 890.40,
    change: "+7.42%",
    changeTone: "good",
    volume: "41.8M",
    marketCap: "2.22T",
    history: [810, 830, 845, 840, 862, 875, 890.4],
    rating: "Buy",
    category: "Stocks",
    description: "NVIDIA Corporation focuses on personal computer graphics, graphics processing units, and also artificial intelligence solutions. It remains the key infrastructural layer powering the AI revolution."
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corp.",
    price: 420.10,
    change: "+0.60%",
    changeTone: "good",
    volume: "22.3M",
    marketCap: "3.12T",
    history: [415, 417, 419, 416, 418.5, 419.8, 420.1],
    rating: "Strong Buy",
    category: "Stocks",
    description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. Its leadership in cloud services (Azure) and enterprise AI integrations offers robust growth."
  },
  {
    ticker: "BTC",
    name: "Bitcoin",
    price: 64250.00,
    change: "+3.85%",
    changeTone: "good",
    volume: "28.5B",
    marketCap: "1.26T",
    history: [61000, 62500, 63100, 62200, 63800, 64100, 64250],
    rating: "Buy",
    category: "Crypto",
    description: "Bitcoin is a decentralized digital currency, without a central bank or single administrator, that can be sent from user to user on the peer-to-peer bitcoin network. The premier digital reserve asset."
  },
  {
    ticker: "ETH",
    name: "Ethereum",
    price: 3450.00,
    change: "+1.92%",
    changeTone: "good",
    volume: "14.2B",
    marketCap: "415B",
    history: [3320, 3350, 3410, 3390, 3420, 3430, 3450],
    rating: "Buy",
    category: "Crypto",
    description: "Ethereum is a decentralized, open-source blockchain with smart contract functionality. Ether is the native cryptocurrency of the platform, hosting the vast majority of DeFi and NFT developer activity."
  },
  {
    ticker: "SOL",
    name: "Solana",
    price: 142.10,
    change: "-1.15%",
    changeTone: "bad",
    volume: "3.9B",
    marketCap: "63.2B",
    history: [146, 144, 141, 143.5, 139.8, 140.2, 142.1],
    rating: "Buy",
    category: "Crypto",
    description: "Solana is a blockchain platform designed to host decentralized, scalable applications. It offers significantly faster transaction speeds and lower fees compared to Ethereum, making it highly competitive."
  }
];

export const INITIAL_PORTFOLIO: any[] = [
  {
    ticker: "AAPL",
    shares: 10,
    averageBuyPrice: 175.00,
    totalCost: 1750.00,
    currentValue: 1852.00,
    returnPercent: 5.82
  },
  {
    ticker: "NVDA",
    shares: 5,
    averageBuyPrice: 820.00,
    totalCost: 4100.00,
    currentValue: 4452.00,
    returnPercent: 8.58
  },
  {
    ticker: "BTC",
    shares: 0.15,
    averageBuyPrice: 60000.00,
    totalCost: 9000.00,
    currentValue: 9637.50,
    returnPercent: 7.08
  }
];

export const fintechMock = {
  title: "CapitalEdge Market Terminal",
  subtitle: "Live stock indicators, indices, and portfolio snapshot",
  layout: "table",
  blocks: []
};
