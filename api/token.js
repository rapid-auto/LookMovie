export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const currentToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjk0NzIsImVtYWlsIjoiZmF0ZWhicmFyOTJAZ21haWwuY29tIiwiZXhwIjoxNzc4MzczNDczLCJpYXQiOjE3Nzc3Njg2NzN9.qlM9HhjACai_gW4XzhD1JHLQ8EsygL65Ca6TO0ESuCU";

  res.status(200).json({ success: true, token: currentToken });
}
