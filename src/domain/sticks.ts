export interface StickInventory {
  tenThousand: number;
  fiveThousand: number;
  thousand: number;
  hundred: number;
}

export interface StickTransferDescription {
  amount: number;
  give: StickInventory;
  change: StickInventory;
  text: string;
}

export function createStickInventory(score: number): StickInventory {
  if (!Number.isInteger(score) || score < 0 || score % 100 !== 0) {
    throw new Error("Score must be a non-negative multiple of 100.");
  }

  let remaining = score;
  const tenThousand = Math.floor(remaining / 10000);
  remaining -= tenThousand * 10000;
  const fiveThousand = Math.floor(remaining / 5000);
  remaining -= fiveThousand * 5000;
  const thousand = Math.floor(remaining / 1000);
  remaining -= thousand * 1000;
  const hundred = Math.floor(remaining / 100);

  return { tenThousand, fiveThousand, thousand, hundred };
}

export function describeTransferSticks(amount: number): StickTransferDescription {
  const give = createStickInventory(amount);
  const change = createStickInventory(0);
  return {
    amount,
    give,
    change,
    text: `Give ${formatInventory(give)}.`
  };
}

function formatInventory(inventory: StickInventory): string {
  const parts = [
    [inventory.tenThousand, "10000"],
    [inventory.fiveThousand, "5000"],
    [inventory.thousand, "1000"],
    [inventory.hundred, "100"]
  ]
    .filter(([count]) => Number(count) > 0)
    .map(([count, label]) => `${count} x ${label}`);

  return parts.length === 0 ? "no sticks" : parts.join(" and ");
}
