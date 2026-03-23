/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for ARIGI</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>ARIGI</Text>
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your ARIGI email from{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Click the button below to confirm this change:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Text style={footer}>
          If you didn't request this change, please secure your account
          immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Georgia', 'Times New Roman', serif" }
const container = { padding: '40px 25px', maxWidth: '560px', margin: '0 auto' }
const brand = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#D4A843',
  letterSpacing: '3px',
  textTransform: 'uppercase' as const,
  margin: '0 0 30px',
}
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#212830',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#677078',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const link = { color: '#D4A843', textDecoration: 'underline' }
const button = {
  backgroundColor: '#D4A843',
  color: '#212830',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
