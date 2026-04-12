"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

const G = "#00e676";
const YELLOW = "#ffcc02";
const DIM = "#555577";
const PANEL = "#10101c";
const BORDER = "#2a2a44";
const TEXT = "#e8e8f0";

const ANNOUNCEMENT_TWEET_ID = "2043018985038283044";
const ANNOUNCEMENT_TWEET_URL = `https://x.com/TempoFarm/status/${ANNOUNCEMENT_TWEET_ID}`;
const QUOTE_TWEET_TEXT =
  "Follow @tempofarm, complete the steps on https://tempofarm.xyz and secure your whitelist spot on the farm.";
const WHITELIST_ENDS_AT_UTC = Date.UTC(2026, 3, 15, 15, 0, 0);

const XIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
);

const HeartIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const RepeatIcon = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="square"
  >
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const WalletIcon = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="square"
  >
    <rect x="2" y="5" width="20" height="14" rx="0" />
    <path d="M16 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" />
    <path d="M22 9H2" />
  </svg>
);

const PixelDivider = ({ color = BORDER }: { color?: string }) => (
  <div
    style={{
      height: 3,
      background: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 4px, transparent 4px, transparent 8px)`,
    }}
  />
);

const STEPS = [
  {
    id: 1,
    label: "FOLLOW ON X",
    desc: "Follow @TempoFarm on X to stay ahead of every update.",
    action: "FOLLOW",
    href: "https://twitter.com/intent/follow?screen_name=TempoFarm",
    Icon: XIcon,
    hasWalletInput: false,
  },
  {
    id: 2,
    label: "LIKE THE POST",
    desc: "Like the launch announcement to confirm your intent.",
    action: "LIKE",
    href: `https://twitter.com/intent/like?tweet_id=${ANNOUNCEMENT_TWEET_ID}`,
    Icon: HeartIcon,
    hasWalletInput: false,
  },
  {
    id: 3,
    label: "QUOTE THE POST",
    desc: "Share the Tempo Farm announcement with the whitelist callout.",
    action: "QUOTE",
    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(QUOTE_TWEET_TEXT)}&url=${encodeURIComponent(ANNOUNCEMENT_TWEET_URL)}`,
    Icon: RepeatIcon,
    hasWalletInput: false,
  },
  {
    id: 4,
    label: "DROP EVM WALLET",
    desc: "Enter your EVM address and reply it on the post.",
    action: "SUBMIT",
    href: `https://twitter.com/intent/tweet?in_reply_to=${ANNOUNCEMENT_TWEET_ID}&text=`,
    Icon: WalletIcon,
    hasWalletInput: true,
  },
] as const;

