// Variant labels for the bag and orders: "Washed black / M" -> "Washed black · M".
export const variantLine = (variantTitle: string) => variantTitle.split(" / ").join(" · ");
