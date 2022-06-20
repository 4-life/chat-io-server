export default function env() {
  if (process.env.NODE_ENV === 'production') {
    return {
      CLIENT_URL: 'https://chat-io-server-4life.herokuapp.com/socket.io/*',
    };
  }

  return {
    CLIENT_URL: '*',
  };
}
