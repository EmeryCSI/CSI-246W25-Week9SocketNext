/**
 * Socket.IO Chat Tutorial - Main Chat Component
 *
 * This component demonstrates real-time chat functionality using Socket.IO.
 * It includes features like:
 * - Username selection
 * - Real-time message updates
 * - Connection status display
 * - Transport protocol information
 */

"use client";

import { useEffect, useState } from "react";
import { socket } from "../socket";

/**
 * Interface for chat messages
 * Extends the basic MessageData with client-side specific fields
 */
interface Message {
  id: string; // Unique identifier for each message
  text: string; // Message content
  timestamp: number; // When the message was received
  username: string; // Sender's username
  type: "user" | "system"; // Type of message
}

export default function ChatPage() {
  // State for connection management
  const [isConnected, setIsConnected] = useState(false);
  // State for transport protocol
  // transport protocol is the protocol used to connect to the server
  const [transport, setTransport] = useState<string>("N/A");

  // State for chat functionality
  // messages is an array of messages
  // inputMessage is the message that the user is typing
  // username is the username of the user
  // isUsernameSet is a boolean that is true if the username is set
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  //useEffect that runs when the component mounts
  // it will establish a connection to the server
  useEffect(() => {
    /**
     * Handle successful socket connection
     * Updates connection status and transport protocol
     */
    function onConnect() {
      setIsConnected(true);
      // set the transport protocol to the name of the transport protocol
      // this is provided by socket.io
      setTransport(socket.io.engine.transport.name);

      // Listen for transport upgrades (e.g., from polling to WebSocket)
      // this is provided by socket.io
      // this allows for us to change the transport protocol if needed
      // if websocket is not available, it will use polling
      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    /**
     * Handle socket disconnection
     * Resets connection status and transport information
     */
    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    /**
     * Handle incoming messages
     * Creates a new message object with additional client-side data
     */
    function onMessage(message: { text: string; username: string }) {
      const newMessage: Message = {
        id: Math.random().toString(36).substring(7), // Generate random ID
        text: message.text,
        username: message.username,
        timestamp: Date.now(), // Add client-side timestamp
        type: "user",
      };
      setMessages((prev) => [...prev, newMessage]);
    }

    // Check if already connected when component mounts
    if (socket.connected) {
      onConnect();
    }

    // Set up event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message", onMessage);

    // Clean up event listeners on unmount
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message", onMessage);
    };
  }, []);

  /**
   * Handle sending messages
   * Emits the message to the server with username
   */
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      socket.emit("message", {
        text: inputMessage,
        username,
        type: "user",
      });
      setInputMessage("");
    }
  };

  /**
   * Handle username submission
   * Allows access to chat once username is set
   */
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
      // Emit user_joined event when username is set
      socket.emit("user_joined", username.trim());
    }
  };

  /**
   * Format timestamp into readable time
   */
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show username entry screen if username isn't set
  if (!isUsernameSet) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">
              Enter Your Username
            </h1>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-3 text-base text-slate-900 border border-slate-300 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder:text-slate-400"
                autoFocus
              />
              <button
                type="submit"
                className="w-full px-8 py-3 rounded-lg text-base font-semibold bg-blue-600 
                  hover:bg-blue-700 text-white transition-colors"
              >
                Join Chat
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header with title and username display */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-slate-900">
              Socket.IO Chat Tutorial
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Logged in as:</span>
              <span className="font-semibold text-slate-900">{username}</span>
            </div>
          </div>

          {/* Connection status and transport info */}
          <div className="bg-slate-50 rounded-lg p-4 mb-8 border border-slate-200">
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${
                    isConnected ? "bg-emerald-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="font-semibold text-slate-900">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-slate-700 font-medium">Transport:</span>
                <code className="ml-2 px-3 py-1 bg-slate-200 rounded-md text-sm font-mono text-slate-900">
                  {transport}
                </code>
              </div>
            </div>
          </div>

          {/* Message display area */}
          <div className="bg-slate-50 rounded-lg p-6 h-[400px] mb-8 overflow-y-auto border border-slate-200">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white rounded-lg shadow-sm p-4 mb-3 border ${
                  msg.type === "system"
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-100"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className={`font-semibold ${
                          msg.type === "system"
                            ? "text-slate-600"
                            : "text-slate-900"
                        }`}
                      >
                        {msg.username}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p
                      className={`${
                        msg.type === "system"
                          ? "text-slate-600 italic"
                          : "text-slate-900"
                      } text-base`}
                    >
                      {msg.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message input form */}
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 text-base text-slate-900 border border-slate-300 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                placeholder:text-slate-400"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected}
              className={`px-8 py-3 rounded-lg text-base font-semibold ${
                isConnected
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              } transition-colors`}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
