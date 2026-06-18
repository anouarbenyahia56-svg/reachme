import type { ReactNode } from "react";
import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Paperclip,
  Mic,
  Send,
  File,
  Play,
  Download,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "@/components/motion";
import { Card } from "../../ui/Card";
import { Avatar } from "../../ui/Avatar";
import { Link, useRouter } from "../../router";
import {
  useReceived,
  replyToRequest,
  platformFeeCents,
  markOpened,
  saveAttachmentFiles,
  getAttachmentUrl,
  type AttachmentScope,
} from "../../store/requests";
import { useProfile } from "../../store/session";
import { formatMoney, timeShort, formatBytes } from "../../store/format";
import { useToast } from "../../ui/Toast";
import { cn } from "@/lib/utils";
import type { RequestAttachment } from "../../types";
import {
  AttachmentChip,
  AttachmentViewer,
  downloadAttachment,
  getInitialAttachmentType,
} from "../../ui/AttachmentViewer";

/**
 * Reply interface — the most important screen in ReachMe.
 *
 * One incoming request. One reply. Nothing else.
 *
 * The surface is calm, focused, and monochrome: a black header bar
 * holding the sender, a soft chat area with the sender's message on
 * the left and the owner's reply on the right, and a minimal input
 * that quietly shifts from microphone to send the moment words
 * appear. No amounts, no timelines, no clutter — the financial layer
 * lives outside this moment.
 */
