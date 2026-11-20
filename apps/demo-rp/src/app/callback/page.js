"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Callback;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
function Callback() {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const [code, setCode] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const c = searchParams.get("code");
        const e = searchParams.get("error");
        if (e) {
            setError(e);
            return;
        }
        if (c) {
            setCode(c);
        }
    }, [searchParams]);
    if (error)
        return (<div className="max-w-md mx-auto py-12 px-4 text-center">
      <div className="text-red-600 font-semibold mb-2">Authorization failed</div>
      <p className="text-sm text-slate-600">{error}</p>
      <button onClick={() => router.push("/")} className="mt-4 text-[#006A4E] underline">Return to store</button>
    </div>);
    if (!code)
        return (<div className="max-w-md mx-auto py-12 px-4 text-center">
      <div className="text-slate-600 font-semibold mb-2">Waiting for AmarID response…</div>
    </div>);
    return (<div className="max-w-md mx-auto py-12 px-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto mb-4"><lucide_react_1.CheckCircle2 className="h-6 w-6"/></div>
        <h2 className="text-xl font-bold">Signed in with Universal ID</h2>
        <p className="text-slate-600 text-sm mt-2">You authenticated on AmarID and approved sharing with Bazar Local.</p>
      </div>
      <div className="mt-8 p-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 mb-2"><lucide_react_1.Shield className="w-4 h-4 text-[#006A4E]"/><span className="text-sm font-semibold">Pairwise subject ID (Bazar Local)</span></div>
        <div className="text-xs font-mono text-slate-500 mb-3">sha256(identityId|bazar-local) — differs per partner</div>
        <button onClick={() => router.push("/claim")} className="w-full py-3 rounded-xl border border-[#006A4E] bg-[#006A4E] text-white font-semibold flex items-center justify-center gap-2">
          Claim your coupon <lucide_react_1.ArrowRight className="h-4 w-4"/>
        </button>
      </div>
    </div>);
}
