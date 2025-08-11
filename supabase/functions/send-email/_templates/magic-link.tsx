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
} from "npm:@react-email/components@0.0.22";

const MagicLinkEmail = (props: {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
}) => {
  const magicLink = `${props.supabase_url}/auth/v1/verify?token=${props.token_hash}&type=${props.email_action_type}&redirect_to=${props.redirect_to}`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Log in to Lishka with this magic link</Preview>
      <Tailwind>
        <Body className="bg-white font-sans pb-[40px]">
          <Container className="bg-[#f8fafc] border border-[#e2e8f0] rounded-b-[8px] shadow-sm max-w-[600px] mx-auto pb-[40px]">
            {/* Header */}
            <Section className="text-center mb-[32px] bg-[#059669] rounded-t-[8px] p-[40px]">
              <Heading className="text-[28px] font-bold text-white m-0 mb-[8px]">
                🔗 Magic Link Login
              </Heading>
              <Text className="text-[16px] text-white m-0">
                Quick and secure access to your Lishka account
              </Text>
            </Section>

            {/* Main Message */}
            <Section className="mb-[32px] px-[40px]">
              <Heading className="text-[24px] font-bold m-0 mb-[8px]">
                Login to Your Account
              </Heading>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Hi there!
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[24px]">
                You requested a magic link to log in to your Lishka account.
                Click the button below to securely access your account without
                entering a password.
              </Text>

              <Button
                href={magicLink}
                className="bg-green-600 text-white px-[32px] py-[16px] rounded-[6px] text-[16px] font-medium no-underline box-border"
              >
                Login to Lishka
              </Button>
            </Section>

            {/* Alternative Link */}
            <Section className="bg-gray-50 rounded-[8px] p-[20px] mb-[32px] px-[40px]">
              <Text className="text-[14px] text-gray-600 m-0 mb-[4px]">
                If the button doesn't work, you can also copy and paste this
                link into your browser:
              </Text>
              <Text className="text-[14px] rounded-[4px] border-[4px] text-[#059669] bg-[#f1f5f9] p-[10px] break-all m-0 mt-[8px]">
                {magicLink}
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mt-[4px]">
                This magic link will expire in 1 hour for security reasons.
              </Text>
            </Section>

            {/* Security Notice */}
            <Section className="bg-green-50 border border-green-200 rounded-[8px] p-[20px] mb-[32px] px-[40px]">
              <Text className="text-[14px] text-green-700 m-0 mb-[8px] font-medium">
                🔒 Security Features:
              </Text>
              <Text className="text-[14px] text-green-700 leading-[20px] m-0">
                • No password required - more secure than traditional login
                <br />
                • Link expires automatically after 1 hour
                <br />• Can only be used once
              </Text>
            </Section>

            <Hr className="border-gray-200 my-[32px]" />

            {/* Footer */}
            <Section className="px-[40px]">
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[8px]">
                If you didn't request this magic link, you can safely ignore
                this email.
              </Text>
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[16px]">
                Need help? Contact our support team.
                <br />
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

export default MagicLinkEmail;
