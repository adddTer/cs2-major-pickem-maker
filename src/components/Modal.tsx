import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export const Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidthClass?: string;
}> = ({ isOpen, onClose, title, children, maxWidthClass = "max-w-md md:max-w-2xl lg:max-w-[800px]" }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={cn("bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200", maxWidthClass)}>
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20 shrink-0">
                    <h3 className="font-bold text-zinc-100">{title}</h3>
                    <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
