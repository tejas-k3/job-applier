const AUTO_FILL_KEY = 'auto-fill-supported-tabs';

export async function getAutoFillEnabled(): Promise<boolean> {
  const value = await chrome.storage.local.get(AUTO_FILL_KEY);
  return value[AUTO_FILL_KEY] === true;
}

export async function setAutoFillEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [AUTO_FILL_KEY]: enabled });
}
