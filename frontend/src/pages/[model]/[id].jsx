import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

const GenericDetailPage = () => {
  const { model, id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(`/populate/read/${model}/${id}`);
        setData(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [model, id]); // ⭐ run only when model or id changes

  return (
    <div>
      <h1>Details Page</h1>
      <p>Model: {model}</p>
      <p>ID: {id}</p>

      <pre style={{ background: "#f0f0f0", padding: "10px", borderRadius: "6px" }}>
        {data ? JSON.stringify(data, null, 2) : "Loading..."}
      </pre>
    </div>
  );
};

export default GenericDetailPage;
