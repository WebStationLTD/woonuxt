interface TBICalculateRequest {
    amount: number;
}

type TBIInstallment = {
    id: number;
    name: string;
    bank_product: string;
    period: number;
    installment_factor: number;
    total_due_factor: number;
    nir: number;
    apr: number;
    amount_min: number;
    amount_max: number;
    category_id: string;
    currency: string;
    amount_min_eur: number;
    amount_max_eur: number;
    amount_min_bgn: number | null;
    amount_max_bgn: number | null;
}

type TBICalculateResponse = {
    error: boolean;
    message: string;
} | TBIInstallment[];

export default defineEventHandler(async (event) => {
    const query = getQuery<TBICalculateRequest>(event);
    const { amount } = query;

    const resellerCode = process.env.TBI_RESELLER_CODE;
    const resellerKey = process.env.TBI_RESELLER_KEY;

    const payload = {
        reseller_code: resellerCode,
        reseller_key: resellerKey,
        amount: amount,
    }

    try {

        const response = await $fetch<TBICalculateResponse>("https://beta.tbibank.support/api/GetCalculations", {
            method: "GET",
            query: payload,
        });

        if(Array.isArray(response)) {
            return response;
        }

        return [];
    } catch (error) {
        console.log(error);
        return [];
    }
});