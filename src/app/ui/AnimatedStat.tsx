interface AnimatedStatProps {
  value: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/** Displays a numeric stat value immediately without animation. */
export function AnimatedStat({ value, className, style }: AnimatedStatProps) {
  return (
    <div className={className} style={style}>
      {String(value)}
    </div>
  );
}
