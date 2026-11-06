import jsQR from "jsqr";
import { PNG } from "pngjs";

/** CRC-16/CCITT-FALSE, as required by EMVCo merchant-presented QR (field 63). */
function crc16(input: string): string {
  let crc = 0xffff;
  for (const byte of Buffer.from(input, "utf8")) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** EMVCo tag-length-value fields. */
function tlv(input: string): Map<string, string> {
  const fields = new Map<string, string>();
  let i = 0;
  while (i < input.length) {
    const id = input.slice(i, i + 2);
    const len = Number(input.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(id) || Number.isNaN(len) || i + 4 + len > input.length) {
      throw new Error(`malformed EMVCo field at offset ${i}`);
    }
    fields.set(id, input.slice(i + 4, i + 4 + len));
    i += 4 + len;
  }
  return fields;
}

export type VietQR = { bin: string; account: string };

/** Validates a Napas VietQR payload (CRC + GUID) and extracts the beneficiary. */
export function parseVietQR(payload: string): VietQR {
  const body = payload.slice(0, -4);
  if (!body.endsWith("6304") || crc16(body) !== payload.slice(-4).toUpperCase()) {
    throw new Error("VietQR payload failed its CRC check");
  }
  const merchant = tlv(tlv(payload).get("38") ?? "");
  if (merchant.get("00") !== "A000000727") throw new Error("payload is not a Napas VietQR");
  const beneficiary = tlv(merchant.get("01") ?? "");
  const bin = beneficiary.get("00");
  const account = beneficiary.get("01");
  if (!bin || !account) throw new Error("VietQR payload has no beneficiary account");
  return { bin, account };
}

/** Reads the QR code printed in a PNG, so text shown next to the image can't drift from it. */
export function readQR(png: Uint8Array): { payload: string; width: number; height: number } {
  const image = PNG.sync.read(Buffer.from(png));
  const code = jsQR(new Uint8ClampedArray(image.data), image.width, image.height);
  if (!code) throw new Error("no QR code found in the image");
  return { payload: code.data, width: image.width, height: image.height };
}
