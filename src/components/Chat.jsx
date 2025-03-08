"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react"; // Import emoji-picker-react

// Connect to the Socket.io server
const socket = io("https://chat-app-lake-nine-42.vercel.app/", {
  path: "/socket_io",
  transports: ["websocket"],
});

export default function ChatComponent() {
  const [darkMode, setDarkMode] = useState(true);
  const [username, setUsername] = useState("");
  const [tempName, setTempName] = useState(""); // For sidebar input
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]); // Array of { user, message }
  const [users, setUsers] = useState([]); // Array of usernames
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Reference for emoji picker container
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    if (!username) {
      const name = prompt("Please enter your name:");
      if (name) {
        setUsername(name);
        socket.emit("userJoined", name);
      }
    }

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("updateUsers", (userList) => {
      setUsers(userList);
    });

    socket.on("connect", () => {
      console.log("Connected to server with id:", socket.id);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("updateUsers");
    };
  }, [username]);

  const sendMessage = () => {
    if (!username) {
      alert("Please add your name first!");
      return;
    }
    if (message.trim()) {
      const msgData = { user: username, message: message };
      socket.emit("sendMessage", msgData);
      setMessage("");
    }
  };

  const handleSetName = () => {
    if (tempName.trim()) {
      setUsername(tempName.trim());
      socket.emit("userJoined", tempName.trim());
      setTempName("");
    } else {
      alert("Please enter a valid name.");
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Toggle emoji picker visibility
  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  // Append selected emoji to message input.
  // emojiData.emoji is the native emoji character.
  const onEmojiClick = (emojiData, event) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const containerClasses = darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black";
  const sidebarBg = darkMode ? "bg-gray-800" : "bg-blue-200";
  const chatBgSelf = darkMode ? "bg-green-700" : "bg-green-200";
  const chatBgOther = darkMode ? "bg-blue-700" : "bg-blue-200";
  const inputClasses = darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black border-gray-300";

  return (
    <div className={`${containerClasses} p-4 h-screen w-[90vw] flex flex-col md:flex-row`}>
      {/* Sidebar */}
      <div className="w-full md:w-1/4 shadow-2xl rounded-2xl shadow-gray-500 p-4 mb-4 md:mb-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-center font-bold">Joined Users</h1>
          <button onClick={toggleDarkMode} className="text-sm px-2 py-1 rounded bg-indigo-500 text-white">
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
        <p className="text-center text-sm font-medium mb-4">Total: {users.length}</p>
        {!username && (
          <div className="mb-4">
            <label className="block text-sm mb-2">Add Your Name:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1 shadow-2xl border p-2 rounded"
                placeholder="Your name"
              />
              <button onClick={handleSetName} className="bg-blue-500 text-white p-2 rounded">
                Set
              </button>
            </div>
          </div>
        )}
        {users.length > 0 ? (
          users.map((user, index) => (
            <p key={index} className={`p-1 my-1 rounded ${sidebarBg}`}>
              {user}
            </p>
          ))
        ) : (
          <p>No users connected</p>
        )}
      </div>

      {/* Chat Area */}
      <div className="w-full md:w-3/4 flex flex-col h-full">
        <div
          className="flex-1 overflow-y-auto p-2 border rounded space-y-2"
          style={{ maxHeight: "calc(100vh - 180px)" }}
        >
          {messages.map((msg, index) => {
            const isSelf = msg.user === username;
            return (
              <div
                key={index}
                className={`p-2 rounded max-w-[75%] ${isSelf ? `ml-auto text-right ${chatBgSelf}` : `mr-auto text-left ${chatBgOther}`}`}
              >
                <span className="font-bold">{isSelf ? "You:" : `${msg.user}: `}</span>
                {msg.message}
              </div>
            );
          })}
        </div>
        {/* Input Area with Emoji Button Inside */}
        <div className="relative flex items-center gap-2 mt-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`flex-1 border p-2 rounded shadow-sm ${inputClasses}`}
            placeholder="Type a message..."
          />
          <button onClick={toggleEmojiPicker} className="bg-gray-300 text-black px-3 py-1 rounded">
            {showEmojiPicker ? "Close Emojis" : "Emojis"}
          </button>
          <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded">
            Send
          </button>
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-10">
              <EmojiPicker onEmojiClick={onEmojiClick} theme={darkMode ? "dark" : "light"} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
