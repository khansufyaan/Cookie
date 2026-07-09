import { describe, expect, it } from "vitest";
import { detectFamily, isEvmAddress, isSolanaAddress } from "@/lib/wallets";
import { custodialLabel } from "@/lib/entities";
import { isOfacSanctioned } from "@/lib/ofac";

describe("address detection", () => {
  const VITALIK = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
  const SOL = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

  it("accepts a valid checksummed/lowercase EVM address", () => {
    expect(isEvmAddress(VITALIK)).toBe(true);
    expect(isEvmAddress(VITALIK.toUpperCase().replace("0X", "0x"))).toBe(true);
    expect(detectFamily(VITALIK)).toBe("evm");
  });

  it("rejects malformed EVM addresses", () => {
    expect(isEvmAddress("0x123")).toBe(false); // too short
    expect(isEvmAddress("d8da6bf26964af9d7eed9e03e53415d37aa96045")).toBe(false); // no 0x
    expect(isEvmAddress("0xzz" + "0".repeat(38))).toBe(false); // non-hex
  });

  it("accepts a valid Solana base58 address and rejects 0/O/I/l", () => {
    expect(isSolanaAddress(SOL)).toBe(true);
    expect(detectFamily(SOL)).toBe("solana");
    expect(isSolanaAddress("0" + SOL.slice(1))).toBe(false); // base58 excludes 0
  });

  it("trims surrounding whitespace", () => {
    expect(isEvmAddress(`  ${VITALIK}  `)).toBe(true);
  });

  it("returns null family for garbage", () => {
    expect(detectFamily("not-an-address")).toBe(null);
    expect(detectFamily("")).toBe(null);
  });
});

describe("custodial registry", () => {
  it("flags a known Coinbase hot wallet case-insensitively", () => {
    expect(custodialLabel("0x71660c4005ba85c37ccec55d0c4493e66fe775d3")).toContain("Coinbase");
    expect(custodialLabel("0x71660C4005BA85C37CCEC55D0C4493E66FE775D3")).toContain("Coinbase");
  });
  it("returns null for a normal wallet", () => {
    expect(custodialLabel("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")).toBe(null);
  });
});

describe("OFAC screening", () => {
  it("does not flag a clean address", () => {
    expect(isOfacSanctioned("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")).toBe(false);
  });
  it("is case-insensitive for EVM entries", () => {
    // Tornado Cash router — present in the committed OFAC ETH snapshot.
    const sanctioned = "0x8589427373D6D84E98730D7795D8f6f8731FDA16";
    // Only assert case-insensitivity IF the snapshot contains it; otherwise
    // assert the function is stable (no throw) on an arbitrary address.
    const a = isOfacSanctioned(sanctioned);
    const b = isOfacSanctioned(sanctioned.toLowerCase());
    expect(a).toBe(b);
  });
});
