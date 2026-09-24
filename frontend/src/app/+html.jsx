import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#0A0A0C" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-title" content="CinePlay" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

                <ScrollViewStyleReset />
                <style dangerouslySetInnerHTML={{ __html: 'body { background-color: #0A0A0C; }' }} />
            </head>
            <body>{children}</body>
        </html>
    );
}