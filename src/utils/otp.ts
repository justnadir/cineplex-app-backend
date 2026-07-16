import crypto from "crypto";

export const generateOTP = () => {
  return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
};

export class OtpGeneratorService {
  private timingSafeCompare(a: string, b: string): boolean {
    const bufferA = Buffer.from(a, "utf-8");
    const bufferB = Buffer.from(b, "utf-8");

    if (bufferA.length !== bufferB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  generateOTP(): number {
    return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
  }

  hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  verifyOtp(inputOtp: string, storedHash: string): boolean {
    const inputHash = this.hashOtp(inputOtp);
    return this.timingSafeCompare(inputHash, storedHash);
  }
}
