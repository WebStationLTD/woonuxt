import { Cryptor } from "./cryptor";

interface TBIRegisterRequest {
    product_id: string;
    quantity: string;
    variation_id?: string;
}

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<TBIRegisterRequest>(event);

        const { product_id, quantity, variation_id } = body;

        const product = await getProductFromAPI(product_id, variation_id);

        if( ! product ) {
            return createError({
                statusCode: 404,
                statusMessage: 'Product not found',
            });
        }

        product.qty = parseInt(quantity);        

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
            items: [product],
            currency: 'EUR'
        }       

        // Encrypt payload for TBI using shared encryption key (same logic as PHP Cryptor::encryptString)
        const encryptedData = encryptTBIData(data);

        const payload = {
            reseller_code: process.env.TBI_RESELLER_CODE,
            reseller_key: process.env.TBI_RESELLER_KEY,
            data: encryptedData,
        }

        const response = await $fetch("https://beta.tbibank.support/api/RegisterApplication", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        return {
            success: true,
            message: 'Product registered successfully',
            data: response
        }
    } catch (error) {
        console.error(error);
        return createError({
            statusCode: 500,
            statusMessage: 'Internal server error',
        });
    }
});

async function getProductFromAPI(product_id: string, variation_id?: string) {
    const runtimeConfig = useRuntimeConfig();
    const wpApiUrl =
        runtimeConfig.WORDPRESS_API_URL ||
        process.env.WORDPRESS_API_URL ||
        "https://admin.leaderfitness.net/wp-json/wc/v3";
    const consumerKey =
        runtimeConfig.WC_CONSUMER_KEY || process.env.WC_CONSUMER_KEY;
    const consumerSecret =
        runtimeConfig.WC_CONSUMER_SECRET || process.env.WC_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
        throw new Error("WooCommerce API credentials missing");
    }

    // Otherwise, fetch the main product
    const response: any = await $fetch(`${wpApiUrl}/products/${product_id}`, {
        method: "GET",
        headers: {
            Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
            "Content-Type": "application/json",
        },
    });

    const item = {
        name: response.name,
        description: '',
        qty: 1,
        price: parseFloat(response.price),
        sku: response.sku,
        category: 1,
        imagelink: getProductImage(response),
        variation_id: null
    };

    // If variation_id is provided, fetch the variation
    if (variation_id) {
        const variation: any = await $fetch(
            `${wpApiUrl}/products/${product_id}/variations/${variation_id}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if(variation) {
            item.name = `${item.name} - ${variation.name}`;
            item.price = parseFloat(variation.price);
            item.variation_id = variation.id;
        }

        if(variation && variation.image) {
            item.imagelink = variation.image.src;
        }

    }
    
    return item;
}

function encryptTBIData(payload: any) {
    const keyEnv = process.env.TBI_ENCRYPTION_KEY;
    if (!keyEnv) {
        throw new Error("TBI_ENCRYPTION_KEY is not configured");
    }

    return Cryptor.Encrypt(JSON.stringify(payload), keyEnv);
}

function getProductImage(product: any) {
    if( ! product ) {
        return null;
    }

    const images = product.images;

    if( ! images ) {
        return null;
    }

    return images[0].src;
}