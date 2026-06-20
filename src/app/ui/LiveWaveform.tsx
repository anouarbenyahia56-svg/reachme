import { useEffect, useRef, useState, memo } from "react";
import { cn } from "@/lib/utils";

/**
 * Live amplitude data from the microphone. Returns a sliding queue of
 * 0–1 values used as bar heights. The queue starts empty, then new bars
 * are appended on the right and scroll left immediately while recording.
 */
function useLiveFrequency(
  stream: MediaStream | null,
  visibleBars: number,
): { bars: number[]; offset: number } {
  const trackBars = visibleBars + 1;
  const [bars, setBars] = useState<number[]>(() =>
    new Array(trackBars).fill(0),
  );
  const [offset, setOffset] = useState(STEP_WIDTH / 2);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef(0);
  const barsRef = useRef<number[]>(new Array(trackBars).fill(0));
  const offsetRef = useRef(STEP_WIDTH / 2);
  const prevRef = useRef(0);
  const lastRef = useRef(0);
  const firstTickRef = useRef(true);

  useEffect(() => {
    barsRef.current = new Array(trackBars).fill(0);
    offsetRef.current = STEP_WIDTH / 2;
    prevRef.current = 0;
    firstTickRef.current = true;
    setBars(barsRef.current);
    setOffset(STEP_WIDTH / 2);

    if (!stream) return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.65;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    ctxRef.current = ctx;
    sourceRef.current = source;

    const dataArray = new Uint8Array(analyser.fftSize);

    const readLevel = () => {
      analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const centered = (dataArray[i] - 128) / 128;
        sum += centered * centered;
      }

      const rms = Math.sqrt(sum / dataArray.length);
      const target = Math.min(1, Math.max(0.08, rms * 10));
      const speed = target > prevRef.current ? 0.35 : 0.18;
      prevRef.current += (target - prevRef.current) * speed;
      return prevRef.current;
    };

    const tick = (now: number) => {
      const delta = lastRef.current ? now - lastRef.current : 16.7;
      lastRef.current = now;

      const level = readLevel();
      let nextOffset =
        offsetRef.current + (STEP_WIDTH * delta) / BAR_INTERVAL_MS;
      let nextBars = [...barsRef.current];

      if (firstTickRef.current) {
        firstTickRef.current = false;
        nextBars = [...nextBars.slice(1), level];
      }

      while (nextOffset >= STEP_WIDTH) {
        nextOffset -= STEP_WIDTH;
        nextBars = [...nextBars.slice(1), level];
      }

      offsetRef.current = nextOffset;
      barsRef.current = nextBars;
      setOffset(nextOffset);
      setBars(nextBars);

      rafRef.current = requestAnimationFrame(tick);
    };

    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      analyser.disconnect();
      ctx.close();
      ctxRef.current = null;
      sourceRef.current = null;
    };
  }, [stream, trackBars]);

  return { bars, offset };
}

const MIN_VISIBLE_BARS = 25;
const BAR_GAP = 4;
const REFERENCE_WAVEFORM_WIDTH = 180;
const BAR_INTERVAL_MS = 90;
const BAR_WIDTH =
  (REFERENCE_WAVEFORM_WIDTH - BAR_GAP * (MIN_VISIBLE_BARS - 1)) /
  MIN_VISIBLE_BARS;
const STEP_WIDTH = BAR_WIDTH + BAR_GAP;

export interface LiveWaveformProps {
  stream: MediaStream | null;
  className?: string;
}

export const LiveWaveform = memo(function LiveWaveform({
  stream,
  className,
}: LiveWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      setWidth(el.getBoundingClientRect().width);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, []);

  const visibleBars = Math.max(
    MIN_VISIBLE_BARS,
    Math.ceil(width / STEP_WIDTH),
  );
  const trackWidth = visibleBars * BAR_WIDTH + visibleBars * BAR_GAP;
  const { bars, offset } = useLiveFrequency(stream, visibleBars);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full flex-1 justify-center overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className="flex h-full shrink-0 items-center gap-[4px]"
        style={{
          width: `${trackWidth}px`,
          transform: `translateX(${STEP_WIDTH / 2 - offset}px)`,
          willChange: "transform",
        }}
      >
        {bars.map((h, i) => (
          <span
            key={i}
            style={{
              width: `${BAR_WIDTH}px`,
              height: h === 0 ? 0 : `${h * 100}%`,
            }}
            className="rounded-full bg-[hsl(var(--ink))]/55"
          />
        ))}
      </div>
    </div>
  );
});
