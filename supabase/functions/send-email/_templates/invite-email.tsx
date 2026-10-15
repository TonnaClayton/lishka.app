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

const InviteEmail = (props: {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
  invited_by?: string;
  organization_name?: string;
}) => {
  const inviteLink = `${props.supabase_url}/auth/v1/verify?token=${props.token_hash}&type=${props.email_action_type}&redirect_to=${props.redirect_to}`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You've been invited to join Lishka!</Preview>
      <Tailwind>
        <Body className="bg-white font-sans pb-[40px]">
          <Container className="bg-[#f8fafc] border border-[#e2e8f0] rounded-b-[8px] shadow-sm max-w-[600px] mx-auto pb-[40px]">
            {/* Header */}
            <Section className="text-center mb-[32px] bg-[#7c3aed] rounded-t-[8px] p-[40px]">
              <Heading className="text-[28px] font-bold text-white m-0 mb-[8px]">
                🎣 You're Invited to Lishka!
              </Heading>
              <Text className="text-[16px] text-white m-0">
                Join the ultimate AI Fishing Companion
              </Text>
            </Section>

            {/* Main Message */}
            <Section className="mb-[32px] px-[40px]">
              <Heading className="text-[24px] font-bold m-0 mb-[8px]">
                Welcome to the Team!
              </Heading>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                Hi there!
              </Text>
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                {props.invited_by ? (
                  <>
                    <strong>{props.invited_by}</strong> has invited you to join
                    Lishka!
                  </>
                ) : (
                  "You've been invited to join Lishka!"
                )}
              </Text>
              {props.organization_name && (
                <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[16px]">
                  Organization: <strong>{props.organization_name}</strong>
                </Text>
              )}
              <Text className="text-[16px] text-gray-700 leading-[24px] m-0 mb-[24px]">
                Lishka is your AI-powered fishing companion that helps you
                discover the best fishing spots, get personalized gear
                recommendations, and connect with fellow anglers. Click the
                button below to accept your invitation and start your fishing
                journey!
              </Text>

              <Button
                href={inviteLink}
                className="bg-[#0251fb] text-white px-[32px] py-[12px] rounded-[24px] text-[16px] font-medium no-underline box-border"
              >
                Accept Invitation
              </Button>
            </Section>

            {/* What You'll Get */}
            <Section className="bg-purple-50 border border-purple-200 rounded-[8px] p-[20px] mb-[32px] px-[40px]">
              <Text className="text-[14px] text-purple-700 m-0 mb-[8px] font-medium">
                🎯 What you'll get with Lishka:
              </Text>
              <Text className="text-[14px] text-purple-700 leading-[20px] m-0">
                • AI-powered fishing spot recommendations
                <br />
                • Personalized gear and tackle suggestions
                <br />
                • Weather and fishing condition insights
                <br />
                • Connect with the fishing community
                <br />• Track your fishing adventures
              </Text>
            </Section>

            {/* Alternative Link */}
            <Section className="bg-gray-50 rounded-[8px] p-[20px] mb-[32px] px-[40px]">
              <Text className="text-[14px] text-gray-600 m-0 mb-[4px]">
                If the button doesn't work, you can also copy and paste this
                link into your browser:
              </Text>
              <Text className="text-[14px] rounded-[4px] border-[4px] text-[#7c3aed] bg-[#f1f5f9] p-[10px] break-all m-0 mt-[8px]">
                {inviteLink}
              </Text>
              <Text className="text-[14px] text-gray-600 leading-[20px] m-0 mt-[4px]">
                This invitation link will expire in 7 days.
              </Text>
            </Section>

            <Hr className="border-gray-200 my-[32px]" />

            {/* Footer */}
            <Section className="px-[40px]">
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[8px]">
                If you received this invitation by mistake, you can safely
                ignore this email.
              </Text>
              <Text className="text-[12px] text-gray-500 leading-[16px] m-0 mb-[16px]">
                Questions? Contact our support team.
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

export default InviteEmail;
