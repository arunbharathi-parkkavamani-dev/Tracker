import fetch from "node-fetch";

export const sendPush = async ({ pushToken, title, body, data }) => {
  if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return;

  const payload = {
    to: pushToken,
    sound: "default",
    title,
    body,
    data,
  };

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Push send error:", err);
  }
};
