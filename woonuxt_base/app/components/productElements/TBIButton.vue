<script lang="ts" setup>
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

const props = defineProps({
    product: {
        type: Object,
        required: true
    },
    variation: {
        type: Object,
        required: false
    },
    quantity: {
        type: Number,
        required: true
    }
})

const openIframe = ref(false);
const loading = ref(false);
const iframeSrc = ref('');

const installments = ref<TBIInstallment[]>([]);

const getCurrentPrice = (): number => {
    const priceString =
        (props.variation as any)?.rawSalePrice ||
        (props.variation as any)?.rawRegularPrice ||
        (props.product as any)?.rawSalePrice ||
        (props.product as any)?.rawRegularPrice ||
        '0';

    const numeric = parseFloat(String(priceString).replace(/[^\d.]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
};

const fetchTbiInstallments = async () => {
    const amount = getCurrentPrice();

    // If price is not available, do not call the API
    if (!amount) {
        installments.value = [];
        return;
    }

    try {
        const response = await $fetch<TBIInstallment[]>('/api/tbi/calculate', {
            method: 'GET',
            query: { amount },
        });

        installments.value = Array.isArray(response) ? response : [];
    } catch (error: any) {
        console.error('TBI calculate error', error);
        installments.value = [];
    }
};

const round2 = (value: number) => {
    return Math.round(value * 100) / 100;
}

const minInstallmentText = computed(() => {
    const amount = getCurrentPrice();
    if (!amount || !installments.value.length) {
        return null;
    }

    let lowestMonthly = Number.MAX_SAFE_INTEGER;

    for(const installment of installments.value) {
        if(installment.amount_min > amount || installment.amount_max < amount) {
            continue;
        }

        const monthly = round2(amount * installment.installment_factor);

        if(monthly < lowestMonthly) {
            lowestMonthly = monthly;
        }
    }

    const bgn = lowestMonthly.toFixed(2);
    const rate = 1.95583; // стойност от data-eur атрибута на бутона
    const eur = round2(lowestMonthly / rate);

    return {
        bgn,
        eur,
    };
});

onMounted(() => {
    fetchTbiInstallments();
});

const openTBIButton = async () => {
    if (props.product.type === 'VARIABLE' && !props.variation) {
        return;
    }

    const args: { product_id: string, quantity: number, variation_id?: string } = {
        product_id: (props.product as any).databaseId,
        quantity: props.quantity,
    }
    
    if (props.variation) {
        args.variation_id = (props.variation as any).databaseId;
    }

    openIframe.value = true;
    loading.value = true;
    iframeSrc.value = '';

    type TBIRegisterProductSuccess = {
        success: boolean;
        message?: string;
        data: {
            url?: string;
            [key: string]: any;
        };
    };

    try {
        const response = await $fetch<TBIRegisterProductSuccess>('/api/tbi/register-product', {
            method: 'POST',
            body: args,
        });

        if(response?.success && response.data?.url) {
            iframeSrc.value = response.data.url as string;
        } else {
            iframeSrc.value = 'https://beta.tbibank.support/application/error/error_notified';
        }
    } catch (error) {
        iframeSrc.value = 'https://beta.tbibank.support/application/error/error_notified';
    }
    loading.value = false;
}
</script>

<template>
    <div v-if="installments.length > 0" class="no-underline outline-none inline-block my-5 min-w-[250px]">
        <div
            @click="openTBIButton"
            class="rounded-lg h-[50px] border border-[#ff6600] shadow-[0_2px_4px_0_rgba(0,0,0,0.4)] flex flex-col justify-around bg-[#ff6600] text-white py-[3px] px-[10px] cursor-pointer"
            id="tbi_button_body"
            data-eur="1.95583"
            data-visible="100"
            data-hide-bnpl="0"
            data-label-bnpl="0% in 4 installments for {installment} BGN ({eur_installment})"
            data-alert="Please select product variation"
            data-alert1="The product is out of stock"
            data-t1-limit="4999.99"
            data-t2-limit="9999.99"
            data-t3-limit="30000"
            data-t1="48"
            data-f1="0.037122433333333"
            data-t2="48"
            data-f2="0.037122433333333"
            data-t3="60"
            data-f3="0.033533266666667"
            data-label="installments starting from {installment} ({eur_installment} €)/month"
            data-variable="0"
            data-delivery-limit="0"
            data-delivery-fee="0"
        >
            <div class="font-inter font-normal text-[13px] flex justify-center items-center m-0 h-0 leading-[0]">
                Купи чрез
                <img
                    src="https://cdn.tbibank.support/logo/tbi-bank-white.svg"
                    alt="tbi bank logo"
                    width="89"
                    height="40"
                    class="max-h-[24px] w-auto mt-[-2px] ml-[5px]"
                >
            </div>
            <div class="font-inter font-normal text-[13px] flex justify-center items-center m-0 h-0 leading-[0]">
                <span v-if="minInstallmentText">
                    с вноски от {{ minInstallmentText.bgn }} лв. ({{ minInstallmentText.eur }} €)/месец
                </span>
                <span v-else>
                    вноски до 30000 лв. с TBI Bank
                </span>
            </div>
        </div>

        <div
            :data-redirect='"/checkout"'
            :data-rest-route='"https://admin.leaderfitness.net/wp-json/"'
            :class="[
                'popup-container fixed inset-0 z-[99999] w-full h-full bg-[rgba(51,51,51,0.3)] justify-center items-center',
                openIframe ? 'flex' : 'hidden'
            ]"
            @click.self="openIframe = false"
        >
			<div class="w-[768px] h-[90vh] max-w-full min-h-[400px] max-h-[720px] relative bg-[#F4F4F4] rounded-[24px]">
				<iframe class="w-full h-full rounded-3xl" :src="iframeSrc" v-if="iframeSrc" scrolling="auto" frameborder="0" width="200" height="200"></iframe>
				<div v-if="loading" class="absolute [top:calc(50%-50px)] [left:calc(50%-50px)] w-[130px] h-[130px] max-w-1/2">
					<img class="max-w-full h-auto block rounded" src="https://cdn.tbibank.support/integrations/loading.svg"  alt="tbi bank loading" width="128" height="128" >
					<div class="text-[15px] font-normal italic text-center w-full">Моля, изчакайте...</div>
				</div>
			</div>
		</div>
    </div>
</template>