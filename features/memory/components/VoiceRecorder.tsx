import React from 'react';

interface VoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish?: () => void;
  duration?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isOpen,
  onClose,
  onFinish,
  duration = '00:15',
}) => {
  if (!isOpen) return null;

  const handleFinish = () => {
    onFinish?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto bg-ink/5 backdrop-blur-[2px]">
      <div className="absolute inset-0 z-0" onClick={onClose} />
      <div className="relative w-full bg-paper/95 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white/40 pb-12 pt-8 px-6 transition-all duration-300 transform translate-y-0">
        <div className="w-12 h-1.5 bg-ink/10 rounded-full mx-auto mb-10" />

        {/* Waveform */}
        <div className="flex items-center justify-center gap-[3px] h-16 mb-8 px-8">
          <div className="w-1.5 bg-accent/30 rounded-full h-4 animate-[pulse_1s_ease-in-out_infinite]" />
          <div className="w-1.5 bg-accent/40 rounded-full h-8 animate-[pulse_1.2s_ease-in-out_infinite] delay-75" />
          <div className="w-1.5 bg-accent/50 rounded-full h-12 animate-[pulse_0.8s_ease-in-out_infinite] delay-100" />
          <div className="w-1.5 bg-accent rounded-full h-16 animate-[pulse_1.5s_ease-in-out_infinite]" />
          <div className="w-1.5 bg-accent/80 rounded-full h-10 animate-[pulse_1.1s_ease-in-out_infinite] delay-150" />
          <div className="w-1.5 bg-accent/60 rounded-full h-14 animate-[pulse_0.9s_ease-in-out_infinite] delay-75" />
          <div className="w-1.5 bg-accent/40 rounded-full h-6 animate-[pulse_1.3s_ease-in-out_infinite]" />
          <div className="w-1.5 bg-accent/50 rounded-full h-12 animate-[pulse_1s_ease-in-out_infinite] delay-200" />
          <div className="w-1.5 bg-accent/30 rounded-full h-5 animate-[pulse_1.4s_ease-in-out_infinite] delay-100" />
        </div>

        {/* Timer */}
        <div className="text-center mb-10">
          <span className="font-sans font-bold text-3xl text-ink tracking-widest tabular-nums drop-shadow-sm">
            {duration}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between max-w-xs mx-auto px-4">
          <button
            className="text-ink/40 font-bold text-xs uppercase tracking-widest hover:text-ink transition-colors py-4"
            onClick={onClose}
          >
            Cancel
          </button>

          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-dusty-rose rounded-full animate-ping opacity-40" />
            <div className="absolute inset-0 bg-dusty-rose rounded-full animate-pulse opacity-60 delay-75" />
            <button className="relative w-20 h-20 bg-dusty-rose rounded-full flex items-center justify-center shadow-lg transform transition-transform active:scale-95 border-4 border-white/40">
              <div className="w-6 h-6 bg-white rounded-sm shadow-sm" />
            </button>
          </div>

          <button
            className="text-ink/40 font-bold text-xs uppercase tracking-widest hover:text-ink transition-colors py-4"
            onClick={handleFinish}
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
};
