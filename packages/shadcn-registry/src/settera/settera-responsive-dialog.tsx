"use client";

import React, { createContext, useContext } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const ResponsiveDialogContext = createContext(false);

export interface ResponsiveDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preventDismiss?: boolean;
}

export function ResponsiveDialog({
  children,
  open,
  onOpenChange,
  preventDismiss,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <ResponsiveDialogContext.Provider value={true}>
        <Drawer
          open={open}
          onOpenChange={onOpenChange}
          dismissible={!preventDismiss}
        >
          {children}
        </Drawer>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={false}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogTrigger({
  children,
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const isMobile = useContext(ResponsiveDialogContext);

  if (isMobile) {
    return <DrawerTrigger {...props}>{children}</DrawerTrigger>;
  }

  return <DialogTrigger {...props}>{children}</DialogTrigger>;
}

export function ResponsiveDialogContent({
  children,
  className,
  onOpenAutoFocus,
  onInteractOutside,
  onEscapeKeyDown,
  onPointerDownOutside,
  ref,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const isMobile = useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerContent className={className} {...props}>
        <div className="overflow-y-auto">{children}</div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent
      ref={ref}
      className={className}
      onOpenAutoFocus={onOpenAutoFocus}
      onInteractOutside={onInteractOutside}
      onEscapeKeyDown={onEscapeKeyDown}
      onPointerDownOutside={onPointerDownOutside}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

export function ResponsiveDialogHeader({
  children,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  const isMobile = useContext(ResponsiveDialogContext);

  if (isMobile) {
    return <DrawerHeader {...props}>{children}</DrawerHeader>;
  }

  return <DialogHeader {...props}>{children}</DialogHeader>;
}

export function ResponsiveDialogFooter({
  children,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  const isMobile = useContext(ResponsiveDialogContext);

  if (isMobile) {
    return <DrawerFooter {...props}>{children}</DrawerFooter>;
  }

  return <DialogFooter {...props}>{children}</DialogFooter>;
}

export function ResponsiveDialogTitle({
  children,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const isMobile = useContext(ResponsiveDialogContext);

  if (isMobile) {
    return <DrawerTitle {...props}>{children}</DrawerTitle>;
  }

  return <DialogTitle {...props}>{children}</DialogTitle>;
}

export function ResponsiveDialogDescription({
  children,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const isMobile = useContext(ResponsiveDialogContext);

  if (isMobile) {
    return <DrawerDescription {...props}>{children}</DrawerDescription>;
  }

  return <DialogDescription {...props}>{children}</DialogDescription>;
}

export function ResponsiveDialogClose({
  children,
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  const isMobile = useContext(ResponsiveDialogContext);

  if (isMobile) {
    return <DrawerClose {...props}>{children}</DrawerClose>;
  }

  return <DialogClose {...props}>{children}</DialogClose>;
}
