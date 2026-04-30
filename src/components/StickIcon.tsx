interface StickIconProps {
  value: 100 | 1000 | 5000 | 10000;
  count: number;
}

export function StickIcon({ value, count }: StickIconProps) {
  return (
    <span className={`stick stick-${value}`} aria-label={`${count} sticks worth ${value}`}>
      {count}x {value}
    </span>
  );
}