export function RequestDetail({ id }: { id: string }) {
  const all = useReceived();
  const profile = useProfile();
  const r = all.find((x) => x.id === id);
  const { navigate } = useRouter();
  const toast = useToast();

  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [viewAttachment, setViewAttachment] = useState<RequestAttachment | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMap = useRef<Map<string, File>>(new Map());
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((a) => {
        if (a.url?.startsWith("blob:")) {
          URL.revokeObjectURL(a.url);
        }
      });
      fileMap.current.clear();
    };
  }, []);

  useEffect(() => {
    if (r && r.status === "pending" && !r.openedAt) {
      markOpened(r.id);
    }
  }, [r]);

  // Auto-resize the textarea up to a sensible max; the outer shape stays fixed.
  // Wrapped in requestAnimationFrame to avoid layout thrashing on every keystroke.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.style.height = "auto";
      const max = 120;
      const newHeight = Math.min(el.scrollHeight, max);
      el.style.height = `${newHeight}px`;
      el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
    });
    return () => cancelAnimationFrame(raf);
  }, [reply]);

  if (!profile || !profile.handle) return null;
  if (!r || !r.toHandle || r.toHandle.toLowerCase() !== profile.handle.toLowerCase()) {
    return (
      <Card className="rounded-[32px]">
        <div className="px-8 py-20 text-center md:px-10">
          <h3
            className="font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "1.5rem",
              fontWeight: 500,
              letterSpacing: "-0.025em",
            }}
          >
            That request can't be found.
          </h3>
          <p className="mt-3 text-[hsl(var(--ink-muted))]">
            It may have been removed, or it isn't yours.
          </p>
          <Link
            href="/dashboard/received"
            className="mt-7 inline-flex rounded-full border border-[hsl(var(--rule-strong))] px-5 py-2.5 text-[13px] text-[hsl(var(--ink))] transition-colors hover:border-[hsl(var(--ink))]"
          >
            Back to inbox
          </Link>
        </div>
      </Card>
    );
  }

  const onSendReply = async () => {
    const body = reply.trim();
    const hasBody = body.length > 0;
    const hasAttachments = attachments.length > 0;
    if (!hasBody && !hasAttachments) return;

    // Hand the raw File objects straight to the cache — no base64
    // round-trip, no main-thread serialization. The cache will mint
    // a blob URL for each so the reply's bubbles render instantly.
    if (hasAttachments && r) {
      const files: File[] = [];
      for (const a of attachments) {
        if (!a.url) continue;
        const file = fileMap.current.get(a.url);
        if (file) files.push(file);
      }
      if (files.length) {
        saveAttachmentFiles(r.id, "reply", files);
      }
    }

    if (r && replyToRequest(r.id, hasBody ? body : undefined, attachments)) {
      toast.show("Reply sent.", "The request is now complete.");
      attachments.forEach((a) => {
        if (a.url?.startsWith("blob:")) {
          URL.revokeObjectURL(a.url);
        }
      });
      fileMap.current.clear();
      setReply("");
      setAttachments([]);
    }
  };

  // Stable handler the bubbles call. The bubble passes its own
  // attachment so we don't have to re-find it through the list on
  // every click — keeps the bubble memoized and the click path
  // tight.
  const handleViewAttachment = useCallback(
    (attachment: RequestAttachment, reqId: string, scope: AttachmentScope, index: number) => {
      const url = attachment.url || getAttachmentUrl(reqId, scope, index) || "";
      if (!url) return;
      setViewAttachment({ ...attachment, url });
    },
    [],
  );

  const onAddFile = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const type = await getInitialAttachmentType(file);
        const url = URL.createObjectURL(file);
        setAttachments((prev) => [
          ...prev,
          { type, url, name: file.name, size: file.size },
        ]);
        fileMap.current.set(url, file);
      } catch {
        toast.show("Couldn't attach file.");
      }
    }

    e.target.value = "";
  };

  const onRemoveAttachment = (index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url);
        fileMap.current.delete(removed.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const canSend = reply.trim().length > 0 || attachments.length > 0;
  const categoryLabel = profile.categories?.find((c) => c.id === r.category)?.label;

  return (
    <div className="mx-auto max-w-5xl">
      <button
        type="button"
        onClick={() => navigate("/dashboard/received")}
        className="group mb-5 inline-flex items-center gap-2 text-[12.5px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
      >
        <ArrowLeft size={14} strokeWidth={1.6} aria-hidden="true" />
        Inbox
      </button>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card className="relative flex h-[640px] flex-col overflow-hidden rounded-[32px] border-[hsl(var(--rule))] bg-[hsl(var(--surface))] shadow-elevated">
        {/* Chat area — the pill is overlaid on top of this scroll container
             (see <header> below). Content below the pill scrolls at full
             opacity with no effects whatsoever. Content that scrolls up past
             the pill is completely hidden by the pill's solid opaque
             background; the pill's own rounded-full corners are what clip
             the visual cleanly at its bottom curve. Content that has emerged
             above the pill — the strip between the top of the card and the
             top of the pill, plus the triangular pockets beside the pill's
             top rounded corners — is rendered at reduced opacity via a
             per-pixel mask on this scroll container. The mask is a property
             of the container (not an overlay element), and its boundary
             follows the pill's rounded top edge, so no scrolled-past fragment
             stays at full opacity. Content uses the same horizontal padding
             as the header so it lines up under the pill's left and right
             edges. */}
        <div
          className="min-h-0 flex-1 flex flex-col overflow-y-auto scrollbar-none [--pill-top:20px] [--pill-pad-x:20px] [--pill-radius:34px] md:[--pill-top:24px] md:[--pill-pad-x:28px]"
          style={{
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) calc(var(--pill-top) + var(--pill-radius)), rgba(0,0,0,1) calc(var(--pill-top) + var(--pill-radius)), rgba(0,0,0,1) 100%), radial-gradient(circle at calc(var(--pill-pad-x) + var(--pill-radius)) calc(var(--pill-top) + var(--pill-radius)), rgba(0,0,0,1) var(--pill-radius), rgba(0,0,0,0) var(--pill-radius)), radial-gradient(circle at calc(100% - var(--pill-pad-x) - var(--pill-radius)) calc(var(--pill-top) + var(--pill-radius)), rgba(0,0,0,1) var(--pill-radius), rgba(0,0,0,0) var(--pill-radius)), linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.4) 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) calc(var(--pill-top) + var(--pill-radius)), rgba(0,0,0,1) calc(var(--pill-top) + var(--pill-radius)), rgba(0,0,0,1) 100%), radial-gradient(circle at calc(var(--pill-pad-x) + var(--pill-radius)) calc(var(--pill-top) + var(--pill-radius)), rgba(0,0,0,1) var(--pill-radius), rgba(0,0,0,0) var(--pill-radius)), radial-gradient(circle at calc(100% - var(--pill-pad-x) - var(--pill-radius)) calc(var(--pill-top) + var(--pill-radius)), rgba(0,0,0,1) var(--pill-radius), rgba(0,0,0,0) var(--pill-radius)), linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.4) 100%)",
            maskComposite: "add",
            WebkitMaskComposite: "source-over",
          }}
        >
          {/* Messages area — min-h-full so the status line is always pushed
              to the very bottom regardless of message length. The messages
              live inside this wrapper so they scroll normally while the
              status line stays anchored at the bottom of the card. */}
          <div className="min-h-full flex-1 space-y-6 px-5 pt-28 pb-6 md:px-7 md:pt-28 md:pb-8">
            {/* Sender message */}
            <div className="flex items-end">
              <div className="flex max-w-[85%] flex-col gap-2">
                <TextBubble text={r.message} time={r.createdAt} side="left" />
                {r.attachments?.map((a, i) => (
                  <AttachmentBubble
                    key={`m-${i}`}
                    attachment={a}
                    time={r.createdAt}
                    side="left"
                    requestId={r.id}
                    scope="msg"
                    index={i}
                    onView={handleViewAttachment}
                  />
                ))}
              </div>
            </div>

            {/* Owner reply */}
            {r.reply && (
              <div className="flex items-end justify-end">
                <div className="flex max-w-[85%] flex-col items-end gap-2">
                  {r.reply.body && (
                    <TextBubble text={r.reply.body} time={r.reply.repliedAt} side="right" />
                  )}
                  {r.reply.attachments?.map((a, i) => (
                    <AttachmentBubble
                      key={`r-${i}`}
                      attachment={a}
                      time={r.reply!.repliedAt}
                      side="right"
                      requestId={r.id}
                      scope="reply"
                      index={i}
                      onView={handleViewAttachment}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status line — always pinned to the very bottom of the scroll area. */}
          {r.status !== "pending" && (
            <div className="shrink-0 flex items-center justify-center gap-2 px-5 pb-6 pt-2 text-[11.5px] text-[hsl(var(--ink-subtle))] md:px-7 md:pb-8">
              {r.status === "replied" ? (
                <>
                  <Check size={13} strokeWidth={1.6} />
                  Replied {timeShort(r.reply!.repliedAt)}
                </>
              ) : (
                <>
                  <Clock size={13} strokeWidth={1.6} />
                  Expired
                </>
              )}
            </div>
          )}
        </div>

        {/* Header — pill-shaped identity bar with avatar, name, and category.
            Positioned absolutely on top of the scroll area with a solid
            opaque background so content scrolling up behind it is
            completely hidden. The pill's own rounded-full border-radius
            creates the visual clipping at its bottom corners — content
            stays fully visible one pixel before the curve, then disappears
            behind the pill. pointer-events-none on the header lets
            touch/click on the pill area pass through to the scroll
            container underneath, so scrolling still works there. The
            mask on the scroll container (see above) is what handles the
            dimming of content that has scrolled above the pill — nothing
            extra sits on top of the pill area itself. */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-5 pt-5 md:px-7 md:pt-6">
            <div className="pointer-events-auto flex w-full items-center gap-3 rounded-full bg-[hsl(var(--page))] px-4 py-2.5 ring-1 ring-[hsl(var(--rule))]">
            <Avatar
              size="md"
              name={r.from.name}
              className="bg-[hsl(var(--rule))] text-[hsl(var(--ink-muted))]"
            />
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-medium text-[hsl(var(--ink))]">
                {r.from.name}
              </p>
              {categoryLabel && (
                <p className="truncate text-[11px] text-[hsl(var(--ink-muted))]">
                  {categoryLabel}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Reply input */}
        {r.status === "pending" && (
          <div className="shrink-0 px-5 pb-5 pt-2 md:px-7 md:pb-6">
            <div className="overflow-hidden rounded-[28px] border border-[hsl(var(--rule-strong))] bg-[hsl(var(--page))] focus-within:border-[hsl(var(--ink))]">
              {/* Pending attachment chips — live inside the input container */}
              {attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none px-3 pt-3">
                  {attachments.map((a, i) => (
                    <AttachmentChip
                      key={i}
                      attachment={a}
                      onRemove={() => onRemoveAttachment(i)}
                      onClick={() => setViewAttachment(a)}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2 px-3 py-1">
                <InputIconButton
                  label="Attach file"
                  onClick={onAddFile}
                  icon={<Paperclip size={17} strokeWidth={1.5} />}
                />

                <textarea
                  ref={inputRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSendReply();
                    }
                  }}
                  placeholder={`Reply to ${r.from.name.split(" ")[0]}...`}
                  rows={1}
                  className="block max-h-[120px] min-h-[38px] w-full flex-1 resize-none bg-transparent pl-1 pr-3 py-2 text-[14.5px] leading-[1.5] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none scrollbar-none"
                />

                <div className="relative h-[38px] w-[38px] shrink-0">
                  <AnimatePresence mode="wait" initial={false}>
                    {canSend ? (
                      <motion.div
                        key="send"
                        initial={{ opacity: 0, scale: 0.85, rotate: -45 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.85, rotate: 45 }}
                        transition={{ duration: 0, ease: EASE }}
                        className="absolute inset-0"
                      >
                        <InputIconButton
                          label="Send reply"
                          onClick={onSendReply}
                          active
                          icon={<Send size={17} strokeWidth={1.8} />}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="mic"
                        initial={{ opacity: 0, scale: 0.85, rotate: 45 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.85, rotate: -45 }}
                        transition={{ duration: 0, ease: EASE }}
                        className="absolute inset-0"
                      >
                        <InputIconButton
                          label="Voice message"
                          onClick={() => setIsRecording((v) => !v)}
                          icon={<Mic size={17} strokeWidth={1.5} />}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onFileChange}
            />

            {isRecording && (
              <div className="mt-3 text-center text-[12px] text-[hsl(var(--ink-muted))]">
                Voice recording is not yet available.
              </div>
            )}
          </div>
        )}
          </Card>
        </div>

        <div className="lg:col-span-4">
          <FinancialCard
            status={r.status === "pending" ? "pending" : r.status === "replied" ? "released" : "refunded"}
            amountCents={r.amountCents}
            feeCents={r.escrow.feeCents ?? platformFeeCents(r.amountCents)}
            releaseCents={r.amountCents - (r.escrow.feeCents ?? platformFeeCents(r.amountCents))}
            replyDate={r.reply?.repliedAt}
            expiryDate={r.expiresAt}
          />
        </div>
      </div>

      <AttachmentViewer
        attachment={viewAttachment}
        open={viewAttachment !== null}
        onClose={() => setViewAttachment(null)}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Bubbles
// ────────────────────────────────────────────────────────────────────────────

const TextBubble = memo(function TextBubble({
  text,
  time,
  side,
}: {
  text: string;
  time: string;
  side: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "relative max-w-[85%] min-w-[80px] rounded-[22px] px-4 pb-6 pt-3.5",
        side === "left"
          ? "rounded-tl-md bg-[hsl(var(--page))] ring-1 ring-[hsl(var(--rule))]"
          : "rounded-tr-md bg-[hsl(var(--ink))] text-[hsl(var(--page))]",
      )}
    >
      <p
        className="whitespace-pre-line"
        style={{
          fontSize: "0.96rem",
          lineHeight: 1.65,
          letterSpacing: "-0.005em",
        }}
      >
        {text}
      </p>
      <Timestamp time={time} side={side} />
    </div>
  );
});

type BubbleView = (
  attachment: RequestAttachment,
  requestId: string,
  scope: AttachmentScope,
  index: number,
) => void;

const AttachmentBubble = memo(function AttachmentBubble({
  attachment,
  time,
  side,
  requestId,
  scope,
  index,
  onView,
}: {
  attachment: RequestAttachment;
  time: string;
  side: "left" | "right";
  requestId: string;
  scope: AttachmentScope;
  index: number;
  onView: BubbleView;
}) {
  // Resolve URL: stored URL takes priority; the cache fills in
  // blob URLs for attachments saved through the new file path.
  // The lookup is a single Map.get and runs only when the cache
  // has a value (most of the time).
  const url =
    attachment.url ||
    getAttachmentUrl(requestId, scope, index) ||
    "";

  if (attachment.type === "image") {
    return (
      <ImageBubble
        url={url}
        name={attachment.name}
        time={time}
        side={side}
        onView={onView}
        attachment={attachment}
        requestId={requestId}
        scope={scope}
        index={index}
      />
    );
  }
  if (attachment.type === "voice" || attachment.type === "video") {
    return (
      <AudioBubble
        attachment={{ ...attachment, url }}
        time={time}
        side={side}
        onView={onView}
      />
    );
  }
  return (
    <DocumentBubble
      attachment={{ ...attachment, url }}
      time={time}
      side={side}
      onView={onView}
    />
  );
});

const ImageBubble = memo(function ImageBubble({
  url,
  name,
  time,
  side,
  onView,
  attachment,
  requestId,
  scope,
  index,
}: {
  url: string;
  name?: string;
  time: string;
  side: "left" | "right";
  onView: BubbleView;
  attachment: RequestAttachment;
  requestId: string;
  scope: AttachmentScope;
  index: number;
}) {
  const handleView = useCallback(() => {
    onView(attachment, requestId, scope, index);
  }, [onView, attachment, requestId, scope, index]);

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      downloadAttachment({ type: "image", url, name });
    },
    [url, name],
  );

  return (
    <div
      className={cn(
        "group relative max-w-[85%] overflow-hidden rounded-[22px] bg-[hsl(var(--rule))]/40",
        side === "left" ? "rounded-tl-md" : "rounded-tr-md",
      )}
    >
      <button
        type="button"
        onClick={handleView}
        className="block w-full focus:outline-none"
        aria-label={name || "Open image"}
      >
        <img
          src={url}
          alt={name || "Image"}
          loading="lazy"
          decoding="async"
          className="block max-h-[320px] min-h-[160px] w-full object-cover"
          draggable={false}
        />
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent" />
      <span className="absolute bottom-2 right-3 text-[11px] font-medium text-white/90">
        {timeShort(time)}
      </span>
      <button
        type="button"
        onClick={handleDownload}
        aria-label="Download image"
        className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-white/90 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus:opacity-100"
      >
        <Download size={12} strokeWidth={1.6} />
      </button>
    </div>
  );
});

const AudioBubble = memo(function AudioBubble({
  attachment,
  time,
  side,
  onView,
}: {
  attachment: RequestAttachment;
  time: string;
  side: "left" | "right";
  onView: BubbleView;
}) {
  const duration = attachment.duration ?? 0;
  const formattedDuration = formatDuration(duration);

  const handleClick = useCallback(() => {
    onView(attachment, "", "msg", -1);
  }, [onView, attachment]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  // Waveform is derived from the URL but, for blob URLs, that
  // changes once when the file is cached. Memoize on the URL so
  // typing in the reply input doesn't re-hash the string.
  const bars = useMemo(
    () => waveformBars(attachment.url ?? ""),
    [attachment.url],
  );

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={cn(
        "relative flex max-w-[85%] min-w-[220px] cursor-pointer items-center gap-3 rounded-[22px] px-3.5 py-3",
        side === "left"
          ? "rounded-tl-md bg-[hsl(var(--page))] ring-1 ring-[hsl(var(--rule))]"
          : "rounded-tr-md bg-[hsl(var(--ink))] text-[hsl(var(--page))]",
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        aria-label="Open audio"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
          side === "left"
            ? "bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
            : "bg-[hsl(var(--page))] text-[hsl(var(--ink))]",
        )}
      >
        <Play size={14} strokeWidth={1.8} />
      </button>

      <div className="flex flex-1 items-center gap-[3px]">
        {bars.map((h, i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-full",
              side === "left" ? "bg-[hsl(var(--ink))]/20" : "bg-[hsl(var(--page))]/25",
            )}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      {formattedDuration && (
        <span
          className={cn(
            "mr-2 text-[11px] tabular-nums",
            side === "left" ? "text-[hsl(var(--ink-muted))]" : "text-[hsl(var(--page))]/70",
          )}
        >
          {formattedDuration}
        </span>
      )}

      <span
        className={cn(
          "absolute bottom-2 right-3 text-[11px] tabular-nums",
          side === "left" ? "text-[hsl(var(--ink-subtle))]" : "text-[hsl(var(--page))]/70",
        )}
      >
        {timeShort(time)}
      </span>
    </div>
  );
});

const DocumentBubble = memo(function DocumentBubble({
  attachment,
  time,
  side,
  onView,
}: {
  attachment: RequestAttachment;
  time: string;
  side: "left" | "right";
  onView: BubbleView;
}) {
  const extension = (attachment.name?.split(".").pop() || "file").toUpperCase();
  const size = attachment.size ? formatBytes(attachment.size) : undefined;

  const handleClick = useCallback(() => {
    onView(attachment, "", "msg", -1);
  }, [onView, attachment]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      downloadAttachment(attachment);
    },
    [attachment],
  );

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={cn(
        "relative flex max-w-[90%] min-w-[260px] cursor-pointer items-center gap-3.5 rounded-[22px] px-4 py-3.5",
        side === "left"
          ? "rounded-tl-md bg-[hsl(var(--page))] ring-1 ring-[hsl(var(--rule))]"
          : "rounded-tr-md bg-[hsl(var(--ink))] text-[hsl(var(--page))]",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
          side === "left"
            ? "bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
            : "bg-[hsl(var(--page))] text-[hsl(var(--ink))]",
        )}
      >
        <File size={18} strokeWidth={1.6} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium tracking-[-0.005em]">
          {attachment.name || "Document"}
        </p>
        <p
          className={cn(
            "text-[11px]",
            side === "left" ? "text-[hsl(var(--ink-subtle))]" : "text-[hsl(var(--page))]/65",
          )}
        >
          {extension}
          {size && ` · ${size}`}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className={cn(
            "flex items-center gap-1 text-[11px] transition-colors",
            side === "left"
              ? "text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))]"
              : "text-[hsl(var(--page))]/70 hover:text-[hsl(var(--page))]",
          )}
        >
          <ExternalLink size={11} strokeWidth={1.6} />
          Open
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className={cn(
            "flex items-center gap-1 text-[11px] transition-colors",
            side === "left"
              ? "text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))]"
              : "text-[hsl(var(--page))]/70 hover:text-[hsl(var(--page))]",
          )}
        >
          <Download size={11} strokeWidth={1.6} />
          Download
        </button>
      </div>

      <Timestamp time={time} side={side} />
    </div>
  );
});

const Timestamp = memo(function Timestamp({ time, side }: { time: string; side: "left" | "right" }) {
  return (
    <span
      className={cn(
        "absolute bottom-2 right-3 text-[11px] tabular-nums",
        side === "left" ? "text-[hsl(var(--ink-subtle))]" : "text-[hsl(var(--page))]/70",
      )}
    >
      {timeShort(time)}
    </span>
  );
});

function InputIconButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void | Promise<void>;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex h-[38px] w-[38px] items-center justify-center rounded-full transition-all duration-200",
        active
          ? "bg-[hsl(var(--ink))] text-[hsl(var(--page))] hover:bg-[hsl(var(--ink))]/85"
          : "text-[hsl(var(--ink-muted))] hover:bg-[hsl(var(--rule))]/50 hover:text-[hsl(var(--ink))]",
      )}
    >
      {icon}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string | null {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Generate a deterministic, varied waveform from an attachment URL. */
function waveformBars(url: string, count = 24): number[] {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 31 + url.charCodeAt(i)) | 0;
  }
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const v = Math.abs((Math.sin(hash + i * 13) * 10000) % 100);
    out.push(20 + v * 0.7);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Money card
// ────────────────────────────────────────────────────────────────────────────

function FinancialCard({
  status,
  amountCents,
  feeCents,
  releaseCents,
  replyDate,
  expiryDate,
  className,
}: {
  status: "pending" | "released" | "refunded";
  amountCents: number;
  feeCents: number;
  releaseCents: number;
  replyDate?: string;
  expiryDate?: string;
  className?: string;
}) {
  const states = {
    pending: {
      label: "AMOUNT ON HOLD",
      amount: amountCents,
      subtitle: `Held until ${dateShort(expiryDate)}`,
      rows: [
        { label: "If you reply", value: `+${formatMoney(releaseCents)}`, dark: true },
        { label: "Platform fee", value: `–${formatMoney(feeCents)}`, dark: false },
        { label: "If you don't reply", value: "Full refund", dark: false },
      ],
    },
    released: {
      label: "RELEASED TO YOU",
      amount: releaseCents,
      subtitle: `Replied on ${dateShort(replyDate)}`,
      rows: [
        { label: "Amount held", value: formatMoney(amountCents), dark: false },
        { label: "Platform fee", value: `–${formatMoney(feeCents)}`, dark: false },
        { label: "You received", value: `+${formatMoney(releaseCents)}`, dark: true },
      ],
    },
    refunded: {
      label: "REFUNDED",
      amount: amountCents,
      subtitle: `Expired on ${dateShort(expiryDate)}`,
      rows: [
        { label: "Returned to sender", value: formatMoney(amountCents), dark: false },
        { label: "Platform fee", value: "None", dark: false },
      ],
    },
  };

  const state = states[status];

  return (
    <div
      className={cn(
        "bg-[#FFFFFF] rounded-[14px] px-6 py-[26px] shadow-[0_1px_4px_rgba(0,0,0,0.07)]",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-[#B0ACA4]">
            {state.label}
          </p>
          <p
            className="mt-[10px] font-serif text-[#1A1A18]"
            style={{
              fontSize: "52px",
              fontWeight: 500,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatMoney(state.amount)}
          </p>
          <p className="mt-[7px] font-sans text-[13px] text-[#B0ACA4]">
            {state.subtitle}
          </p>

          {state.rows.length > 0 && (
            <div className="mt-[26px] space-y-[12px]">
              {state.rows.map((row, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-sans text-[13.5px] text-[#B0ACA4]">
                    {row.label}
                  </span>
                  <span
                    className={cn(
                      "font-sans text-[13.5px]",
                      row.dark
                        ? "font-semibold text-[#1A1A18]"
                        : "font-normal text-[#B0ACA4]",
                    )}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function dateShort(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
