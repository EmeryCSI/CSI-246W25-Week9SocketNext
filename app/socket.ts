/**
 * Socket.IO Client Configuration
 *
 * This file sets up the client-side Socket.IO connection with proper TypeScript types.
 * The 'use client' directive is necessary because Socket.IO client code must run in the browser.
 */

"use client";

import { io, Socket } from "socket.io-client";

/**
 * Interface defining the structure of a chat message
 * This ensures type safety when sending and receiving messages
 */
interface MessageData {
  text: string; // The content of the message
  username: string; // The sender's username
  type: "user" | "system"; // Type of message
}

/**
 * Type definitions for events we expect to receive from the server
 * This provides type checking for incoming socket events
 */
interface ServerToClientEvents {
  message: (message: MessageData) => void; // Server sends messages with MessageData structure
}

/**
 * Type definitions for events we send to the server
 * This provides type checking when emitting events
 */
interface ClientToServerEvents {
  message: (message: MessageData) => void; // Client sends messages with MessageData structure
  user_joined: (username: string) => void; // Client notifies server when user joins
}

/**
 * Create and export a typed Socket.IO client instance
 * The generic type parameters ensure type safety for all socket communications
 *
 * By default, Socket.IO connects to the same host that serves the page
 * In our case, it connects to our custom server.js
 */
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();
