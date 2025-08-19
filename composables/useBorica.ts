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
  ): Promise<BoricaResponse> {
    isProcessing.value = true;

    try {
      console.log("Initiating Borica payment:", {
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency || "BGN",
        description: data.description?.substring(0, 50) + "...",
      });

      const response = await $fetch<BoricaResponse>("/api/borica/initiate", {
        method: "POST",
        body: {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency || "BGN",
          description: data.description,
          customerEmail: data.customerEmail,
          merchantData: data.merchantData,
        },
      });

      if (response.success && response.formData) {
        console.log("Borica payment initiated successfully");
        return response;
      } else {
        throw new Error(response.error || "Failed to initiate payment");
      }
    } catch (error: any) {
      console.error("Borica payment initiation failed:", error);

      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Грешка при инициализиране на плащането";
      showError("Грешка при плащане", errorMessage);

      return {
        success: false,
        error: errorMessage,
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
