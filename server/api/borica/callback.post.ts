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
  if (getMethod(event) !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  try {
    const body = await readBody<BoricaCallbackData>(event);
    console.log("Borica callback received:", {
      action: body.ACTION,
      rc: body.RC,
      order: body.ORDER,
      amount: body.AMOUNT,
      timestamp: body.TIMESTAMP,
    });

    // Проверка на подписа
    const isValidSignature = verifyBoricaSignature(body);

    if (!isValidSignature) {
      console.error("Invalid Borica signature");
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid signature",
      });
    }

    // Анализ на response code
    const rc = parseInt(body.RC);
    const isSuccessful = rc === 0;
    const amount = parseInt(body.AMOUNT) / 100; // Convert from cents

    console.log("Payment result:", {
      orderId: body.ORDER,
      successful: isSuccessful,
      amount,
      currency: body.CURRENCY,
      responseCode: rc,
      statusMessage: body.STATUSMSG,
      approval: body.APPROVAL,
      rrn: body.RRN,
      intRef: body.INT_REF,
    });

    // Тук можете да добавите логика за обновяване на статуса на поръчката във WordPress/WooCommerce
    // Например чрез GraphQL mutation или REST API заявка

    if (isSuccessful) {
      // Успешно плащане - обновете поръчката като платена
      await updateOrderStatus(body.ORDER, "completed", {
        transactionId: body.RRN,
        approval: body.APPROVAL,
        intRef: body.INT_REF,
        amount: amount,
        currency: body.CURRENCY,
        timestamp: body.TIMESTAMP,
      });
    } else {
      // Неуспешно плащане - обновете поръчката като неплатена
      await updateOrderStatus(body.ORDER, "failed", {
        responseCode: rc,
        statusMessage: body.STATUSMSG,
        timestamp: body.TIMESTAMP,
      });
    }

    // Връщане на успешен отговор към Borica
    return {
      success: true,
      message: "Callback processed successfully",
      orderId: body.ORDER,
      status: isSuccessful ? "success" : "failed",
    };
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
  // Тук трябва да се имплементира логиката за обновяване на поръчката
  // в WordPress/WooCommerce чрез GraphQL или REST API

  console.log("Updating order status:", {
    orderId,
    status,
    metadata,
  });

  // Пример за GraphQL mutation (трябва да се адаптира според вашия setup)
  // const mutation = `
  //   mutation UpdateOrder($id: ID!, $status: String!, $metadata: [MetaDataInput!]) {
  //     updateOrder(input: {
  //       id: $id
  //       status: $status
  //       metaData: $metadata
  //     }) {
  //       order {
  //         id
  //         status
  //       }
  //     }
  //   }
  // `;

  // await executeGraphQLMutation(mutation, { id: orderId, status, metadata });
}
