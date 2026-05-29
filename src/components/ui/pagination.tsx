import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const range = (start: number, end: number) => {
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
};

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const safeTotalPages = Math.max(1, totalPages);
    const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

    const pages: (number | "...")[] = [];

    if (safeTotalPages <= 7) {
        pages.push(...range(1, safeTotalPages));
    } else {
        const left = Math.max(2, safeCurrentPage - 1);
        const right = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

        pages.push(1);

        if (left > 2) pages.push("...");

        pages.push(...range(left, right));

        if (right < safeTotalPages - 1) pages.push("...");

        pages.push(safeTotalPages);
    }

    return (
        <div className="flex items-center justify-center gap-2 p-4 rounded-lg border bg-background/60">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                disabled={safeCurrentPage === 1}
                aria-label="الصفحة السابقة"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>

            {pages.map((p, idx) =>
                p === "..." ? (
                    <span key={`gap-${idx}`} className="px-3">
                        ...
                    </span>
                ) : (
                    <Button
                        key={p}
                        size="sm"
                        variant={p === safeCurrentPage ? "default" : "outline"}
                        onClick={() => onPageChange(Number(p))}
                    >
                        {p}
                    </Button>
                )
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
                disabled={safeCurrentPage === safeTotalPages}
                aria-label="الصفحة التالية"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default Pagination;

