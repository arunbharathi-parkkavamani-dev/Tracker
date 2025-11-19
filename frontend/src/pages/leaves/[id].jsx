import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import FloatingCard from "../../components/Common/FloatingCard.jsx";
import GenericDetailPage from "./model.jsx";

export default function DetailModalRoute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);               // close modal visually
  };

  if (!open) return null; // just hide, don't navigate here

  return (
    <FloatingCard onClose={handleClose}>
      <GenericDetailPage id={id} onClose={handleClose} />
    </FloatingCard>
  );
}
