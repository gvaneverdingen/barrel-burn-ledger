import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Img,
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'

interface ConfirmationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const ConfirmationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to ARIGI - Confirm your email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>Welcome to ARIGI</Heading>
          <Text style={subtitle}>Premium Whiskey Cask Trading Platform</Text>
        </Section>
        
        <Section style={content}>
          <Text style={text}>
            Thank you for joining ARIGI! To complete your registration and start trading premium whiskey casks, please confirm your email address.
          </Text>
          
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            target="_blank"
            style={button}
          >
            Confirm Email Address
          </Link>
          
          <Text style={text}>
            Or copy and paste this link in your browser:
          </Text>
          <Text style={linkText}>
            {`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
          </Text>
          
          <Text style={securityNote}>
            If you didn't create an account with ARIGI, you can safely ignore this email.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            Best regards,<br />
            The ARIGI Team
          </Text>
          <Text style={footerNote}>
            This email was sent to {user_email}. ARIGI is your trusted platform for whiskey cask investments.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ConfirmationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}

const subtitle = {
  color: '#666',
  fontSize: '16px',
  margin: '0',
  textAlign: 'center' as const,
}

const content = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6ebf1',
  borderRadius: '8px',
  padding: '32px',
  marginBottom: '32px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
}

const button = {
  backgroundColor: '#8B4513',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '16px 32px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  margin: '24px 0',
}

const linkText = {
  color: '#8B4513',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  margin: '8px 0 24px',
  padding: '12px',
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
}

const securityNote = {
  color: '#666',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '24px 0 0',
  padding: '16px',
  backgroundColor: '#f0f4f8',
  borderRadius: '4px',
  borderLeft: '4px solid #8B4513',
}

const footer = {
  textAlign: 'center' as const,
  padding: '16px',
}

const footerText = {
  color: '#333',
  fontSize: '16px',
  margin: '0 0 16px',
}

const footerNote = {
  color: '#666',
  fontSize: '12px',
  margin: '0',
}