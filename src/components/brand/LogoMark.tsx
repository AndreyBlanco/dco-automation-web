export function LogoMark({ size = 40 }: { size?: number }) {
  const src = `${import.meta.env.BASE_URL}dcoLogo.svg`

  return (
    <img
      src={src}
      alt="logo"
      width={size}
      height="auto"
      decoding="async"
      draggable={false}
      aria-hidden
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}
