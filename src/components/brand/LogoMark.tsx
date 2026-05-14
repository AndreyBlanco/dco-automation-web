export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="40" height="40" rx="10" fill="var(--color-primary)" />
      <path
        d="M20 8c-3.5 0-6 2.2-7 5.5-.8 2.5-.5 5.5 1 9.5 1.2 3.2 2.5 5.5 4 8 .6 1 1.8 1.6 3 1.6s2.4-.6 3-1.6c1.5-2.5 2.8-4.8 4-8 1.5-4 1.8-7 1-9.5-1-3.3-3.5-5.5-7-5.5Z"
        fill="#fff"
        fillOpacity="0.95"
      />
      <path
        d="M14 14c1.2 3.5 3.5 6 6 6s4.8-2.5 6-6"
        stroke="var(--color-primary)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
