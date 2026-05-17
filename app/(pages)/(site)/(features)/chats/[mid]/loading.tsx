import { Skeleton } from "@/components/ui/skeleton";

export default function MeetingChatLoading() {
  return (
    <div className="flex flex-col h-dvh sm:h-[calc(100vh-4rem)] sm:max-w-4xl sm:mx-auto bg-slate-50 sm:border-x border-slate-200 sm:shadow-sm">
      {/* Header skeleton */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <div className="flex sm:hidden">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </header>

      {/* Messages skeleton */}
      <div className="flex-1 overflow-hidden px-4 sm:px-6 py-4 space-y-6">
        {/* Date separator */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-slate-200" />
          <Skeleton className="h-3 w-20" />
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Incoming */}
        <div className="flex flex-col items-start gap-1">
          <Skeleton className="h-16 w-56 sm:w-72 rounded-2xl rounded-bl-none" />
          <Skeleton className="h-3 w-12" />
        </div>

        {/* Outgoing */}
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-12 w-48 sm:w-64 rounded-2xl rounded-br-none" />
          <Skeleton className="h-3 w-12" />
        </div>

        {/* Incoming long */}
        <div className="flex flex-col items-start gap-1">
          <Skeleton className="h-20 w-64 sm:w-80 rounded-2xl rounded-bl-none" />
          <Skeleton className="h-3 w-12" />
        </div>

        {/* Outgoing */}
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-10 w-40 sm:w-52 rounded-2xl rounded-br-none" />
          <Skeleton className="h-3 w-12" />
        </div>

        {/* Incoming */}
        <div className="flex flex-col items-start gap-1">
          <Skeleton className="h-14 w-52 sm:w-68 rounded-2xl rounded-bl-none" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>

      {/* Input skeleton */}
      <div className="px-3 sm:px-4 py-3 bg-white border-t border-slate-200">
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}