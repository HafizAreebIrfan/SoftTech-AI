import { create } from "zustand";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TodoState {
  tasks: Task[];
  isAdding: boolean;
  busyTodoIds: string[];
  setTasks: (tasks: Task[]) => void;
  setIsAdding: (isAdding: boolean) => void;
  addBusyTodoId: (id: string) => void;
  removeBusyTodoId: (id: string) => void;
  addTodo: (title: string) => Promise<void>;
  completeTodo: (id: string) => Promise<void>;
}

// MCP bridge setup
let rpcId = 0;
const pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

const rpcNotify = (method: string, params: any) => {
  window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
};

const rpcRequest = (method: string, params: any) =>
  new Promise((resolve, reject) => {
    const id = ++rpcId;
    pendingRequests.set(id, { resolve, reject });
    window.parent.postMessage(
      { jsonrpc: "2.0", id, method, params },
      "*"
    );
  });

const initializeBridge = async () => {
  const appInfo = { name: "todo-widget", version: "0.1.0" };
  const appCapabilities = {};
  const protocolVersion = "2026-01-26";

  try {
    await rpcRequest("ui/initialize", {
      appInfo,
      appCapabilities,
      protocolVersion,
    });
    rpcNotify("ui/notifications/initialized", {});
  } catch (error) {
    console.error("Failed to initialize the MCP Apps bridge:", error);
    throw error;
  }
};

const bridgeReady = initializeBridge();

const callTodoTool = async (name: string, payload: any, setTasks: (tasks: Task[]) => void) => {
  await bridgeReady;
  const response = await rpcRequest("tools/call", {
    name,
    arguments: payload,
  }) as any;
  if (response?.structuredContent?.tasks) {
    setTasks(response.structuredContent.tasks);
  }
};

export const useTodoStore = create<TodoState>((set, get) => {
  // Listen for model-initiated tool calls
  window.addEventListener(
    "message",
    (event) => {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;

      // Responses
      if (typeof message.id === "number") {
        const pending = pendingRequests.get(message.id);
        if (!pending) return;
        pendingRequests.delete(message.id);

        if (message.error) {
          pending.reject(message.error);
          return;
        }

        pending.resolve(message.result);
        return;
      }

      // Notifications
      if (typeof message.method !== "string") return;
      if (message.method === "ui/notifications/tool-result") {
        if (message.params?.structuredContent?.tasks) {
          set({ tasks: message.params.structuredContent.tasks });
        }
      }
    },
    { passive: true }
  );

  return {
    tasks: [],
    isAdding: false,
    busyTodoIds: [],
    setTasks: (tasks) => set({ tasks }),
    setIsAdding: (isAdding) => set({ isAdding }),
    addBusyTodoId: (id) => set((state) => ({ busyTodoIds: [...state.busyTodoIds, id] })),
    removeBusyTodoId: (id) => set((state) => ({ busyTodoIds: state.busyTodoIds.filter((tId) => tId !== id) })),
    addTodo: async (title) => {
      const { isAdding, setTasks } = get();
      if (!title || isAdding) return;
      set({ isAdding: true });
      try {
        await callTodoTool("add_todo", { title }, setTasks);
      } catch (error) {
        console.error("Failed to add todo:", error);
      } finally {
        set({ isAdding: false });
      }
    },
    completeTodo: async (id) => {
      const { busyTodoIds, setTasks, addBusyTodoId, removeBusyTodoId } = get();
      if (busyTodoIds.includes(id)) return;
      addBusyTodoId(id);
      try {
        await callTodoTool("complete_todo", { id }, setTasks);
      } catch (error) {
        console.error("Failed to complete todo:", error);
      } finally {
        removeBusyTodoId(id);
      }
    },
  };
});
