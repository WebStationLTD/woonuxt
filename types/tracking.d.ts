interface LineItem {
    quantity: number;
    total: string;
    product: any | null;
    variation: any | null;
}

interface SavedOrder {
    id: string;
    key: string;
    total: string;
    shippingTotal: string|number;
    status: string;
    date: string;
    paymentMethod: string;
    paymentMethodTitle: string;
    lineItems: {
        nodes: LineItem[];
    };
}

export type { SavedOrder };