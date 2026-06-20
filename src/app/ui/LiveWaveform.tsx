import { useEffect, useRef, useState, memo } from "react";
import { cn } from "@/lib/utils";

/**
 * Live frequency data from the microphone. Returns an array of 0–1
 * values representing the current amplitude of each frequency band.
 * Updates via requestAnimationFrame while the stream is active.
 */
function useLiveFrequency(
  stream: MediaStream | null,
  barCount: number,
): number[] {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 0.08),
  );
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef(0);
  const prevRef = useRef<number[]>(Array.from({ length: barCount }, () => 0.08));

  useEffect(() => {
    if (!stream) return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    ctxRef.current = ctx;
    sourceRef.current = source;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const prev = prevRef.current;

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);

      const binCount = dataArray.length;
      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * binCount);
        const raw = (dataArray[idx] ?? 0) / 255;
        const target = Math.min(1, raw * 1.3 + 0.06);
        const speed = target > prev[i] ? 0.4 : 0.15;
        prev[i] = prev[i] + (target - prev[i]) * speed;
      }

      setBars([...prev]);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      analyser.disconnect();
      ctx.close();
      ctxRef.current = null;
      sourceRef.current = null;
    };
  }, [stream, barCount]);

  return bars;
}

const BAR_COUNT = 40;

export interface LiveWaveformProps {
  stream: MediaStream | null;
  className?: string;
}

export const LiveWaveform = memo(function LiveWaveform({
  stream,
  className,
}: LiveWaveformProps) {
  const bars = useLiveFrequency(stream, BAR_COUNT);

  return (
    <div
      className={cn("flex h-full w-full items-center gap-[2px]", className)}
      aria-hidden="true"
    >
      {bars.map((h, i) => (
        <span
          key={i}
          style={{ height: `${Math.max(12, h * 100)}%` }}
          className="flex-1 rounded-full bg-[hsl(var(--ink))]/55"
        />
      ))}
    </div>
  );
});
