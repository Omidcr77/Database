let ioRef = null;

export function attachRealtime(io) {
  ioRef = io.of('/realtime');
  ioRef.on('connection', (socket) => {
    // could add auth here if desired
    socket.emit('connected', { ok: true });
  });
}

export const realtime = {
  emitCustomer(event, payload) {
    if (ioRef) ioRef.emit(`customer:${event}`, payload);
  },
  emitTransaction(event, payload) {
    if (ioRef) ioRef.emit(`transaction:${event}`, payload);
  },
  emitStatsUpdated() {
    if (ioRef) ioRef.emit('stats:updated', {});
  }
};

