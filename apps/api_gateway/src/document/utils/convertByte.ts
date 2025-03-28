export function convertBytes(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB"];

  if (bytes === 0) {
    return "0 Byte";
  }

  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  if (i == 0) {
    return bytes + " " + sizes[i];
  }

  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
}
