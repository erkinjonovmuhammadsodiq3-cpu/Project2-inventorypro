import { Headphones, Laptop, Smartphone, Monitor, Keyboard, Mouse, Watch, Tablet, Speaker, Camera, Printer, Usb, Package } from 'lucide-react'

const MAP = { Headphones, Laptop, Smartphone, Monitor, Keyboard, Mouse, Watch, Tablet, Speaker, Camera, Printer, Usb }

export default function ProductIcon({ name, size = 20, className = '' }) {
  const Icon = MAP[name] || Package
  return <Icon size={size} className={className} />
}
