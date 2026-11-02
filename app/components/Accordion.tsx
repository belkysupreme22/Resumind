import type { ReactNode } from "react";
import React, { createContext, useContext, useId, useState } from "react";
import { cn } from "~/lib/utils";
import { ChevronDown } from "lucide-react";

interface AccordionContextType {
    idPrefix: string;
    activeItems: string[];
    toggleItem: (id: string) => void;
    isItemActive: (id: string) => boolean;
}

const AccordionContext = createContext<AccordionContextType | undefined>(
    undefined
);

const useAccordion = () => {
    const context = useContext(AccordionContext);
    if (!context) {
        throw new Error("Accordion components must be used within an Accordion");
    }
    return context;
};

interface AccordionProps {
    children: ReactNode;
    defaultOpen?: string;
    allowMultiple?: boolean;
    className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
                                                        children,
                                                        defaultOpen,
                                                        allowMultiple = false,
                                                        className = "",
                                                    }) => {
    const idPrefix = useId();
    const [activeItems, setActiveItems] = useState<string[]>(
        defaultOpen ? [defaultOpen] : []
    );

    const toggleItem = (id: string) => {
        setActiveItems((prev) => {
            if (allowMultiple) {
                return prev.includes(id)
                    ? prev.filter((item) => item !== id)
                    : [...prev, id];
            } else {
                return prev.includes(id) ? [] : [id];
            }
        });
    };

    const isItemActive = (id: string) => activeItems.includes(id);

    return (
        <AccordionContext.Provider
            value={{ idPrefix, activeItems, toggleItem, isItemActive }}
        >
            <div className={`space-y-2 ${className}`}>{children}</div>
        </AccordionContext.Provider>
    );
};

interface AccordionItemProps {
    id: string;
    children: ReactNode;
    className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
                                                                id,
                                                                children,
                                                                className = "",
                                                            }) => {
    return (
        <div className={`accordion-item ${className}`}>
            {children}
        </div>
    );
};

interface AccordionHeaderProps {
    itemId: string;
    children: ReactNode;
    className?: string;
    icon?: ReactNode;
    iconPosition?: "left" | "right";
}

export const AccordionHeader: React.FC<AccordionHeaderProps> = ({
                                                                    itemId,
                                                                    children,
                                                                    className = "",
                                                                    icon,
                                                                    iconPosition = "right",
                                                                }) => {
    const { idPrefix, toggleItem, isItemActive } = useAccordion();
    const isActive = isItemActive(itemId);

    const defaultIcon = (
        <ChevronDown
            aria-hidden="true"
            className={cn("size-4 shrink-0 transition-transform duration-200", {
                "rotate-180": isActive,
            })}
            strokeWidth={2}
        />
    );

    const handleClick = () => {
        toggleItem(itemId);
    };

    return (
        <button
            type="button"
            id={`${idPrefix}-${itemId}-trigger`}
            aria-expanded={isActive}
            aria-controls={`${idPrefix}-${itemId}-content`}
            onClick={handleClick}
            className={`accordion-trigger ${className}`}
        >
            <div className="flex items-center space-x-3">
                {iconPosition === "left" && (icon || defaultIcon)}
                <div className="flex-1">{children}</div>
            </div>
            {iconPosition === "right" && (icon || defaultIcon)}
        </button>
    );
};

interface AccordionContentProps {
    itemId: string;
    children: ReactNode;
    className?: string;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
                                                                      itemId,
                                                                      children,
                                                                      className = "",
                                                                  }) => {
    const { idPrefix, isItemActive } = useAccordion();
    const isActive = isItemActive(itemId);

    return (
        <div
            id={`${idPrefix}-${itemId}-content`}
            role="region"
            aria-labelledby={`${idPrefix}-${itemId}-trigger`}
            hidden={!isActive}
            className={`accordion-body ${isActive ? "is-open" : ""} ${className}`}
        >
            <div className="accordion-content">{children}</div>
        </div>
    );
};
