import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Calgary Business Networking Events Calendar | Founders Edge',
    description: 'The complete Calgary business networking events calendar. Discover upcoming startup mixers, founder meetups, tech workshops & networking events in Calgary, Alberta (YYC).',
    keywords: [
        'Calgary business networking events',
        'Calgary business events calendar',
        'YYC startup events',
        'Calgary founder meetups',
        'Calgary entrepreneur events',
        'Platform Calgary events',
        'Calgary networking mixers',
        'Business events Calgary 2026',
        'Founders Edge events'
    ],
    alternates: {
        canonical: 'https://foundersedge.com/events'
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        title: 'Calgary Business Networking Events Calendar | Founders Edge',
        description: 'Discover upcoming business networking events, startup mixers, founder meetups, and workshops in Calgary, AB.',
        url: 'https://foundersedge.com/events',
        siteName: 'Founders Edge',
        locale: 'en_CA',
        type: 'website',
        images: [{ url: 'https://foundersedge.com/logo.png', width: 1200, height: 630, alt: 'Calgary Business Events Calendar' }]
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Calgary Business Networking Events Calendar | Founders Edge',
        description: 'Discover upcoming business networking events, startup mixers, founder meetups, and workshops in Calgary, AB.',
        images: ['https://foundersedge.com/logo.png'],
    },
};

export default function EventsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': 'Calgary Business Networking Events Calendar',
        'description': 'Upcoming business networking events, startup mixers, and founder meetups in Calgary, AB.',
        'url': 'https://foundersedge.com/events',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Calgary Business Networking & Startup Events',
                'url': 'https://foundersedge.com/events'
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}