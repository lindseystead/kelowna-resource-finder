/**
 * @fileoverview Request update page
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Form for users to request updates to resource information.
 */

import { useState, useEffect } from "react";
import { useLocation as useWouterLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Send, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const updateRequestSchema = z.object({
  resourceName: z.string().min(1, "Organization name is required"),
  contactName: z.string().min(1, "Your name is required"),
  contactEmail: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().optional(),
  submitterType: z.enum(["organization", "professional", "citizen"]),
  requestType: z.enum(["update", "new", "remove"]),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  hours: z.string().optional(),
  details: z.string().min(10, "Please provide more details (at least 10 characters)"),
});

type UpdateRequestFormData = z.infer<typeof updateRequestSchema>;

export default function RequestUpdate() {
  const { toast } = useToast();
  const [, setLocation] = useWouterLocation();
  const [submitted, setSubmitted] = useState(false);
  
  // Get URL params to pre-fill form if coming from resource detail page
  const urlParams = new URLSearchParams(window.location.search);
  const resourceId = urlParams.get('resourceId');
  const resourceName = urlParams.get('resourceName') || '';
  const address = urlParams.get('address') || '';
  const phone = urlParams.get('phone') || '';
  const email = urlParams.get('email') || '';
  const website = urlParams.get('website') || '';
  const hours = urlParams.get('hours') || '';
  
  const form = useForm<UpdateRequestFormData>({
    resolver: zodResolver(updateRequestSchema),
    defaultValues: {
      resourceName: resourceName,
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      submitterType: "citizen",
      requestType: resourceId ? "update" : "new",
      address: address,
      phone: phone,
      email: email || "",
      website: website || "",
      hours: hours,
      details: "",
    },
  });
  
  // Update form when URL params change
  useEffect(() => {
    if (resourceName) {
      form.setValue('resourceName', resourceName);
    }
    if (address) {
      form.setValue('address', address);
    }
    if (phone) {
      form.setValue('phone', phone);
    }
    if (email) {
      form.setValue('email', email);
    }
    if (website) {
      form.setValue('website', website);
    }
    if (hours) {
      form.setValue('hours', hours);
    }
    if (resourceId) {
      form.setValue('requestType', 'update');
    }
  }, [resourceName, address, phone, email, website, hours, resourceId, form]);

  const mutation = useMutation({
    mutationFn: async (data: UpdateRequestFormData) => {
      return apiRequest('POST', '/api/update-requests', data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "Thank you! We'll review your request and update the listing.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: UpdateRequestFormData) => {
    // Format the details to include all resource information fields
    let formattedDetails = data.details;
    
    if ((data.requestType === 'update' || data.requestType === 'new') && (data.address || data.phone || data.email || data.website || data.hours)) {
      const resourceInfo: string[] = [];
      
      if (data.address) resourceInfo.push(`Address: ${data.address}`);
      if (data.phone) resourceInfo.push(`Phone: ${data.phone}`);
      if (data.email) resourceInfo.push(`Email: ${data.email}`);
      if (data.website) resourceInfo.push(`Website: ${data.website}`);
      if (data.hours) resourceInfo.push(`Hours: ${data.hours}`);
      
      if (resourceInfo.length > 0) {
        const prefix = data.requestType === 'update' ? 'Updated Resource Information:' : 'New Resource Information:';
        formattedDetails = `${prefix}\n${resourceInfo.join('\n')}\n\nAdditional Details:\n${data.details}`;
      }
    }
    
    // Submit with formatted details (remove fields that aren't in the schema)
    const { address, phone, email, website, hours, ...submitData } = data;
    mutation.mutate({
      ...submitData,
      details: formattedDetails,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
          <Card className="shadow-lg">
            <CardContent className="p-6 sm:p-12 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Request Submitted!</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-2">
                Thank you for helping keep our directory accurate. We'll review your request 
                and update the listing as needed.
              </p>
              <Button asChild className="h-12 sm:h-11 text-base sm:text-sm touch-manipulation">
                <Link href="/">Return to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Request Update</span>
        </nav>

        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-gray-100">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Request an Update</CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2 text-gray-600">
              Help us keep our directory accurate. Use this form to update a listing, 
              add a new service, or report incorrect information.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <FormField
                  control={form.control}
                  name="submitterType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">I am a: *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger 
                            data-testid="select-submitter-type"
                            className="h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                          >
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="organization" className="text-sm sm:text-base">Organization/Service Provider</SelectItem>
                          <SelectItem value="professional" className="text-sm sm:text-base">Professional (Social Worker, Case Manager, etc.)</SelectItem>
                          <SelectItem value="citizen" className="text-sm sm:text-base">Community Member/Citizen</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">What would you like to do? *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger 
                            data-testid="select-request-type"
                            className="h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                          >
                            <SelectValue placeholder="Select request type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="update" className="text-sm sm:text-base">Update existing listing</SelectItem>
                          <SelectItem value="new" className="text-sm sm:text-base">Add a new service</SelectItem>
                          <SelectItem value="remove" className="text-sm sm:text-base">Remove a listing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resourceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">Organization/Service Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Central Okanagan Food Bank"
                          data-testid="input-resource-name"
                          className="h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                          maxLength={200}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">Your Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your full name"
                          data-testid="input-contact-name"
                          className="h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                          maxLength={100}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">Email Address *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="your@email.com"
                          data-testid="input-contact-email"
                          className="h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">Your Phone Number (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="(250) 555-0123"
                          data-testid="input-contact-phone"
                          className="h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                          autoComplete="tel"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resource Information Fields - Show when updating or adding new resource */}
                {(form.watch('requestType') === 'update' || form.watch('requestType') === 'new') && (
                  <div className="space-y-4 sm:space-y-6 pt-4 border-t border-gray-200">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-blue-800 font-medium mb-1">
                        {form.watch('requestType') === 'update' ? 'Resource Information' : 'New Resource Information'}
                      </p>
                      <p className="text-xs text-blue-700">
                        {form.watch('requestType') === 'update' 
                          ? 'Please update the fields below with the correct information:'
                          : 'Please provide the following information for the new resource:'}
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-semibold">Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., 123 Main Street, Kelowna, BC"
                              data-testid="input-address"
                              className="h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-semibold">Organization Phone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="(250) 555-0123"
                              data-testid="input-phone"
                              className="h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-semibold">Organization Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="info@organization.ca"
                              data-testid="input-email"
                              className="h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-semibold">Website</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              placeholder="https://www.organization.ca"
                              data-testid="input-website"
                              className="h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-semibold">Hours of Operation</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm"
                              data-testid="input-hours"
                              className="h-11 sm:h-10 text-sm sm:text-base touch-manipulation"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-gray-500 mt-1">Please include days and times, e.g., "Mon-Fri 9am-5pm"</p>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">Additional Details *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={form.watch('requestType') === 'update' 
                            ? "Please describe any additional changes or information you'd like to add..."
                            : "Please describe the service, including what it offers, who it serves, eligibility requirements, etc."}
                          className="min-h-[120px] sm:min-h-[150px] text-sm sm:text-base touch-manipulation resize-y"
                          data-testid="textarea-details"
                          maxLength={5000}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full gap-2 h-12 sm:h-11 text-base sm:text-sm font-semibold touch-manipulation shadow-md hover:shadow-lg transition-shadow" 
                  disabled={mutation.isPending}
                  data-testid="button-submit-request"
                >
                  {mutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Submit Request</span>
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 px-2">
          All submissions are reviewed by our team before publishing. 
          We typically process requests within 1-2 business days.
        </p>
      </div>
      <Footer />
    </div>
  );
}
