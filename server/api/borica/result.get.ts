/**
 * GET endpoint за обработка на Borica BACKREF URL
 * Този endpoint получава потребителя след завършване на плащането в Borica
 */
export default defineEventHandler(async (event) => {
  if (getMethod(event) !== "GET") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  try {
    const query = getQuery(event);
    console.log("Borica result GET request:", query);

    // Извличаме основните параметри
    const orderId = query.order as string;
    const rc = query.rc as string;
    const success = rc === "0";

    // Определяме съобщението според response code
    let message = "";
    if (success) {
      message = "Плащането е завършено успешно";
    } else {
      const errorMessages: Record<string, string> = {
        "-17": "Невалиден подпис или изтекла заявка",
        "-25": "Потребителят отказа плащането",
        "-19": "Грешка при автентикация",
        "-1": "Системна грешка",
        "-2": "Невалидни данни",
      };
      message = errorMessages[rc] || "Възникна грешка при плащането";
    }

    // Пренасочваме към нашата страница за резултати
    const redirectUrl = `/payment-result?order=${orderId}&success=${success}&message=${encodeURIComponent(message)}&rc=${rc}`;

    console.log("Redirecting to:", redirectUrl);

    return await sendRedirect(event, redirectUrl, 302);
  } catch (error: any) {
    console.error("Borica result GET error:", error);

    // При грешка пренасочваме към checkout с error параметър
    return await sendRedirect(event, "/checkout?payment_error=true", 302);
  }
});
