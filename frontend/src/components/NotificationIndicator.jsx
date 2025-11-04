/* eslint-disable no-unused-vars */
import {useState, useEffect} from "react";
import { useNotification } from "../context/notificationProvider";

const NotificationIndicator = () => {
  const { unReadCount } = useNotification();

  return (
    <div>
      {unReadCount > 0 && <span>{unReadCount}</span>}
    </div>
  );
};

export default NotificationIndicator;
