interface BoricaPaymentData {
  orderId: string;
  amount: number;
  currency?: string;
  description: string;
  customerEmail?: string;
  merchantData?: string;
}

interface BoricaResponse {
  success: boolean;
  gatewayUrl?: string;
  parameters?: Record<string, string>;
  formData?: string;
  error?: string;
}

export function useBorica() {
  const isProcessing = ref(false);
  const { showError, showSuccess } = useNotifications();

  /**
   * Инициализира плащане чрез Borica
   * @param data - Данни за плащането
   * @returns Promise с резултата от инициализацията
   */
  async function initiatePayment(
    data: BoricaPaymentData
  ): Promise<BoricaResponse & { debugInfo?: any }> {
    isProcessing.value = true;

    const debugInfo = {
      timestamp: new Date().toISOString(),
      step: "initiating_request",
      requestData: {
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency || "BGN",
        description: data.description,
        customerEmail: data.customerEmail,
        merchantData: data.merchantData,
      },
      requestUrl: "/api/borica/initiate",
      requestMethod: "POST",
    };

    try {
      console.log("🚀 DEBUG: Initiating Borica payment request:", debugInfo);

      const requestBody = {
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency || "BGN",
        description: data.description,
        customerEmail: data.customerEmail,
        merchantData: data.merchantData,
      };

      console.log(
        "📤 DEBUG: Request body to /api/borica/initiate:",
        requestBody
      );

      // Записваме времето преди заявката
      const requestStartTime = performance.now();

      const response = await $fetch<BoricaResponse>("/api/borica/initiate", {
        method: "POST",
        body: requestBody,
      });

      const requestEndTime = performance.now();
      const requestDuration = Math.round(requestEndTime - requestStartTime);

      debugInfo.step = "request_completed";
      debugInfo.responseTime = `${requestDuration}ms`;
      debugInfo.response = {
        success: response.success,
        hasFormData: !!response.formData,
        hasGatewayUrl: !!response.gatewayUrl,
        hasParameters: !!response.parameters,
        error: response.error,
        formDataLength: response.formData?.length,
        parametersCount: response.parameters
          ? Object.keys(response.parameters).length
          : 0,
      };

      console.log("📥 DEBUG: Response from /api/borica/initiate:", {
        ...debugInfo,
        fullResponse: response,
      });

      if (response.success && response.formData) {
        console.log("✅ DEBUG: Borica payment initiated successfully");
        return {
          ...response,
          debugInfo,
        };
      } else {
        debugInfo.step = "request_failed";
        debugInfo.error = response.error;
        console.log("❌ DEBUG: Borica payment initiation failed:", debugInfo);
        throw new Error(response.error || "Failed to initiate payment");
      }
    } catch (error: any) {
      debugInfo.step = "request_error";
      debugInfo.error = {
        name: error?.name,
        message: error?.message,
        statusCode: error?.statusCode,
        statusMessage: error?.statusMessage,
        data: error?.data,
        stack: error?.stack?.substring(0, 300),
      };

      console.error("💥 DEBUG: Borica payment initiation failed:", debugInfo);
      console.error("Full error object:", error);

      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Грешка при инициализиране на плащането";
      showError("Грешка при плащане", errorMessage);

      return {
        success: false,
        error: errorMessage,
        debugInfo,
      };
    } finally {
      isProcessing.value = false;
    }
  }

  /**
   * Пренасочва потребителя към Borica gateway
   * @param formData - HTML форма за изпращане към Borica
   */
  function redirectToGateway(formData: string): void {
    // Създаваме временен div за формата
    const div = document.createElement("div");
    div.innerHTML = formData;
    document.body.appendChild(div);

    // Намираме формата и я изпращаме
    const form = div.querySelector("form") as HTMLFormElement;
    if (form) {
      form.submit();
    } else {
      showError("Грешка", "Невалидна форма за плащане");
    }
  }

  /**
   * Обработва резултата от Borica плащане
   * @param orderId - ID на поръчката
   * @param success - Дали плащането е успешно
   * @param message - Съобщение за резултата
   */
  function handlePaymentResult(
    orderId: string,
    success: boolean,
    message?: string
  ): void {
    if (success) {
      showSuccess("Успешно плащане", `Поръчката ${orderId} е платена успешно.`);

      // Пренасочваме към страницата за благодарности
      const router = useRouter();
      router.push(`/thank-you?order=${orderId}`);
    } else {
      showError(
        "Неуспешно плащане",
        message || "Плащането не бе завършено успешно."
      );

      // Пренасочваме обратно към checkout
      const router = useRouter();
      router.push("/checkout");
    }
  }

  /**
   * Валидира данните за Borica плащане
   * @param data - Данни за валидация
   * @returns true ако данните са валидни
   */
  function validatePaymentData(data: BoricaPaymentData): boolean {
    if (!data.orderId || data.orderId.trim() === "") {
      showError("Валидационна грешка", "Липсва номер на поръчка");
      return false;
    }

    if (!data.amount || data.amount <= 0) {
      showError("Валидационна грешка", "Невалидна сума за плащане");
      return false;
    }

    if (!data.description || data.description.trim() === "") {
      showError("Валидационна грешка", "Липсва описание на плащането");
      return false;
    }

    // Проверка за максимална дължина на описанието (Borica ограничение)
    if (data.description.length > 125) {
      showError(
        "Валидационна грешка",
        "Описанието е твърде дълго (максимум 125 символа)"
      );
      return false;
    }

    return true;
  }

  /**
   * Генерира описание за поръчката
   * @param orderData - Данни за поръчката
   * @returns Форматирано описание
   */
  function generateOrderDescription(orderData: any): string {
    const merchantName = "LeaderFitness"; // Или от конфигурацията
    const orderNumber = orderData.orderId || orderData.id;

    return `${merchantName} - Поръчка #${orderNumber}`;
  }

  /**
   * Извлича сумата от количката в правилния формат
   * @param cart - Обект с количката
   * @returns Сума като число
   */
  function extractAmountFromCart(cart: any): number {
    if (!cart || !cart.total) {
      throw new Error("Невалидна количка");
    }

    // Премахваме HTML тагове и извличаме числото
    const totalString = cart.total.replace(/<[^>]*>/g, "").trim();
    const amountMatch = totalString.match(/[\d,\.]+/);

    if (!amountMatch) {
      throw new Error("Не може да се извлече сумата от количката");
    }

    // Заменяме запетаята с точка и конвертираме в число
    const amount = parseFloat(amountMatch[0].replace(",", "."));

    if (isNaN(amount) || amount <= 0) {
      throw new Error("Невалидна сума в количката");
    }

    return amount;
  }

  return {
    isProcessing: readonly(isProcessing),
    initiatePayment,
    redirectToGateway,
    handlePaymentResult,
    validatePaymentData,
    generateOrderDescription,
    extractAmountFromCart,
  };
}
