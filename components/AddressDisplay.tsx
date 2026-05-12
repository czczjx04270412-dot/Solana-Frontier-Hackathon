import { useState, useRef } from "react";

export default function AddressDisplay({
  address,
  className = "",
}: {
  address: string;
  className?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (ref.current && ref.current.scrollWidth > ref.current.clientWidth) {
      setShowTooltip(true);
    } else {
      // Even if not overflowing (short address), show tooltip on hover
      setShowTooltip(true);
    }
  };

  return (
    <span
      className="relative inline-block max-w-full overflow-visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        ref={ref}
        className={`block overflow-hidden text-ellipsis whitespace-nowrap ${className}`}
      >
        {address}
      </span>
      {showTooltip && (
        <span className="pointer-events-none absolute -top-2 left-1/2 z-[9999] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-line bg-panel px-3 py-1.5 text-xs text-slate-200 shadow-lg">
          {address}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-line" />
        </span>
      )}
    </span>
  );
}
