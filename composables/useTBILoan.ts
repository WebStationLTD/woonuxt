interface TBILoanPaymentData {
  orderId: string;
}

interface TBILoanResponse {
    error: number;
    order_id: number;
    token: string;
    url: string;
}

export function useTBILoan() {
  const isProcessing = ref(false);
  const { showError, showSuccess } = useNotifications();

  async function initiateTBILoanPayment(
    data: TBILoanPaymentData
  ): Promise<any & { debugInfo?: any }> {
    isProcessing.value = true;

    try {
      const requestBody = {
        orderId: data.orderId,
      };

      const response = await $fetch<TBILoanResponse>("/api/tbi/register", {
        method: "POST",
        body: requestBody,
      });

      if (response.error === 0) {
        return response;
      } else {
        throw new Error("Грешка при инициализиране на плащането");
      }
    } catch (error: any) {
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

  return {
    isProcessing: readonly(isProcessing),
    showError,
    showSuccess,
    initiateTBILoanPayment
  };
}