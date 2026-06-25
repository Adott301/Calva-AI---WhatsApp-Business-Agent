import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Calva AI — Dashboard</title>
        <meta
          name="description"
          content="Calva AI powered by Gemini 2.5 Flash with RAG knowledge base"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}