import './globals.css'

export const metadata = {
  title: 'New Kappabel Prototype',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}