import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechRecognitionAlternative;
};

type SpeechRecognitionResultList = {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEvent = {
  readonly results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = {
  readonly error: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type SpeechRecognitionState = {
  error: string | null;
  isRecording: boolean;
  isSupported: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  transcript: string;
};

export function useSpeechRecognition(): SpeechRecognitionState {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");
  const manualStopRef = useRef(false);
  const recognitionErrorRef = useRef(false);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionConstructor = getSpeechRecognitionConstructor();
  const isSupported = recognitionConstructor !== null;

  const stopRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    manualStopRef.current = true;
    setIsRecording(false);
    try {
      recognition.stop();
    } catch {
      recognition.abort();
    }
  }, []);

  const startRecording = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setError(
        "Speech recognition is not supported in this browser. Use a current version of Chrome or Edge."
      );
      return;
    }

    recognitionRef.current?.abort();
    transcriptRef.current = "";
    manualStopRef.current = false;
    recognitionErrorRef.current = false;
    setTranscript("");
    setError(null);

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => {
      setIsRecording(true);
    };
    recognition.onresult = (event) => {
      const nextTranscript = Array.from(
        { length: event.results.length },
        (_, index) => event.results[index]?.[0]?.transcript ?? ""
      )
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      transcriptRef.current = nextTranscript;
      setTranscript(nextTranscript);
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted" && manualStopRef.current) {
        return;
      }
      recognitionErrorRef.current = true;
      setIsRecording(false);
      setError(getRecognitionErrorMessage(event.error));
    };
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      if (
        !recognitionErrorRef.current &&
        !transcriptRef.current.trim()
      ) {
        setError(
          "No speech was detected. Check your microphone and try recording again."
        );
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsRecording(false);
      setError(
        "The microphone could not be started. Check your browser permissions and try again."
      );
    }
  }, []);

  useEffect(
    () => () => {
      manualStopRef.current = true;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    },
    []
  );

  return {
    error,
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    transcript,
  };
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const speechWindow = window as SpeechRecognitionWindow;
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}

function getRecognitionErrorMessage(error: string): string {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied. Allow microphone access in your browser settings and try again.";
    case "audio-capture":
      return "No microphone is available. Connect or enable a microphone and try again.";
    case "no-speech":
      return "No speech was detected. Speak clearly and try recording again.";
    case "network":
      return "Speech recognition could not connect. Check your internet connection and try again.";
    default:
      return "Speech recognition stopped unexpectedly. Please try recording again.";
  }
}
