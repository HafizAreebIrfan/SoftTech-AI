import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "../../../../styles/fintech.module.css";
import { useFintechStore } from "../../../../infrastructure/store/fintechStore";
import {
  WalletIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BriefcaseIcon,
  Plus,
  CloseIcon,
  CheckIcon,
  DatabaseIcon
} from "../../../../assets/icons";

interface FintechScreenProps {
  title: string;
  subtitle?: string;
  blocks?: any[];
  isPreview?: boolean;
  previewIndustry?: string;
  setPreviewIndustry?: (val: string) => void;
  renderPreviewControls?: (
    previewIndustry: string,
    setPreviewIndustry: (v: string) => void
  ) => React.ReactNode;
}

export const FintechScreen: React.FC<FintechScreenProps> = ({
  title,
  subtitle,
  blocks = [],
  isPreview,
  previewIndustry,
  setPreviewIndustry,
  renderPreviewControls,
}) => {
  const {
    balance,
    stocks,
    portfolio,
    transactions,
    selectedStock,
    filterType,
    tradeModalOpen,
    tradeType,
    tradeShares,
    setSelectedStock,
    setFilterType,
    openTradeModal,
    closeTradeModal,
    setTradeShares,
    executeTrade
  } = useFintechStore();

  const displayTransactions = React.useMemo(() => {
    if (blocks && Array.isArray(blocks)) {
      const tableBlock = blocks.find((b: any) => (b?.type === "table" || b?.type === "list") && (Array.isArray(b?.tableRows) || Array.isArray(b?.listItems)));
      if (tableBlock) {
        const rows = tableBlock.tableRows || tableBlock.listItems || [];
        if (rows.length > 0) {
          return rows.map((r: any, idx: number) => ({
            id: `dyn_tx_${idx}`,
            type: r.type || "Buy",
            ticker: r.ticker || r.title || r[0] || "AAPL",
            shares: r.shares || 10,
            price: typeof r.price === 'number' ? r.price : 180.50,
            amount: typeof r.amount === 'number' ? r.amount : 1805.00,
            timestamp: r.date || "Just now"
          }));
        }
      }
    }
    return transactions;
  }, [blocks, transactions]);

  const [activeTab, setActiveTab] = useState<'holdings' | 'transactions'>('holdings');

  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter stocks list
  const filteredStocks = stocks.filter((stock) => {
    if (filterType === "All") return true;
    return stock.category === filterType;
  });

  // Calculate portfolio totals
  const totalHoldingsValue = portfolio.reduce((acc, item) => acc + item.currentValue, 0);
  const totalHoldingsCost = portfolio.reduce((acc, item) => acc + item.totalCost, 0);
  const totalGains = totalHoldingsValue - totalHoldingsCost;
  const totalGainsPercent = totalHoldingsCost > 0 ? (totalGains / totalHoldingsCost) * 100 : 0;

  // Find user holding info for the active selected stock
  const currentHolding = portfolio.find((item) => item.ticker === selectedStock.ticker);

  // Generate SVG path for stock sparkline
  const generateSparklinePoints = (history: number[], width: number, height: number) => {
    const minVal = Math.min(...history);
    const maxVal = Math.max(...history);
    const valRange = maxVal - minVal || 1;
    return history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * width;
      const y = height - 8 - ((val - minVal) / valRange) * (height - 16);
      return `${x},${y}`;
    }).join(" ");
  };

  const sparklineWidth = 320;
  const sparklineHeight = 90;
  const pointsString = generateSparklinePoints(selectedStock.history, sparklineWidth, sparklineHeight);

  // Generate background area path for visual fill gradient under sparkline
  const areaPointsString = `${pointsString} ${sparklineWidth},${sparklineHeight} 0,${sparklineHeight}`;

  const handleConfirmTradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = executeTrade();
    if (result.success) {
      setTradeMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        setTradeMessage(null);
        closeTradeModal();
      }, 1500);
    } else {
      setTradeMessage({ type: 'error', text: result.message });
      setTimeout(() => setTradeMessage(null), 3000);
    }
  };

  return (
    <div className={styles.container}>
      {/* Control panel header in preview mode */}
      {isPreview && renderPreviewControls && setPreviewIndustry && previewIndustry && (
        <div style={{ marginBottom: "1.5rem", position: "relative", zIndex: 10 }}>
          {renderPreviewControls(previewIndustry, setPreviewIndustry)}
        </div>
      )}

      {/* Main Terminal Header */}
      <header className={styles.header}>
        <div className={styles.titleSec}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle || "Live stock indicators, indices, and portfolio snapshot"}</p>
        </div>

        {/* Live account cash balance */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceIcon}>
            <WalletIcon size={20} color="currentColor" />
          </div>
          <div>
            <div className={styles.balanceLabel}>Trading Cash</div>
            <div className={styles.balanceVal}>${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </header>

      {/* Main interactive grid section */}
      <div className={styles.mainGrid}>
        {/* Left side: Terminal Watchlist */}
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>
            <DatabaseIcon size={18} color="currentColor" />
            Market Hotlist Watcher
          </h3>

          <div className={styles.filtersRow}>
            {(['All', 'Stocks', 'Crypto'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`${styles.filterBtn} ${filterType === type ? styles.filterBtnActive : ""}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.th}>Ticker</th>
                  <th className={styles.th}>Price</th>
                  <th className={styles.th}>Daily Change</th>
                  <th className={styles.thActions}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
                  const isSelected = selectedStock.ticker === stock.ticker;
                  const isUp = stock.change.includes("+");
                  return (
                    <tr
                      key={stock.ticker}
                      onClick={() => setSelectedStock(stock)}
                      className={`${styles.tableRow} ${isSelected ? styles.tableRowSelected : ""}`}
                    >
                      <td className={styles.td}>
                        <div className={styles.tickerBadge}>{stock.ticker}</div>
                        <div className={styles.nameBadge}>{stock.name}</div>
                      </td>
                      <td className={styles.td} style={{ fontWeight: "700" }}>
                        ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={styles.td}>
                        <span className={isUp ? styles.changeUp : styles.changeDown}>
                          {isUp ? <TrendingUpIcon size={14} color="currentColor" /> : <TrendingDownIcon size={14} color="currentColor" />}
                          {stock.change}
                        </span>
                      </td>
                      <td className={styles.tdActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStock(stock);
                          }}
                          className={styles.tradeBtn}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side: Selected Asset detail and buy/sell operations */}
        <div className={styles.panel}>
          <div className={styles.detailHeader}>
            <div>
              <h3 className={styles.detailTitle}>{selectedStock.name}</h3>
              <span className={styles.detailTicker}>{selectedStock.category} • {selectedStock.ticker}</span>
            </div>
            <span className={styles.detailTicker} style={{ fontWeight: "bold" }}>
              {selectedStock.rating}
            </span>
          </div>

          <div className={styles.detailPriceSec}>
            <span className={styles.detailPrice}>
              ${selectedStock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className={selectedStock.changeTone === "good" ? styles.changeUp : styles.changeDown} style={{ fontSize: "14px", fontWeight: "bold" }}>
              {selectedStock.change}
            </span>
          </div>

          {/* dynamic inline sparkline chart with gradient */}
          <div className={styles.chartContainer}>
            <svg className={styles.chartSvg} viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}>
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={selectedStock.changeTone === "good" ? "#10b981" : "#f43f5e"} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={selectedStock.changeTone === "good" ? "#10b981" : "#f43f5e"} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke={selectedStock.changeTone === "good" ? "#10b981" : "#f43f5e"}
                strokeWidth="2.5"
                points={pointsString}
              />
              <polygon
                fill="url(#chartGlow)"
                points={areaPointsString}
              />
            </svg>
          </div>

          {/* Description */}
          <p className={styles.detailDesc}>{selectedStock.description}</p>

          {/* Market Stats */}
          <div className={styles.detailGrid}>
            <div className={styles.detailStatItem}>
              <div className={styles.detailStatLabel}>24h Vol</div>
              <div className={styles.detailStatVal}>{selectedStock.volume}</div>
            </div>
            <div className={styles.detailStatItem}>
              <div className={styles.detailStatLabel}>Market Cap</div>
              <div className={styles.detailStatVal}>{selectedStock.marketCap}</div>
            </div>
          </div>

          {/* User holdings statistics */}
          <div className={styles.holdingCard}>
            <div className={styles.holdingTitle}>Your Holdings</div>
            {currentHolding ? (
              <div className={styles.holdingGrid}>
                <div className={styles.holdingStat}>
                  Shares: <span>{currentHolding.shares}</span>
                </div>
                <div className={styles.holdingStat}>
                  Avg Cost: <span>${currentHolding.averageBuyPrice.toFixed(2)}</span>
                </div>
                <div className={styles.holdingStat}>
                  Current Val: <span>${currentHolding.currentValue.toFixed(2)}</span>
                </div>
                <div className={styles.holdingStat}>
                  Return: <span className={currentHolding.returnPercent >= 0 ? styles.changeUp : styles.changeDown}>
                    {currentHolding.returnPercent >= 0 ? "+" : ""}{currentHolding.returnPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "13px", opacity: 0.7 }}>You do not currently own any shares of this asset.</div>
            )}
          </div>

          {/* Action triggers */}
          <div className={styles.detailActions}>
            <button onClick={() => openTradeModal('buy')} className={styles.buyBtn}>
              Buy Asset
            </button>
            <button
              onClick={() => openTradeModal('sell')}
              className={`${styles.sellBtn} ${!currentHolding ? styles.sellBtnDisabled : ""}`}
              disabled={!currentHolding}
            >
              Sell Asset
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Total Portfolio Breakdown vs Transaction Logs */}
      <div className={styles.bottomSection}>
        <div className={styles.tabNav}>
          <button
            onClick={() => setActiveTab('holdings')}
            className={`${styles.tabBtn} ${activeTab === 'holdings' ? styles.tabBtnActive : ""}`}
          >
            <BriefcaseIcon size={16} color="currentColor" />
            <span>Investment Portfolio ({portfolio.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`${styles.tabBtn} ${activeTab === 'transactions' ? styles.tabBtnActive : ""}`}
          >
            <Plus size={16} color="currentColor" />
            <span>Transaction Logs ({transactions.length})</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'holdings' ? (
            <motion.div
              key="holdings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={styles.panel}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--app-text-secondary)", fontWeight: 700 }}>Total Portfolio Equity</div>
                  <div style={{ fontSize: "24px", fontWeight: 900, color: "var(--app-text-heading)", marginTop: "2px" }}>
                    ${totalHoldingsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--app-text-secondary)", fontWeight: 700 }}>Total Return</div>
                  <div className={totalGains >= 0 ? styles.changeUp : styles.changeDown} style={{ fontSize: "20px", fontWeight: 800, marginTop: "2px" }}>
                    {totalGains >= 0 ? "+" : ""}${totalGains.toFixed(2)} ({totalGainsPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeaderRow}>
                      <th className={styles.th}>Asset</th>
                      <th className={styles.th}>Holdings</th>
                      <th className={styles.th}>Avg Cost</th>
                      <th className={styles.th}>Total Cost</th>
                      <th className={styles.thActions}>Current Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((item) => {
                      const stockInfo = stocks.find(s => s.ticker === item.ticker);
                      const isProfit = item.returnPercent >= 0;
                      return (
                        <tr key={item.ticker} className={styles.tableRow} onClick={() => stockInfo && setSelectedStock(stockInfo)}>
                          <td className={styles.td}>
                            <div className={styles.tickerBadge}>{item.ticker}</div>
                            <div className={styles.nameBadge}>{stockInfo?.name}</div>
                          </td>
                          <td className={styles.td} style={{ fontWeight: "700" }}>{item.shares}</td>
                          <td className={styles.td}>${item.averageBuyPrice.toFixed(2)}</td>
                          <td className={styles.td}>${item.totalCost.toFixed(2)}</td>
                          <td className={styles.tdActions}>
                            <div style={{ fontWeight: "800", color: "var(--app-text-heading)" }}>${item.currentValue.toFixed(2)}</div>
                            <div className={isProfit ? styles.changeUp : styles.changeDown} style={{ fontSize: "11px", marginTop: "2px" }}>
                              {isProfit ? "+" : ""}{item.returnPercent.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={styles.txList}
            >
              {displayTransactions.length === 0 ? (
                <div className={styles.panel} style={{ textAlign: "center", padding: "40px", opacity: 0.7 }}>No transactions recorded.</div>
              ) : (
                displayTransactions.map((tx: any) => {
                  const isBuy = tx.type === 'buy' || tx.type === 'Buy';
                  const total = (tx.shares || 1) * (tx.price || 100);
                  return (
                    <div key={tx.id} className={styles.txRow}>
                      <div className={styles.txInfo}>
                        <span className={`${styles.txBadge} ${isBuy ? styles.txBadgeBuy : styles.txBadgeSell}`}>
                          {tx.type}
                        </span>
                        <div className={styles.txDetails}>
                          {tx.shares} shares of <strong>{tx.ticker}</strong> <span>@ ${typeof tx.price === 'number' ? tx.price.toFixed(2) : tx.price}</span>
                        </div>
                      </div>
                      <div className={styles.txMeta}>
                        <div className={styles.txValue}>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className={styles.txDate}>{tx.date || tx.timestamp || "Today"}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transaction executing glass dialog modal */}
      <AnimatePresence>
        {tradeModalOpen && (
          <div className={styles.modalOverlay}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={styles.modalContent}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 className={styles.modalTitle}>
                  Execute Trade: {tradeType === 'buy' ? "Buy" : "Sell"} {selectedStock.ticker}
                </h3>
                <button
                  onClick={closeTradeModal}
                  style={{ background: "transparent", border: "none", color: "currentColor", cursor: "pointer" }}
                >
                  <CloseIcon size={20} color="currentColor" />
                </button>
              </div>

              {tradeMessage ? (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "14px",
                    marginBottom: "16px",
                    background: tradeMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: tradeMessage.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${tradeMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                  }}
                >
                  {tradeMessage.text}
                </div>
              ) : null}

              <form onSubmit={handleConfirmTradeSubmit}>
                <div className={styles.modalGroup}>
                  <label className={styles.modalLabel}>Shares Amount</label>
                  <input
                    type="number"
                    step="any"
                    value={tradeShares === 0 ? "" : tradeShares}
                    onChange={(e) => setTradeShares(Number(e.target.value))}
                    className={styles.modalInput}
                    placeholder="Enter shares quantity"
                    min="0"
                    required
                  />
                </div>

                <div className={styles.modalSummary}>
                  <div className={styles.summaryRow}>
                    <span>Available Cash:</span>
                    <span>${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Current Price:</span>
                    <span>${selectedStock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Trading Shares:</span>
                    <span>{tradeShares}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Estimated Total:</span>
                    <span>${(selectedStock.price * tradeShares).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" onClick={closeTradeModal} className={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`${styles.confirmBtn} ${tradeType === 'buy' ? styles.confirmBtnBuy : styles.confirmBtnSell}`}
                  >
                    Confirm {tradeType === 'buy' ? "Purchase" : "Sale"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
