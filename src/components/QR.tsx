import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Renders a QR code as an <img>. Uses brand colors (onyx on bone).
export function QR({ value, size = 160 }: { value: string; size?: number }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: '#0A0A0C', light: '#F5F0E8' },
    })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(''))
    return () => {
      alive = false
    }
  }, [value, size])

  return src ? (
    <img src={src} width={size} height={size} alt="QR ticket" className="rounded" />
  ) : (
    <div style={{ width: size, height: size }} className="bg-white/5" />
  )
}
