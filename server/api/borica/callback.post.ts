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

  console.log("🔔 BORICA CALLBACK RECEIVED:", {
    method,
    timestamp: new Date().toISOString(),
    url: event.node.req.url,
    headers: event.node.req.headers,
  });

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
      console.log("🔵 Borica GET callback received:", query);
    } else {
      data = await readBody<BoricaCallbackData>(event);
      console.log("🔴 Borica POST callback received:", {
        action: data.ACTION,
        rc: data.RC,
        order: data.ORDER,
        amount: data.AMOUNT,
        timestamp: data.TIMESTAMP,
        signature: data.P_SIGN?.substring(0, 20) + "...",
      });
    }

    console.log("📋 Full callback data:", data);

    // Проверка на подписа само за POST заявки (system callbacks)
    if (method === "POST") {
      console.log("🔐 Verifying Borica signature...");
      const isValidSignature = verifyBoricaSignature(data);
      console.log("🔐 Signature verification result:", isValidSignature);

      if (!isValidSignature) {
        console.error("❌ Invalid Borica signature");
        console.error("❌ Signature data used for verification:", {
          action: data.ACTION,
          rc: data.RC,
          approval: data.APPROVAL,
          terminal: data.TERMINAL,
          order: data.ORDER,
          receivedSignature: data.P_SIGN?.substring(0, 30) + "...",
        });
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid signature",
        });
      } else {
        console.log("✅ Borica signature verified successfully");
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
      console.log("🔄 Processing user return (GET request)");

      const message = isSuccessful
        ? "Плащането е завършено успешно"
        : getErrorMessage(rc, data.STATUSMSG);

      const redirectUrl = `/payment-result?order=${data.ORDER}&success=${isSuccessful}&message=${encodeURIComponent(message)}&rc=${rc}`;

      console.log("🔄 Redirecting user to:", redirectUrl);

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
    const publicKey = process.env.BORICA_PUBLIC_KEY;

    if (!publicKey) {
      console.error("BORICA_PUBLIC_KEY is missing or empty!");
      return false;
    }

    let formattedKey = atob(publicKey);
    formattedKey = formattedKey.replace(/\\n/g, "\n");

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
    ];

    let macSignatureData = "";
    
    for (const token of signatureData) {
      macSignatureData += token.length + token;
    }

    macSignatureData = macSignatureData + "-";

    // Проверка на подписа
    const verify = crypto.createVerify("SHA1");
    verify.update(Buffer.from(macSignatureData, "utf8"));

    const signature = Buffer.from(data.P_SIGN, "hex");
    const result = verify.verify(formattedKey, signature);

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
    console.log("🔄 Updating order status:", {
      orderId,
      status,
      metadata,
    });

    // Използваме WooCommerce REST API за обновяване на поръчката
    const runtimeConfig = useRuntimeConfig();
    const wpApiUrl =
      runtimeConfig.WORDPRESS_API_URL ||
      process.env.WORDPRESS_API_URL ||
      "https://leaderfitness.admin-panels.com/wp-json/wc/v3";
    const consumerKey =
      runtimeConfig.WC_CONSUMER_KEY || process.env.WC_CONSUMER_KEY;
    const consumerSecret =
      runtimeConfig.WC_CONSUMER_SECRET || process.env.WC_CONSUMER_SECRET;

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
