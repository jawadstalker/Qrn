import { Alert, Platform } from "react-native";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Marks the confirm button red (iOS) for actions that delete something. */
  destructive?: boolean;
}

/**
 * Asks the person to confirm. Resolves true only for the confirm button.
 * React Native's Alert does nothing in a browser, so the web uses window.confirm.
 */
export function confirmAction({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === "web") {
    const ask = (globalThis as { confirm?: (text: string) => boolean }).confirm;

    return Promise.resolve(ask ? ask(`${title}\n\n${message}`) : true);
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
