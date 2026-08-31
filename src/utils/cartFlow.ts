/**
 * Cart flow — shared "add to cart" behavior for both the catalog card and the
 * product detail page. Fully generic (keys off actions/verbs, never company or
 * entity names):
 *
 *  1. Always add the item to the local Zustand cart (drives the badge count and
 *     the fallback overlay).
 *  2. If the company registered an "add to cart / create order / book / reserve"
 *     tool (detected from `actions` by verb), call it via the Apps SDK and render
 *     the tool's result — the real server cart — in the SAME widget.
 *  3. If no such tool exists (or the call yields no usable result), fall back to
 *     the local cart overlay built from the Zustand items.
 */
import { callMcpTool } from "./mcpBridge";
import {
  useCartStore,
  findCartAction,
  type CartItemData,
} from "../infrastructure/store/cartStore";
import {
  useMcpWidgetStore,
  extractToolResult,
} from "../infrastructure/store/mcpWidgetStore";
import type { WidgetAction } from "../domain/entities/GenericWidget";

interface AddToCartOptions {
  item: Omit<CartItemData, "quantity">;
  quantity?: number;
  actions?: WidgetAction[];
  /** Backend record id passed to the cart/order tool (defaults to item.id). */
  recordId?: string | number;
}

export async function addToCartAndSync({
  item,
  quantity = 1,
  actions = [],
  recordId,
}: AddToCartOptions): Promise<void> {
  // 1. Local cart is always updated (drives badge count and persistent localStorage).
  useCartStore.getState().addItem(item, quantity);

  // 2. If the company registered a cart/order tool, sync server state in the background.
  const cartAction = findCartAction(actions);
  if (cartAction?.tool) {
    try {
      await callMcpTool(cartAction.tool, {
        id: recordId ?? item.id,
        productId: recordId ?? item.id,
        quantity,
      });
    } catch (err) {
      console.warn(
        "[cartFlow] cart/order background tool sync:",
        err,
      );
    }
  }
}
