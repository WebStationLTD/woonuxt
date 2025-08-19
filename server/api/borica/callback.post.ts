import crypto from "crypto";

interface BoricaCallbackData {
  ACTION: string;
  RC: string;
  APPROVAL: string;
  TERMINAL: string;
  TRTYPE: string;
  AMOUNT: string;
  CURRENCY: string;
  ORDER: string;
  RRN: string;
  INT_REF: string;
  PARES_STATUS: string;
  ECI: string;
  TIMESTAMP: string;
  NONCE: string;
  MERCH_TOKEN_ID: string;
  P_SIGN: string;
  STATUSMSG?: string;
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // Поддържаме и GET и POST заявки
  if (method !== "POST" && method !== "GET") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  try {
    // За GET заявки вземаме данните от query parameters
    // За POST заявки вземаме данните от body
    let data: BoricaCallbackData;

    if (method === "GET") {
      const query = getQuery(event);
      data = query as unknown as BoricaCallbackData;
      console.log("Borica GET callback received:", query);
    } else {
      data = await readBody<BoricaCallbackData>(event);
      console.log("Borica POST callback received:", {
        action: data.ACTION,
        rc: data.RC,
        order: data.ORDER,
        amount: data.AMOUNT,
        timestamp: data.TIMESTAMP,
      });
    }

    // Проверка на подписа само за POST заявки (system callbacks)
    if (method === "POST") {
      const isValidSignature = verifyBoricaSignature(data);

      if (!isValidSignature) {
        console.error("Invalid Borica signature");
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid signature",
        });
      }
    }

    // Анализ на response code
    const rc = parseInt(data.RC);
    const isSuccessful = rc === 0;
    const amount = parseInt(data.AMOUNT) / 100; // Convert from cents

    console.log("Payment result:", {
      orderId: data.ORDER,
      successful: isSuccessful,
      amount,
      currency: data.CURRENCY,
      responseCode: rc,
      statusMessage: data.STATUSMSG,
      approval: data.APPROVAL,
      rrn: data.RRN,
      intRef: data.INT_REF,
      method: method,
    });

    // Тук можете да добавите логика за обновяване на статуса на поръчката във WordPress/WooCommerce
    // Например чрез GraphQL mutation или REST API заявка

    // Обновяване на статуса на поръчката (само за POST callbacks)
    if (method === "POST") {
      if (isSuccessful) {
        // Успешно плащане - обновете поръчката като платена
        await updateOrderStatus(data.ORDER, "completed", {
          transactionId: data.RRN,
          approval: data.APPROVAL,
          intRef: data.INT_REF,
          amount: amount,
          currency: data.CURRENCY,
          timestamp: data.TIMESTAMP,
        });
      } else {
        // Неуспешно плащане - обновете поръчката като неплатена
        await updateOrderStatus(data.ORDER, "failed", {
          responseCode: rc,
          statusMessage: data.STATUSMSG,
          timestamp: data.TIMESTAMP,
        });
      }

      // Връщане на успешен отговор към Borica
      return {
        success: true,
        message: "Callback processed successfully",
        orderId: data.ORDER,
        status: isSuccessful ? "success" : "failed",
      };
    } else {
      // За GET заявки (user return) пренасочваме към резултатната страница
      const message = isSuccessful
        ? "Плащането е завършено успешно"
        : getErrorMessage(rc, data.STATUSMSG);

      const redirectUrl = `/payment-result?order=${data.ORDER}&success=${isSuccessful}&message=${encodeURIComponent(message)}&rc=${rc}`;

      console.log("Redirecting user to:", redirectUrl);

      return await sendRedirect(event, redirectUrl, 302);
    }
  } catch (error: any) {
    console.error("Borica callback error:", error);

    // Връщане на грешка към Borica
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal server error",
    });
  }
});

