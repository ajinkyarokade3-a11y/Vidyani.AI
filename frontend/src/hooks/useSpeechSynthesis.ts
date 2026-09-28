import { useCallback, useEffect, useRef, useState } from "react";

type SpeechSynthesisState = {
  cancel: () => void;
  error: string | null;
  isMuted: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  replay: (text?: string) => void;
  speak: (text: string) => void;
  toggleMute: () => void;
};

export function useSpeechSynthesis(): SpeechSynthesisState {
  const lastTextRef = useRef("");
  const isMutedRef = useRef(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  const cancel = useCallback(() => {
    if (!isSupported) {
      return;
    }
    window.speechSynthesis.cancel();
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      const normalizedText = text.trim();
      if (!normalizedText) {
        return;
      }
      lastTextRef.current = normalizedText;

      if (!isSupported || isMutedRef.current) {
        return;
      }

      window.speechSynthesis.cancel();
      setError(null);

      try {
        const utterance = new SpeechSynthesisUtterance(normalizedText);
        utterance.lang = "en-US";
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.onstart = () => {
          if (activeUtteranceRef.current === utterance) {
            setIsSpeaking(true);
          }
        };
        utterance.onend = () => {
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
            setIsSpeaking(false);
          }
        };
        utterance.onerror = (event) => {
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
            setIsSpeaking(false);
          }
          if (event.error !== "canceled" && event.error !== "interrupted") {
            setError(
              "Voice playback was interrupted. The interview can continue normally."
            );
          }
        };

        activeUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch {
        activeUtteranceRef.current = null;
        setIsSpeaking(false);
        setError(
          "Voice playback is unavailable. The interview can continue normally."
        );
      }
    },
    [isSupported]
  );

  const replay = useCallback(
    (text?: string) => {
      const replayText = text?.trim() || lastTextRef.current;
      if (replayText) {
        speak(replayText);
      }
    },
    [speak]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((currentValue) => {
      const nextValue = !currentValue;
      isMutedRef.current = nextValue;
      if (nextValue && isSupported) {
        window.speechSynthesis.cancel();
        activeUtteranceRef.current = null;
        setIsSpeaking(false);
      }
      return nextValue;
    });
  }, [isSupported]);

  useEffect(
    () => () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
      activeUtteranceRef.current = null;
    },
    [isSupported]
  );

  return {
    cancel,
    error,
    isMuted,
    isSpeaking,
    isSupported,
    replay,
    speak,
    toggleMute,
  };
}
