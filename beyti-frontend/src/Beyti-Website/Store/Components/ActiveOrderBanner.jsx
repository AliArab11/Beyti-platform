import { X, Package } from "@phosphor-icons/react";

const ActiveOrderBanner = ({ activeOrderCount, onTrack, onDismiss }) => {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md rounded-b-xl">
      <div className="max-w-[1440px] mx-auto px-8 py-2.5 flex items-center justify-between">
        
        {/* Left side */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <Package size={18} weight="fill" />
          </div>

          <p className="font-semibold text-sm">
            You have {activeOrderCount} active order{activeOrderCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onTrack}
            className="bg-white text-orange-600 px-3.5 py-1.5 rounded-lg font-semibold text-xs hover:bg-orange-50 transition-all"
          >
            Track Order
          </button>

          <button
            onClick={onDismiss}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveOrderBanner;
