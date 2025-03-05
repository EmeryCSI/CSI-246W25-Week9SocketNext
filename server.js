/**
 * Custom Server Setup for Next.js with Socket.IO
 *
 * Why do we need a custom server?
 * Next.js by default uses a serverless architecture, which doesn't support persistent connections
 * like WebSockets. To use Socket.IO, we need to create our own HTTP server that can:
 * 1. Handle regular Next.js requests
 * 2. Maintain WebSocket connections
 * 3. Manage Socket.IO events
 *
 * Downsides of using a custom server:
 * 1. Loses Next.js serverless capabilities - can't deploy to platforms like Vercel
 * 2. Removes automatic static optimization
 * 3. Requires manual server management and scaling
 * 4. May increase deployment complexity
 * 5. Needs more careful memory management for socket connections
 */

import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

// Configure the Next.js application
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

// Initialize Next.js instance with custom server options
const app = next({ dev, hostname, port });
// Get the default request handler from Next.js
const handler = app.getRequestHandler();

// Wait for Next.js to prepare the application
app.prepare().then(() => {
  // Create a standard Node.js HTTP server
  const httpServer = createServer(handler);

  // Initialize Socket.IO with the HTTP server
  // This allows Socket.IO to handle both HTTP and WebSocket connections
  const io = new Server(httpServer);

  // Handle Socket.IO connections
  io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle user joining with username
    socket.on("user_joined", (username) => {
      console.log("User joined:", username);
      // Store username in socket instance
      socket.username = username;
      // Broadcast join message to all clients
      io.emit("message", {
        text: "has joined the chat",
        username: username,
        type: "system",
      });
    });

    // Handle incoming messages
    socket.on("message", (message) => {
      console.log("Message received:", message);
      // Broadcast the message to all connected clients
      io.emit("message", {
        text: message.text,
        username: message.username,
        type: "user",
      });
    });

    // Handle client disconnections
    socket.on("disconnect", () => {
      if (socket.username) {
        console.log("User disconnected:", socket.username);
        // Broadcast disconnect message to all clients
        io.emit("message", {
          text: "has left the chat",
          username: socket.username,
          type: "system",
        });
      }
    });
  });

  // Start the server
  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

/*it's theoretically possible to implement Socket.IO through Next.js API routes, but it comes with significant limitations and caveats. Here's how it could work and why it might not be the best approach:
Using Next.js API Routes with Socket.IO:
}
However, this approach has several major drawbacks:
Connection Stability Issues:
API routes are designed for serverless environments
Each request is handled independently
WebSocket connections may not persist reliably
Connection might drop and reconnect frequently
Scaling Problems:
API routes are stateless by design
Socket.IO needs state management for connections
Multiple instances of your app would need external state sync
No built-in way to share socket connections between instances
Performance Impact:
Each WebSocket connection might trigger new serverless function invocations
Could lead to higher latency
Potentially higher costs in serverless environments
Limited Socket.IO Features:
Some Socket.IO features rely on having a persistent server
Room management would be more complex
Broadcast operations might not work as expected
Transport upgrades (polling to WebSocket) might be unreliable
Deployment Restrictions:
Many serverless platforms (including Vercel) don't support WebSocket connections
Would need to fall back to long-polling, which is less efficient
Some platforms might terminate long-running connections
The custom server.js approach, while more complex to set up initially, provides:
Stable, persistent connections
Full Socket.IO feature support
Better performance
More predictable behavior
Proper WebSocket support
Easier debugging and monitoring
If you absolutely need to use API routes (e.g., for serverless deployment), you might want to consider alternatives to Socket.IO like:
Server-Sent Events (SSE)
HTTP long-polling
Third-party real-time services (Pusher, Ably, etc.)
Edge Runtime with WebSocket support
But for a proper real-time chat application, the custom server approach remains the most robust solution.
*/
