import React from "react";
import styles from "../../../../../styles/adminpreview.module.css";
import { McpTool } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mcpTools: McpTool[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, mcpTools }) => {
  return (
    <div className={styles.sidebar}>
      <button
        className={`${styles.sidebarBtn} ${activeTab === "onboarding" ? styles.activeSidebarBtn : ""}`}
        onClick={() => setActiveTab("onboarding")}
      >
        🏛️ Setup & Onboarding
      </button>
      <button
        className={`${styles.sidebarBtn} ${activeTab === "apis" ? styles.activeSidebarBtn : ""}`}
        onClick={() => setActiveTab("apis")}
      >
        🔌 API Management
      </button>
      <button
        className={`${styles.sidebarBtn} ${activeTab === "mcp-tools" ? styles.activeSidebarBtn : ""}`}
        onClick={() => setActiveTab("mcp-tools")}
      >
        🛠️ MCP Tool Definitions
      </button>
      <button
        className={`${styles.sidebarBtn} ${activeTab === "playground" ? styles.activeSidebarBtn : ""}`}
        onClick={() => {
          setActiveTab("playground");
        }}
      >
        🧪 Testing Playground
      </button>
      <button
        className={`${styles.sidebarBtn} ${activeTab === "plans" ? styles.activeSidebarBtn : ""}`}
        onClick={() => setActiveTab("plans")}
      >
        💳 Plans & Subscriptions
      </button>
    </div>
  );
};

export default Sidebar;
