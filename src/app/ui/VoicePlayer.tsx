import { useEffect, useMemo, useRef, useState, memo, type RefObject } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeShort } from "../store/format";

/**
 * Voice message player — the inline waveform row that appears in a
 * conversation bubble when a voice clip is sent or received.
 *
 * Layout, left to right: a large circular filled play button, waveform
 * bars (varied natural heights) that fill as playback advances, and the
 * duration (noticeably larger than the timestamp) at the right. When a
 * `time` is supplied, a small muted timestamp sits beneath the duration
 * at the bubble's bottom-right. `side` flips the palette so it reads
 * correctly on the owner's (dark) and sender's (light) bubbles.
 *
 * The waveform is decoded once per clip via `AudioContext` and sampled
 * into a fixed number of bars. If decoding fails (rare codec, tainted
 * data), a calm synthetic bar set is used so the UI is never empty.
 */

const BAR_COUNT = 25;
const MIN_BARS = 8;

export function useWaveform(url: string | undefined): number[] {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    if (!url) {
      setBars([]);
      return;
    }
    let cancelled = false;

    const fallback = () => {
      if (cancelled) return;
      setBars(
        Array.from({ length: BAR_COUNT }, (_, i) => {
          const t = i / (BAR_COUNT - 1);
          return 0.35 + 0.55 * Math.sin(t * Math.PI) * (0.7 + 0.3 * Math.random());
        }),
      );
    };

    const decode = async () => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) {
          fallback();
          return;
        }
        const ctx = new AudioCtx();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        ctx.close();
        if (cancelled) return;

        const data = audioBuffer.getChannelData(0);
        const samplesPerBar = Math.floor(data.length / BAR_COUNT);
        if (samplesPerBar === 0) {
          fallback();
          return;
        }
        const peaks: number[] = [];
        let max = 0.0001;
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          const start = i * samplesPerBar;
          for (let j = 0; j < samplesPerBar; j++) {
            sum += Math.abs(data[start + j] || 0);
          }
          const avg = sum / samplesPerBar;
          peaks.push(avg);
          if (avg > max) max = avg;
        }
        setBars(peaks.map((p) => Math.max(0.08, p / max)));
      } catch {
        fallback();
      }
    };

    decode();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return bars.length >= MIN_BARS ? bars : [];
}

function formatClock(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

export interface VoicePlayerProps {
  url: string;
  duration?: number;
  side: "left" | "right";
  /** Optional send timestamp rendered below the duration, bottom-right. */
  time?: string;
}

export const VoicePlayer = memo(function VoicePlayer({
  url,
  duration,
  side,
  time,
}: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [resolvedDuration, setResolvedDuration] = useState(duration ?? 0);
  const [isDragging, setIsDragging] = useState(false);

  const bars = useWaveform(url);
  const dark = side === "right";

  const effectiveBars = useMemo(
    () => (bars.length ? bars : Array.from({ length: BAR_COUNT }, () => 0.5)),
    [bars],
  );

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onCanPlay = () => {
      if (isFinite(el.duration) && el.duration > 0) {
        setResolvedDuration(el.duration);
      }
    };
    el.addEventListener("loadedmetadata", onCanPlay);
    el.addEventListener("durationchange", onCanPlay);
    return () => {
      el.removeEventListener("loadedmetadata", onCanPlay);
      el.removeEventListener("durationchange", onCanPlay);
    };
  }, [url]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  };

  const seekFromClientX = (clientX: number) => {
    const el = audioRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const dur = el.duration && isFinite(el.duration) ? el.duration : resolvedDuration;
    el.currentTime = fraction * dur;
    setCurrent(fraction * dur);
  };

  const onTrackPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    seekFromClientX(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => seekFromClientX(e.clientX);
    const onUp = () => setIsDragging(false);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, resolvedDuration]);

  const progress =
    resolvedDuration > 0 ? Math.min(1, current / resolvedDuration) : 0;
  const playedBars = Math.round(progress * effectiveBars.length);

  const durationLabel =
    isPlaying || current > 0
      ? formatClock(current)
      : formatClock(resolvedDuration);

  return (
    <div className="relative flex w-full items-center gap-2.5 py-3">
      <audio
        ref={audioRef as RefObject<HTMLAudioElement>}
        src={url}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrent(0);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
            setResolvedDuration(e.currentTarget.duration);
          }
        }}
        className="hidden"
      />

      {/* Large circular filled play button. */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
          dark
            ? "bg-[hsl(var(--page))] text-[hsl(var(--ink))] hover:bg-[hsl(var(--page))]/85"
            : "bg-[hsl(var(--ink))] text-[hsl(var(--page))] hover:bg-[hsl(var(--ink))]/85",
        )}
      >
        {isPlaying ? (
          <Pause size={15} strokeWidth={2} />
        ) : (
          <Play size={15} strokeWidth={2} className="ml-0.5" />
        )}
      </button>

      {/* Waveform bars — varied natural heights, fill as it plays. */}
      <div
        ref={trackRef}
        onPointerDown={onTrackPointerDown}
        className="flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-[4px]"
        role="slider"
        tabIndex={0}
        aria-label="Seek voice message"
        aria-valuemin={0}
        aria-valuemax={Math.round(resolvedDuration) || 0}
        aria-valuenow={Math.round(current)}
        onKeyDown={(e) => {
          const el = audioRef.current;
          if (!el) return;
          const step = (resolvedDuration || 1) * 0.05;
          if (e.key === "ArrowLeft") {
            el.currentTime = Math.max(0, el.currentTime - step);
          } else if (e.key === "ArrowRight") {
            el.currentTime = Math.min(resolvedDuration, el.currentTime + step);
          }
        }}
      >
        {effectiveBars.map((h, i) => {
          const active = i < playedBars;
          return (
            <span
              key={i}
              style={{ height: `${Math.max(18, h * 90)}%` }}
              className={cn(
                "flex-1 rounded-full transition-colors duration-150",
                dark
                  ? active
                    ? "bg-[hsl(var(--page))]"
                    : "bg-[hsl(var(--page))]/35"
                  : active
                    ? "bg-[hsl(var(--ink))]"
                    : "bg-[hsl(var(--ink))]/25",
              )}
            />
          );
        })}
      </div>

      {/* Duration — vertically centred with the waveform row. */}
      <span
        className={cn(
          "shrink-0 pl-0.5 text-[13px] font-medium leading-none tabular-nums",
          dark ? "text-[hsl(var(--page))]/90" : "text-[hsl(var(--ink))]",
        )}
      >
        {durationLabel}
      </span>

      {/* Timestamp — anchored to the bottom-right of the bubble. */}
      {time && (
        <span
          className={cn(
            "absolute -bottom-0.5 right-1 text-[11px] leading-none tabular-nums",
            dark ? "text-[hsl(var(--page))]/55" : "text-[hsl(var(--ink-subtle))]",
          )}
        >
          {timeShort(time)}
        </span>
      )}
    </div>
  );
});
