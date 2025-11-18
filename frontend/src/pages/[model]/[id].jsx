import { useNavigate, useParams } from "react-router-dom";
import FloatingCard from "../../components/Common/FloatingCard.jsx";
import GenericDetailPage from "../../components/Common/Modal.jsx"; // your data component

export default function DetailModalRoute() {
  const navigate = useNavigate();
  const { model, id } = useParams();

  return (
    <FloatingCard onClose={() => navigate(-1)}>
      <GenericDetailPage model={model} id={id} />
    </FloatingCard>
  );
}
