import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

let socket = null;

export function initSocket() {
  socket = io('/realtime', { withCredentials: true });
  return socket;
}

export function on(event, handler) {
  socket?.on(event, handler);
}

export function off(event, handler) {
  socket?.off(event, handler);
}

