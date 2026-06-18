import { useEffect, useMemo, useRef, useState, memo, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Download,
  ImageIcon,
  FileText,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  Presentation,
  Archive,
  FileCode,
  File,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "../store/format";
import type { RequestAttachment } from "../types";

export type AttachmentKind =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "archive"
  | "code"
  | "text"
  | "other";

export interface AttachmentMeta {
  kind: AttachmentKind;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  extension: string;
}

function getExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function getMimeFromDataURL(url: string): string {
  if (!url.startsWith("data:")) return "";
  const match = url.match(/^data:([^;]+)/);
  return match?.[1] ?? "";
}

const TYPE_STYLES: Record<
  AttachmentKind,
  { label: string; icon: LucideIcon; colorClass: string }
> = {
  image: { label: "Image", icon: ImageIcon, colorClass: "text-blue-500" },
  video: { label: "Video", icon: FileVideo, colorClass: "text-violet-500" },
  audio: { label: "Audio", icon: FileAudio, colorClass: "text-emerald-500" },
  pdf: { label: "PDF", icon: FileText, colorClass: "text-red-500" },
  document: { label: "Document", icon: FileText, colorClass: "text-blue-600" },
  spreadsheet: { label: "Spreadsheet", icon: FileSpreadsheet, colorClass: "text-green-600" },
  presentation: { label: "Presentation", icon: Presentation, colorClass: "text-orange-500" },
  archive: { label: "Archive", icon: Archive, colorClass: "text-yellow-500" },
  code: { label: "Code", icon: FileCode, colorClass: "text-indigo-500" },
  text: { label: "Text", icon: FileText, colorClass: "text-slate-500" },
  other: { label: "File", icon: File, colorClass: "text-gray-500" },
};

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "heic",
  "heif",
  "svg",
  "bmp",
  "tiff",
  "tif",
]);

const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "m4a",
  "ogg",
  "aac",
  "flac",
  "wma",
  "opus",
  "aiff",
  "au",
  "ra",
  "ram",
]);

const VIDEO_EXTENSIONS = new Set([
  "avi",
  "flv",
  "wmv",
  "m4v",
  "mpeg",
  "mpg",
  "3gp",
  "ogv",
]);

const AMBIGUOUS_MEDIA_EXTENSIONS = new Set([
  "mp4",
  "mov",
  "webm",
  "mkv",
]);

const PDF_EXTENSIONS = new Set(["pdf"]);

const DOCUMENT_EXTENSIONS = new Set(["doc", "docx"]);

const SPREADSHEET_EXTENSIONS = new Set([
  "xls",
  "xlsx",
  "csv",
  "numbers",
]);

const PRESENTATION_EXTENSIONS = new Set(["ppt", "pptx", "key"]);

const ARCHIVE_EXTENSIONS = new Set([
  "zip",
  "rar",
  "tar",
  "gz",
  "tgz",
  "bz2",
  "7z",
]);

const CODE_EXTENSIONS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "json",
  "xml",
  "yaml",
  "yml",
  "sql",
  "php",
  "rb",
  "go",
  "rs",
  "swift",
  "kt",
  "java",
  "c",
  "cpp",
  "h",
  "cs",
  "sh",
  "bash",
  "zsh",
  "ps1",
  "vue",
  "svelte",
]);

const TEXT_EXTENSIONS = new Set(["txt", "rtf", "md"]);

/**
 * Detect whether a media container file actually contains a video track.
 * Used for ambiguous extensions (mp4, mov, webm, mkv) where the extension
 * alone cannot tell audio from video.
 */
function detectMediaType(file: File): Promise<"video" | "audio"> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    const timer = window.setTimeout(() => {
      cleanup();
      resolve("audio");
    }, 3000);

    video.onloadedmetadata = () => {
      window.clearTimeout(timer);
      cleanup();
      resolve(video.videoWidth > 0 || video.videoHeight > 0 ? "video" : "audio");
    };

    video.onerror = () => {
      window.clearTimeout(timer);
      cleanup();
      resolve("audio");
    };
  });
}

