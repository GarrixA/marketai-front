export const ACTION_DELAY_MS = 1100;

export function waitForAction(ms = ACTION_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
