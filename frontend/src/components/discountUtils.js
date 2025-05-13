import { useSales } from "../context/SalesContext";

export function useDiscountUtils() {
  const sales = useSales();

  const getSaleForVariant = (variantId) => {
    return sales.find((sale) => sale.variant_ids.includes(variantId)) || null;
  };

  const getDiscountedPrice = (variant) => {
    if (!variant || variant.price == null) return 0;

    const price = parseFloat(variant.price);
    const sale = getSaleForVariant(variant.id);
    if (!sale) return price;

    if (sale.discount_type === "percent") {
      return parseFloat((price * (1 - sale.discount_value / 100)).toFixed(2));
    } else if (sale.discount_type === "amount") {
      return Math.max(0, parseFloat((price - sale.discount_value).toFixed(2)));
    }

    return price;
  };

  return { getSaleForVariant, getDiscountedPrice };
}