function getCountdownState() {
  const diff = Math.max(WHITELIST_ENDS_AT_UTC - Date.now(), 0);
  const totalSeconds = Math.floor(diff / 1000);

  return {
    expired: diff === 0,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function PixelBox({
  children,
  color = G,
  style = {},
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        border: `3px solid ${color}`,
        boxShadow: `4px 4px 0 ${color}40`,
        background: PANEL,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const [done, setDone] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [saved, setSaved] = useState(false);
  const [countdown, setCountdown] = useState(getCountdownState);
  const savedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setCountdown(getCountdownState()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const allDone = done.size === 4;
    if (allDone && session && !savedRef.current) {
      savedRef.current = true;
      fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evmWallet: walletAddress,
          tasksCompleted: Array.from(done),
        }),
      }).then(() => setSaved(true));
    }
  }, [done, session, walletAddress]);

  const progress = done.size;
  const allDone = progress === 4;

  const toggle = (id: number, href: string) => {
    const url = id === 4 ? href + encodeURIComponent(walletAddress) : href;
    window.open(url, "_blank", "noopener,noreferrer");

    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a14", color: TEXT }}>
      <div className="sweep" />

      <header className="rel" style={{ borderBottom: `3px solid ${BORDER}`, background: PANEL }}>
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Tempo Farm logo"
              width={36}
              height={36}
              priority
              style={{ imageRendering: "pixelated" }}
            />
            <span className="pixel" style={{ fontSize: 10, color: G, letterSpacing: 1 }}>
              TEMPO<span style={{ color: YELLOW }}> FARM</span>
            </span>
          </div>

          {status === "loading" ? null : session ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="avatar"
                  width={24}
                  height={24}
                  style={{ border: `2px solid ${G}`, imageRendering: "pixelated" }}
                />
              )}
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: DIM }}>
                @{((session.user as Record<string, unknown>).twitterUsername as string) || session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="px-btn"
                style={{
                  border: `2px solid ${BORDER}`,
                  color: DIM,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontFamily: "var(--mono)",
                  background: "transparent",
                  boxShadow: `2px 2px 0 ${BORDER}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = TEXT;
                  e.currentTarget.style.borderColor = TEXT;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = DIM;
                  e.currentTarget.style.borderColor = BORDER;
                }}
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("twitter")}
              className="px-btn flex items-center gap-2"
              style={{
                border: `3px solid ${G}`,
                color: "#0a0a14",
                background: G,
                padding: "6px 14px",
                fontFamily: "var(--pixel)",
                fontSize: 9,
                boxShadow: `3px 3px 0 ${G}60`,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = YELLOW;
                e.currentTarget.style.borderColor = YELLOW;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = G;
                e.currentTarget.style.borderColor = G;
              }}
            >
              <XIcon size={10} />
              CONNECT X
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="anim-1 text-center">
          <div
            className="inline-flex items-center gap-2 mb-6 px-3 py-2"
            style={{ border: `2px solid ${G}`, background: "#0a0a14" }}
          >
            <span className="blink" style={{ color: G, fontFamily: "var(--pixel)", fontSize: 6 }}>
              *
            </span>
            <span style={{ fontFamily: "var(--pixel)", fontSize: 7, color: G, letterSpacing: 2 }}>
              WHITELIST
            </span>
          </div>

          <div className="mb-2">
            <div
              className="pixel"
              style={{
                fontSize: "clamp(28px, 7vw, 64px)",
                color: G,
                lineHeight: 1.2,
                textShadow: "3px 3px 0 #004a1a, 6px 6px 0 #002a0a",
                letterSpacing: 2,
              }}
            >
              TEMPO
            </div>
            <div
              className="pixel"
              style={{
                fontSize: "clamp(28px, 7vw, 64px)",
                color: YELLOW,
                lineHeight: 1.2,
                textShadow: "3px 3px 0 #5a4400, 6px 6px 0 #2a2000",
                letterSpacing: 2,
              }}
            >
              FARM
            </div>
          </div>

          <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: DIM, marginTop: 16, lineHeight: 1.8 }}>
            COMPLETE 4 QUESTS TO SECURE YOUR WHITELIST SPOT
          </p>
        </div>

        <PixelBox color={countdown.expired ? BORDER : YELLOW} style={{ padding: 0 }}>
          <div
            style={{
              background: countdown.expired ? BORDER : YELLOW,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="pixel" style={{ fontSize: 8, color: "#0a0a14" }}>
              {countdown.expired ? "> HARVEST ENDED" : "> HARVEST CLOSES IN"}
            </span>
          </div>

          <div className="grid grid-cols-4 anim-2" style={{ gap: 0 }}>
            {[
              { label: "DAYS", value: countdown.days },
              { label: "HRS", value: countdown.hours },
              { label: "MIN", value: countdown.minutes },
              { label: "SEC", value: countdown.seconds },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{
                  borderRight: i < 3 ? `3px solid ${countdown.expired ? BORDER : YELLOW}40` : "none",
                  padding: "16px 8px",
                  textAlign: "center",
                }}
              >
                <div
                  className="pixel"
                  style={{
                    fontSize: "clamp(20px, 5vw, 36px)",
                    color: countdown.expired ? DIM : YELLOW,
                    lineHeight: 1,
                    textShadow: countdown.expired ? "none" : "2px 2px 0 #5a4400",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(item.value).padStart(2, "0")}
                </div>
                <div style={{ fontFamily: "var(--pixel)", fontSize: 7, color: DIM, marginTop: 8, letterSpacing: 1 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          <PixelDivider color={countdown.expired ? BORDER : `${YELLOW}40`} />
          <div style={{ padding: "6px 14px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: DIM }}>
              {countdown.expired ? "ENDED: 15.04.2026 - 15:00 UTC" : "DEADLINE: 15.04.2026 - 15:00 UTC"}
            </span>
          </div>
        </PixelBox>

        <PixelBox color={G} style={{ padding: 0 }}>
          <div
            style={{
              background: G,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span className="pixel" style={{ fontSize: 8, color: "#0a0a14" }}>
              &gt; QUEST LOG
            </span>
            {session && (
              <span className="pixel" style={{ fontSize: 7, color: "#0a0a14" }}>
                {progress}/4
              </span>
            )}
          </div>

          {mounted && !session && status !== "loading" && (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div style={{ fontFamily: "var(--pixel)", fontSize: 18, color: DIM }}>LOCKED</div>
              <div>
                <p className="pixel" style={{ fontSize: 9, color: TEXT, marginBottom: 10, lineHeight: 2 }}>
                  CONNECT YOUR X ACCOUNT
                </p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: DIM }}>
                  to unlock the whitelist quests
                </p>
              </div>
              <button
                onClick={() => signIn("twitter")}
                className="px-btn flex items-center gap-2"
                style={{
                  border: `3px solid ${G}`,
                  background: G,
                  color: "#0a0a14",
                  padding: "10px 20px",
                  fontFamily: "var(--pixel)",
                  fontSize: 9,
                  boxShadow: `4px 4px 0 ${G}50`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = YELLOW;
                  e.currentTarget.style.borderColor = YELLOW;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = G;
                  e.currentTarget.style.borderColor = G;
                }}
              >
                <XIcon size={11} />
                CONNECT WITH X
              </button>
            </div>
          )}

          {session && (
            <div>
              {STEPS.map((step, i) => {
                const isDone = done.has(step.id);

                return (
                  <div key={step.id}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        padding: "16px 16px",
                        background: isDone ? `${G}0c` : "transparent",
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          flexShrink: 0,
                          border: `3px solid ${isDone ? G : BORDER}`,
                          background: isDone ? G : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: isDone ? `2px 2px 0 ${G}50` : "2px 2px 0 #00000050",
                        }}
                      >
                        {isDone && (
                          <svg
                            width={12}
                            height={12}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#0a0a14"
                            strokeWidth="4"
                            strokeLinecap="square"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: DIM }}>{`0${step.id}`}</span>
                          <span className="pixel" style={{ fontSize: 8, color: isDone ? G : TEXT, letterSpacing: 0.5 }}>
                            {isDone ? "> " : ""}
                            {step.label}
                          </span>
                        </div>
                        <p
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 11,
                            color: DIM,
                            lineHeight: 1.7,
                            marginBottom: step.hasWalletInput && !isDone ? 10 : 0,
                          }}
                        >
                          {step.desc}
                        </p>

                        {step.hasWalletInput && !isDone && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              borderBottom: `2px solid ${BORDER}`,
                              paddingBottom: 4,
                              marginTop: 8,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--pixel)",
                                fontSize: 7,
                                color: DIM,
                                whiteSpace: "nowrap",
                              }}
                            >
                              EVM:
                            </span>
                            <input
                              type="text"
                              placeholder="0x..."
                              value={walletAddress}
                              onChange={(e) => setWalletAddress(e.target.value)}
                              style={{
                                flex: 1,
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                fontFamily: "var(--mono)",
                                fontSize: 12,
                                color: G,
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggle(step.id, step.href)}
                        className="px-btn flex items-center gap-1.5"
                        style={
                          isDone
                            ? {
                                border: `2px solid ${G}`,
                                background: G,
                                color: "#0a0a14",
                                padding: "5px 10px",
                                fontFamily: "var(--pixel)",
                                fontSize: 7,
                                boxShadow: `3px 3px 0 ${G}50`,
                                cursor: "pointer",
                                flexShrink: 0,
                              }
                            : {
                                border: `2px solid ${BORDER}`,
                                background: "transparent",
                                color: G,
                                padding: "5px 10px",
                                fontFamily: "var(--pixel)",
                                fontSize: 7,
                                boxShadow: `3px 3px 0 ${BORDER}`,
                                cursor: "pointer",
                                flexShrink: 0,
                              }
                        }
                        onMouseEnter={(e) => {
                          if (!isDone) {
                            e.currentTarget.style.borderColor = G;
                            e.currentTarget.style.boxShadow = `3px 3px 0 ${G}50`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isDone) {
                            e.currentTarget.style.borderColor = BORDER;
                            e.currentTarget.style.boxShadow = `3px 3px 0 ${BORDER}`;
                          }
                        }}
                      >
                        {isDone ? (
                          <>
                            <svg
                              width={10}
                              height={10}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinecap="square"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            DONE
                          </>
                        ) : (
                          <>
                            <step.Icon /> {step.action}
                          </>
                        )}
                      </button>
                    </div>

                    {i < STEPS.length - 1 && <PixelDivider />}
                  </div>
                );
              })}

              {allDone && mounted && (
                <>
                  <PixelDivider color={G} />
                  <div
                    style={{
                      padding: "14px 16px",
                      background: `${G}15`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontFamily: "var(--pixel)", fontSize: 14, color: G }}>OK</span>
                    <span className="pixel" style={{ fontSize: 8, color: G, lineHeight: 2 }}>
                      {saved ? "CONFIRMED - YOU'RE ON THE LIST!" : "SAVING..."}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </PixelBox>
      </main>

      <footer className="rel" style={{ borderTop: `3px solid ${BORDER}`, background: PANEL }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="pixel" style={{ fontSize: 7, color: DIM, letterSpacing: 1 }}>
            (C) 2026 TEMPO FARM
          </span>
          <a
            href="https://x.com/TempoFarm"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5"
            style={{ fontFamily: "var(--pixel)", fontSize: 7, color: DIM, textDecoration: "none" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = G;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = DIM;
            }}
          >
            <XIcon size={8} /> @TEMPOFARM
          </a>
        </div>
      </footer>
    </div>
  );
}
