import React from "react";
import * as Icon from "@phosphor-icons/react";

const DriverAnalytics = ({ driverId, driverName, metrics }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-h2 text-charcoal-600">Analytics</h1>
        <p className="text-body-regular text-charcoal-400">{driverName} • Performance Analytics</p>
      </div>
      
      <div className="bg-grey-200 rounded-lg p-12 text-center shadow-soft-lift border border-grey-stroke">
        <Icon.ChartBar size={64} className="text-charcoal-400 mx-auto mb-4" />
        <p className="text-card-h2 text-charcoal-500 mb-2">Analytics Coming Soon</p>
        <p className="text-body-regular text-charcoal-400">
          We're building detailed analytics for your delivery performance
        </p>
      </div>
    </div>
  );
};

export default DriverAnalytics;