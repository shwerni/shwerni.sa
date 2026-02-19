// prisma data
import { updateTimings } from "@/data/timings";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

export const saveTimings = async (
  author: string,
  cid: number,
  day: Weekday,
  times: string[]
) => {
  try {
    // save new timings data
    const save = await updateTimings(author, cid, day, times);
    // if error
    if (!save)
      return {
        state: false,
        message: "حدث حطأ ما برجاء المحاولة مرة اخري",
      };
    // return
    return {
      state: true,
      message: "تم حفظ المواقيت بنجاح",
    };
  } catch {
    // return
    return {
      state: false,
      message: "حدث حطأ ما برجاء المحاولة مرة اخري",
    };
  }
};
