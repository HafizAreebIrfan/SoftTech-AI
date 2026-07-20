export interface FintechStock {
  ticker: string;
  name: string;
  price: number;
  change: string;
  changeTone: 'good' | 'bad' | 'default';
  volume: string;
  marketCap: string;
  history: number[]; // 7 data points for sparkline
  rating: string;
  category: 'Stocks' | 'Crypto';
  description: string;
}

export interface FintechPortfolioItem {
  ticker: string;
  shares: number;
  averageBuyPrice: number;
  totalCost: number;
  currentValue: number;
  returnPercent: number;
}

export interface FintechTransaction {
  id: string;
  ticker: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  date: string;
}
