"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Claim;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
function Claim() {
    const [claimed, setClaimed] = (0, react_1.useState)(false);
    const [blocked, setBlocked] = (0, react_1.useState)(false);
    return (<div className="max-w-md mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <lucide_react_1.Tag className="w-8 h-8 rounded-lg bg-[#F42A41]/10 flex items-center justify-center text-[#F42A41] mx-auto mb-3"/>
        <h2 className="text-2xl font-bold">Claim BAZAR50</h2>
        <p className="text-slate-600 text-sm mt-2">One coupon per real person — enforced via Universal ID uniqueness token.</p>
      </div>

      {claimed && (<div className="rounded-2xl border border-green-100 bg-green-50 p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-green-600/20 flex items-center justify-center text-green-600 mx-auto mb-4">✓</div>
          <h3 className="text-lg font-bold text-green-900">Coupon claimed</h3>
          <p className="text-slate-600 text-sm mt-2">BAZAR50 applied to your account. One person, one coupon.</p>
        </div>)}
      {blocked && (<div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-red-600/20 flex items-center justify-center text-red-600 mx-auto mb-4">⚠</div>
          <h3 className="text-lg font-bold text-red-900">Already claimed</h3>
          <p className="text-slate-600 text-sm mt-2">This identity already claimed BAZAR50. Promo abuse prevented.</p>
        </div>)}
      {!claimed && !blocked && (<button onClick={() => setClaimed(true)} className="w-full py-4 rounded-xl border border-[#F42A41] bg-[#F42A41]/10 text-[#F42A41] font-semibold flex items-center justify-center gap-2">
          <lucide_react_1.Tag className="h-5 w-5"/> Claim BAZAR50
        </button>)}
      {!claimed && !blocked && (<p className="mt-6 text-center text-xs text-slate-500">Requires “Continue with Universal ID” login first.</p>)}
    </div>);
}
