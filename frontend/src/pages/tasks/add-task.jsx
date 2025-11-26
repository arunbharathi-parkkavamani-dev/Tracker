import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";
import FormRenderer from "../../components/Common/FormRenderer";
import ActivityEntryFrom from "../../constants/ActivityEntryFrom";

const AddTask = ({ onClose, alert }) => {
    const { user } =useAuth();

    const handleSubmit = async(formData) => {
        try{
            const {clientName, projectType, title, titleNotes, useStory, observation, impacts, acceptanceCreteria, attachments, assignee, priorityLevel, startDate, endDate, tags} = formData;

            if(!clientName || !projectType || !title) {
                alert.message("Select all the required Fields");
                return;
            }

            const payload = {
                client : 
            }
        }
    }
}