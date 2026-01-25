import React from 'react';

interface MobileWrapperProps {
  children: React.ReactNode;
}

export const MobileWrapper: React.FC<MobileWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-gray-100/50">
      <div className="w-full max-w-[430px] min-h-[100dvh] bg-background-light shadow-2xl overflow-hidden relative flex flex-col pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>
    </div>
  );
};
