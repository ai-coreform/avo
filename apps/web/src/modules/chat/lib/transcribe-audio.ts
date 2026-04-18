import { CHAT_API_PATH, TRANSCRIBE_HEADER } from "./constants";

export class ChatUnauthorizedError extends Error {
  override readonly name = "ChatUnauthorizedError";
}

export async function transcribeAudioBlob(audioBlob: Blob): Promise<string> {
  const fd = new FormData();
  fd.append("audio", audioBlob, "voice.webm");

  const res = await fetch(CHAT_API_PATH, {
    method: "POST",
    headers: { [TRANSCRIBE_HEADER]: "1" },
    credentials: "include",
    body: fd,
  });

  if (res.status === 401) {
    throw new ChatUnauthorizedError();
  }

  if (!res.ok) {
    throw new Error("Transcribe request failed");
  }

  const data = (await res.json()) as { text?: string; error?: string };
  if (data.error || !data.text?.trim()) {
    throw new Error(data.error || "Empty transcription");
  }

  return data.text.trim();
}
