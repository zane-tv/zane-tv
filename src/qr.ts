import QRCode from "qrcode";

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

/** QR matrix as one path in module units (1 unit = 1 module), quiet zone excluded. */
export function qrPath(payload: string): { size: number; d: string } {
  const { size, data } = QRCode.create(payload, { errorCorrectionLevel: "M" }).modules;
  let d = "";
  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!data[row * size + col]) {
        col++;
        continue;
      }
      let end = col;
      while (end < size && data[row * size + end]) end++;
      d += `M${col} ${row}h${end - col}v1h${col - end}z`;
      col = end;
    }
  }
  return { size, d };
}
