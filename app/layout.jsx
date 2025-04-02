import "./globals.css"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>TEA Protocol | Decentralized Finance on the TEA Blockchain</title>
        <meta
          name="description"
          content="TEA Protocol is a decentralized finance platform built on the TEA blockchain, enabling staking, governance, and community participation."
        />
        <meta
          name="keywords"
          content="TEA Protocol, DeFi, blockchain, staking, governance, cryptocurrency, TEA token, decentralized finance"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#1A5F7A" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body>{children}</body>
    </html>
  )
}



import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
