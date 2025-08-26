import BottomNav, { SideNav } from "@/components/bottom-nav";
import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/contexts/auth-context";
import { GearItem } from "@/lib/gear";
import { GEAR_CATEGORIES } from "./my-gear";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/lib/routing";

const formSchema = z.object({
  name: z.string().min(1, { message: "Gear name is required." }),
  category: z.string().min(1, { message: "Category is required." }),
  brand: z.string().optional().default(""),
  model: z.string().optional().default(""),
  condition: z.string().optional().default(""),
  size: z.string().optional().default(""),
  weight: z.string().optional().default(""),
  targetFish: z.string().optional().default(""),
  fishingTechnique: z.string().optional().default(""),
  colorPattern: z.string().optional().default(""),
  actionType: z.string().optional().default(""),
  depthRange: z.string().optional().default(""),
  weatherConditions: z.string().optional().default(""),
  waterConditions: z.string().optional().default(""),
  seasonalUsage: z.string().optional().default(""),
  versatility: z.string().optional().default(""),
  compatibleGear: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export default function GearDetailPage() {
  const { gearId } = useParams();
  const { profile, refreshProfile, updateProfile } = useAuth();
  const navigate = useNavigate();

  const gear: GearItem | undefined = useMemo(() => {
    const list = (profile?.gear_items as unknown as GearItem[]) || [];

    return list.find((g) => g.id === gearId);
  }, [profile, gearId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      name: gear?.name || "",
      category: gear?.category || "",
      brand: gear?.brand || "",
      model: gear?.model || "",
      condition: gear?.condition || "",
      size: gear?.size || "",
      weight: gear?.weight || "",
      targetFish: gear?.targetFish || "",
      fishingTechnique: gear?.fishingTechnique || "",
      colorPattern: gear?.colorPattern || "",
      actionType: gear?.actionType || "",
      depthRange: gear?.depthRange || "",
      weatherConditions: gear?.weatherConditions || "",
      waterConditions: gear?.waterConditions || "",
      seasonalUsage: gear?.seasonalUsage || gear?.season || "",
      versatility: gear?.versatility || "",
      compatibleGear: gear?.compatibleGear || "",
      description: gear?.description || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!gear) return;
    const current = (profile?.gear_items as unknown as GearItem[]) || [];
    const updated = current.map((g) =>
      g.id === gear.id
        ? {
            ...g,
            name: values.name,
            category: values.category,
            brand: values.brand || "",
            model: values.model || "",
            condition: values.condition || "",
            size: values.size || "",
            weight: values.weight || "",
            targetFish: values.targetFish || "",
            fishingTechnique: values.fishingTechnique || "",
            colorPattern: values.colorPattern || "",
            actionType: values.actionType || "",
            depthRange: values.depthRange || "",
            weatherConditions: values.weatherConditions || "",
            waterConditions: values.waterConditions || "",
            seasonalUsage: values.seasonalUsage || "",
            versatility: values.versatility || "",
            compatibleGear: values.compatibleGear || "",
            description: values.description || "",
            userConfirmed: true,
          }
        : g,
    );

    await updateProfile({
      // store as plain array; context layer ensures correct typing/validation
      gear_items: updated as unknown as any,
    });

    await refreshProfile();

    navigate(ROUTES.MY_GEAR);
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      <div className="flex-1 flex h-full">
        <div className="hidden lg:block">
          <SideNav />
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-4 lg:pb-4 max-w-2xl mx-auto w-full pb-20">
            <div className="flex items-center gap-1 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M6.25 3.55835L13.75 7.85002"
                  stroke="#191B1F"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17.5 6.66669C17.4997 6.37442 17.4225 6.08736 17.2763 5.83432C17.13 5.58128 16.9198 5.37116 16.6667 5.22502L10.8333 1.89169C10.58 1.74541 10.2926 1.6684 10 1.6684C9.70744 1.6684 9.42003 1.74541 9.16667 1.89169L3.33333 5.22502C3.08022 5.37116 2.86998 5.58128 2.72372 5.83432C2.57745 6.08736 2.5003 6.37442 2.5 6.66669V13.3334C2.5003 13.6256 2.57745 13.9127 2.72372 14.1657C2.86998 14.4188 3.08022 14.6289 3.33333 14.775L9.16667 18.1084C9.42003 18.2546 9.70744 18.3316 10 18.3316C10.2926 18.3316 10.58 18.2546 10.8333 18.1084L16.6667 14.775C16.9198 14.6289 17.13 14.4188 17.2763 14.1657C17.4225 13.9127 17.4997 13.6256 17.5 13.3334V6.66669Z"
                  stroke="#191B1F"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.75 5.83331L10 9.99998L17.25 5.83331"
                  stroke="#191B1F"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 18.3333V10"
                  stroke="#191B1F"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-[#191B1F] text-lg font-semibold">
                Edit Gear Information
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#191B1F] text-xs font-semibold">
                          Gear name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Shimano Curado"
                            className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="min-w-full w-full">
                            {GEAR_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#191B1F] text-xs font-semibold">
                          Brand
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brand"
                            className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#191B1F] text-xs font-semibold">
                          Model
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Model"
                            className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="min-w-full w-full">
                            {["New", "Excellent", "Good", "Fair", "Poor"].map(
                              (condition) => (
                                <SelectItem key={condition} value={condition}>
                                  {condition}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("category") === "lures-jigs" && (
                    <>
                      <div className="grid grid-cols-2 gap-2 md:col-span-2">
                        <FormField
                          control={form.control}
                          name="size"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#191B1F] text-xs font-semibold">
                                Size
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Size"
                                  className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#191B1F] text-xs font-semibold">
                                Weight
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Weight"
                                  className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="targetFish"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-[#191B1F] text-xs font-semibold">
                              Target fish
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Comma-separated list"
                                {...field}
                                className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fishingTechnique"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-[#191B1F] text-xs font-semibold">
                              Fishing technique
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Technique"
                                className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-2 md:col-span-2">
                        <FormField
                          control={form.control}
                          name="colorPattern"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#191B1F] text-xs font-semibold">
                                Color pattern
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Color pattern"
                                  className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="actionType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#191B1F] text-xs font-semibold">
                                Action type
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Action type"
                                  className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="depthRange"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-[#191B1F] text-xs font-semibold">
                              Depth range
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Depth range"
                                className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-2 md:col-span-2">
                        <FormField
                          control={form.control}
                          name="weatherConditions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#191B1F] text-xs font-semibold">
                                Weather conditions
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Weather conditions"
                                  className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="waterConditions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#191B1F] text-xs font-semibold">
                                Water conditions
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Water conditions"
                                  className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="seasonalUsage"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-[#191B1F] text-xs font-semibold">
                              Seasional usage
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Seasonal usage"
                                className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="versatility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#191B1F] text-xs font-semibold">
                              Versatility
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Versatility"
                                className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="compatibleGear"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-[#191B1F] text-xs font-semibold">
                              Compatible gear
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Compatible gear"
                                className="border-[#191B1F1A] shadow-none py-2.5 px-3.5 rounded-[6px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-[#191B1F] text-xs font-semibold">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description"
                          className="border-[#191B1F1A] min-h-[80px] resize-none shadow-none py-2.5 px-3.5 rounded-[6px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      !form.formState.isDirty || form.formState.isSubmitting
                    }
                    onClick={() => navigate(-1)}
                    className="bg-[#025DFB1A] hover:bg-[#025DFB1A] hover:text-[#0251FB] text-[#0251FB] h-10 border-none rounded-full text-xs font-semibold shadow-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !form.formState.isDirty || form.formState.isSubmitting
                    }
                    className="bg-[#025DFB] hover:bg-[#025DFB] hover:text-white shadow-none text-white h-10 border-none rounded-full text-xs font-semibold"
                  >
                    Save changes
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
