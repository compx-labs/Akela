type WolfMarkProps = {
  className?: string;
};

export default function WolfMark({ className = "h-7 w-7 shrink-0" }: WolfMarkProps) {
  return (
    <img
      src="/akela-logo.png"
      alt=""
      aria-hidden="true"
      className={`object-contain ${className}`}
    />
  );
}
