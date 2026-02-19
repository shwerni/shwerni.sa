"use client";
// React & Next
import React from "react";
import Link from "next/link";
import Image from "next/image";

// components
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CurrencyLabel from "@/app/_components/layout/currency/label";

// prisma types
import { Program } from "@/lib/generated/prisma/client";

// utils
import { cn } from "@/lib/utils";
import { totalAfterTax, findCategory } from "@/utils";

// icons
import { ChevronLeft, ChevronRight } from "lucide-react";

// props
interface Props {
    tax: number;
    programs: Program[];
}

const ConsultantPrograms: React.FC<Props> = ({ tax, programs }: Props) => {
    // pages state
    const [currentPage, setCurrentPage] = React.useState(1);

    // pages machanism
    const totalPages = Math.ceil(programs.length / 6);
    const startIndex = (currentPage - 1) * 6;
    const endIndex = startIndex + 6;
    const currentPrograms = programs.slice(startIndex, endIndex);

    // discount
    const discountTotal = (price: number) =>
        totalAfterTax(price + price * 0.2, tax);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Programs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentPrograms.map((program) => (
                    <Link key={program.id} href={`/dashboard/programs/${program.prid}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <div className="relative">
                                <Image
                                    src={program.image || ""}
                                    alt={program.title}
                                    width={300}
                                    height={200}
                                    className="w-full h-48 object-cover"
                                />
                                <Badge
                                    className={cn([
                                        "absolute top-3 left-3",
                                        findCategory(program.category)?.style ??
                                        "bg-gray-100 text-gray-800",
                                    ])}
                                    variant="secondary"
                                >
                                    {findCategory(program.category)?.category}
                                </Badge>
                            </div>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg line-clamp-2 text-zblue-200">
                                    {program.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <CardDescription className="h-10 text-sm mb-4 line-clamp-3">
                                    {program.summary}
                                </CardDescription>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col justify-start">
                                        <CurrencyLabel
                                            amount={program.price}
                                            tax={tax}
                                            className="text-xl font-bold"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                >
                    التالي
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>

                <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-10"
                        >
                            {page}
                        </Button>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    السابق
                </Button>
            </div>

            {/* Page Info */}
            <div className="text-center mt-4 text-sm text-muted-foreground">
                {startIndex + 1} - {Math.min(endIndex, programs.length)} من {" | "}
                {programs.length} برنامج
            </div>
        </div>
    );
};
export default ConsultantPrograms;
