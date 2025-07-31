import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const authQueryKeys = {
  useVerifyAuthToken: (token: string) => ["useVerifyAuthToken", token] as const,
  useResendAuthToken: (email: string) => ["useResendAuthToken", email] as const,
};

export const useVerifyAuthToken = (token: string) =>
  useQuery({
    queryKey: authQueryKeys.useVerifyAuthToken(token),
    queryFn: async () => {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "signup",
      });

      if (error) {
        throw error;
      }

      return data;
    },
  });

export const useSignUp = () => {
  const queryClient = useQueryClient();

  return useMutation<
    {
      user: User | null;
      session: Session | null;
    },
    {},
    { email: string; password: string; fullName: string }
  >({
    mutationFn: async (input) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {},
  });
};
