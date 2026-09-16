import type { FieldSchema } from "../../domain/entities/GenericWidget";
import type { PresentationBlock } from "./widgetdecider.interface";

export type AssetKind = "image" | "logo" | "icon" | "avatar" | "thumbnail";

export interface AssetItemData {
  id: string;
  url: string;
  alt?: string;
  kind?: AssetKind;
  label?: string;
}

export interface AssetItemProps {
  asset: AssetItemData;
}

export interface AssetBlockProps {
  block?: PresentationBlock;
  records?: unknown[];
  fields?: FieldSchema[];
}