function verifyBoricaSignature(data: BoricaCallbackData): boolean {
  try {
    // Borica public key за тестова среда
    const publicKeyPem = `-----BEGIN CERTIFICATE-----
MIIEaTCCA1GgAwIBAgIJAK3ZW+0aemn/MA0GCSqGSIb3DQEBBQUAMIGIMQswCQYD
VQQGEwJCRzETMBEGA1UECAwKQnVsZ2FyaWFkODESMBAGA1UEBwwJU29maWFkODE4
MRwwGgYDVQQKDBNCT1JJQ0EgQUQgVEVTVCBTSUdOMRwwGgYDVQQLDBNCT1JJQ0Eg
QURURXNUU0lHTjEUMBIGA1UEAwwLQm9yaWNhVGVzdDAeFw0xOTA3MjQxNTM2MDBa
Fw0yOTA3MjExNTM2MDBaMIGJMQswCQYDVQQGEwJCRzEOMAwGA1UECAwFU29maWEx
DjAMBgNVBAcMBVNvZmlhMQ4wDAYDVQQKDAVCb3JpYzEOMAwGA1UECwwFQm9yaWMx
BTADBgNVBAcMBlRlc3Q3NDQwEgYJKoZIhvcNAQkBFgV0ZXN0QUBib3JpY2FhZC5i
ZzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJ8L3vKMn1TtW/gDHr4Z
PdUKI5XqKmdAVOejxe1d9t1K7u6PLjE+GjcTr8T5TdZJzYHfFYFBjn2s2xz3VLkf
YDO8xJwYxM/3RsH5LjlEi8q4tJE+dWZ+dUjI6E1DP1g7g9+6O6zJXKJrN4rK2Q5b
KoE8M1S1MwT7gUYT3HyW2A7+8d2vF+7gQ+3h2H5K1BX5lF0Z7PJhZKP+eaLjzAOp
kFR0q8KQEZ9V8k9+tHlA6EqZ8D5y8/eB+x7sQwc8P8tC6F5v5k8iVSH7l+qZFjPs
MJ5+5Hhd1aG5s1+H7Q+Q9B5wJ3+N8ZkU6/5Ds7N2hT8vEV2mJ9yF7kRANv31o8hj
CAwIBAgMBAAGjUzBRMB0GA1UdDgQWBBRhW3P3/rP4RxL9P5KtKq5Zq+5yJTAfBgNV
HSMEGDAWGBRG3P3/rP4RxL9P5KtKq5Zq+5yJTAPBgNVHRMBAf8EBTADAQH/MA0G
CSqGSIb3DQEBBQUAA4IBAQAwKq4L8sRQ9r7u7+6ywKcr1Gn2EgwMpHdIYzMHy8KQ
cEU7EeOI8t5rz5VcS+q6CK5o3f5kJtJrYbO3wKqJj5y1mGi5ykdZq6Gy1zYzVjJJ
L8+xMQL3RZY+m5hXL7QZ9K5B3D8T9F5S0z9E3n8B6Q+Y8F8wQZ3f1g+R7xJ3zYhz
SUrz5K6G8Z3k3q8Sj8V2TdJI8d7h6C3E1kSKjm7sSsWq1CoBHf3zJ7QgOT6L8Z8M
B5Hq8hFq1Gz7gJ8+XKQ9f3K5W6l1vQ8ZRHYY2fq5Q3H7Uv6E8Y8g3K5N1H1E7Jx4
c1F1S3e7t4F6Y9K3r4T6M1G7Y+Hg2Z3q4L1fQrJV=
-----END CERTIFICATE-----`;

    // Генериране на данните за проверка на подписа
    const signatureData = [
      data.ACTION,
      data.RC,
      data.APPROVAL,
      data.TERMINAL,
      data.TRTYPE,
      data.AMOUNT,
      data.CURRENCY,
      data.ORDER,
      data.RRN,
      data.INT_REF,
      data.PARES_STATUS,
      data.ECI,
      data.TIMESTAMP,
      data.NONCE,
      data.MERCH_TOKEN_ID,
    ].join("");

    // Проверка на подписа
    const verify = crypto.createVerify("SHA1");
    verify.update(Buffer.from(signatureData, "utf8"));

    const signature = Buffer.from(data.P_SIGN, "hex");
    const result = verify.verify(publicKeyPem, signature);

    return result;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

async function updateOrderStatus(
  orderId: string,
  status: string,
  metadata: any
): Promise<void> {
  try {
    console.log("Updating order status:", {
      orderId,
      status,
      metadata,
    });

    // Използваме WooCommerce REST API за обновяване на поръчката
    const wpApiUrl =
      process.env.WORDPRESS_API_URL ||
      "https://leaderfitness.admin-panels.com/wp-json/wc/v3";
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      console.error("WooCommerce API credentials missing");
      return;
    }

    // Подготвяме данните за обновяване
    const updateData: any = {
      status: status === "completed" ? "processing" : "failed", // WooCommerce статуси
    };

    // Добавяме meta data за транзакцията
    if (metadata.transactionId) {
      updateData.transaction_id = metadata.transactionId;
    }

    if (metadata.approval) {
      updateData.meta_data = [
        { key: "_borica_approval", value: metadata.approval },
        { key: "_borica_rrn", value: metadata.intRef },
        { key: "_borica_amount", value: metadata.amount },
        { key: "_payment_method", value: "borica_emv" },
        { key: "_payment_method_title", value: "Borica EMV" },
      ];
    }

    // Изпращаме заявката към WooCommerce
    const response = await $fetch(`${wpApiUrl}/orders/${orderId}`, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: updateData,
    });

    console.log("Order status updated successfully:", response);
  } catch (error: any) {
    console.error("Failed to update order status:", error);
    // Не хвърляме грешка, защото не искаме да прекъснем callback процеса
  }
}

function getErrorMessage(rc: string, statusMsg?: string): string {
  const errorMessages: Record<string, string> = {
    "-17": "Невалиден подпис или изтекла заявка",
    "-25": "Потребителят отказа плащането",
    "-19": "Грешка при автентикация",
    "-1": "Системна грешка",
    "-2": "Невалидни данни",
  };

  return errorMessages[rc] || statusMsg || "Възникна грешка при плащането";
}
