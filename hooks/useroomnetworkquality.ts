"use client";
import React from "react";
import { useHMSActions, useHMSStore, selectLocalPeer } from "@100mslive/react-sdk";

export type NetworkQuality = "unknown" | "poor" | "fair" | "good";
export type NetworkScore = 0 | 1 | 2 | 3 | 4 | 5;

interface NetworkState {
  score: NetworkScore;
  quality: NetworkQuality;
  rtt: number | null;
}

const PING_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/favicon.ico`
    : "/favicon.ico";

function rttToScore(rtt: number): NetworkScore {
  if (rtt < 80)  return 5;
  if (rtt < 150) return 4;
  if (rtt < 250) return 3;
  if (rtt < 400) return 2;
  return 1;
}

function scoreToQuality(score: NetworkScore): NetworkQuality {
  if (score === 0) return "unknown";
  if (score <= 2)  return "poor";
  if (score === 3) return "fair";
  return "good";
}

function connectionTypeScore(): NetworkScore | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  if (!conn) return null;
  switch (conn.effectiveType) {
    case "slow-2g": return 1;
    case "2g":      return 2;
    case "3g":      return 3;
    case "4g":      return 5;
    default:        return null;
  }
}

async function measureRTT(): Promise<number | null> {
  try {
    const start = performance.now();
    await fetch(PING_URL, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    return Math.round(performance.now() - start);
  } catch {
    return null;
  }
}

// useNetworkQuality:
// 1. Measures local network quality via RTT ping every 10s
// 2. Broadcasts the score to the room by merging it into peer metadata
//    so every other peer can read it from peer.metadata.networkScore
export function useNetworkQuality(intervalMs: number = 10_000): NetworkState {
  const [state, setState] = React.useState<NetworkState>({
    score: 0,
    quality: "unknown",
    rtt: null,
  });

  const hmsActions = useHMSActions();
  const localPeer = useHMSStore(selectLocalPeer);

  // keep a ref to the latest score to avoid stale closure in the broadcast
  const scoreRef = React.useRef<NetworkScore>(0);

  React.useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const rtt = await measureRTT();
      if (cancelled) return;

      let score: NetworkScore = 0;
      if (rtt !== null) score = rttToScore(rtt);

      const typeScore = connectionTypeScore();
      if (typeScore !== null && score !== 0) {
        score = Math.min(score, typeScore) as NetworkScore;
      } else if (typeScore !== null && score === 0) {
        score = typeScore;
      }

      const quality = scoreToQuality(score);
      setState({ score, quality, rtt });
      scoreRef.current = score;

      // broadcast score to room via peer metadata.
      // we merge into existing metadata so we don't overwrite user/image/role.
      if (!localPeer?.metadata) return;
      try {
        const existing = JSON.parse(localPeer.metadata);
        // only update if score actually changed to avoid unnecessary signaling
        if (existing.networkScore === score) return;
        await hmsActions.changeMetadata(
          JSON.stringify({ ...existing, networkScore: score }),
        );
      } catch {
        // metadata parse failed or changeMetadata not available — ignore
      }
    };

    check();
    const id = setInterval(check, intervalMs);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection;
    if (conn) conn.addEventListener("change", check);

    return () => {
      cancelled = true;
      clearInterval(id);
      if (conn) conn.removeEventListener("change", check);
    };
  }, [intervalMs, hmsActions, localPeer?.metadata]);

  return state;
}


// // prefer metadata.networkScore (self-reported RTT-based, always available)
//   // fall back to 100ms downlinkQuality (requires mic to be on)
//   const signalScore: number | undefined =
//     participant.isLocal
//       ? localScore                                    // always fresh for local
//       : (metadata.networkScore                        // remote: from their metadata
//         ?? connectionQuality?.downlinkQuality         // fallback: 100ms quality
//         ?? undefined);


//         {(participant.isLocal || (signalScore != null && signalScore > 0)) && (
//               <div className="absolute -top-1 -left-1 flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm">
//                 <SignalIcon score={signalScore} />
//               </div>
//             )}