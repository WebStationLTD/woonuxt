import crypto from "crypto";
import fs from 'fs';

interface BoricaInitiateRequest {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  merchantData?: string;
}

interface BoricaConfig {
  terminalId: string;
  privateKey: string;
  passphrase: string;
  merchantName: string;
  merchantUrl: string;
  backrefUrl: string;
  gatewayUrl: string;
  merchantId: string;
}

export default defineEventHandler(async (event) => {
  console.log("Borica initiate API called");

  if (getMethod(event) !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  try {
    const body = await readBody<BoricaInitiateRequest>(event);

    console.log("Request body:", body);

    const {
      orderId,
      amount,
      currency = "BGN",
      description,
      customerEmail,
      customerName,
    } = body;

    // Валидация на входящите данни
    if (!orderId || !amount || amount <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid order data",
      });
    }

    // Конфигурация от process.env (директно)
    const config: BoricaConfig = {
      terminalId: process.env.BORICA_TERMINAL_ID || "V5400641",
      privateKey: process.env.BORICA_PRIVATE_KEY || "",
      passphrase: process.env.BORICA_PASSPHRASE || "",
      merchantName: process.env.BORICA_MERCHANT_NAME || "LIDERFITNES EOOD",
      merchantUrl:
        process.env.BORICA_MERCHANT_URL || "https://woonuxt-ten.vercel.app/",
      backrefUrl:
        process.env.BORICA_BACKREF_URL ||
        "https://woonuxt-ten.vercel.app/api/borica/callback",
      gatewayUrl:
        process.env.BORICA_GATEWAY_URL ||
        "https://3dsgate-dev.borica.bg/cgi-bin/cgi_link",
      merchantId: process.env.BORICA_MERCHANT_ID || "",
    };

    console.log("Borica config loaded:", config);

    if (!config.privateKey) {
      console.error("BORICA_PRIVATE_KEY is missing or empty!");
      throw createError({
        statusCode: 500,
        statusMessage:
          "Borica configuration missing - BORICA_PRIVATE_KEY not found",
      });
    }

    // Генериране на уникални стойности
    const timestamp = generateTimestamp();
    const nonce = crypto.randomBytes(16).toString("hex").toUpperCase().substring(0, 32);

    // Форматиране на сумата (в стотинки)
    const amountInCents = Math.round(amount * 100).toString();

    const formattedOrderId = orderId.padStart(6, "0");

    const isTestMode = process.env.BORICA_TEST_ENABLED || false;

    console.log("🔔 BORICA TEST MODE:", isTestMode);

    // Параметри за заявката
    const params: Record<string, string> = {
      TERMINAL: config.terminalId,
      TRTYPE: "1", // Sale transaction
      AMOUNT: amount.toFixed(2),
      CURRENCY: isTestMode ? "EUR" : currency,
      ORDER: formattedOrderId,
      COUNTRY: 'BG',
      DESC: description,
      MERCH_NAME: config.merchantName,
      MERCH_URL: config.merchantUrl,
      MERCHANT: config.merchantId,
      TIMESTAMP: timestamp,
      NONCE: nonce,
      EMAIL: customerEmail || "",
      BACKREF: config.backrefUrl,
      "AD.CUST_BOR_ORDER_ID": `${formattedOrderId}@${formattedOrderId}`,
      ADDENDUM: "AD,TD",
      M_INFO: btoa(JSON.stringify({
        email: customerEmail,
        cardholderName: customerName
      }))
    };

    // Генериране на подпис
    const signatureData: string[] = [
      params.TERMINAL || '',
      params.TRTYPE || '',
      params.AMOUNT || '',
      params.CURRENCY || '',
      params.ORDER || '',
      params.TIMESTAMP || '',
      params.NONCE || '',
    ];

    // Създаване на подпис с private key
    const signature = generateMacSignature(signatureData, config.privateKey, config.passphrase);
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
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
    });

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message || error.statusMessage || "Internal server error",
    });
  }
});

function generateMacSignature(data: string[], privateKeyPem: string, passphrase: string): string {
  try {
    let signData = '';

    for (const token of data) {
      signData += token.length + token;
    }

    signData = signData + '-';

    console.log(
      "Generating signature for data:",
      signData
    );

    // Проверяваме дали ключът има PEM headers
    let formattedKey = atob(privateKeyPem);
    formattedKey = formattedKey.replace(/\\n/g, "\n");

    console.log(formattedKey);

    const sign = crypto.createSign("SHA256");
    sign.update(signData, "utf8");
    sign.end();

    const hexSignature = sign.sign({
      key: formattedKey,
      passphrase: passphrase,
    }, 'hex').toUpperCase();

    return hexSignature;
  } catch (error: any) {
    console.log(error);

    return '';
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

function generateTimestamp() {
  const d = new Date(); // current UTC timestamp in ms
  
  const YYYY = d.getUTCFullYear().toString();
  const MM   = String(d.getUTCMonth() + 1).padStart(2, "0");
  const DD   = String(d.getUTCDate()).padStart(2, "0");
  const HH   = String(d.getUTCHours()).padStart(2, "0");
  const mm   = String(d.getUTCMinutes()).padStart(2, "0");
  const SS   = String(d.getUTCSeconds()).padStart(2, "0");

  return YYYY + MM + DD + HH + mm + SS; // always 14 chars, in UTC
}