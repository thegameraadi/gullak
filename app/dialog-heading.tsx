"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function focusDialogOnOpen(event: Event) {
  const dialog = event.target as HTMLElement;
  const mobile = window.matchMedia("(max-width: 620px), (pointer: coarse)").matches;
  const target = dialog.querySelector<HTMLElement>(mobile ? "[data-slot=dialog-title]" : "[data-autofocus]");
  if (target) {
    event.preventDefault();
    target.focus({ preventScroll: true });
  }
}

export default function DialogHeading({ title, children, busy }: { title: string; children: ReactNode; busy: boolean }) {
  return <header className="gullak-dialog-header">
    <DialogTitle className="dialog-title" tabIndex={-1}>{title}</DialogTitle>
    <DialogDescription className="dialog-description">{children}</DialogDescription>
    <DialogClose className="icon-button gullak-dialog-dismiss" disabled={busy} aria-label="Close"><X size={18}/></DialogClose>
  </header>;
}
