import { createContext, useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    // ✅ IMPORTANT: register user in socket
    newSocket.emit("newUser", currentUser.id);

    return () => newSocket.close();
  }, [currentUser]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
