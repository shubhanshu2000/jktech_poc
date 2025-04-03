import { convertBytes } from "./convertByte";

describe("convertByte", () => {
  it("should convert bytes to KB, MB, GB", () => {
    expect(convertBytes(1024)).toBe("1.0 KB");
    expect(convertBytes(1024 * 1024)).toBe("1.0 MB");
    expect(convertBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
  });

  it('should return "0" if bytes is 0', () => {
    expect(convertBytes(0)).toBe("0 Byte");
  });

  it('should return "Bytes" if bytes is less than 1024', () => {
    expect(convertBytes(1023)).toBe("1023 Bytes");
  });
});
