import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export const metadata: Metadata = {
title: "Nexora — CRM professionnel",
description:
"Gérez vos clients, prospects, ventes et activités commerciales avec Nexora Business Suite.",
};

export default function RootLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
return ( <html lang="fr"> <body className="min-h-screen bg-[#f6f7fb] text-slate-800 antialiased"> <Sidebar />

```
    <div className="min-h-screen md:ml-64">
      <Topbar />

      <main className="min-w-0">{children}</main>
    </div>
  </body>
</html>
```

);
}
