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

const PasswordRecoveryEmail = (props: {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
}) => {
  const recoveryLink = `${props.supabase_url}/auth/v1/verify?token=${props.token_hash}&type=${props.email_action_type}&redirect_to=${props.redirect_to}`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Reset your Lishka password</Preview>
      <Tailwind>
        <Body className="bg-white font-sans pb-[40px]">
          <Container className="bg-[#f8fafc] border border-[#e2e8f0] rounded-b-[8px] shadow-sm max-w-[600px] mx-auto pb-[40px]">
            {/* Header */}
            <Section className="text-center mb-[32px] bg-[#dc2626] rounded-t-[8px] p-[40px]">
              <Heading className="text-[28px] font-bold text-white m-0 mb-[8px]">
                🔐 Password Recovery
              </Heading>
              <Text className="text-[16px] text-white m-0">
                Reset your Lishka account password
              </Text>
            </Section>

            {/* Main Message */}
            <Section className="mb-[32px] px-[40px]">
              <Heading className="text-[24px] font-bold m-0 mb-[8px]">
                Reset Your Password
              </Heading>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Hi there!
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[24px]">
                We received a request to reset your password for your Lishka
                account. If you made this request, click the button below to
                create a new password. If you didn't request this, you can
                safely ignore this email.
              </Text>

              <Button
                href={recoveryLink}
                className="bg-[#0251fb] text-white px-[32px] py-[12px] rounded-[24px] text-[16px] font-medium no-underline box-border"
              >
                Reset Password
              </Button>
            </Section>

            {/* Alternative Link */}
            <Section className="bg-gray-50 rounded-[8px] p-[20px] mb-[32px] px-[40px]">
              <Text className="text-[14px] text-gray-600 m-0 mb-[4px]">
                If the button doesn't work, you can also copy and paste this
                link into your browser:
              </Text>
              <Text className="text-[14px] rounded-[4px] border-[4px] text-[#dc2626] bg-[#f1f5f9] p-[10px] break-all m-0 mt-[8px]">
                {recoveryLink}
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mt-[4px]">
                This password reset link will expire in 1 hour for security
                reasons.
              </Text>
            </Section>

            {/* Security Notice */}
            <Section className="bg-red-50 border border-red-200 rounded-[8px] p-[20px] mb-[32px] px-[40px]">
              <Text className="text-[14px] text-red-700 m-0 mb-[8px] font-medium">
                🔒 Security Notice:
              </Text>
              <Text className="text-[14px] text-red-700 leading-[20px] m-0">
                • Never share this link with anyone
                <br />
                • Lishka staff will never ask for your password
                <br />• Make sure you're on the official Lishka website before
                entering your new password
              </Text>
            </Section>

            <Hr className="border-gray-200 my-[32px]" />

            {/* Footer */}
            <Section className="px-[40px]">
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[8px]">
                If you didn't request a password reset, your account is secure
                and no action is needed.
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

export default PasswordRecoveryEmail;
