export function beautifyObjectName(string: string) {
  // Remove bracketed indices
  // if numbers only return the string
  let output = string.replace(/\[\d+\]/g, "").replace(/([A-Z])/g, " $1");
  output = output.charAt(0).toUpperCase() + output.slice(1);
  return output;
}
