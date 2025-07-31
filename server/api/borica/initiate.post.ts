import crypto from "crypto";

interface BoricaInitiateRequest {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  merchantData?: string;
}

interface BoricaConfig {
  terminalId: string;
  privateKey: string;
  merchantName: string;
  merchantUrl: string;
  backrefUrl: string;
  gatewayUrl: string;
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  try {
    const body = await readBody<BoricaInitiateRequest>(event);
    const {
      orderId,
      amount,
      currency = "BGN",
      description,
      customerEmail,
      merchantData,
    } = body;

    // Валидация на входящите данни
    if (!orderId || !amount || amount <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid order data",
      });
    }

    // Конфигурация от environment variables
    const config: BoricaConfig = {
      terminalId: process.env.BORICA_TERMINAL_ID || "V5400641",
      privateKey: process.env.BORICA_PRIVATE_KEY || "",
      merchantName: process.env.BORICA_MERCHANT_NAME || "MyStore",
      merchantUrl: process.env.BORICA_MERCHANT_URL || "https://myshop.com/",
      backrefUrl:
        process.env.BORICA_BACKREF_URL ||
        "https://myshop.com/api/borica/callback",
      gatewayUrl:
        process.env.BORICA_GATEWAY_URL ||
        "https://3dsgate-dev.borica.bg/cgi-bin/cgi_link",
    };

    if (!config.privateKey) {
      throw createError({
        statusCode: 500,
        statusMessage: "Borica configuration missing",
      });
    }

    // Генериране на уникални стойности
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString("hex").toUpperCase();

    // Форматиране на сумата (в стотинки)
    const amountInCents = Math.round(amount * 100).toString();

    // Параметри за заявката
    const params: Record<string, string> = {
      TERMINAL: config.terminalId,
      TRTYPE: "1", // Sale transaction
      AMOUNT: amountInCents,
      CURRENCY: currency,
      ORDER: orderId,
      DESC: description,
      MERCH_NAME: config.merchantName,
      MERCH_URL: config.merchantUrl,
      MERCHANT: config.terminalId,
      TIMESTAMP: timestamp,
      NONCE: nonce,
      EMAIL: customerEmail || "",
      MERCH_TOKEN_ID: merchantData || "",
      BACKREF: config.backrefUrl,
    };

    // Генериране на подпис
    const signatureData = [
      params.TERMINAL,
      params.TRTYPE,
      params.AMOUNT,
      params.CURRENCY,
      params.ORDER,
      params.TIMESTAMP,
      params.NONCE,
      params.MERCH_TOKEN_ID,
    ].join("");

    // Създаване на подпис с private key
    const signature = generateMacSignature(signatureData, config.privateKey);
    params.P_SIGN = signature;

    console.log("Borica payment initiated:", {
      orderId,
      amount: amountInCents,
      currency,
      timestamp,
      nonce,
      signature: signature.substring(0, 20) + "...",
    });

    return {
      success: true,
      gatewayUrl: config.gatewayUrl,
      parameters: params,
      formData: createFormHTML(config.gatewayUrl, params),
    };
  } catch (error: any) {
    console.error("Borica initiate error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal server error",
    });
  }
});

function generateMacSignature(data: string, privateKeyPem: string): string {
  try {
    // Проверяваме дали ключът има PEM headers
    let formattedKey = privateKeyPem;

    if (!formattedKey.includes("-----BEGIN PRIVATE KEY-----")) {
      // Ако няма headers, добавяме ги
      formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
    }

    // Заменяме \\n с реални нови редове
    formattedKey = formattedKey.replace(/\\n/g, "\n");

    console.log("Using private key format:", {
      hasBeginHeader: formattedKey.includes("-----BEGIN PRIVATE KEY-----"),
      hasEndHeader: formattedKey.includes("-----END PRIVATE KEY-----"),
      keyLength: formattedKey.length,
    });

    // Създаване на подпис
    const sign = crypto.createSign("SHA1");
    sign.update(Buffer.from(data, "utf8"));

    const signature = sign.sign(formattedKey);
    return signature.toString("hex").toUpperCase();
  } catch (error: any) {
    console.error("Signature generation error:", error);
    console.error(
      "Private key format:",
      privateKeyPem.substring(0, 100) + "..."
    );
    throw new Error(
      "Failed to generate signature: " + (error?.message || error)
    );
  }
}

function createFormHTML(
  actionUrl: string,
  params: Record<string, string>
): string {
  const inputs = Object.entries(params)
    .map(
      ([key, value]) => `<input type="hidden" name="${key}" value="${value}">`
    )
    .join("\n");

  return `
    <form id="borica-form" action="${actionUrl}" method="POST" style="display: none;">
      ${inputs}
    </form>
    <script>
      document.getElementById('borica-form').submit();
    </script>
  `;
}
