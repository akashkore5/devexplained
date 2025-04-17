import { SessionProvider } from "next-auth/react";
import "../styles/globals.css"; // Adjust path if you have a custom CSS file

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}