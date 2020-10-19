export default function makeId() {
  const random = crypto.getRandomValues(new Uint8Array(10));
  const name = arrayBufferToBase64(random)
    .replace("+", "-")
    .replace("/", "_")
    .replace("=", "");
  return `${name.replace("=", "")}`;
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const letters = btoa(binary);
  return letters.replace("+", "-").replace("/", "_");
}
