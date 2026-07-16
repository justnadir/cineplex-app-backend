import build from "pino-abstract-transport";
import fs from "fs";
import path from "path";

const RETENTION_DAYS: number = Number(process.env.LOG_RETENTION_DAYS) || 14;
const ONE_DAY_MS: number = 24 * 60 * 60 * 1000;

interface LogTransportOptions {
  successDir: string;
  errorDir: string;
}

interface StreamState {
  date: string | null;
  stream: fs.WriteStream | null;
  dir: string;
}

interface PinoLogObject {
  level: number;
  [key: string]: unknown;
}

type StreamType = "success" | "error";

function getDateStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function cleanupOldFiles(dir: string): void {
  if (!fs.existsSync(dir)) return;

  const now = Date.now();
  const maxAgeMs = RETENTION_DAYS * ONE_DAY_MS;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const match = file.match(/^(\d{4}-\d{2}-\d{2})\.log$/);
    if (!match) continue;
    const dateStr = match[1];
    if (!dateStr) continue;

    const fileDate = new Date(dateStr);
    if (now - fileDate.getTime() > maxAgeMs) {
      try {
        fs.unlinkSync(path.join(dir, file));
      } catch {
        // ignore,
      }
    }
  }
}

function msUntilNextMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  return nextMidnight.getTime() - now.getTime();
}

function scheduleAutoCleanup(dirs: string[]): void {
  const runCleanup = (): void => {
    for (const dir of dirs) {
      cleanupOldFiles(dir);
    }
  };

  runCleanup(); // startup cleanup

  const delay = msUntilNextMidnight();

  setTimeout(() => {
    runCleanup();
    setInterval(runCleanup, ONE_DAY_MS);
  }, delay);
}

export default function logTransport(opts: LogTransportOptions) {
  const { successDir, errorDir } = opts;

  fs.mkdirSync(successDir, { recursive: true });
  fs.mkdirSync(errorDir, { recursive: true });

  const streams: Record<StreamType, StreamState> = {
    success: { date: null, stream: null, dir: successDir },
    error: { date: null, stream: null, dir: errorDir },
  };

  scheduleAutoCleanup([successDir, errorDir]);

  function getStream(type: StreamType): fs.WriteStream {
    const today = getDateStr();
    if (streams[type].date !== today) {
      if (streams[type].stream) {
        streams[type].stream.end();
      }

      const filePath = path.join(streams[type].dir, `${today}.log`);
      streams[type].stream = fs.createWriteStream(filePath, { flags: "a" });
      streams[type].date = today;
    }
    return streams[type].stream as fs.WriteStream;
  }

  return build(async function (source: AsyncIterable<PinoLogObject>) {
    for await (const obj of source) {
      const line = JSON.stringify(obj) + "\n";
      if (obj.level >= 50) {
        getStream("error").write(line);
      } else {
        getStream("success").write(line);
      }
    }
  });
}
