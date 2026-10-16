"use client";

import { useCallback, useRef, useState } from "react";
import {
  AppResponseDialog,
  type AppResponseVariant,
} from "@/components/AppResponseDialog";

type DialogState = {
  open: boolean;
  variant: AppResponseVariant;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  loading: boolean;
};

const closedState = (): DialogState => ({
  open: false,
  variant: "info",
  title: "",
  message: "",
  confirmLabel: "OK",
  cancelLabel: "Cancel",
  destructive: false,
  loading: false,
});

export type ConfirmDialogOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void | Promise<void>;
};

export type ResponseDialogOptions = {
  title?: string;
  confirmLabel?: string;
};

export function useAppDialog() {
  const [state, setState] = useState<DialogState>(closedState);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const confirmActionRef = useRef<(() => void | Promise<void>) | null>(null);

  const closeDialog = useCallback(() => {
    setState((previous) => {
      if (previous.loading) return previous;
      return closedState();
    });
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    confirmActionRef.current = null;
  }, []);

  const confirm = useCallback(
    (options: ConfirmDialogOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        confirmActionRef.current = options.onConfirm ?? null;
        setState({
          open: true,
          variant: "confirm",
          title: options.title ?? "Confirm action",
          message: options.message,
          confirmLabel: options.confirmLabel ?? "Confirm",
          cancelLabel: options.cancelLabel ?? "Cancel",
          destructive: options.destructive ?? false,
          loading: false,
        });
      });
    },
    []
  );

  const openResponse = useCallback(
    (
      variant: Exclude<AppResponseVariant, "confirm">,
      message: string,
      options: ResponseDialogOptions,
      defaultTitle: string
    ): Promise<void> => {
      return new Promise((resolve) => {
        resolveRef.current = () => {
          resolve();
        };
        setState({
          open: true,
          variant,
          title: options.title ?? defaultTitle,
          message,
          confirmLabel: options.confirmLabel ?? "OK",
          cancelLabel: "Cancel",
          destructive: false,
          loading: false,
        });
      });
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, options: ResponseDialogOptions = {}) =>
      openResponse("success", message, options, "Success"),
    [openResponse]
  );

  const showError = useCallback(
    (message: string, options: ResponseDialogOptions = {}) =>
      openResponse("error", message, options, "Something went wrong"),
    [openResponse]
  );

  const showWarning = useCallback(
    (message: string, options: ResponseDialogOptions = {}) =>
      openResponse("warning", message, options, "Warning"),
    [openResponse]
  );

  const handleConfirm = useCallback(async () => {
    if (state.variant !== "confirm") {
      closeDialog();
      return;
    }

    const confirmAction = confirmActionRef.current;
    if (confirmAction) {
      setState((previous) => ({ ...previous, loading: true }));
      try {
        await confirmAction();
        resolveRef.current?.(true);
        resolveRef.current = null;
        confirmActionRef.current = null;
        setState(closedState());
      } catch (error) {
        resolveRef.current?.(false);
        resolveRef.current = null;
        confirmActionRef.current = null;
        const message =
          error instanceof Error
            ? error.message
            : "Action failed. Please try again.";
        setState({
          open: true,
          variant: "error",
          title: "Something went wrong",
          message,
          confirmLabel: "OK",
          cancelLabel: "Cancel",
          destructive: false,
          loading: false,
        });
      }
      return;
    }

    resolveRef.current?.(true);
    resolveRef.current = null;
    confirmActionRef.current = null;
    setState(closedState());
  }, [closeDialog, state.variant]);

  const dialog = (
    <AppResponseDialog
      open={state.open}
      variant={state.variant}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      destructive={state.destructive}
      loading={state.loading}
      onConfirm={() => {
        void handleConfirm();
      }}
      onClose={closeDialog}
    />
  );

  return {
    confirm,
    showSuccess,
    showError,
    showWarning,
    closeDialog,
    dialog,
  };
}
