import useGetConversations from "../../hooks/useGetConversations";
import Conversation from "./Conversation";
import useConversation from "../../store/useConversation";
import toast from "react-hot-toast";
import useCreateGroup from "../../hooks/useCreateGroup";
import { useState,useEffect} from "react";
import { useSocketContext } from "../../context/SocketContext";
const Conversations = () => {
    const { loading, conversations, setConversations } = useGetConversations();
    const { chat } = useConversation();
    const [inputs, setInputs] = useState({ fullName: "" });
    const { createloading, createGroup } = useCreateGroup();
    const useListenGroup = () => {
        const { socket } = useSocketContext();
        useEffect(() => {
            socket?.on("newGroup", (newGroup) => {
                setConversations(prev => {
                    const updated = [...prev];
                    const index = chat ? 0 : 1;
                    const existingIndex = updated[index].findIndex(group => group._id === newGroup._id);
                
                    if (existingIndex !== -1) {
                        updated[index][existingIndex] = newGroup;
                    } else {
                        updated[index].push(newGroup);
                    }
                
                    return updated;
                });
                
            });
            return () => socket?.off("newGroup");
        }, [socket, setConversations, conversations]);
    };
    const handleSubmit = async (event) => {
        event.preventDefault(); 
        const newGroup = await createGroup(inputs); 
        if (newGroup) {
			//setConversations(prev => {
			//	const updated = [...prev];
			//	const index = chat ? 0 : 1;
			//	const existingIndex = updated[index].findIndex(group => group._id === newGroup._id);
			
			//	if (existingIndex !== -1) {
			//		updated[index][existingIndex] = newGroup;
			//	} else {
			//		updated[index].push(newGroup);
			//	}
			
			//	return updated;
			//});
			
           setInputs({ fullName: "" }); // Reset input field
           toast.success("Group created successfully!");
       }
    };
    useListenGroup();
    return (
        <>
            <div className='py-2 flex flex-col overflow-auto w-full'>
                {conversations[chat ? 0 : 1] && conversations[chat ? 0 : 1].map((conversation, idx) => (
                    <Conversation
                        key={conversation._id}
                        conversation={conversation}
                        lastIdx={idx === conversations[chat ? 0 : 1].length - 1}
                    />
                ))}
                {loading ? <span className='loading loading-spinner mx-auto'></span> : null}
            </div>
            {!chat && (
                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
                    <input
                        type='text'
                        placeholder='Group Name'
                        className='input input-bordered w-full max-w-xs h-10'
                        value={inputs.fullName}
                        onChange={(e) => setInputs({ ...inputs, fullName: e.target.value })}
                    />
                    <div className="w-full flex justify-center pt-2">
                        <button className="btn max-w-xs w-full" type="submit">Create Group</button>
                    </div>
                </form>
            )}
        </>
    );
};
export default Conversations;