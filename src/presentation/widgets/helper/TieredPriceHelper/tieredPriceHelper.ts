export interface TierOption {
  label: string;
  price: string | number;
  rawPrice: string;
  index: number;
}

export interface TieredPriceResult {
  hasTiers: boolean;
  options: TierOption[];
  typeFieldKey?: string;
  priceFieldKey?: string;
}

const isCsvString = (val: unknown): val is string =>
  typeof val === "string" && val.includes(",") && val.trim().length > 0;

const splitCsv = (val: string): string[] =>
  val.split(",").map((s) => s.trim()).filter(Boolean);

/**
 * Data-driven detection of tiered pricing from record fields.
 * Pairs type/option fields (e.g. "Basic, Standard, Premium") with price fields (e.g. "$40, $100, $250").
 * Entity-agnostic and company-agnostic.
 */
export const extractTieredPrices = (
  record: Record<string, any>,
  fields: Array<{ key: string; label?: string; type?: string; uiRole?: string }>,
): TieredPriceResult => {
  if (!record || typeof record !== "object") {
    return { hasTiers: false, options: [] };
  }

  // 1. Look for price field ($price or field with type === 'currency' / uiRole === 'price')
  let priceKey = "$price";
  let rawPriceVal = record.$price;

  if (!isCsvString(rawPriceVal)) {
    for (const f of fields) {
      const val = record[f.key];
      if (
        (f.uiRole === "price" || f.type === "currency" || /price|amount|cost|fee/i.test(f.key)) &&
        isCsvString(val)
      ) {
        priceKey = f.key;
        rawPriceVal = val;
        break;
      }
    }
  }

  if (!isCsvString(rawPriceVal)) {
    return { hasTiers: false, options: [] };
  }

  const priceParts = splitCsv(rawPriceVal);
  if (priceParts.length <= 1) {
    return { hasTiers: false, options: [] };
  }

  // 2. Look for corresponding type/tier/option field ($description or field with matching CSV count)
  let typeKey = "$description";
  let rawTypeVal = record.$description;

  if (!isCsvString(rawTypeVal) || splitCsv(rawTypeVal).length !== priceParts.length) {
    for (const f of fields) {
      if (f.key === priceKey) continue;
      const val = record[f.key];
      if (isCsvString(val) && splitCsv(val).length === priceParts.length) {
        typeKey = f.key;
        rawTypeVal = val;
        break;
      }
    }
  }

  const typeParts = isCsvString(rawTypeVal) ? splitCsv(rawTypeVal) : [];

  const options: TierOption[] = priceParts.map((p, idx) => {
    const label = typeParts[idx] ? `${typeParts[idx]} — ${p}` : `Tier ${idx + 1} — ${p}`;
    return {
      label,
      price: p,
      rawPrice: p,
      index: idx,
    };
  });

  return {
    hasTiers: options.length > 1,
    options,
    typeFieldKey: typeKey,
    priceFieldKey: priceKey,
  };
};
