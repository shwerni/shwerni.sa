// packages
import schedule from "node-schedule";

// utils
import { endMeeting } from "@/lib/api/google";

// meeting schedule to close
export function meetingSchedule(minutes: number, meeting: string) {
  // end time according to duration
  const endTime = new Date(Date.now() + minutes * 60000);
  // Schedule the end meeting task
  schedule.scheduleJob(endTime, async () => {
    // end meeting
    await endMeeting(meeting);
  });
}
