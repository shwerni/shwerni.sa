//components
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function SkeletonAudioRoom() {
    return (
        <div className="min-h-[250px] bg-background flex flex-col">
            {/* header Skeleton */}
            <div className="border-b bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                </div>
            </div>

            {/* content skeleton */}
            <div className="flex-1 container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="flex flex-col items-center space-y-3">
                                    <Skeleton className="h-16 w-16 rounded-full" />
                                    <div className="space-y-2 text-center">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-3 w-12" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* controls Skeleton */}
            <div className="border-t bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-center gap-4">
                        <Skeleton className="rounded-full h-12 w-12" />
                        <Skeleton className="rounded-full h-12 w-12" />
                        <Skeleton className="rounded-full h-12 w-12" />
                    </div>
                    <div className="flex items-center justify-center mt-3 gap-6">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>
            </div>
        </div>
    )
}