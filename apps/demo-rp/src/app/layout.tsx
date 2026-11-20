import "./globals.css";
export const metadata = { title: "Bazar Local — Demo Partner", description: "Demo relying party for AmarID Universal ID" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="min-h-screen">
      <nav className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">B</div><span className="font-bold text-xl tracking-tight">Bazar<span className="text-[#006A4E]">Local</span></span></div>
          <div className="flex items-center gap-4"><a href="/" className="text-sm font-medium text-[#006A4E] hover:underline">Home</a><a href="/claim" className="text-sm font-medium text-slate-600 hover:underline">Claim coupon</a></div>
        </div>
      </nav>
      {children}
    </body></html>
  );
}
