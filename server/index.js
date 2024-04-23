
import express from "express"
import dotenv from "dotenv"
import connectToDB from "./db/conectToDB.js"
import bcrypt from "bcryptjs";
import User from "./models/userModel.js";
import generateTokenAndSetCookie from "./utils/generateToken.js"
import protectRoute from "./middleware/protectRoute.js";
import cookieParser from 'cookie-parser';
import { io,app,server } from "./socket/socket.js";
import Conversation from "./models/conversationModel.js";
import Message from "./models/messageModel.js"; 
import { getReceiverSocketId } from "./socket/socket.js";
import Group from "./models/groupModel.js";
dotenv.config();
const PORT = process.env.PORT || 5000
app.use(express.json())
app.use(cookieParser());
dotenv.config();
app.get("/",(req,res)=>{
    res.send("Hah")
});

app.post("/api/signup",async (req,res)=> {
    try {
		const { fullName, username, password, confirmPassword, gender } = req.body;

		if (password !== confirmPassword) {
			return res.status(400).json({ error: "Passwords don't match" });
		}

		const user = await User.findOne({ username });

		if (user) {
			return res.status(400).json({ error: "Username already exists" });
		}

		// HASH PASSWORD HERE
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// https://avatar-placeholder.iran.liara.run/

		const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
		const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

		const newUser = new User({
			fullName,
			username,
			password: hashedPassword,
			gender,
			profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
		});

		if (newUser) {
			// Generate JWT token here
			generateTokenAndSetCookie(newUser._id, res);
			await newUser.save();

			res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				profilePic: newUser.profilePic,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.post("/api/login",async (req,res)=>{
    try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username or password" });
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			profilePic: user.profilePic,
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.post("/api/logout", async (req,res)=>{
    try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.get("/api/messages/:id", protectRoute, async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;

		const conversation = await Conversation.findOne({
			participants: { $all: [senderId, userToChatId] },
		}).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

		if (!conversation) return res.status(200).json([]);

		const messages = conversation.messages;

		res.status(200).json(messages);
	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
});

    app.post("/api/messages/send/:id", protectRoute,async (req, res) => {
        try {
            const { message } = req.body;
            const { id: receiverId } = req.params;
            const senderId = req.user._id;
			var id=senderId
            let conversation = await Conversation.findOne({
                participants: { $all: [senderId, receiverId] },
            });
			let gro=await Group.findOne({
				_id: { $all: [receiverId] },
			});
			if(gro){
				id=receiverId
				let gropo=await Conversation.findOne({
					participants: { $all: [receiverId] },
				});
				if(gropo){
					if (!gropo.participants.includes(senderId)) {
						gropo.participants.push(senderId);
						await gropo.save(); 
						conversation=gropo
					}
				}
			}
            if (!conversation) {
				conversation = await Conversation.create({
                    participants: [senderId, receiverId],
                });
            }
			let imgpic=  await User.findOne({
				_id: [senderId]
			}).select('profilePic -_id').exec()
			const messagePic=imgpic.profilePic
            const newMessage = new Message({
                senderId,
                receiverId,
                message,
				messagePic,
            });
    
            if (newMessage) {
                conversation.messages.push(newMessage._id);
            }
    
            // await conversation.save();
            // await newMessage.save();
		
            // this will run in parallel
			await Promise.all([conversation.save(), newMessage.save()]);
			conversation.participants.forEach(participantId => {
				const receiverSocketId = getReceiverSocketId(participantId);
			
				if (receiverSocketId&& participantId!=senderId) {
					// Emit the message to each participant's socket
					io.to(receiverSocketId).emit("newMessage", [newMessage,id]);
				}
			});
            res.status(201).json(newMessage);
        } catch (error) {
            console.log("Error in sendMessage controller: ", error.message);
            res.status(500).json({ error: "Internal server error" });
        }});
    
	app.get('/api/users',protectRoute,async (req, res) => {
		try {
			const loggedInUserId = req.user._id;
	
			const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
			const groupChat= await Group.find();
			const allCc = {
				User: filteredUsers,
				Group: groupChat
			  };
			res.status(200).json(allCc);
		} catch (error) {
			console.error("Error in getUsersForSidebar: ", error.message);
			res.status(500).json({ error: "Internal server error" });
		}
	})	
	app.post('/api/creategroup',protectRoute,async (req, res) => {
		try {
            const {fullName} = req.body;
			console.log(fullName)
			const group = await Group.create({
				fullName: fullName,
				member:[],
				});
			io.emit("newGroup",group);
            res.status(201).json(group);
        } catch (error) {
            console.log("Error in sendMessage controller: ", error.message);
            res.status(500).json({ error: "Internal server error" });
        }}
		
	);

server.listen(PORT,() => {
    connectToDB();
    console.log(`${PORT}`)});