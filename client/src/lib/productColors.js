export const getColorValue = (color) =>
  typeof color === "string" ? color : color?.color;

export const getColorQuantity = (color) => {
  if (!color || typeof color === "string") return null;
  return Number(color.quantity ?? 0);
};

export const normalizeColor = (color) => ({
  color: getColorValue(color),
  quantity: getColorQuantity(color),
});