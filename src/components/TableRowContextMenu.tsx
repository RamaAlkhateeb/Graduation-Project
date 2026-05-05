import { ReactNode } from "react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface RowAction {
    label: string;
    onSelect: () => void;
    icon?: ReactNode;
    destructive?: boolean;
    disabled?: boolean;
}

interface TableRowContextMenuProps {
    children: ReactNode;
    actions: RowAction[];
}

const TableRowContextMenu = ({ children, actions }: TableRowContextMenuProps) => {
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

            <ContextMenuContent className="font-tajawal">
                {actions.map((action, index) => (
                    <ContextMenuItem
                        key={action.label}
                        disabled={action.disabled}
                        onSelect={action.onSelect}
                        className={action.destructive ? "text-destructive focus:text-destructive" : ""}
                    >
                        <span className="flex items-center gap-2">
                            {action.icon}
                            {action.label}
                        </span>
                    </ContextMenuItem>
                ))}
            </ContextMenuContent>
        </ContextMenu>
    );
};

export default TableRowContextMenu;