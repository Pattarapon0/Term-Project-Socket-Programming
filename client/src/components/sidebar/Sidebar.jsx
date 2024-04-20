import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import { useState } from "react";
import useConversation from "../../store/useConversation";
const Sidebar = () => {
	const { chat,setChat } = useConversation();
	return (
		<div className='border-r border-slate-500 p-4 flex flex-col'>
		<div><button className="btn" onClick={()=> setChat(true)}>private</button>
			<button className="btn" onClick={()=> setChat(false)}>group</button></div>	
			<Conversations />
			<LogoutButton />
		</div>
	);
};
export default Sidebar;