function getAttachmentKind(attachment: RequestAttachment): AttachmentKind {
  const name = attachment.name ?? "";
  const ext = getExtension(name);
  const mime = getMimeFromDataURL(attachment.url ?? "");

  // Extension-first detection is more reliable for user-downloaded files,
  // where the browser MIME type is often misreported.
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (PDF_EXTENSIONS.has(ext)) return "pdf";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  if (AMBIGUOUS_MEDIA_EXTENSIONS.has(ext)) {
    // These containers can hold either audio or video. Trust the actual detected type.
    if (attachment.type === "voice") return "audio";
    if (attachment.type === "video") return "video";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
    return "video";
  }
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (DOCUMENT_EXTENSIONS.has(ext)) return "document";
  if (SPREADSHEET_EXTENSIONS.has(ext)) return "spreadsheet";
  if (PRESENTATION_EXTENSIONS.has(ext)) return "presentation";
  if (ARCHIVE_EXTENSIONS.has(ext)) return "archive";
  if (CODE_EXTENSIONS.has(ext)) return "code";
  if (TEXT_EXTENSIONS.has(ext)) return "text";

  // Fallback to MIME / stored type when extension is missing or unknown.
  if (attachment.type === "image" || mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (attachment.type === "voice" || mime.startsWith("audio/")) return "audio";
  if (attachment.type === "video" || mime.startsWith("video/")) return "video";
  if (mime.startsWith("text/")) return "text";

  return "other";
}

export function getAttachmentMeta(attachment: RequestAttachment): AttachmentMeta {
  const name = attachment.name ?? "";
  const ext = getExtension(name);
  const kind = getAttachmentKind(attachment);
  const style = TYPE_STYLES[kind];
  const Icon = style.icon;
  const label = ext.toUpperCase() || "FILE";

  return {
    kind,
    label,
    icon: <Icon size={18} strokeWidth={1.6} />,
    colorClass: style.colorClass,
    extension: ext.toUpperCase() || label.toUpperCase(),
  };
}

export async function getInitialAttachmentType(
  file: File,
): Promise<RequestAttachment["type"]> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (file.type.startsWith("image/") || IMAGE_EXTENSIONS.has(ext)) return "image";
  if (file.type.startsWith("audio/") || AUDIO_EXTENSIONS.has(ext)) return "voice";
  if (AMBIGUOUS_MEDIA_EXTENSIONS.has(ext)) {
    return (await detectMediaType(file)) === "video" ? "video" : "voice";
  }
  if (file.type.startsWith("video/") || VIDEO_EXTENSIONS.has(ext)) return "video";
  return "file";
}

export function downloadAttachment(attachment: RequestAttachment): void {
  if (!attachment.url) return;
  const a = document.createElement("a");
  a.href = attachment.url;
  a.download = attachment.name || "download";
  a.click();
}

