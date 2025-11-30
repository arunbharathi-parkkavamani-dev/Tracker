import { useState } from "react";

export default function InlineEdit({ value, onSave, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value || "");

  const save = async () => {
    setEditing(false);
    if (input !== value) await onSave(input);
  };

  if (!canEdit) return <span>{value || "—"}</span>;

  return editing ? (
    <input
      autoFocus
      className="border-none"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === "Enter" && save()}
    />
  ) : (
    <span
      className="cursor-pointer p-1 rounded"
      onClick={() => setEditing(true)}
    >
      {value || "—"}
    </span>
  );
}
