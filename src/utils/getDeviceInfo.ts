import { UAParser } from "ua-parser-js";

function getDeviceInfo(userAgentString: string): string {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const os =
    [result.os.name, result.os.version].filter(Boolean).join(" ") ||
    "Unknown OS";
  const browser =
    [result.browser.name, result.browser.version].filter(Boolean).join(" ") ||
    "Unknown Browser";
  const deviceName =
    result.device?.model || result.browser.name || "Unknown Device";
  const deviceType = result.device?.type || "desktop";

  return `${browser} on ${os} (${deviceName} - ${deviceType})`;
}

export default getDeviceInfo;
