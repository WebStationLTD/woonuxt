// cryptor.ts
import * as crypto from 'crypto';

export enum CryptFormat {
  RAW = 0,
  B64 = 1,
  HEX = 2,
}

export class Cryptor {
  private cipherAlgo: string;
  private hashAlgo: string;
  private ivNumBytes: number;
  private format: CryptFormat;

  /**
   * Construct a Cryptor, using aes256 encryption, sha256 key hashing and base64 encoding.
   * @param cipherAlgo Cipher algorithm (e.g. 'aes-256-ctr').
   * @param hashAlgo   Key hashing algorithm (e.g. 'sha256').
   * @param fmt        Output format: RAW, B64 or HEX.
   */
  constructor(
    cipherAlgo: string = 'aes-256-ctr',
    hashAlgo: string = 'sha256',
    fmt: CryptFormat = CryptFormat.B64
  ) {
    this.cipherAlgo = cipherAlgo;
    this.hashAlgo = hashAlgo;
    this.format = fmt;

    // Validate cipher / hash like in PHP
    if (!crypto.getCiphers().includes(cipherAlgo)) {
      throw new Error(`Cryptor:: - unknown cipher algo ${cipherAlgo}`);
    }

    if (!crypto.getHashes().includes(hashAlgo)) {
      throw new Error(`Cryptor:: - unknown hash algo ${hashAlgo}`);
    }

    // Determine IV length (Node 10+)
    let ivLen = 16; // sensible default for AES-*-* ciphers
    if (typeof (crypto as any).getCipherInfo === 'function') {
      const info = (crypto as any).getCipherInfo(cipherAlgo) as
        | { ivLength?: number }
        | undefined;
      if (info && typeof info.ivLength === 'number') {
        ivLen = info.ivLength;
      }
    }

    this.ivNumBytes = ivLen;
  }

  /**
   * Encrypt a string.
   * @param inStr String to encrypt.
   * @param key   Encryption key.
   * @param fmt   Optional override for output format (RAW, B64 or HEX).
   * @return Encrypted data (Buffer for RAW, string otherwise).
   */
  public encryptString(
    inStr: string,
    key: crypto.BinaryLike,
    fmt: CryptFormat | null = null
  ): string | Buffer {
    if (fmt === null || fmt === undefined) {
      fmt = this.format;
    }

    // IV
    const iv = crypto.randomBytes(this.ivNumBytes);

    // Hash the key (binary)
    const keyhash = crypto.createHash(this.hashAlgo).update(key).digest();

    // Encrypt
    const cipher = crypto.createCipheriv(this.cipherAlgo, keyhash, iv);
    const encrypted = Buffer.concat([
      cipher.update(inStr, 'utf8'),
      cipher.final(),
    ]);

    // Prepend IV
    let res = Buffer.concat([iv, encrypted]);

    // Format result
    if (fmt === CryptFormat.B64) {
      return res.toString('base64');
    } else if (fmt === CryptFormat.HEX) {
      return res.toString('hex');
    }

    // RAW
    return res;
  }

  /**
   * Decrypt a string.
   * @param inData Data to decrypt (string if B64/HEX, Buffer or binary string if RAW).
   * @param key    Decryption key.
   * @param fmt    Optional override for input format (RAW, B64 or HEX).
   * @return Decrypted UTF-8 string.
   */
  public decryptString(
    inData: string | Buffer,
    key: crypto.BinaryLike,
    fmt: CryptFormat | null = null
  ): string {
    if (fmt === null || fmt === undefined) {
      fmt = this.format;
    }

    let raw: Buffer;

    // Decode by format
    if (fmt === CryptFormat.B64) {
      raw = Buffer.from(String(inData), 'base64');
    } else if (fmt === CryptFormat.HEX) {
      raw = Buffer.from(String(inData), 'hex');
    } else {
      // RAW
      if (Buffer.isBuffer(inData)) {
        raw = inData;
      } else {
        raw = Buffer.from(inData, 'binary');
      }
    }

    // Integrity check
    if (raw.length < this.ivNumBytes) {
      throw new Error(
        `Cryptor::decryptString() - data length ${raw.length} is less than iv length ${this.ivNumBytes}`
      );
    }

    // Extract IV and ciphertext
    const iv = raw.subarray(0, this.ivNumBytes);
    const enc = raw.subarray(this.ivNumBytes);

    // Hash key
    const keyhash = crypto.createHash(this.hashAlgo).update(key).digest();

    // Decrypt
    const decipher = crypto.createDecipheriv(this.cipherAlgo, keyhash, iv);
    let decrypted: Buffer;
    try {
      decrypted = Buffer.concat([decipher.update(enc), decipher.final()]);
    } catch (e: any) {
      throw new Error(
        `Cryptor::decryptString - decryption failed: ${e?.message ?? String(e)}`
      );
    }

    return decrypted.toString('utf8');
  }

  /**
   * Static convenience method for encrypting.
   */
  public static Encrypt(
    inStr: string,
    key: crypto.BinaryLike,
    fmt: CryptFormat | null = null
  ): string | Buffer {
    const c = new Cryptor();
    return c.encryptString(inStr, key, fmt);
  }

  /**
   * Static convenience method for decrypting.
   */
  public static Decrypt(
    inData: string | Buffer,
    key: crypto.BinaryLike,
    fmt: CryptFormat | null = null
  ): string {
    const c = new Cryptor();
    return c.decryptString(inData, key, fmt);
  }
}
