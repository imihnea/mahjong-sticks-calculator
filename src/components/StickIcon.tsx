interface StickIconProps {
  value: 100 | 1000 | 5000 | 10000;
  count: number;
}

const STICK_IMAGES: Record<StickIconProps["value"], string> = {
  100: "/sticks/white/100.png",
  1000: "/sticks/white/1000.png",
  5000: "/sticks/white/5000.png",
  10000: "/sticks/white/10000.png"
};

const STICK_LABELS: Record<StickIconProps["value"], string> = {
  100: "100-point stick",
  1000: "1000-point stick",
  5000: "5000-point stick",
  10000: "10000-point stick"
};

export function StickIcon({ value, count }: StickIconProps) {
  const visibleCount = Math.max(0, Math.floor(count));

  if (visibleCount === 0) {
    return null;
  }

  const label = STICK_LABELS[value];

  return (
    <span className={`stick-stack stick-stack-${value}`} aria-label={`${visibleCount} ${label}${visibleCount === 1 ? "" : "s"}`}>
      {Array.from({ length: visibleCount }, (_, index) => (
        <img
          alt={label}
          className="stick-image"
          decoding="async"
          draggable={false}
          height={112}
          key={`${value}-${index}`}
          loading="lazy"
          src={STICK_IMAGES[value]}
          width={480}
        />
      ))}
    </span>
  );
}