async function urlToArrayBuffer(url: string): Promise<ArrayBuffer> {
  if (url.startsWith("data:")) {
    const base64 = url.split(",")[1] ?? "";
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  const response = await fetch(url);
  return response.arrayBuffer();
}

async function urlToText(url: string): Promise<string> {
  if (url.startsWith("data:")) {
    const text = extractTextContent(url);
    if (text !== null) return text;
    const base64 = url.split(",")[1] ?? "";
    return atob(base64);
  }
  const response = await fetch(url);
  return response.text();
}

function extractTextContent(url: string): string | null {
  if (!url.startsWith("data:text")) return null;
  const base64Match = url.match(/^data:text\/[^;]+;base64,(.+)$/);
  if (base64Match) {
    try {
      return atob(base64Match[1]);
    } catch {
      return null;
    }
  }
  const plainMatch = url.match(/^data:text\/[^,]+,(.*)$/);
  if (plainMatch) return decodeURIComponent(plainMatch[1]);
  return null;
}

export const AttachmentChip = memo(function AttachmentChip({
  attachment,
  onRemove,
  onClick,
  showDownload = true,
}: {
  attachment: RequestAttachment;
  onRemove?: () => void;
  onClick?: () => void;
  showDownload?: boolean;
}) {
  const meta = getAttachmentMeta(attachment);
  const size = attachment.size ? formatBytes(attachment.size) : undefined;

  if (meta.kind === "image") {
    return (
      <div className="group relative h-14 w-14 min-h-14 max-h-14 min-w-14 max-w-14 shrink-0 basis-14 overflow-hidden rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] shadow-sm transition-colors duration-200 hover:border-[hsl(var(--ink))]/30">
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="block h-full w-full focus:outline-none"
            aria-label={attachment.name || "Image"}
          >
        <img
          src={attachment.url}
          alt={attachment.name || "Image"}
          className="h-full w-full object-cover"
          draggable={false}
          loading="lazy"
          decoding="async"
        />
          </button>
        ) : (
          <img
            src={attachment.url}
            alt={attachment.name || "Image"}
            className="h-full w-full object-cover"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        )}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove image"
            className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--ink))]/70 text-[hsl(var(--page))] shadow-sm transition-colors hover:bg-[hsl(var(--ink))]"
          >
            <X size={12} strokeWidth={1.6} />
          </button>
        )}
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
      className={cn(
        "group relative flex h-14 w-[280px] min-w-[280px] max-w-[280px] shrink-0 basis-[280px] items-center gap-3 overflow-hidden rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-4 py-3 shadow-sm transition-colors transition-shadow duration-200",
        onClick && "cursor-pointer hover:border-[hsl(var(--ink))]/30 hover:shadow-md",
      )}
    >
      <span className={cn("shrink-0 transition-colors", meta.colorClass)}>
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium leading-tight text-[hsl(var(--ink))]">
          {attachment.name || meta.label}
        </p>
        <p className="truncate text-[11px] leading-tight text-[hsl(var(--ink-subtle))]">
          {meta.label}
          {size && ` · ${size}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {showDownload && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadAttachment(attachment);
            }}
            aria-label={`Download ${attachment.name || meta.label}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[hsl(var(--ink-muted))] transition-colors hover:bg-[hsl(var(--rule))]/50 hover:text-[hsl(var(--ink))]"
          >
            <Download size={14} strokeWidth={1.6} />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={`Remove ${attachment.name || meta.label}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[hsl(var(--ink-muted))] transition-colors hover:bg-[hsl(var(--rule))]/50 hover:text-[hsl(var(--ink))]"
          >
            <X size={14} strokeWidth={1.6} />
          </button>
        )}
      </div>
    </div>
  );
});

export function AttachmentViewer({
  attachment,
  open,
  onClose,
}: {
  attachment: RequestAttachment | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  const meta = useMemo(
    () => (attachment ? getAttachmentMeta(attachment) : null),
    [attachment],
  );

  if (!open || !attachment || !meta || !attachment.url) return null;

  // The full attachment with the resolved URL — children that
  // re-use the URL no longer need to deal with the `?` form.
  const url: string = attachment.url;
  const resolved: RequestAttachment = { ...attachment, url };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[hsl(var(--ink))]/85"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-6 top-6 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--page))]/10 text-[hsl(var(--page))] transition-colors hover:bg-[hsl(var(--page))]/20"
          >
            <X size={22} strokeWidth={1.6} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadAttachment(attachment);
            }}
            aria-label={`Download ${attachment.name || meta.label}`}
            className="absolute left-6 top-6 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--page))]/10 text-[hsl(var(--page))] transition-colors hover:bg-[hsl(var(--page))]/20"
          >
            <Download size={22} strokeWidth={1.6} />
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative flex max-h-[90vh] w-full items-center justify-center overflow-hidden",
              meta.kind === "video" ? "max-w-[85vw]" : "max-w-[90vw]",
            )}
          >
            {meta.kind === "image" && (
              <ImageView url={url} name={attachment.name} />
            )}
            {meta.kind === "pdf" && <PDFView url={url} />}
            {meta.kind === "video" && <VideoView url={url} />}
            {meta.kind === "audio" && (
              <AudioView url={url} name={attachment.name} />
            )}
            {(meta.kind === "text" || meta.kind === "code") && (
              <TextView attachment={resolved} meta={meta} />
            )}
            {meta.kind === "spreadsheet" && (
              <SpreadsheetView attachment={resolved} meta={meta} />
            )}
            {meta.kind === "document" && (
              <DocumentView attachment={resolved} meta={meta} />
            )}
            {meta.kind === "presentation" && (
              <PresentationView attachment={resolved} meta={meta} />
            )}
            {meta.kind === "archive" && (
              <ArchiveView attachment={resolved} meta={meta} />
            )}
            {meta.kind === "other" && (
              <FallbackView attachment={resolved} meta={meta} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ImageView({ url, name }: { url: string; name?: string }) {
  return (
    <img
      src={url}
      alt={name || "Image"}
      className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
      loading="eager"
      decoding="async"
    />
  );
}

function PDFView({ url }: { url: string }) {
  return (
    <div className="h-[85vh] w-[85vw] overflow-hidden rounded-2xl bg-[hsl(var(--page))] shadow-2xl">
      <iframe
        src={url}
        title="PDF preview"
        className="h-full w-full"
      />
    </div>
  );
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

function MediaPlayer({
  src,
  kind,
  name,
}: {
  src: string;
  kind: "audio" | "video";
  name?: string;
}) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const speedButtonRef = useRef<HTMLButtonElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const volumeLeaveTimer = useRef<number | null>(null);
  const controlsTimer = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVolume, setShowVolume] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [speedMenuPosition, setSpeedMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const media = mediaRef.current;

  const clearControlsTimer = () => {
    if (controlsTimer.current) {
      window.clearTimeout(controlsTimer.current);
      controlsTimer.current = null;
    }
  };

  const showControlsBar = () => {
    setShowControls(true);
    clearControlsTimer();
  };

  const hideControlsBar = (delay: number) => {
    clearControlsTimer();
    controlsTimer.current = window.setTimeout(() => {
      setShowControls(false);
    }, delay);
  };

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;

    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onDurationChange = () => setDuration(el.duration);
    const onPlay = () => {
      setIsPlaying(true);
      hideControlsBar(500);
    };
    const onPause = () => {
      setIsPlaying(false);
      showControlsBar();
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(el.duration || 0);
      showControlsBar();
    };
    const onVolumeChange = () => {
      setVolume(el.volume);
      setMuted(el.muted);
    };
    const onRateChange = () => setPlaybackRate(el.playbackRate);

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("volumechange", onVolumeChange);
    el.addEventListener("ratechange", onRateChange);

    setDuration(el.duration);
    setVolume(el.volume);
    setMuted(el.muted);
    setPlaybackRate(el.playbackRate);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("volumechange", onVolumeChange);
      el.removeEventListener("ratechange", onRateChange);
      clearControlsTimer();
    };
  }, [src]);

  useEffect(() => {
    if (!showSpeed) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !speedMenuRef.current?.contains(target) &&
        !speedButtonRef.current?.contains(target)
      ) {
        setShowSpeed(false);
        setSpeedMenuPosition(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSpeed]);

  useEffect(() => {
    if (!showSpeed) return;
    const handleResize = () => {
      const rect = speedButtonRef.current?.getBoundingClientRect();
      if (rect) {
        setSpeedMenuPosition({
          top: rect.top,
          left: rect.left + rect.width / 2,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showSpeed]);

  const togglePlay = () => {
    if (!media) return;
    if (media.paused) {
      void media.play();
    } else {
      media.pause();
    }
  };

  const seek = (value: number) => {
    if (!media) return;
    media.currentTime = value;
  };

  const seekFromMouseEvent = (e: React.MouseEvent | MouseEvent) => {
    const track = sliderRef.current;
    if (!track || !media) return;
    const rect = track.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(fraction * (media.duration || 0));
  };

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    seekFromMouseEvent(e);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => seekFromMouseEvent(e);
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, duration]);

  const handleSliderTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const track = sliderRef.current;
    if (!track || !media) return;
    const rect = track.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    seek(fraction * (media.duration || 0));
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const track = sliderRef.current;
      if (!track || !media) return;
      const rect = track.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      seek(fraction * (media.duration || 0));
    };
    const onEnd = () => setIsDragging(false);
    document.addEventListener("touchmove", onMove);
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [isDragging, duration]);

  const handleSliderKeyDown = (e: React.KeyboardEvent) => {
    if (!media) return;
    const step = media.duration * 0.05 || 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      seek(Math.max(0, media.currentTime - step));
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      seek(Math.min(media.duration, media.currentTime + step));
    } else if (e.key === "Home") {
      e.preventDefault();
      seek(0);
    } else if (e.key === "End") {
      e.preventDefault();
      seek(media.duration);
    }
  };

  const setVolumeValue = (value: number) => {
    if (!media) return;
    media.volume = value;
    media.muted = value === 0;
  };

  const toggleMute = () => {
    if (!media) return;
    media.muted = !media.muted;
  };

  const setSpeed = (speed: number) => {
    if (!media) return;
    media.playbackRate = speed;
    setShowSpeed(false);
    setSpeedMenuPosition(null);
  };

  const handleSpeedToggle = () => {
    if (showSpeed) {
      setShowSpeed(false);
      setSpeedMenuPosition(null);
      return;
    }
    if (kind === "audio") {
      const rect = speedButtonRef.current?.getBoundingClientRect();
      if (rect) {
        setSpeedMenuPosition({
          top: rect.top,
          left: rect.left + rect.width / 2,
        });
      }
    }
    setShowSpeed(true);
  };

  const speedOptions = PLAYBACK_SPEEDS.map((speed) => (
    <button
      key={speed}
      type="button"
      onClick={() => setSpeed(speed)}
      className={cn(
        "block w-full whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-[12px] font-medium transition-colors",
        playbackRate === speed
          ? "bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
          : "text-[hsl(var(--ink))] hover:bg-[hsl(var(--rule))]/50",
      )}
    >
      {speed}x
    </button>
  ));

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const showVolumeSlider = () => {
    if (volumeLeaveTimer.current) {
      window.clearTimeout(volumeLeaveTimer.current);
      volumeLeaveTimer.current = null;
    }
    setShowVolume(true);
  };

  const hideVolumeSlider = () => {
    volumeLeaveTimer.current = window.setTimeout(() => setShowVolume(false), 200);
  };

  const handleVideoMouseEnter = () => {
    showControlsBar();
  };

  const handleVideoMouseMove = () => {
    showControlsBar();
    if (isPlaying) {
      hideControlsBar(3000);
    }
  };

  const handleVideoMouseLeave = () => {
    if (isPlaying) {
      hideControlsBar(500);
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const controls = (
    <div
      className={cn(
        "flex w-full items-center rounded-2xl border px-3 py-2.5 shadow-lg",
        kind === "video" ? "gap-1.5" : "gap-2",
        kind === "video"
          ? "border-[hsl(var(--rule))] bg-[hsl(var(--page))] text-[hsl(var(--ink))]"
          : "border-[hsl(var(--rule))] bg-[hsl(var(--surface))]",
        kind === "audio" && "overflow-hidden",
      )}
    >
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
          kind === "video"
            ? "bg-[hsl(var(--ink))] text-[hsl(var(--page))] hover:bg-[hsl(var(--ink))]/85"
            : "bg-[hsl(var(--ink))] text-[hsl(var(--page))] hover:bg-[hsl(var(--ink))]/85",
        )}
      >
        {isPlaying ? (
          <Pause size={15} strokeWidth={1.8} />
        ) : (
          <Play size={15} strokeWidth={1.8} className="ml-0.5" />
        )}
      </button>

      <div
        ref={sliderRef}
        className="media-custom-slider group/slider"
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        onMouseDown={handleSliderMouseDown}
        onTouchStart={handleSliderTouchStart}
        onKeyDown={handleSliderKeyDown}
        style={{
          ["--media-timeline-fill" as string]: "hsl(var(--ink))",
          ["--media-timeline-track" as string]: "hsl(var(--rule))",
          ["--media-timeline-thumb" as string]: "hsl(var(--page))",
          ["--media-timeline-thumb-border" as string]: "hsl(var(--ink))",
        }}
      >
        <div className="media-custom-track">
          <div className="media-custom-track-fill-wrap">
            <div className="media-custom-track-bg" />
            <div
              className="media-custom-track-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div
            className={cn("media-custom-scrubber", isDragging && "scale-115")}
            style={{ left: `${progressPercent}%` }}
          />
        </div>
        <input
          ref={hiddenInputRef}
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          tabIndex={-1}
          className="media-hidden-range"
          aria-hidden="true"
        />
      </div>

      <span
        className={cn(
          "shrink-0 text-[11px] tabular-nums",
          "text-[hsl(var(--ink-muted))]",
        )}
      >
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <div
        className="flex items-center"
        onMouseEnter={showVolumeSlider}
        onMouseLeave={hideVolumeSlider}
      >
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
            "text-[hsl(var(--ink-muted))] hover:bg-[hsl(var(--rule))]/50 hover:text-[hsl(var(--ink))]",
          )}
        >
          <VolumeIcon size={16} strokeWidth={1.6} />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => setVolumeValue(Number(e.target.value))}
          style={{ ["--volume-level" as string]: `${(muted ? 0 : volume) * 100}%` }}
          className={cn(
            "media-volume h-1 cursor-pointer appearance-none rounded-full transition-all duration-200 ease-out",
            showVolume ? "ml-2 w-20 opacity-100" : "ml-0 w-0 opacity-0",
          )}
        />
      </div>

      <div className="relative">
        <button
          ref={speedButtonRef}
          type="button"
          onClick={handleSpeedToggle}
          className={cn(
            "inline-flex h-7 min-w-[40px] shrink-0 items-center justify-center rounded-full px-2 text-[12px] font-medium transition-colors",
            "text-[hsl(var(--ink-muted))] hover:bg-[hsl(var(--rule))]/50 hover:text-[hsl(var(--ink))]",
          )}
        >
          {playbackRate}x
        </button>
        {showSpeed && kind === "video" && (
          <div
            ref={speedMenuRef}
            className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] p-1 shadow-lg"
          >
            {speedOptions}
          </div>
        )}
      </div>
      {showSpeed && kind === "audio" && speedMenuPosition &&
        createPortal(
          <div
            ref={speedMenuRef}
            className="fixed z-[200] rounded-xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] p-1 shadow-lg"
            style={{
              top: speedMenuPosition.top - 8,
              left: speedMenuPosition.left,
              transform: "translateX(-50%) translateY(-100%)",
            }}
          >
            {speedOptions}
          </div>,
          document.body,
        )}
    </div>
  );

  if (kind === "video") {
    return (
      <div
        className="group relative flex aspect-video w-full max-w-[85vw] max-h-[75vh] items-center justify-center overflow-hidden rounded-2xl bg-[hsl(var(--ink))]"
        onMouseEnter={handleVideoMouseEnter}
        onMouseMove={handleVideoMouseMove}
        onMouseLeave={handleVideoMouseLeave}
      >
        <video
          ref={mediaRef as RefObject<HTMLVideoElement>}
          src={src}
          playsInline
          onClick={togglePlay}
          className="block max-h-full max-w-full cursor-pointer"
        />
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 flex items-end bg-gradient-to-t from-[hsl(var(--ink))]/80 to-transparent p-2 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            showControls ? "translate-y-0" : "translate-y-full pointer-events-none",
          )}
        >
          {controls}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-[400px] max-w-[90vw] flex-col items-center justify-center gap-5 rounded-2xl bg-[hsl(var(--surface))] p-8 shadow-2xl">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--ink))]/10 text-[hsl(var(--ink))]">
        <FileAudio size={28} strokeWidth={1.6} />
      </div>
      {name && (
        <p className="max-w-[280px] truncate text-center text-[15px] font-medium text-[hsl(var(--ink))]">
          {name}
        </p>
      )}
      <audio ref={mediaRef as RefObject<HTMLAudioElement>} src={src} className="hidden" />
      {controls}
    </div>
  );
}

function VideoView({ url }: { url: string }) {
  return <MediaPlayer src={url} kind="video" />;
}

function AudioView({ url, name }: { url: string; name?: string }) {
  return <MediaPlayer src={url} kind="audio" name={name} />;
}

function normalizeCjsImport<T>(mod: T | { default?: T }): T {
  return (mod as { default?: T }).default ?? (mod as T);
}

function TextView({
  attachment,
  meta,
}: {
  attachment: RequestAttachment;
  meta: AttachmentMeta;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (getExtension(attachment.name ?? "") === "rtf") {
      setError(true);
      return;
    }
    if (!attachment.url) return;
    let cancelled = false;
    const url = attachment.url;
    urlToText(url)
      .then((text) => {
        if (!cancelled) setContent(text);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attachment.url, attachment.name]);

  if (error) {
    return <FallbackView attachment={attachment} meta={meta} />;
  }

  if (content === null) return null;

  return (
    <div className="flex h-[85vh] w-[85vw] flex-col overflow-hidden rounded-2xl bg-[hsl(var(--page))] shadow-2xl">
      <div className="border-b border-[hsl(var(--rule))] px-5 py-3">
        <p className="truncate text-[14px] font-medium text-[hsl(var(--ink))]">
          {attachment.name || meta.label}
        </p>
      </div>
      <pre className="flex-1 overflow-auto whitespace-pre-wrap p-6 font-mono text-[14px] leading-relaxed text-[hsl(var(--ink))]">
        {content}
      </pre>
    </div>
  );
}

function SpreadsheetView({
  attachment,
  meta,
}: {
  attachment: RequestAttachment;
  meta: AttachmentMeta;
}) {
  const [rows, setRows] = useState<unknown[][] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!attachment.url) return;
    const url = attachment.url;
    let cancelled = false;
    Promise.all([urlToArrayBuffer(url), import("xlsx")])
      .then(([buffer, xlsxMod]) => {
        const XLSX = normalizeCjsImport(xlsxMod);
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) throw new Error("No sheets");
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attachment.url]);

  if (error) {
    return <FallbackView attachment={attachment} meta={meta} />;
  }

  if (rows === null) return null;

  return (
    <div className="flex h-[85vh] w-[85vw] flex-col overflow-hidden rounded-2xl bg-[hsl(var(--page))] shadow-2xl">
      <div className="border-b border-[hsl(var(--rule))] px-5 py-3">
        <p className="truncate text-[14px] font-medium text-[hsl(var(--ink))]">
          {attachment.name || meta.label}
        </p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <table className="w-full border-collapse border border-[hsl(var(--rule))]">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {(row ?? []).map((cell, j) => (
                  <td
                    key={j}
                    className="border border-[hsl(var(--rule))] px-3 py-2 text-[13px] text-[hsl(var(--ink))]"
                  >
                    {String(cell ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentView({
  attachment,
  meta,
}: {
  attachment: RequestAttachment;
  meta: AttachmentMeta;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ext = getExtension(attachment.name ?? "");
    if (ext !== "docx") return;
    if (!attachment.url) return;
    const url = attachment.url;
    let cancelled = false;
    Promise.all([urlToArrayBuffer(url), import("mammoth")])
      .then(([buffer, mammothMod]) => {
        const mammoth = normalizeCjsImport(mammothMod);
        return mammoth.convertToHtml({ arrayBuffer: buffer });
      })
      .then((result) => {
        if (!cancelled) setHtml(result.value);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attachment.url, attachment.name]);

  if (error) {
    return <FallbackView attachment={attachment} meta={meta} />;
  }

  if (html === null) return null;

  return (
    <div className="flex h-[85vh] w-[85vw] flex-col overflow-hidden rounded-2xl bg-[hsl(var(--page))] shadow-2xl">
      <div className="border-b border-[hsl(var(--rule))] px-5 py-3">
        <p className="truncate text-[14px] font-medium text-[hsl(var(--ink))]">
          {attachment.name || meta.label}
        </p>
      </div>
      <div
        className="docx-preview flex-1 overflow-auto p-6 text-[15px] leading-relaxed text-[hsl(var(--ink))]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
        .docx-preview p { margin-bottom: 0.75rem; }
        .docx-preview h1 { font-size: 1.75rem; font-weight: 600; margin: 1.25rem 0 0.75rem; }
        .docx-preview h2 { font-size: 1.5rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .docx-preview h3 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
        .docx-preview ul, .docx-preview ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .docx-preview ul { list-style: disc; }
        .docx-preview ol { list-style: decimal; }
        .docx-preview table { border-collapse: collapse; width: 100%; margin-bottom: 0.75rem; }
        .docx-preview td, .docx-preview th { border: 1px solid hsl(var(--rule)); padding: 0.5rem; }
        .docx-preview th { font-weight: 600; background: hsl(var(--surface)); }
        .docx-preview img { max-width: 100%; height: auto; }
        .docx-preview a { color: hsl(var(--ink)); text-decoration: underline; }
      `}</style>
    </div>
  );
}

