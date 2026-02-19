"use server";
// packages
import { BetaAnalyticsDataClient } from "@google-analytics/data";

// auth
export async function analyticsClient() {
  try {
    // initialize google analytics
    const auth = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.ANALYTICS_EMAIL as string,
        private_key: (process.env.ANALYTICS_KEY as string).replace(
          /\\n/g,
          "\n"
        ),
      },
    });
    // if not exit
    if (!auth) return null;
    // return
    return auth;
  } catch {
    return null;
  }
}

// visitors
export async function googleAnalyticsVistiors() {
  try {
    // auth client
    const authClient = await analyticsClient();

    // if not valid
    if (!authClient) return null;

    // get response
    const [response] = await authClient.runReport({
      property: `properties/${process.env.ANALYTICS_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }],
    });
    // if not exit
    if (!response || !response.rows) return null;
    // return
    return response;
  } catch {
    return null;
  }
}

// total users
export async function googleAnalyticsUsers() {
  try {
    // auth client
    const authClient = await analyticsClient();

    // if not valid
    if (!authClient) return null;

    // get response
    const [response] = await authClient.runReport({
      property: `properties/${process.env.ANALYTICS_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "totalUsers" }],
    });
    // if not exit
    if (!response || !response.rows) return null;
    // return
    return response;
  } catch {
    return null;
  }
}

// users source
export async function googleAnalyticsUsersSource() {
  try {
    // auth client
    const authClient = await analyticsClient();

    // if not valid
    if (!authClient) return null;

    // get response
    const [response] = await authClient.runReport({
      property: `properties/${process.env.ANALYTICS_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "firstUserDefaultChannelGroup" }],
      metrics: [{ name: "newUsers" }],
    });
    // if not exit
    if (!response || !response.rows) return null;
    // return
    return response;
  } catch {
    return null;
  }
}
