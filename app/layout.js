import PWARegister from '../components/PWARegister';
import "./globals.css";

export const metadata = {
  manifest: '/manifest.webmanifest',
  title: "GOSPEL TALES LIFESYTE",
  description: "Learn the Word • Test Your Knowledge • Grow in Christ"
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<PWARegister /></body></html>;
}
