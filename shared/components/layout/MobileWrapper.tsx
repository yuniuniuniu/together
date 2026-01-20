import React from 'react';

interface MobileWrapperProps {
  children: React.ReactNode;
}

export const MobileWrapper: React.FC<MobileWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex justify-center bg-gray-100/50">
      <div className="w-full max-w-[430px] min-h-screen bg-background-light shadow-2xl overflow-hidden relative flex flex-col">
        {children}
      </div>
    </div>
  );
};
