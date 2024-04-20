import { useEffect } from "react";

import { useSocketContext } from "../context/SocketContext";
import useConversation from "../store/useConversation";


const useListenMessages = () => {
	const { socket } = useSocketContext();
	const { messages, setMessages,selectedConversation} = useConversation();
	useEffect(() => {
		socket?.on("newMessage", (newMessage) => {
			console.log(selectedConversation)
			console.log(newMessage[1])
			if(selectedConversation._id==newMessage[1]){
			setMessages([...messages, newMessage[0]]);}
		});

		return () => socket?.off("newMessage");
	}, [socket, setMessages, messages]);
};
export default useListenMessages;
