"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, Loader2, Send, Square } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface VoiceParseResult {
  date?: string;
  subcategory_id?: string;
  title?: string;
  amount?: string;
  payment_method?: "card" | "cash" | null;
}

type PageState = "idle" | "recording" | "transcribing" | "processing";

const MAX_RECORDING_SECONDS = 15;

export default function VoiceEntryPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const parseTranscript = useCallback(async (text: string) => {
    setState("processing");
    setTranscript(text);

    try {
      const res = await fetch("/api/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcription: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to understand the expense");
        setState("idle");
        setTranscript("");
        return;
      }

      const result: VoiceParseResult = await res.json();
      sessionStorage.setItem("voiceResult", JSON.stringify(result));
      router.push("/add?from=voice");
    } catch {
      toast.error("Something went wrong");
      setState("idle");
      setTranscript("");
    }
  }, [router]);

  const transcribeAndParse = useCallback(async (audioBlob: Blob) => {
    setState("transcribing");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("/api/voice-transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to transcribe audio");
        setState("idle");
        return;
      }

      const { transcription } = await res.json();
      await parseTranscript(transcription);
    } catch {
      toast.error("Something went wrong");
      setState("idle");
    }
  }, [parseTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    clearTimer();
  }, [clearTimer]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick a supported mime type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });

        if (audioBlob.size > 0) {
          transcribeAndParse(audioBlob);
        } else {
          toast.error("No audio recorded. Please try again.");
          setState("idle");
        }
      };

      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        clearTimer();
        toast.error("Recording failed. Please try again.");
        setState("idle");
      };

      recorder.start(1000); // collect data every second for iOS compatibility
      setState("recording");
      setSeconds(0);
      setTranscript("");

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setSeconds(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        toast.error("Microphone access denied. Check your browser settings.");
      } else {
        toast.error("Could not access microphone.");
      }
      setState("idle");
    }
  }, [clearTimer, stopRecording, transcribeAndParse]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = textInput.trim();
    if (!text) return;
    setTextInput("");
    parseTranscript(text);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Processing / Transcribing state
  if (state === "transcribing" || state === "processing") {
    return (
      <>
        <Header title="Voice Entry" showBackButton />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">
              {state === "transcribing"
                ? "Transcribing audio..."
                : "Understanding your expense..."}
            </p>
            {transcript && (
              <p className="text-sm text-muted-foreground italic max-w-xs">
                &ldquo;{transcript}&rdquo;
              </p>
            )}
          </div>
        </main>
      </>
    );
  }

  // Idle and Recording states
  return (
    <>
      <Header title="Voice Entry" showBackButton />
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        {/* Example phrases (idle only) */}
        {state === "idle" && (
          <div className="text-center space-y-2 mb-4">
            <p className="text-sm text-muted-foreground">Try saying:</p>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground/70 italic">
                &ldquo;Compr&eacute; un helado por 50 pesos&rdquo;
              </p>
              <p className="text-sm text-muted-foreground/70 italic">
                &ldquo;Coffee at Starbucks, 89 pesos&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Recording indicator */}
        {state === "recording" && (
          <div className="text-center space-y-2 mb-4">
            <p className="text-lg font-semibold">Listening...</p>
            <p className="text-2xl font-mono tabular-nums text-muted-foreground">
              {formatTime(seconds)}
            </p>
          </div>
        )}

        {/* Mic button */}
        <div className="relative">
          {/* Pulse ring when recording */}
          {state === "recording" && (
            <div className="absolute inset-0 -m-2 rounded-full bg-red-500/20 animate-ping" />
          )}
          <Button
            variant="default"
            size="icon"
            className={`w-20 h-20 rounded-full transition-colors ${
              state === "recording"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-primary hover:bg-primary/90"
            }`}
            onClick={state === "recording" ? stopRecording : startRecording}
          >
            {state === "recording" ? (
              <Square className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
        </div>

        {/* Subtext */}
        {state === "idle" && (
          <p className="text-sm text-muted-foreground">Tap to start recording</p>
        )}
        {state === "recording" && (
          <p className="text-sm text-muted-foreground">Tap to stop</p>
        )}

        {/* Text input fallback */}
        {state === "idle" && (
          <div className="w-full max-w-sm mt-4">
            <div className="relative flex items-center gap-1 text-xs text-muted-foreground mb-2 justify-center">
              <span>or type what you spent</span>
            </div>
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Compré un café por 65 pesos"
                className="flex-1 h-11"
              />
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 shrink-0"
                disabled={!textInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
