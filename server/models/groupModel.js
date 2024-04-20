import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true,
		},
		member: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
	
		profilePic: {
			type: String,
			default: "https://github.com/sameen-shi.png",
		},
		// createdAt, updatedAt => Member since <createdAt>
	},
	{ timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;