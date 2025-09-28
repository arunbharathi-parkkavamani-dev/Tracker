import {useState, useEffect} from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import useAuth from "../../context/authProvider";

const AddDailyEntry = () => {
    const {user} = useAuth();
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
}