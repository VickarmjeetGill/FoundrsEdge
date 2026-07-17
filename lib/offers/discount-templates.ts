export type DiscountPreset = {
    value: string;
    label: string;
    description: string;
    offerType: 'percentage' | 'fixed' | 'bogo' | 'custom';
    recommended?: boolean;
    customDiscount?: string;
};

export const categoryDiscountPresets: Record<string, DiscountPreset[]> = {
    'Professional Services': [
        {
            value: '20',
            label: '20% Off First Service',
            description:
                'Give Founders Edge members 20% off their first eligible professional service.',
            offerType: 'percentage',
            recommended: true,
        },
        {
            value: 'free-consultation',
            label: 'Free Consultation',
            description:
                'Offer members one complimentary introductory consultation.',
            offerType: 'custom',
            customDiscount: 'Free consultation',
        },
        
        {
            value: 'free-strategy-session',
            label: 'Free Strategy Session',
            description:
                'Provide members with one complimentary strategy session.',
            offerType: 'custom',
            customDiscount: 'Free strategy session',
        },
    ],

    'Marketing & Design': [
        {
            value: '10',
            label: '10% Off',
            description: 'Recommended for smaller creative services.',
            offerType: 'percentage',
        },
        {
            value: '15',
            label: '15% Off',
            description: 'Ideal for projects and design packages.',
            offerType: 'percentage',
        },

        {
            value: '20',
            label: '20% Off',
            description: 'A high-value member-exclusive promotion.',
            offerType: 'percentage',
        },
    ],

    Technology: [
        {
            value: '10',
            label: '10% Off',
            description: 'Recommended for subscriptions and setup fees.',
            offerType: 'percentage',
        },
        {
            value: '15',
            label: '15% Off',
            description: 'Useful for onboarding or implementation.',
            offerType: 'percentage',
        },
        {
            value: '20',
            label: '20% Off',
            description: 'Best for annual plans or larger packages.',
            offerType: 'percentage',
            recommended: true,
        },
    ],

    'Finance & Legal': [
        {
            value: '5',
            label: '5% Off',
            description: 'A modest discount for professional services.',
            offerType: 'percentage',
        },
        {
            value: '10',
            label: '10% Off',
            description: 'Recommended for consultations and reviews.',
            offerType: 'percentage',
        },
        {
            value: '15',
            label: '15% Off',
            description: 'Best for larger service packages.',
            offerType: 'percentage',
        },
    ],

    'Health & Wellness': [
        {
            value: '10',
            label: '10% Off',
            description: 'Recommended for individual appointments.',
            offerType: 'percentage',
        },
        {
            value: '15',
            label: '15% Off',
            description: 'Ideal for treatments or wellness services.',
            offerType: 'percentage',
        },
        {
            value: '20',
            label: '20% Off',
            description: 'Best for packages or first-time clients.',
            recommended: true,
            offerType: 'percentage',
        },
    ],

    'Events & Venues': [
        {
            value: '10',
            label: '10% Off',
            description: 'Recommended for bookings and event services.',
            offerType: 'percentage',
        },
        {
            value: '15',
            label: '15% Off',
            description: 'Ideal for venue or package discounts.',
            offerType: 'percentage',
        },
        {
            value: '20',
            label: '20% Off',
            description: 'A strong incentive for larger bookings.',
            offerType: 'percentage',
            recommended: true,
        },
    ],

    'Retail & Products': [
        {
            value: '10',
            label: '10% Off',
            description: 'A familiar and easy-to-understand discount.',
            offerType: 'percentage',
        },
        {
            value: '15',
            label: '15% Off',
            description: 'Recommended for member purchases.',
            offerType: 'percentage',
        },
        {
            value: '20',
            label: '20% Off',
            description: 'Best for promotions or selected products.',
            offerType: 'percentage',
            recommended: true,
        },
    ],

    'Food & Beverage': [
        {
            value: '10',
            label: '10% Off',
            description: 'Recommended for meals and regular purchases.',
            offerType: 'percentage',
        },
        {
            value: '15',
            label: '15% Off',
            description: 'Ideal for catering or larger orders.',
            offerType: 'percentage',
        },
        {
            value: '20',
            label: '20% Off',
            description: 'A strong member-exclusive promotion.',
            recommended: true,
            offerType: 'percentage',
        },
    ],

    Golf: [
        {
            value: '20',
            label: '20% Off Green Fees',
            description:
                'Give Founders Edge members 20% off eligible green-fee bookings.',
            offerType: 'percentage',
            recommended: true,
        },
        {
            value: 'bogo-round',
            label: 'BOGO Round',
            description:
                'Members purchase one eligible round and receive a second round free.',
            offerType: 'bogo',
        },
        {
            value: 'free-bucket-of-balls',
            label: 'Free Bucket of Balls',
            description:
                'Offer members one complimentary bucket of practice balls.',
            offerType: 'custom',
            customDiscount: 'Free bucket of balls',
        },
    ],

    Golf: [
        {
            value: '20',
            label: '20% Off Green Fees',
            description:
                'Give Founders Edge members 20% off eligible green-fee bookings.',
            offerType: 'percentage',
            recommended: true,
        },
        {
            value: 'bogo-round',
            label: 'BOGO Round',
            description:
                'Members purchase one eligible round and receive a second round free.',
            offerType: 'bogo',
        },
        {
            value: 'free-bucket-of-balls',
            label: 'Free Bucket of Balls',
            description:
                'Offer members one complimentary bucket of practice balls.',
            offerType: 'custom',
            customDiscount: 'Free bucket of balls',
        },
    ],

    Other: [
        {
            value: '10',
            label: '10% Off',
            description: 'A safe and simple recommended discount.',
            offerType: 'percentage',
        },
        {
            value: '15',
            label: '15% Off',
            description: 'A balanced member-exclusive incentive.',
            offerType: 'percentage',
        },
        {
            value: '20',
            label: '20% Off',
            description: 'A high-value promotional option.',
            recommended: true,
            offerType: 'percentage',
        },
    ],
};

export const discountTemplateCategories = Object.keys(
    categoryDiscountPresets
);