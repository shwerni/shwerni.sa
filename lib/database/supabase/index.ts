// pacakge
// import { createBrowserClient } from "@supabase/ssr";

// prisma data
import { updateOnlineAt } from "@/data/instant";
import { createClient } from "@supabase/supabase-js";

// props
interface Props {
  url: string;
  anonKey: string;
}

// supabase client
export const supabaseClient = (config: Props) => {
  return createClient(config.url, config.anonKey);
};

// supabase presence
export const newOnlineUser = (config: Props, author: string) => {
  // get supabase
  const supabase = supabaseClient(config);

  // return void
  if (!supabase) return () => {};

  // channel
  const channel = supabase.channel("online_state");

  // start
  channel
    .on(
      "presence",
      {
        event: "sync",
      },
      () => {
        // onlie user id
        const userIds: string[] = [];

        // push online users
        for (const id in channel.presenceState()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          userIds.push((channel.presenceState()[id][0] as any).id);
        }
      },
    )
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          online_at: new Date().toISOString(),
          id: author,
        });

        // update instant online_at
        await updateOnlineAt(author);
      }
    });

  return () => {
    channel.unsubscribe();
  };
};

export const getOnlineUsers = async (config: Props) => {
  // get supabase
  const supabase = supabaseClient(config);

  if (!supabase) return [];

  // channel
  return new Promise<string[]>((resolve) => {
    // channel
    const channel = supabase.channel("online_state");

    // subscribe and wait for sync
    channel
      .on("presence", { event: "sync" }, () => {
        // fetch online user ids
        const userIds: string[] = [];
        for (const id in channel.presenceState()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          userIds.push((channel.presenceState()[id][0] as any).id);
        }
        resolve(userIds);
      })
      .subscribe();
  });
};
