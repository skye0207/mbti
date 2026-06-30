export default function Toast({ message }) {
  return <div className={message ? 'toast show' : 'toast'}>{message}</div>;
}
