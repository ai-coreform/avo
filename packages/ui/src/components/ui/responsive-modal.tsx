"use client";

import { cn } from "@avo/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { HTMLAttributes } from "react";

const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalClose = DialogPrimitive.Close;
const ModalPortal = DialogPrimitive.Portal;

const ModalOverlay = (props: DialogPrimitive.DialogOverlayProps) => (
  <DialogPrimitive.Overlay
    {...props}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      "data-[state=closed]:animate-out data-[state=open]:animate-in",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      props.className
    )}
  />
);

const ModalVariants = cva(
  cn(
    "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out",
    "data-[state=closed]:animate-out data-[state=open]:animate-in",
    "overflow-y-auto data-[state=closed]:duration-300 data-[state=open]:duration-500",
    "lg:top-[50%] lg:left-[50%] lg:w-full lg:max-w-lg lg:translate-x-[-50%] lg:translate-y-[-50%]",
    "lg:border lg:duration-200 lg:data-[state=closed]:animate-out lg:data-[state=open]:animate-in",
    "lg:data-[state=closed]:fade-out-0 lg:data-[state=open]:fade-in-0",
    "lg:data-[state=closed]:zoom-out-95 lg:data-[state=open]:zoom-in-95 lg:rounded-xl"
  ),
  {
    variants: {
      side: {
        top: "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 max-h-[80dvh] rounded-b-xl border-b lg:h-fit",
        bottom:
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 max-h-[80dvh] rounded-t-xl border-t lg:h-fit",
        left: "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 rounded-r-xl border-r sm:max-w-sm lg:h-fit",
        right:
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 rounded-l-xl border-l sm:max-w-sm lg:h-fit",
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  }
);

type ModalContentProps = DialogPrimitive.DialogContentProps &
  VariantProps<typeof ModalVariants>;

const ModalContent = ({
  side = "bottom",
  className,
  children,
  ...props
}: ModalContentProps) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      {...props}
      aria-describedby="responsive-modal-description"
      className={cn(ModalVariants({ side }), className)}
    >
      {children}
      <ModalClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </ModalClose>
    </DialogPrimitive.Content>
  </ModalPortal>
);

const ModalHeader = (props: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      props.className
    )}
  />
);

const ModalFooter = (props: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      props.className
    )}
  />
);

const ModalTitle = (props: DialogPrimitive.DialogTitleProps) => (
  <DialogPrimitive.Title
    {...props}
    className={cn("font-semibold text-foreground text-lg", props.className)}
  />
);

const ModalDescription = (props: DialogPrimitive.DialogDescriptionProps) => (
  <DialogPrimitive.Description
    {...props}
    className={cn("text-muted-foreground text-sm", props.className)}
  />
);

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalTrigger,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
};
