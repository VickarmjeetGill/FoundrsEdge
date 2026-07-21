import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Star, Tag } from 'lucide-react';
import PageLayout from '@/components/PageLayout';

type BusinessProfilePageProps = {
  params: {
    id: string;
  };
};

const sampleBusiness = {
  name: 'Business Profile',
  industry: 'Member Business',
  location: 'Calgary, AB',
  description:
    'This directory profile gives members a place to view business details, contact information, and active offers connected to the business.',
  featured: true,
};

const sampleOffers = [
  {
    id: 'sample-offer-1',
    title: 'Member Exclusive Offer',
    discount: 'Special Offer',
    description: 'View this offer to learn more about the member discount or promotion.',
    expiryDate: '2026-12-31',
  },
];

export default function BusinessProfilePage({ params }: BusinessProfilePageProps) {
  return (
    <PageLayout>
      <div style={{ padding: '60px 0', background: '#f9f9f7', minHeight: '100vh' }}>
        <div className="container">
          <Link
            href="/directory"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 24,
              color: '#9b7011',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            Back to Directory
          </Link>

          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e0d8',
              padding: 32,
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <span className="tag">{sampleBusiness.industry}</span>
              {sampleBusiness.featured && <span className="tag gold">Featured</span>}
            </div>

            <h1
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 900,
                fontSize: '36px',
                color: '#2a2820',
                marginBottom: 12,
              }}
            >
              {sampleBusiness.name}
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#9a9585',
                fontSize: '14px',
                marginBottom: 20,
              }}
            >
              <MapPin size={14} style={{ color: '#e7b605' }} />
              {sampleBusiness.location}
            </div>

            <p
              style={{
                fontFamily: 'Noto Serif, serif',
                color: '#5a5650',
                fontSize: '15px',
                lineHeight: 1.8,
                maxWidth: 720,
              }}
            >
              {sampleBusiness.description}
            </p>
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e0d8',
              padding: 32,
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <div className="section-label">Business Offers</div>
              <h2
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 800,
                  fontSize: '24px',
                  color: '#2a2820',
                  marginBottom: 8,
                }}
              >
                View Offers
              </h2>
              <p
                style={{
                  fontFamily: 'Noto Serif, serif',
                  color: '#9a9585',
                  fontSize: '14px',
                  lineHeight: 1.7,
                }}
              >
                Browse active offers connected to this business profile.
              </p>
            </div>

            {sampleOffers.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  border: '1px solid #f0efe9',
                  color: '#9a9585',
                  fontFamily: 'Noto Serif, serif',
                }}
              >
                This business does not have active offers right now.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {sampleOffers.map((offer) => (
                  <div
                    key={offer.id}
                    style={{
                      border: '1px solid #e2e0d8',
                      borderTop: '4px solid #e7b605',
                      padding: 24,
                      background: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Discount hero */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontFamily: 'DM Sans, sans-serif',
                            fontWeight: 700,
                            fontSize: '11px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#9a9585',
                            marginBottom: 8,
                          }}
                        >
                          <Tag size={12} style={{ color: '#e7b605' }} />
                          Member Offer
                        </div>

                        <div
                          style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(30px, 4vw, 44px)',
                            lineHeight: 1,
                            color: '#e7b605',
                            letterSpacing: '-0.03em',
                            marginBottom: 10,
                          }}
                        >
                          {offer.discount}
                        </div>

                        <h3
                          style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontWeight: 800,
                            fontSize: '18px',
                            color: '#2a2820',
                            margin: 0,
                            lineHeight: 1.3,
                          }}
                        >
                          {offer.title}
                        </h3>
                      </div>

                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#9a9585',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                          paddingTop: 4,
                        }}
                      >
                        <Calendar size={13} style={{ color: '#e7b605' }} />
                        Expires{' '}
                        {new Date(offer.expiryDate).toLocaleDateString('en-CA', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    <p
                      style={{
                        fontFamily: 'Noto Serif, serif',
                        color: '#5a5650',
                        fontSize: '14px',
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {offer.description}
                    </p>

                    <div
                      style={{
                        paddingTop: 16,
                        borderTop: '1px solid #f0efe9',
                      }}
                    >
                      <Link
                        href={`/offers/${offer.id}`}
                        className="btn-primary"
                        style={{
                          display: 'inline-flex',
                          padding: '9px 18px',
                          fontSize: '12px',
                        }}
                      >
                        View Offer
                      </Link>
                    </div>


                    <p
                      style={{
                        fontFamily: 'Noto Serif, serif',
                        color: '#5a5650',
                        fontSize: '14px',
                        lineHeight: 1.7,
                        marginBottom: 16,
                      }}
                    >
                      {offer.description}
                    </p>

                    <Link
                      href={`/offers/${offer.id}`}
                      className="btn-primary"
                      style={{
                        display: 'inline-flex',
                        padding: '9px 18px',
                        fontSize: '12px',
                      }}
                    >
                      View Offer
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}