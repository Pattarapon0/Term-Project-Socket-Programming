import { useEffect, useState } from "react";
import toast from "react-hot-toast";
function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
	  const later = () => {
		clearTimeout(timeout);
		func(...args);
	  };
	  clearTimeout(timeout);
	  timeout = setTimeout(later, wait);
	};
  }
  
const useGetConversations = () => {
	const [loading, setLoading] = useState(false);
	const [conversations, setConversations] = useState([]);

	useEffect(() => {
		const getConversations = debounce(async (inputValue) => {
			setLoading(true);
			try {
			  const res = await fetch(`/api/users?search=${inputValue}`);
			  const data = await res.json();
			  if (data.error) {
				throw new Error(data.error);
			  }
			  const ll = [data.User, data.Group];
			  setConversations(ll);
			} catch (error) {
			  toast.error(error.message);
			} finally {
			  setLoading(false);
			}
		  }, 1000);

		getConversations();
	}, []);

	return { loading, conversations, setConversations };
};
export default useGetConversations;
