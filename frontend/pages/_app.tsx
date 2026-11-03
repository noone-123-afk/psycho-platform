import type { AppProps } from 'next/app';
import { LanguageProvider } from '../context/LanguageContext';
import Header from '../components/Header';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <Header />
      <Component {...pageProps} />
    </LanguageProvider>
  );
}
