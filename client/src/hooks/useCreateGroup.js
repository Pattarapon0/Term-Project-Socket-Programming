import { useState } from "react";
import toast from "react-hot-toast";

const useCreateGroup = () => {
	const [createloading, setLoading] = useState(false);

	const createGroup = async ({ fullName}) => {
		const success = handleInputErrors({ fullName });
		if (!success) return;

		setLoading(true);
		try {
			const res = await fetch("/api/creategroup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ fullName}),
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}

			return data;
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return { createloading, createGroup };
};
export default useCreateGroup;

function handleInputErrors({ fullName}) {
	if (!fullName) {
		toast.error("Please fill group name");
		return false;
	}

	

	return true;
}