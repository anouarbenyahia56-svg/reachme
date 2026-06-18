import type { ReactNode } from "react";
import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Paperclip,
  Mic,
  Send,
  Download,
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
  getAttachmentMeta,
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
          {/* Messages area — flex-1 lets the messages fill whatever
              space is available.  When messages are short the status
              line sits right beneath them (both at the bottom of the
              card).  When messages overflow, the whole container
              scrolls and the status line ends up at the very bottom. */}
          <div className="flex-1 space-y-6 px-5 pt-28 pb-6 md:px-7 md:pt-28 md:pb-8">
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

  return (
    <ChatAttachmentBubble
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

  return (
    <div
      className={cn(
        "group relative h-14 w-14 min-h-14 max-h-14 min-w-14 max-w-14 shrink-0 basis-14 overflow-hidden rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] shadow-sm transition-colors duration-200 hover:border-[hsl(var(--ink))]/30",
        side === "left" ? "rounded-tl-md" : "rounded-tr-md",
      )}
    >
      <button
        type="button"
        onClick={handleView}
        className="block h-full w-full focus:outline-none"
        aria-label={name || "Open image"}
      >
        <img
          src={url}
          alt={name || "Image"}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </button>
      <span className="absolute bottom-2 right-2 text-[11px] font-medium text-white/90 drop-shadow-md">
        {timeShort(time)}
      </span>
    </div>
  );
});

const ChatAttachmentBubble = memo(function ChatAttachmentBubble({
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
  const meta = getAttachmentMeta(attachment);
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
        "relative flex h-14 w-[280px] min-w-[280px] max-w-[280px] shrink-0 cursor-pointer items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 shadow-sm transition-colors transition-shadow duration-200",
        side === "left"
          ? "rounded-tl-md border border-[hsl(var(--rule))] bg-[hsl(var(--page))] hover:border-[hsl(var(--ink))]/30 hover:shadow-md"
          : "rounded-tr-md border border-[hsl(var(--page))]/10 bg-[hsl(var(--ink))] text-[hsl(var(--page))] hover:border-[hsl(var(--page))]/20 hover:shadow-md",
      )}
    >
      <span
        className={cn(
          "shrink-0 transition-colors",
          side === "left" ? meta.colorClass : "text-[hsl(var(--page))]/70",
        )}
      >
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1 pr-12">
        <p
          className={cn(
            "truncate text-[14px] font-medium leading-tight",
            side === "left" ? "text-[hsl(var(--ink))]" : "text-[hsl(var(--page))]",
          )}
        >
          {attachment.name || meta.label}
        </p>
        <p
          className={cn(
            "truncate text-[11px] leading-tight",
            side === "left" ? "text-[hsl(var(--ink-subtle))]" : "text-[hsl(var(--page))]/65",
          )}
        >
          {meta.label}
          {size && ` · ${size}`}
        </p>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        aria-label={`Download ${attachment.name || meta.label}`}
        className={cn(
          "absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          side === "left"
            ? "text-[hsl(var(--ink-muted))] hover:bg-[hsl(var(--rule))]/50 hover:text-[hsl(var(--ink))]"
            : "text-[hsl(var(--page))]/70 hover:bg-[hsl(var(--page))]/10 hover:text-[hsl(var(--page))]",
        )}
      >
        <Download size={14} strokeWidth={1.6} />
      </button>

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
