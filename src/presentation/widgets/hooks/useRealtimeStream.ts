import { useEffect, useRef, useState, useCallback } from "react";

export interface UseRealtimeStreamOptions {
  streamUrl?: string;
  onMessage?: (payload: any) => void;
  enabled?: boolean;
}

export interface UseRealtimeStreamResult {
  isConnected: boolean;
  lastMessage: any | null;
  error: Error | null;
}

/**
 * Universal React hook to subscribe to live data feeds via WebSocket (wss://) or SSE (https://).
 * Automatically detects transport, parses JSON payloads, and handles reconnection and cleanup.
 */
export function useRealtimeStream({
  streamUrl,
  onMessage,
  enabled = true,
}: UseRealtimeStreamOptions): UseRealtimeStreamResult {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const handleIncomingData = useCallback((rawData: any) => {
    let parsed: any = rawData;
    if (typeof rawData === "string") {
      try {
        parsed = JSON.parse(rawData);
      } catch {
        parsed = rawData;
      }
    }
    setLastMessage(parsed);
    if (onMessageRef.current) {
      try {
        onMessageRef.current(parsed);
      } catch (err) {
        console.warn("[RealtimeStream] Error in onMessage handler:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || !streamUrl || typeof streamUrl !== "string") {
      setIsConnected(false);
      return;
    }

    const trimmedUrl = streamUrl.trim();
    if (!trimmedUrl) return;

    let socket: WebSocket | null = null;
    let eventSource: EventSource | null = null;
    let isDisposed = false;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const maxRetries = 5;

    // 1. WebSocket Transport (ws:// or wss://)
    if (trimmedUrl.startsWith("ws://") || trimmedUrl.startsWith("wss://")) {
      const connectWs = () => {
        if (isDisposed) return;
        try {
          socket = new WebSocket(trimmedUrl);

          socket.onopen = () => {
            if (isDisposed) {
              socket?.close();
              return;
            }
            setIsConnected(true);
            setError(null);
            retryCount = 0;
            console.log(`[RealtimeStream] Connected to WebSocket: ${trimmedUrl}`);
          };

          socket.onmessage = (event) => {
            if (isDisposed) return;
            handleIncomingData(event.data);
          };

          socket.onerror = (err) => {
            console.warn("[RealtimeStream] WebSocket error:", err);
            setError(new Error("WebSocket connection error"));
          };

          socket.onclose = (event) => {
            setIsConnected(false);
            if (!isDisposed && retryCount < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 15000);
              retryCount++;
              console.log(`[RealtimeStream] Reconnecting WebSocket in ${delay}ms (attempt ${retryCount}/${maxRetries})...`);
              reconnectTimeout = setTimeout(connectWs, delay);
            }
          };
        } catch (err: any) {
          console.warn("[RealtimeStream] Failed to initialize WebSocket:", err);
          setError(err);
        }
      };

      connectWs();

      return () => {
        isDisposed = true;
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        if (socket) {
          socket.onopen = null;
          socket.onmessage = null;
          socket.onerror = null;
          socket.onclose = null;
          socket.close();
        }
        setIsConnected(false);
      };
    }

    // 2. Server-Sent Events Transport (http:// or https://)
    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
      try {
        eventSource = new EventSource(trimmedUrl);

        eventSource.onopen = () => {
          if (isDisposed) {
            eventSource?.close();
            return;
          }
          setIsConnected(true);
          setError(null);
          console.log(`[RealtimeStream] Connected to SSE: ${trimmedUrl}`);
        };

        eventSource.onmessage = (event) => {
          if (isDisposed) return;
          handleIncomingData(event.data);
        };

        eventSource.onerror = (err) => {
          console.warn("[RealtimeStream] SSE connection error:", err);
          setIsConnected(false);
          setError(new Error("SSE connection error"));
        };
      } catch (err: any) {
        console.warn("[RealtimeStream] Failed to initialize SSE:", err);
        setError(err);
      }

      return () => {
        isDisposed = true;
        if (eventSource) {
          eventSource.onopen = null;
          eventSource.onmessage = null;
          eventSource.onerror = null;
          eventSource.close();
        }
        setIsConnected(false);
      };
    }
  }, [streamUrl, enabled, handleIncomingData]);

  return { isConnected, lastMessage, error };
}
