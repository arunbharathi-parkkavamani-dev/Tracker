import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";

export default function AddComment({ threadId, onAdded }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await axiosInstance.put(`/populate/update/commentsthreads/${threadId}`, {
      comments: {
        commentedBy: user.id,
        message: text
      }
    });
    setText("");
    setLoading(false);
    onAdded?.();
  };

  return (
    <div className="flex items-center mt-6 space-x-3">
      <img
        src={`https://ui-avatars.com/api/?name=${user?.firstName || "U"}`}
        className="w-10 h-10 rounded-full"
      />
      <input
        className="flex-1 border px-3 py-2 rounded-lg"
        placeholder="Your thoughts on this..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={submit}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
