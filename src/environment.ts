export default function env() {
  if (process.env.NODE_ENV === 'production') {
    return {
      CLIENT_URL: 'https://test.4life.work',
    };
  }

  return {
    CLIENT_URL: '*',
  };
}
