import Image from 'next/image';

export function IcarusBrand({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center font-display tracking-[0.34em] ${
        compact ? 'gap-2 text-xs text-aether/55' : 'gap-2.5 text-sm text-aether'
      }`}
    >
      <Image
        src="/icon.svg"
        alt=""
        aria-hidden
        width={32}
        height={32}
        priority
        loading="eager"
        className={`${compact ? 'h-7 w-7' : 'h-8 w-8'} object-contain drop-shadow-[0_0_8px_rgba(192,132,252,0.32)]`}
      />
      <span className="hidden sm:inline">
        ICARUS <span className="text-star-olympian">ATLAS</span>
      </span>
    </span>
  );
}
