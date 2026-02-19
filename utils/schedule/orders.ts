// packages
import schedule from "node-schedule";

// hooks
import { cancelOrder } from "@/handlers/clients/reservation/order";

// cancel order if not still processing
export function cancelSchedule(oid: number) {
  // deadline duration
  const deadline = new Date(Date.now() + 10 * 60000);
  // schedule task
  schedule.scheduleJob(deadline, async () => {
    // cancel this meeting
    await cancelOrder(oid);
  });
}
