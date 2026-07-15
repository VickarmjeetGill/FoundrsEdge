export type DiscountPreset = {
  value: string;
  label: string;
  description: string;
  recommended?: boolean;
};

export const categoryDiscountPresets: Record<string, DiscountPreset[]> = {
  'Professional Services': [
    {
      value: '10',
      label: '10% Off',
      description: 'A simple introductory member discount.',
      recommended: true,
    },
    {
      value: '15',
      label: '15% Off',
      description: 'A strong incentive for first-time clients.',
    },
    {
      value: '20',
      label: '20% Off',
      description: 'Best for consultations or service packages.',
    },
  ],

  'Marketing & Design': [
    {
      value: '10',
      label: '10% Off',
      description: 'Recommended for smaller creative services.',
      recommended: true,
    },
    {
      value: '15',
      label: '15% Off',
      description: 'Ideal for projects and design packages.',
    },
    {
      value: '20',
      label: '20% Off',
      description: 'A high-value member-exclusive promotion.',
    },
  ],

  Technology: [
    {
      value: '10',
      label: '10% Off',
      description: 'Recommended for subscriptions and setup fees.',
      recommended: true,
    },
    {
      value: '15',
      label: '15% Off',
      description: 'Useful for onboarding or implementation.',
    },
    {
      value: '20',
      label: '20% Off',
      description: 'Best for annual plans or larger packages.',
    },
  ],

  'Finance & Legal': [
    {
      value: '5',
      label: '5% Off',
      description: 'A modest discount for professional services.',
    },
    {
      value: '10',
      label: '10% Off',
      description: 'Recommended for consultations and reviews.',
      recommended: true,
    },
    {
      value: '15',
      label: '15% Off',
      description: 'Best for larger service packages.',
    },
  ],

  'Health & Wellness': [
    {
      value: '10',
      label: '10% Off',
      description: 'Recommended for individual appointments.',
      recommended: true,
    },
    {
      value: '15',
      label: '15% Off',
      description: 'Ideal for treatments or wellness services.',
    },
    {
      value: '20',
      label: '20% Off',
      description: 'Best for packages or first-time clients.',
    },
  ],

  'Events & Venues': [
    {
      value: '10',
      label: '10% Off',
      description: 'Recommended for bookings and event services.',
      recommended: true,
    },
    {
      value: '15',
      label: '15% Off',
      description: 'Ideal for venue or package discounts.',
    },
    {
      value: '20',
      label: '20% Off',
      description: 'A strong incentive for larger bookings.',
    },
  ],

  'Retail & Products': [
    {
      value: '10',
      label: '10% Off',
      description: 'A familiar and easy-to-understand discount.',
      recommended: true,
    },
    {
      value: '15',
      label: '15% Off',
      description: 'Recommended for member purchases.',
    },
    {
      value: '20',
      label: '20% Off',
      description: 'Best for promotions or selected products.',
    },
  ],

  'Food & Beverage': [
    {
      value: '10',
      label: '10% Off',
      description: 'Recommended for meals and regular purchases.',
      recommended: true,
    },
    {
      value: '15',
      label: '15% Off',
      description: 'Ideal for catering or larger orders.',
    },
    {
      value: '20',
      label: '20% Off',
      description: 'A strong member-exclusive promotion.',
    },
  ],

  Other: [
    {
      value: '10',
      label: '10% Off',
      description: 'A safe and simple recommended discount.',
      recommended: true,
    },
    {
      value: '15',
      label: '15% Off',
      description: 'A balanced member-exclusive incentive.',
    },
    {
      value: '20',
      label: '20% Off',
      description: 'A high-value promotional option.',
    },
  ],
};

export const discountTemplateCategories = Object.keys(
  categoryDiscountPresets
);