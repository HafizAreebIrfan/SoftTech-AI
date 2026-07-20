import { create } from "zustand";
import { FintechStock, FintechPortfolioItem, FintechTransaction } from "../../types/fintech";
import { MOCK_STOCKS, INITIAL_PORTFOLIO } from "../../hooks/mockData/fintech";

interface FintechState {
  balance: number;
  stocks: FintechStock[];
  portfolio: FintechPortfolioItem[];
  transactions: FintechTransaction[];
  selectedStock: FintechStock;
  filterType: 'All' | 'Stocks' | 'Crypto';
  
  // Dialog / Trade State
  tradeModalOpen: boolean;
  tradeType: 'buy' | 'sell';
  tradeShares: number;

  // Actions
  setSelectedStock: (stock: FintechStock) => void;
  setFilterType: (type: 'All' | 'Stocks' | 'Crypto') => void;
  openTradeModal: (type: 'buy' | 'sell') => void;
  closeTradeModal: () => void;
  setTradeShares: (shares: number) => void;
  executeTrade: () => { success: boolean; message: string };
  resetStore: () => void;
}

export const useFintechStore = create<FintechState>((set, get) => ({
  balance: 12450.00,
  stocks: MOCK_STOCKS,
  portfolio: INITIAL_PORTFOLIO,
  transactions: [
    {
      id: "tx_1",
      ticker: "AAPL",
      type: "buy",
      shares: 10,
      price: 175.00,
      date: "2026-07-10 14:23"
    },
    {
      id: "tx_2",
      ticker: "NVDA",
      type: "buy",
      shares: 5,
      price: 820.00,
      date: "2026-07-12 09:45"
    }
  ],
  selectedStock: MOCK_STOCKS[0],
  filterType: 'All',
  
  tradeModalOpen: false,
  tradeType: 'buy',
  tradeShares: 1,

  setSelectedStock: (stock) => set({ selectedStock: stock }),
  
  setFilterType: (type) => set({ filterType: type }),
  
  openTradeModal: (type) => set({ tradeModalOpen: true, tradeType: type, tradeShares: 1 }),
  
  closeTradeModal: () => set({ tradeModalOpen: false, tradeShares: 1 }),
  
  setTradeShares: (shares) => set({ tradeShares: Math.max(0, shares) }),

  executeTrade: () => {
    const { tradeType, tradeShares, selectedStock, balance, portfolio, transactions } = get();
    
    if (tradeShares <= 0) {
      return { success: false, message: "Please enter a valid number of shares." };
    }

    const price = selectedStock.price;
    const totalCost = price * tradeShares;

    if (tradeType === 'buy') {
      if (balance < totalCost) {
        return { success: false, message: `Insufficient balance. Required: $${totalCost.toFixed(2)}, Available: $${balance.toFixed(2)}` };
      }

      // Update balance
      const newBalance = balance - totalCost;

      // Update portfolio
      const existingItem = portfolio.find(item => item.ticker === selectedStock.ticker);
      let newPortfolio = [...portfolio];

      if (existingItem) {
        const newShares = existingItem.shares + tradeShares;
        const newTotalCost = existingItem.totalCost + totalCost;
        const newAverageBuyPrice = newTotalCost / newShares;
        const newCurrentValue = newShares * price;
        const newReturnPercent = ((newCurrentValue - newTotalCost) / newTotalCost) * 100;

        newPortfolio = portfolio.map(item => 
          item.ticker === selectedStock.ticker
            ? {
                ...item,
                shares: newShares,
                averageBuyPrice: newAverageBuyPrice,
                totalCost: newTotalCost,
                currentValue: newCurrentValue,
                returnPercent: newReturnPercent
              }
            : item
        );
      } else {
        newPortfolio.push({
          ticker: selectedStock.ticker,
          shares: tradeShares,
          averageBuyPrice: price,
          totalCost: totalCost,
          currentValue: totalCost,
          returnPercent: 0
        });
      }

      // Add transaction
      const newTx: FintechTransaction = {
        id: `tx_${Date.now()}`,
        ticker: selectedStock.ticker,
        type: 'buy',
        shares: tradeShares,
        price: price,
        date: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

      set({
        balance: newBalance,
        portfolio: newPortfolio,
        transactions: [newTx, ...transactions],
        tradeModalOpen: false,
        tradeShares: 1
      });

      return { success: true, message: `Successfully purchased ${tradeShares} shares of ${selectedStock.ticker}!` };

    } else {
      // Selling
      const existingItem = portfolio.find(item => item.ticker === selectedStock.ticker);
      
      if (!existingItem || existingItem.shares < tradeShares) {
        return { 
          success: false, 
          message: `Insufficient shares. You only own ${existingItem ? existingItem.shares : 0} shares of ${selectedStock.ticker}.` 
        };
      }

      const sellValue = price * tradeShares;
      const newBalance = balance + sellValue;
      let newPortfolio = [...portfolio];

      const remainingShares = existingItem.shares - tradeShares;

      if (remainingShares === 0) {
        newPortfolio = portfolio.filter(item => item.ticker !== selectedStock.ticker);
      } else {
        const averageBuyPrice = existingItem.averageBuyPrice;
        const newTotalCost = averageBuyPrice * remainingShares;
        const newCurrentValue = remainingShares * price;
        const newReturnPercent = ((newCurrentValue - newTotalCost) / newTotalCost) * 100;

        newPortfolio = portfolio.map(item => 
          item.ticker === selectedStock.ticker
            ? {
                ...item,
                shares: remainingShares,
                totalCost: newTotalCost,
                currentValue: newCurrentValue,
                returnPercent: newReturnPercent
              }
            : item
        );
      }

      // Add transaction
      const newTx: FintechTransaction = {
        id: `tx_${Date.now()}`,
        ticker: selectedStock.ticker,
        type: 'sell',
        shares: tradeShares,
        price: price,
        date: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

      set({
        balance: newBalance,
        portfolio: newPortfolio,
        transactions: [newTx, ...transactions],
        tradeModalOpen: false,
        tradeShares: 1
      });

      return { success: true, message: `Successfully sold ${tradeShares} shares of ${selectedStock.ticker}!` };
    }
  },

  resetStore: () => set({
    balance: 12450.00,
    stocks: MOCK_STOCKS,
    portfolio: INITIAL_PORTFOLIO,
    transactions: [
      {
        id: "tx_1",
        ticker: "AAPL",
        type: "buy",
        shares: 10,
        price: 175.00,
        date: "2026-07-10 14:23"
      },
      {
        id: "tx_2",
        ticker: "NVDA",
        type: "buy",
        shares: 5,
        price: 820.00,
        date: "2026-07-12 09:45"
      }
    ],
    selectedStock: MOCK_STOCKS[0],
    filterType: 'All',
    tradeModalOpen: false,
    tradeType: 'buy',
    tradeShares: 1
  })
}));
