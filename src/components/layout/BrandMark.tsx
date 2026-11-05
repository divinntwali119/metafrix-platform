interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 32, className = "" }: BrandMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/metafrix-fox.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`object-contain ${className}`.trim()}
    />
  );
}
