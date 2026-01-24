import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (audioDataUrl: string, duration: number) => void;
  initialVoiceNote?: string | null;
  maxDuration?: number;
}

// Get the best supported audio MIME type for the browser
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/wav',
    '',  // Empty string means browser default
  ];
  
  for (const type of types) {
    if (type === '' || MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isOpen,
  onClose,
  onSave,
  initialVoiceNote = null,
  maxDuration = 60,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceNote, setVoiceNote] = useState<string | null>(initialVoiceNote);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [audioLevels, setAudioLevels] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldSaveRef = useRef<boolean>(true);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check and request permission when opening
  useEffect(() => {
    if (!isOpen) return;

    const checkAndRequestPermission = async () => {
      setError(null);
      setPermissionStatus('checking');

      // Check basic requirements
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Your browser does not support audio recording.');
        setPermissionStatus('denied');
        return;
      }

      if (!window.isSecureContext) {
        setError('Audio recording requires HTTPS. Please access via https:// or localhost.');
        setPermissionStatus('denied');
        return;
      }

      // Check permission status if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');

          if (result.state === 'denied') {
            setError('Microphone permission was denied. Please enable it in your browser settings:\n\niOS: Settings → Safari → Microphone\nAndroid: Tap the lock icon in the address bar → Permissions');
            return;
          }

          // Listen for permission changes
          result.onchange = () => {
            setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
            if (result.state === 'granted') {
              setError(null);
            }
          };

          // If permission can be requested, trigger the browser's permission dialog
          if (result.state === 'prompt') {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach(track => track.stop()); // Release immediately
              setPermissionStatus('granted');
            } catch {
              setPermissionStatus('denied');
              setError('Microphone permission was denied. Please allow access to record voice notes.');
            }
          }
        } catch {
          // permissions.query not supported for microphone, try getUserMedia directly
          setPermissionStatus('prompt');
        }
      } else {
        // Fallback: try to get permission directly
        setPermissionStatus('prompt');
      }
    };

    checkAndRequestPermission();
  }, [isOpen]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setVoiceNote(initialVoiceNote);
      setRecordingTime(0);
      setIsRecording(false);
      setIsPlayingPreview(false);
    }
  }, [isOpen, initialVoiceNote]);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setAudioLevels([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }, []);

  const startRecording = async () => {
    setError(null);
    
    // Check if browser supports required APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support audio recording. Please use a modern browser.');
      return;
    }

    // Check if MediaRecorder is supported
    if (typeof MediaRecorder === 'undefined') {
      setError('Audio recording is not supported on this device.');
      return;
    }

    // Check if running in secure context (HTTPS)
    if (!window.isSecureContext) {
      setError('Audio recording requires a secure connection (HTTPS).');
      return;
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      streamRef.current = stream;
      
      // Get the best supported MIME type
      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;
      
      // Create MediaRecorder with supported MIME type
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      shouldSaveRef.current = true;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (shouldSaveRef.current && audioChunksRef.current.length > 0) {
          // Use the actual MIME type from the recorder
          const actualMimeType = mimeTypeRef.current || mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            setVoiceNote(reader.result as string);
          };
          reader.readAsDataURL(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      // Set up audio analyser for real-time waveform
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Start visualizing audio levels
      const updateLevels = () => {
        if (!analyserRef.current || !isRecording) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Sample 9 frequency bands for visualization
        const bandSize = Math.floor(dataArray.length / 9);
        const levels = [];
        for (let i = 0; i < 9; i++) {
          const start = i * bandSize;
          const end = start + bandSize;
          let sum = 0;
          for (let j = start; j < end; j++) {
            sum += dataArray[j];
          }
          // Normalize to 0-1 range
          levels.push(sum / (bandSize * 255));
        }
        setAudioLevels(levels);
        
        animationFrameRef.current = requestAnimationFrame(updateLevels);
      };
      
      mediaRecorder.start(1000); // Collect data every second for better compatibility
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start the visualization loop
      updateLevels();

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Unable to access microphone:', err);
      
      // Provide user-friendly error messages
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone access denied. Please allow microphone permission in your browser settings and try again.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('Microphone is in use by another application. Please close other apps using the microphone.');
        } else if (err.name === 'OverconstrainedError') {
          setError('Microphone does not meet requirements. Please try a different microphone.');
        } else if (err.name === 'SecurityError') {
          setError('Microphone access blocked due to security settings. Please use HTTPS.');
        } else {
          setError(`Unable to access microphone: ${err.message}`);
        }
      } else {
        setError('Unable to access microphone. Please check your browser settings.');
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      shouldSaveRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Stop audio visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      setAudioLevels([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    shouldSaveRef.current = false;

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    cleanup();
    onClose();
  }, [isRecording, cleanup, onClose]);

  const deleteVoiceNote = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
    setVoiceNote(null);
    setRecordingTime(0);
  }, []);

  const togglePreviewPlayback = useCallback(() => {
    if (!voiceNote) return;

    if (isPlayingPreview && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      setIsPlayingPreview(false);
      return;
    }

    const audio = new Audio(voiceNote);
    previewAudioRef.current = audio;
    audio.play();
    setIsPlayingPreview(true);

    audio.onended = () => {
      setIsPlayingPreview(false);
    };
  }, [voiceNote, isPlayingPreview]);

  const handleDone = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    if (voiceNote) {
      onSave(voiceNote, recordingTime);
    }
    cleanup();
    onClose();
  }, [isRecording, voiceNote, recordingTime, stopRecording, onSave, cleanup, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto bg-ink/5 backdrop-blur-[2px]">
      <div
        className="absolute inset-0 z-0"
        onClick={() => !isRecording && cancelRecording()}
      />
      <div className="relative w-full bg-paper/95 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white/40 pb-12 pt-8 px-6 transition-all duration-300 transform translate-y-0">
        <div className="w-12 h-1.5 bg-ink/10 rounded-full mx-auto mb-8" />

        {/* Title */}
        <h3 className="text-center text-ink font-bold text-lg mb-4">
          {voiceNote && !isRecording ? 'Preview Recording' : isRecording ? 'Recording...' : 'Voice Note'}
        </h3>

        {/* Permission/Error message */}
        {permissionStatus === 'checking' && (
          <div className="mx-4 mb-4 p-4 bg-ink/5 border border-ink/10 rounded-xl flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
            <p className="text-ink/60 text-sm">Checking microphone permission...</p>
          </div>
        )}
        
        {error && (
          <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 text-xl shrink-0">mic_off</span>
              <div className="flex-1">
                <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
                {permissionStatus === 'denied' && (
                  <button
                    onClick={async () => {
                      setError(null);
                      setPermissionStatus('checking');
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        stream.getTracks().forEach(track => track.stop());
                        setPermissionStatus('granted');
                      } catch {
                        setPermissionStatus('denied');
                        setError('Microphone permission still denied. Please check your browser/system settings.');
                      }
                    }}
                    className="mt-3 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Request Permission Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Waveform */}
        <div className="flex items-center justify-center gap-[3px] h-16 mb-6 px-8">
          {isRecording ? (
            // Real-time audio visualization
            audioLevels.map((level, index) => {
              // Min height 8px, max height 64px, responsive to audio level
              const minHeight = 8;
              const maxHeight = 64;
              const height = minHeight + level * (maxHeight - minHeight);
              // Opacity based on level (more active = more opaque)
              const opacity = 0.3 + level * 0.7;
              return (
                <div
                  key={index}
                  className="w-2 bg-accent rounded-full transition-all duration-75"
                  style={{
                    height: `${height}px`,
                    opacity: opacity,
                  }}
                />
              );
            })
          ) : voiceNote ? (
            <>
              <div className="w-1.5 bg-green-400/30 rounded-full h-4" />
              <div className="w-1.5 bg-green-400/40 rounded-full h-8" />
              <div className="w-1.5 bg-green-400/50 rounded-full h-12" />
              <div className="w-1.5 bg-green-500 rounded-full h-16" />
              <div className="w-1.5 bg-green-400/80 rounded-full h-10" />
              <div className="w-1.5 bg-green-400/60 rounded-full h-14" />
              <div className="w-1.5 bg-green-400/40 rounded-full h-6" />
              <div className="w-1.5 bg-green-400/50 rounded-full h-12" />
              <div className="w-1.5 bg-green-400/30 rounded-full h-5" />
            </>
          ) : (
            <>
              <div className="w-1.5 bg-ink/10 rounded-full h-4" />
              <div className="w-1.5 bg-ink/10 rounded-full h-8" />
              <div className="w-1.5 bg-ink/10 rounded-full h-12" />
              <div className="w-1.5 bg-ink/20 rounded-full h-16" />
              <div className="w-1.5 bg-ink/10 rounded-full h-10" />
              <div className="w-1.5 bg-ink/10 rounded-full h-14" />
              <div className="w-1.5 bg-ink/10 rounded-full h-6" />
              <div className="w-1.5 bg-ink/10 rounded-full h-12" />
              <div className="w-1.5 bg-ink/10 rounded-full h-5" />
            </>
          )}
        </div>

        {/* Timer */}
        <div className="text-center mb-4">
          <span className="font-sans font-bold text-3xl text-ink tracking-widest tabular-nums drop-shadow-sm">
            {formatTime(recordingTime)}
          </span>
          {isRecording && (
            <span className="text-ink/40 text-sm ml-2">/ {formatTime(maxDuration)}</span>
          )}
        </div>

        {/* Progress bar */}
        {isRecording && (
          <div className="w-full max-w-xs mx-auto mb-8 h-1 bg-ink/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-dusty-rose transition-all duration-1000 ease-linear"
              style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
            />
          </div>
        )}

        {/* Preview controls */}
        {voiceNote && !isRecording && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={togglePreviewPlayback}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                isPlayingPreview
                  ? 'bg-green-500 text-white'
                  : 'bg-ink/5 text-ink hover:bg-ink/10'
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {isPlayingPreview ? 'pause' : 'play_arrow'}
              </span>
              <span className="text-sm font-medium">
                {isPlayingPreview ? 'Pause' : 'Play'}
              </span>
            </button>
            <button
              onClick={deleteVoiceNote}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all"
            >
              <span className="material-symbols-outlined text-xl">delete</span>
              <span className="text-sm font-medium">Delete</span>
            </button>
          </div>
        )}

        {/* Main Controls */}
        <div className="flex items-center justify-between max-w-xs mx-auto px-4">
          <button
            className="text-ink/40 font-bold text-xs uppercase tracking-widest hover:text-ink transition-colors py-4"
            onClick={cancelRecording}
          >
            Cancel
          </button>

          <div
            className={`relative group ${permissionStatus === 'granted' || isRecording ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onClick={() => {
              if (permissionStatus !== 'granted' && !isRecording) {
                setError('Please grant microphone permission first.');
                return;
              }
              if (isRecording) {
                stopRecording();
              } else if (!voiceNote) {
                startRecording();
              }
            }}
          >
            {isRecording && (
              <>
                <div className="absolute inset-0 bg-dusty-rose rounded-full animate-ping opacity-40" />
                <div className="absolute inset-0 bg-dusty-rose rounded-full animate-pulse opacity-60 delay-75" />
              </>
            )}
            <button
              className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transform transition-transform active:scale-95 border-4 border-white/40 ${
                voiceNote && !isRecording ? 'bg-green-500' : permissionStatus !== 'granted' && !isRecording ? 'bg-ink/30' : 'bg-dusty-rose'
              }`}
              disabled={voiceNote !== null && !isRecording}
            >
              {isRecording ? (
                <div className="w-6 h-6 bg-white rounded-sm shadow-sm" />
              ) : voiceNote ? (
                <span className="material-symbols-outlined text-white text-3xl">check</span>
              ) : (
                <span className="material-symbols-outlined text-white text-3xl">mic</span>
              )}
            </button>
          </div>

          <button
            className="text-accent font-bold text-xs uppercase tracking-widest hover:text-accent/80 transition-colors py-4 disabled:opacity-30 disabled:text-ink/40"
            onClick={handleDone}
            disabled={!voiceNote && !isRecording}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
