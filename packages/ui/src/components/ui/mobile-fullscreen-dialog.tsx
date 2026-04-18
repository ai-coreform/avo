"use client";

import { Button } from "@avo/ui/components/ui/button";
import { DialogOverlay, DialogPortal } from "@avo/ui/components/ui/dialog";
import { cn } from "@avo/ui/lib/utils";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type * as React from "react";

type MobileFullscreenDialogContentProps = React.ComponentProps<
  typeof DialogPrimitive.Content
> & {
  desktopClassName?: string;
};

function MobileFullscreenDialogContent({
  className,
  desktopClassName,
  children,
  ...props
}: MobileFullscreenDialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay className="bg-black/30 supports-backdrop-filter:backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-0 z-50 flex h-dvh w-screen flex-col bg-background text-foreground",
          "data-[state=closed]:animate-out data-[state=open]:animate-in",
          "data-[state=closed]:slide-out-to-bottom-0 data-[state=open]:slide-in-from-bottom-0",
          "sm:inset-auto sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[92vh] sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border-4 sm:ring-1 sm:ring-slate-300 sm:ring-inset",
          "sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0",
          className,
          desktopClassName
        )}
        data-slot="mobile-fullscreen-dialog-content"
        {...props}
      >
        {children}
        <DialogPrimitive.Close asChild>
          <Button
            className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 sm:top-4 sm:right-4"
            size="icon-sm"
            variant="ghost"
          >
            <X />
            <span className="sr-only">Close</span>
          </Button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function MobileFullscreenDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-b bg-background/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pr-14 pb-4 sm:px-6 sm:py-5",
        className
      )}
      data-slot="mobile-fullscreen-dialog-header"
      {...props}
    />
  );
}

function MobileFullscreenDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5",
        className
      )}
      data-slot="mobile-fullscreen-dialog-body"
      {...props}
    />
  );
}

function MobileFullscreenDialogSection({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/70 bg-card/30 p-4 sm:p-5",
        className
      )}
      data-slot="mobile-fullscreen-dialog-section"
      {...props}
    />
  );
}

function MobileFullscreenDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-t bg-background/95 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5",
        className
      )}
      data-slot="mobile-fullscreen-dialog-footer"
      {...props}
    />
  );
}

export {
  MobileFullscreenDialogBody,
  MobileFullscreenDialogContent,
  MobileFullscreenDialogFooter,
  MobileFullscreenDialogHeader,
  MobileFullscreenDialogSection,
};
