import * as React from "npm:react@18.3.1";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Tailwind,
  Img,
} from "npm:@react-email/components@0.0.22";

const AccountConfirmationEmail = (props: {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
}) => {
  const verificationLink = `${props.supabase_url}/auth/v1/verify?token=${props.token_hash}&type=${props.email_action_type}&redirect_to=${props.redirect_to}`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome! Please confirm your account to get started</Preview>
      <Tailwind>
        <Body className="bg-white font-sans pb-[40px]">
          <Container className="bg-[#f8fafc] border border-[#e2e8f0] rounded-b-[8px] shadow-sm max-w-[600px] mx-auto pb-[40px]">
            {/* Header */}
            <Section className="text-center mb-[32px] bg-[#0251fb] rounded-t-[8px] p-[40px]">
              <Img
                src="https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/logo.png"
                alt="Lishka Logo"
                width="168"
                height="32"
                className="mx-auto mb-[8px]"
              />
              <Text className="text-[16px] text-white m-0">
                Your AI Fishing Companion
              </Text>
            </Section>

            {/* Main Message */}
            <Section className="mb-[32px] px-[40px]">
              <Heading className="text-[24px] font-bold m-0 mb-[8px]">
                Confirm Your Email Address
              </Heading>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Hi there!
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[24px]">
                Thanks for signing up for Lishka! To complete your registration
                and start exploring the best fishing spots and techniques,
                please confirm your email address by clicking the button below:
              </Text>

              <Button
                href={verificationLink}
                className="bg-[#0251fb] text-white px-[32px] py-[12px] rounded-[24px] text-[16px] font-medium no-underline box-border"
              >
                Confirm Email Address
              </Button>
            </Section>

            {/* Alternative Link */}
            <Section className="bg-gray-50 rounded-[8px] p-[20px] mb-[32px] px-[40px]">
              <Text className="text-[14px] text-gray-600 m-0 mb-[4px]">
                If the button doesn't work, you can also copy and paste this
                link into your browser:
              </Text>
              <Text className="text-[14px] rounded-[4px] border-[4px] text-[#3b82f6] bg-[#f1f5f9] p-[10px] break-all m-0 mt-[8px]">
                {verificationLink}
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mt-[4px]">
                This confirmation link will expire in 24 hours for security
                reasons.
              </Text>
            </Section>

            <Hr className="border-gray-200 my-[32px]" />

            {/* Footer */}
            <Section className="px-[40px]">
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[8px]">
                If you didn't create an account with Lishka, you can safely
                ignore this email.
              </Text>
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[16px]">
                Happy fishing! 🐟
                <br />
                The Lishka Team
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AccountConfirmationEmail;
