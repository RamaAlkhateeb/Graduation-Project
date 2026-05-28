import React from "react";
import { Button } from "@/components/ui/button";

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
    if (totalPages <= 1) return null;

    const pages: (number | "...")[] = [];

    if (totalPages <= 7) {
        pages.push(...range(1, totalPages));
    } else {
        const left = Math.max(2, currentPage - 1);
        const right = Math.min(totalPages - 1, currentPage + 1);

        pages.push(1);

        if (left > 2) pages.push("...");

        pages.push(...range(left, right));

        if (right < totalPages - 1) pages.push("...");

        pages.push(totalPages);
    }

    return (
        <div className="flex items-center justify-center gap-2 p-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                السابق
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
                        variant={p === currentPage ? "default" : "outline"}
                        onClick={() => onPageChange(Number(p))}
                    >
                        {p}
                    </Button>
                )
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
            >
                التالي
            </Button>
        </div>
    );
};

export default Pagination;