function PresentationView({
  attachment,
  meta,
}: {
  attachment: RequestAttachment;
  meta: AttachmentMeta;
}) {
  const [slides, setSlides] = useState<string[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ext = getExtension(attachment.name ?? "");
    if (ext !== "pptx") return;
    if (!attachment.url) return;
    const url = attachment.url;
    let cancelled = false;
    Promise.all([urlToArrayBuffer(url), import("jszip")])
      .then(([buffer, jszipMod]) => {
        const JSZip = normalizeCjsImport(jszipMod);
        return JSZip.loadAsync(buffer);
      })
      .then(async (zip) => {
        const slideNames = Object.keys(zip.files)
          .filter((name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"))
          .sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] ?? "0", 10);
            const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] ?? "0", 10);
            return numA - numB;
          });
        const texts: string[] = [];
        for (const name of slideNames) {
          const xml = await zip.file(name)?.async("text");
          if (!xml) continue;
          const doc = new DOMParser().parseFromString(xml, "application/xml");
          const textNodes = Array.from(doc.getElementsByTagName("a:t"));
          const slideText = textNodes.map((node) => node.textContent).join(" ").trim();
          texts.push(slideText || "(No text on this slide)");
        }
        if (!cancelled) setSlides(texts);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attachment.url, attachment.name]);

  if (error) {
    return <FallbackView attachment={attachment} meta={meta} />;
  }

  if (slides === null) return null;

  return (
    <div className="flex h-[85vh] w-[85vw] flex-col overflow-hidden rounded-2xl bg-[hsl(var(--page))] shadow-2xl">
      <div className="border-b border-[hsl(var(--rule))] px-5 py-3">
        <p className="truncate text-[14px] font-medium text-[hsl(var(--ink))]">
          {attachment.name || meta.label}
        </p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          {slides.map((text, i) => (
            <div
              key={i}
              className="rounded-xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] p-5"
            >
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
                Slide {i + 1}
              </p>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[hsl(var(--ink))]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArchiveView({
  attachment,
  meta,
}: {
  attachment: RequestAttachment;
  meta: AttachmentMeta;
}) {
  const [files, setFiles] = useState<string[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ext = getExtension(attachment.name ?? "");
    if (ext !== "zip") return;
    if (!attachment.url) return;
    const url = attachment.url;
    let cancelled = false;
    Promise.all([urlToArrayBuffer(url), import("jszip")])
      .then(([buffer, jszipMod]) => {
        const JSZip = normalizeCjsImport(jszipMod);
        return JSZip.loadAsync(buffer);
      })
      .then((zip) => {
        const names = Object.keys(zip.files)
          .filter((name) => !zip.files[name].dir)
          .sort();
        if (!cancelled) setFiles(names);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attachment.url, attachment.name]);

  if (error) {
    return <FallbackView attachment={attachment} meta={meta} />;
  }

  if (files === null) return null;

  return (
    <div className="flex h-[85vh] w-[85vw] flex-col overflow-hidden rounded-2xl bg-[hsl(var(--page))] shadow-2xl">
      <div className="border-b border-[hsl(var(--rule))] px-5 py-3">
        <p className="truncate text-[14px] font-medium text-[hsl(var(--ink))]">
          {attachment.name || meta.label}
        </p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <ul className="space-y-1">
          {files.map((name, i) => (
            <li
              key={i}
              className="truncate font-mono text-[13px] text-[hsl(var(--ink))]"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FallbackView({
  attachment,
  meta,
}: {
  attachment: RequestAttachment;
  meta: AttachmentMeta;
}) {
  return (
    <div className="flex min-w-[320px] flex-col items-center justify-center gap-5 rounded-2xl bg-[hsl(var(--surface))] p-10 text-center shadow-2xl">
      <div
        className={cn(
          "inline-flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--page))]",
          meta.colorClass,
        )}
      >
        {meta.icon}
      </div>
      <div>
        <p className="max-w-[260px] truncate text-[17px] font-medium text-[hsl(var(--ink))]">
          {attachment.name || meta.label}
        </p>
        <p className="mt-1 text-[13px] text-[hsl(var(--ink-subtle))]">
          {meta.label}
          {attachment.size && ` · ${formatBytes(attachment.size)}`}
        </p>
      </div>
      <p className="max-w-[240px] text-[13px] text-[hsl(var(--ink-subtle))]">
        This file type cannot be previewed in the browser. Use the download button in the top-left corner to open it.
      </p>
    </div>
  );
}
