import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "ARIGI"

interface NewOfferNotificationProps {
  sellerName?: string
  buyerName?: string
  spiritName?: string
  caskNumber?: string
  offerType?: string
  offeredTotalPrice?: string
  offeredPricePerLiter?: string
  volumeLiters?: string
  message?: string
}

const NewOfferNotificationEmail = ({
  sellerName,
  buyerName,
  spiritName,
  caskNumber,
  offerType,
  offeredTotalPrice,
  offeredPricePerLiter,
  volumeLiters,
  message,
}: NewOfferNotificationProps) => {
  const isEnquiry = offerType === 'enquiry'
  const heading = isEnquiry
    ? `New enquiry on ${spiritName || 'your cask'}`
    : `New offer on ${spiritName || 'your cask'}`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{heading}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>{SITE_NAME}</Text>
          <Heading style={h1}>
            {sellerName ? `Hi ${sellerName},` : 'Hello,'}
          </Heading>
          <Text style={text}>
            {isEnquiry
              ? `${buyerName || 'A buyer'} has sent an enquiry about your cask listing.`
              : `${buyerName || 'A buyer'} has made an offer on your cask listing.`}
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Cask</Text>
            <Text style={detailValue}>
              {spiritName || 'Unknown'} — #{caskNumber || 'N/A'}
            </Text>

            {!isEnquiry && (
              <>
                <Hr style={divider} />
                <Text style={detailLabel}>Offered Price</Text>
                <Text style={detailValue}>
                  ${offeredPricePerLiter || '0'}/L · Total ${offeredTotalPrice || '0'}
                </Text>
                <Hr style={divider} />
                <Text style={detailLabel}>Volume</Text>
                <Text style={detailValue}>{volumeLiters || '0'} litres</Text>
              </>
            )}

            {message && (
              <>
                <Hr style={divider} />
                <Text style={detailLabel}>
                  {isEnquiry ? 'Question' : 'Message from buyer'}
                </Text>
                <Text style={detailValue}>{message}</Text>
              </>
            )}
          </Section>

          <Section style={{ textAlign: 'center' as const, marginTop: '24px' }}>
            <Button style={button} href="https://barrel-burn-ledger.lovable.app/offers">
              View in {SITE_NAME}
            </Button>
          </Section>

          <Text style={footer}>
            Best regards,<br />The {SITE_NAME} Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NewOfferNotificationEmail,
  subject: (data: Record<string, any>) =>
    data.offerType === 'enquiry'
      ? `New enquiry on ${data.spiritName || 'your cask'} — ${SITE_NAME}`
      : `New offer on ${data.spiritName || 'your cask'} — ${SITE_NAME}`,
  displayName: 'New offer / enquiry notification',
  previewData: {
    sellerName: 'James',
    buyerName: 'Sarah',
    spiritName: 'Highland Single Malt',
    caskNumber: 'HM-2019-042',
    offerType: 'buy_offer',
    offeredTotalPrice: '12,500',
    offeredPricePerLiter: '62.50',
    volumeLiters: '200',
    message: 'Would you consider a slightly lower price for this cask?',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Georgia', 'Times New Roman', serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const brand = { fontSize: '13px', fontWeight: 'bold' as const, letterSpacing: '3px', color: '#c5972c', textTransform: 'uppercase' as const, margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = { backgroundColor: '#faf8f4', border: '1px solid #e8e2d6', borderRadius: '8px', padding: '20px', margin: '0 0 8px' }
const detailLabel = { fontSize: '11px', fontWeight: 'bold' as const, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#888', margin: '0 0 2px' }
const detailValue = { fontSize: '15px', color: '#1a1a1a', margin: '0 0 4px' }
const divider = { borderColor: '#e8e2d6', margin: '12px 0' }
const button = { backgroundColor: '#c5972c', color: '#ffffff', padding: '12px 28px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#999', margin: '32px 0 0', lineHeight: '1.5' }
