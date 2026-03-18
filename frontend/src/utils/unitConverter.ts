// unitConverter.ts
export const unitGroups: Record<string, string[]> = {
  weight: ['kg', 'g', 'mg', 'lb'],
  volume: ['L', 'mL'],
};

export const conversionFactors: Record<string, number> = {
  kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592,
  L: 1, mL: 0.001,
};

export function canConvertUnit(oldUnit: string, newUnit: string) {
  const oldGroup = Object.keys(unitGroups).find(g => unitGroups[g].includes(oldUnit));
  const newGroup = Object.keys(unitGroups).find(g => unitGroups[g].includes(newUnit));
  return !!oldGroup && oldGroup === newGroup;
}

export function convertUnitQuantity(oldUnit: string, newUnit: string, quantity: number) {
  if (!canConvertUnit(oldUnit, newUnit)) return quantity;
  const quantityInBase = quantity * conversionFactors[oldUnit];
  return quantityInBase / conversionFactors[newUnit];
}