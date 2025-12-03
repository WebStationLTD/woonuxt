import { Cryptor } from "./cryptor";

interface TBIRegisterRequest {
    orderId: string;
}

export default defineEventHandler(async (event) => {
    const body = await readBody<TBIRegisterRequest>(event);

    const { orderId } = body;

    const order = await getOrder(orderId);

    const data = {
        orderid: '0',
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        deliveryaddress: {
            city: '',
            streetname: '',
            postalcode: ''
        },
        items: getProductsFromOrder(order),
        currency: 'BGN'
    }

    // Encrypt payload for TBI using shared encryption key (same logic as PHP Cryptor::encryptString)
    
    const encryptedData = Cryptor.Encrypt(JSON.stringify(data), process.env.TBI_ENCRYPTION_KEY || '');

    const payload = {
        reseller_code: process.env.TBI_RESELLER_CODE,
        reseller_key: process.env.TBI_RESELLER_KEY,
        data: encryptedData,
    }

    try {
        const response = await $fetch("https://beta.tbibank.support/api/RegisterApplication", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        return response;
    } catch (error) {
        console.error(error);
        return createError({
            statusCode: 400,
            statusMessage: 'Error registering order',
        });
    }
});

function getProductsFromOrder(order: any) {
    const products = [];
    const shipping = [];

    for(const item of order.line_items) {
        products.push({
            name: item.name,
            description: '',
            qty: item.quantity,
            price: parseFloat(item.total),
            sku: item.sku,
            category: 1,
            imagelink: item.image?.src
        });
    }

    for(const item of order.shipping_lines) {
        shipping.push({
            name: item.method_title,
            description: '',
            qty: 1,
            price: parseFloat(item.total),
            sku: 'shipping',
            category: 1,
            imageLink: ''
        });
    }

    return [...products, ...shipping];
}

async function getOrder(orderid: string) {
    const wpApiUrl = process.env.WORDPRESS_API_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
        throw new Error("WooCommerce API credentials missing");
    }

    const order = await $fetch(`${wpApiUrl}/orders/${orderid}`, {
        headers: {
            Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
        },
    });

    return order;
}