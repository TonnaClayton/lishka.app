import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { log } from "@/lib/logging";
import { config } from "@/lib/config";
import { api } from "../api";
import { LocationData } from "../location/use-location-storage";

export const searchQueryKeys = {
    sessions: () => ["search", "sessions"] as const,
    search: (id: string) => ["search", id] as const,
    sessionFollowQuestions: (id: string) =>
        ["search", id, "follow-questions"] as const,
};

export const useGetSearchSessions = useQuery({
    queryKey: searchQueryKeys.sessions(),
    queryFn: async () => {
        const data = await api<{
            data: {
                created_at: string;
                id: string;
                title: string;
                updated_at: string | null;
                user_id: string;
            }[];
        }>("search-agent/sessions", {
            method: "GET",
        });

        return data.data;
    },
    // enabled: !!id, // Only run when saved location is loaded
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
});

export const useGetSearchSession = (id: string) =>
    useQuery({
        queryKey: searchQueryKeys.search(id),
        queryFn: async () => {
            const data = await api<{
                data: {
                    created_at: string;
                    id: string;
                    title: string;
                    updated_at: string | null;
                    user_id: string;
                    messages: {
                        content: string | null;
                        created_at: string;
                        id: string;
                        image: string | null;
                        metadata: any;
                        session_id: string;
                        updated_at: string | null;
                        user_role: "user" | "assistant";
                    }[];
                };
            }>("search-agent/sessions/" + id, {
                method: "GET",
            });

            return data.data;
        },
        enabled: !!id, // Only run when saved location is loaded
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

export const useGetSearchSessionFollowQuestions = (id: string) =>
    useQuery({
        queryKey: searchQueryKeys.sessionFollowQuestions(id),
        queryFn: async () => {
            if (!id) {
                return [];
            }

            const data = await api<{
                data: string[];
            }>("search-agent/sessions/" + id + "/follow-questions", {
                method: "GET",
            });

            return data.data;
        },
        enabled: !!id, // Only run when saved location is loaded
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

export const useCreateSearchSession = () =>
    useMutation({
        mutationFn: async (payload: {
            use_location_context?: boolean;
            use_imperial_units?: boolean;
            message: string;
            attachment?: File;
            session_id?: string;
        }) => {
            const formData = new FormData();
            formData.append(
                "use_location_context",
                payload.use_location_context?.toString() || "false",
            );
            formData.append(
                "use_imperial_units",
                payload.use_imperial_units?.toString() || "false",
            );
            formData.append("message", payload.message);
            if (payload.attachment) {
                formData.append("attachment", payload.attachment);
            }

            let path = "search-agent/sessions";
            if (payload.session_id) {
                path = "search-agent/sessions/" + payload.session_id;
            }

            const data = await api<{
                data: {
                    content: string | null;
                    created_at: string;
                    id: string;
                    image: string | null;
                    metadata: any;
                    session_id: string;
                    updated_at: string | null;
                    user_role: "user" | "assistant";
                };
            }>(path, {
                method: "POST",
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                body: formData,
            });

            return data.data;
        },
        onSuccess: (updatedLocation) => {
            // // Update the current location cache
            // queryClient.setQueryData(
            //     locationQueryKeys.userLocation(),
            //     updatedLocation,
            // );
            // setCurrentLocation(updatedLocation);
        },
    });
