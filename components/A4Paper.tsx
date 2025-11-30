import React from 'react';

export const A4Paper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-white text-black shadow-2xl p-[10mm] md:p-[20mm] w-full max-w-[210mm] min-h-[297mm] mx-auto transition-transform origin-top print:shadow-none print:w-full print:max-w-none print:min-h-0 print:p-[10mm] print:m-0 print:scale-100 print:overflow-visible">
       {/* Removed justify-between, content will now stack with fixed spacing */}
       <div className="h-full flex flex-col">
         {children}
       </div>
    </div>
  );
};