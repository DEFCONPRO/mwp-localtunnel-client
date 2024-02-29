import { io } from 'socket.io-client';

class Tunnel {
  constructor({ id, url }, socket) {
    this.id = id;
    this.url = url;
    this.socket = socket;
  }

  async close() {
    const promise = new Promise((resolve) => {
      this.socket.on('disconnect', resolve);
    });

    this.socket.disconnect();

    await promise;
  }
}

export default function ({ host, port }) {
  return new Promise((resolve, reject) => {
    try {
      const socket = io(host);

      socket.on('init', (info) => {
        resolve(new Tunnel(info, socket));
      });

      socket.on('request', async ({id, path, method, headers, body}) => {
        const response = await fetch(`http://localhost:${port}${path}`, {
          method,
          headers,
          body,
        });

        const responseBody = await response.text();
        socket.emit(`${id}:response`, {
          id,
          statusCode: response.status,
          headers: response.headers,
          body: responseBody,
        });
      });
    } catch (e) {
      reject(e);
    }
  });
}
