import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voice recording — the press-and-hold microphone primitive.
 *
 * Logic only; no UI. The owner presses the mic, the hook captures audio
 * from `MediaRecorder`, ticks a live timer, and on release hands back a
 * `{file, blob, url, duration}` triple. Cancel discards everything and
 * stops the mic tracks.
 *
 * The codec is chosen at runtime so the feature works across browsers:
 * Chrome/Firefox → `audio/webm;codecs=opus`, Safari → `audio/mp4`. The
 * file extension follows the actual mime so the recorded clip downloads
 * and plays back with the right container everywhere.
 *
 * A recorded voice clip is just an attachment — the caller mints a
 * `RequestAttachment{type:"voice",...}` from the returned `File` and
 * sends it through the existing reply path. No store or type changes.
 */

export type RecorderStatus =
  | "idle"
  | "starting"
  | "recording"
  | "paused"
  | "denied"
  | "error";

export interface RecordedVoice {
  /** A real `File` ready for `saveAttachmentFiles`. */
  file: File;
  blob: Blob;
  /** `blob:` URL previewing the clip. The caller owns its lifetime. */
  url: string;
  /** Duration in whole seconds. */
  duration: number;
  mime: string;
}

export interface VoiceRecorderOptions {
  /** Called when the user declines mic permission. */
  onDenied?: () => void;
  /** Called when recording fails for any other reason. */
  onError?: (message: string) => void;
}

interface MimeChoice {
  mime: string;
  ext: string;
}

/** Pick the best container/codec the current browser can record. */
function pickMime(): MimeChoice {
  const candidates: MimeChoice[] = [
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
    { mime: "audio/mp4", ext: "m4a" },
    { mime: "audio/mpeg", ext: "mp3" },
  ];
  if (typeof MediaRecorder === "undefined") {
    return { mime: "", ext: "webm" };
  }
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return { mime: "", ext: "webm" };
}

export function useVoiceRecorder(options: VoiceRecorderOptions = {}) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<MimeChoice>(pickMime());
  const startMarkRef = useRef(0);
  const pausedAtRef = useRef(0);
  const accumulatedRef = useRef(0);
  const tickerRef = useRef<number | null>(null);
  const optsRef = useRef(options);
  optsRef.current = options;

  const stopTicker = () => {
    if (tickerRef.current !== null) {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  };

  /** Release the mic and drop any in-flight chunks. Safe to call anytime. */
  const teardown = useCallback(() => {
    stopTicker();
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;
    // Recorder is left to finish on its own in `stop()`; only null out
    // the ref here so a stale teardown doesn't touch a finishing one.
    recorderRef.current = null;
  }, []);

  /** Clean up everything on unmount. */
  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  const startTicker = () => {
    stopTicker();
    startMarkRef.current = Date.now();
    accumulatedRef.current = 0;
    pausedAtRef.current = 0;
    setElapsed(0);
    tickerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMarkRef.current + accumulatedRef.current) / 1000));
    }, 250);
  };

  const tick = () => {
    if (tickerRef.current !== null) {
      setElapsed(Math.floor((Date.now() - startMarkRef.current + accumulatedRef.current) / 1000));
    }
  };

  /** Begin capturing. Resolves once recording is actually underway.
   *  Rejects (and toasts) on permission denial or unsupported hardware. */
  const start = useCallback(async (): Promise<void> => {
    if (status === "recording" || status === "starting") return;
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      optsRef.current.onError?.("Recording isn't supported in this browser.");
      return;
    }

    setStatus("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const e = err as DOMException;
      if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
        setStatus("denied");
        optsRef.current.onDenied?.();
      } else {
        setStatus("error");
        optsRef.current.onError?.("Couldn't access the microphone.");
      }
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const choice = mimeRef.current;
    let recorder: MediaRecorder;
    try {
      recorder = choice.mime
        ? new MediaRecorder(stream, { mimeType: choice.mime })
        : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStatus("error");
      optsRef.current.onError?.("Couldn't start recording.");
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorderRef.current = recorder;
    recorder.start(1000);
    startTicker();
    accumulatedRef.current = 0;
    pausedAtRef.current = 0;
    setStatus("recording");
  }, [status]);

  /** Stop and resolve the captured clip. Returns `null` if nothing was
   *  recorded (e.g. stopped before the first chunk landed). */
  const stop = useCallback((): Promise<RecordedVoice | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        teardown();
        setStatus("idle");
        resolve(null);
        return;
      }

      const choice = mimeRef.current;
      const duration = Math.max(
        0,
        Math.floor((Date.now() - startMarkRef.current + accumulatedRef.current) / 1000),
      );

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: choice.mime || "audio/webm",
        });
        teardown();
        setStatus("idle");
        if (blob.size === 0) {
          resolve(null);
          return;
        }
        const file = new File([blob], `voice-${Date.now()}.${choice.ext}`, {
          type: blob.type,
        });
        resolve({
          file,
          blob,
          url: URL.createObjectURL(file),
          duration,
          mime: blob.type,
        });
      };

      try {
        recorder.stop();
      } catch {
        teardown();
        setStatus("idle");
        resolve(null);
      }
    });
  }, [teardown]);

  /** Abandon the current recording without producing a clip. */
  const cancel = useCallback((): void => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        /* already stopped */
      }
    }
    teardown();
    chunksRef.current = [];
    accumulatedRef.current = 0;
    pausedAtRef.current = 0;
    setElapsed(0);
    setStatus("idle");
  }, [teardown]);

  /** Pause the active recording. The mic stays open but data stops
   *  flowing. Elapsed timer freezes. `requestData()` is called first
   *  to flush the encoder's internal buffer so no audio is lost. */
  const pause = useCallback((): void => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    stopTicker();
    pausedAtRef.current = Date.now();
    accumulatedRef.current += Date.now() - startMarkRef.current;
    // Flush any buffered audio before pausing — without this the last
    // chunk of the recording is silently dropped.
    try { recorder.requestData(); } catch { /* already stopped */ }
    recorder.pause();
    setStatus("paused");
  }, [stopTicker]);

  /** Resume a paused recording. Elapsed timer picks up where it left off. */
  const resume = useCallback((): void => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    startMarkRef.current = Date.now();
    setStatus("recording");
    tickerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMarkRef.current + accumulatedRef.current) / 1000));
    }, 250);
  }, []);

  /** Snapshot the current recording as a blob WITHOUT stopping the
   *  recorder. Used to create a preview URL while paused — the
   *  MediaRecorder keeps its state so resume() still works. */
  const getBlob = useCallback((): RecordedVoice | null => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive" || chunksRef.current.length === 0) return null;
    const choice = mimeRef.current;
    const duration = Math.max(
      0,
      Math.floor((Date.now() - startMarkRef.current + accumulatedRef.current) / 1000),
    );
    const blob = new Blob(chunksRef.current, {
      type: choice.mime || "audio/webm",
    });
    if (blob.size === 0) return null;
    const file = new File([blob], `voice-${Date.now()}.${choice.ext}`, {
      type: blob.type,
    });
    return {
      file,
      blob,
      url: URL.createObjectURL(file),
      duration,
      mime: blob.type,
    };
  }, []);

  const stream = streamRef.current;

  return { status, elapsed, start, stop, cancel, pause, resume, getBlob, stream };
}
