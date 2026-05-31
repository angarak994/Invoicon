import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../auth/ThemeContext";
import { AuthProvider } from "../auth/AuthProvider";

export const metadata: Metadata = {
  title: "Invoicon — Professional Invoice Generator for Every Business",
  description: "Create, customize, and send professional invoices instantly. 9 industry-specific templates for freelancers, restaurants, landlords, contractors, and more. Free forever plan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
