import { NextResponse } from 'next/server';
import {
  categoryDiscountPresets,
  discountTemplateCategories,
} from '@/lib/offers/discount-templates';

export async function GET() {
  try {
    const totalPresets = Object.values(categoryDiscountPresets).reduce(
      (total, presets) => total + presets.length,
      0
    );

    return NextResponse.json({
      success: true,
      categories: discountTemplateCategories,
      templates: categoryDiscountPresets,
      meta: {
        categoryCount: discountTemplateCategories.length,
        presetCount: totalPresets,
      },
    });
  } catch (error) {
    console.error('Discount templates fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch discount templates.',
      },
      { status: 500 }
    );
  }
}