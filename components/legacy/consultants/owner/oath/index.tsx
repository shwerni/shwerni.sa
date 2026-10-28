"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

// components
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

// icons
import { Ban, Save, TriangleAlert } from 'lucide-react';
import { confirmOathAcceptance } from "@/actions/consultant";
import LoadingBtn from '@/components/legacy/layout/loadingBtn';
import { ZToast } from '@/components/legacy/layout/toasts';

// constants
import { CONSULTANT_OATH } from '@/constants/oath';

function ConsultantOath({ id }: { id: string }) {
    const router = useRouter();
    const [agree, setAgree] = React.useState(false);
    const [isPending, startTransition] = React.useTransition();

    const terms = CONSULTANT_OATH.terms;

    const handleReject = () => {
        router.push("/");
    };

    const handleAccept = () => {
        if (!agree) return;
        startTransition(() => {
            confirmOathAcceptance(id).then((response) => {
                if (response) {
                    router.refresh()
                } else {
                    ZToast({ state: false, message: "حدث خطأ ما" })
                }
            });
        });
    };

    return (
        <div dir="rtl" className="max-w-3xl mx-auto py-10 px-4 space-y-6">
            <h3 className="text-zblue-200 text-2xl font-bold">
                {CONSULTANT_OATH.title}
            </h3>
            <p className="text-sm text-gray-600">
                {CONSULTANT_OATH.intro}
            </p>
            <Separator />
            <h6 className="text-base font-semibold">{CONSULTANT_OATH.heading}</h6>
            <ul className="list-disc px-4 space-y-2">
                {terms.map((t, i) => (
                    <li key={i} className="text-sm leading-relaxed">{t}</li>
                ))}
            </ul>
            <Separator />

            <div className="flex items-center gap-3">
                <Checkbox checked={agree} onCheckedChange={() => setAgree(!agree)} />
                <Label className="text-black text-sm">الموافقة على الميثاق المهني</Label>
            </div>

            <div className="flex justify-between pt-6">
                <Button
                    onClick={handleAccept}
                    disabled={!agree || isPending}
                    className="gap-2 bg-zblue-200 text-base"
                >
                    <LoadingBtn loading={isPending}>
                        <Save className="w-5 h-5" /> موافقة
                    </LoadingBtn>
                </Button>

                <Button
                    onClick={handleReject}
                    variant="destructive"
                    disabled={isPending}
                    className="gap-2 text-base"
                >
                    <Ban className="w-5 h-5" /> عدم الموافقة
                </Button>
            </div>

            <div className='rflex gap-2'>
                <TriangleAlert className='w-5 text-amber-500' />
                <h6 className='text-base text-amber-500 font-medium'>عدم الموافقة يعرض حسابك للإيقاف</h6>
            </div>
        </div>
    );
}

export default ConsultantOath;