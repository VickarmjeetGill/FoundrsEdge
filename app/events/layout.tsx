import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Calgary Business Networking Events Calendar | Founders Edge',
    description: 'Discover upcoming business networking events, startup mixers, founders meetups, and workshops in Calgary. Connect with the YYC entrepreneurial community.',
    keywords: [
        'Founders Edge',
        'Founders Edge events',
        'Calgary business networking',
        'YYC startup events',
        'Calgary founder meetups',
        'Calgary entrepreneur events',
        'YYC business calendar',
        'Platform Calgary events',
        'Calgary networking mixers'
    ],
    openGraph: {
        title: 'Calgary Business Networking Events Calendar | Founders Edge',
        description: 'Find your next co-founder, investor, or business partner. View the complete schedule of local startup and business events in Calgary.',
        url: `https://foundersedge.com/events`,
        locale: 'en_CA',
        type: 'website',
        images: ['https://foundersedge.com/logo.png']
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Calgary Business Networking Events Calendar | Founders Edge',
        description: 'Discover upcoming business networking events, startup mixers, founders meetups, and workshops in Calgary. Connect with the YYC entrepreneurial community.',
        images: ['https://foundersedge.com/logo.png'],
    },
};

export default function EventsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}