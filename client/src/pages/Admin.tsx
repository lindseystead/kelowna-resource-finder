/**
 * @fileoverview Admin dashboard page
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Admin interface for managing update requests and resource hours.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Clock, XCircle, Mail, Phone, Edit2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UpdateRequest, Resource } from "@shared/schema";

export default function Admin() {
  const [editingHours, setEditingHours] = useState<{ [id: number]: string }>({});
  const { toast } = useToast();

  const { data: updateRequests, isLoading: requestsLoading } = useQuery<UpdateRequest[]>({
    queryKey: ['/api/update-requests'],
  });

  const { data: allResources, isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
  });

  const resourcesWithoutHours = allResources?.filter(r => !r.hours || r.hours.trim() === "") || [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/update-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/update-requests'] });
      toast({ title: "Status updated" });
    }
  });

  const updateHoursMutation = useMutation({
    mutationFn: async ({ id, hours }: { id: number; hours: string }) => {
      return apiRequest('PATCH', `/api/resources/${id}`, { hours });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      toast({ title: "Hours updated!" });
      setEditingHours({});
    }
  });

  const handleEditHours = (resourceId: number, currentHours: string | null) => {
    setEditingHours(prev => ({ ...prev, [resourceId]: currentHours || "" }));
  };

  const handleSaveHours = (resourceId: number) => {
    const hours = editingHours[resourceId]?.trim() || "";
    updateHoursMutation.mutate({ id: resourceId, hours });
  };

  const pendingRequests = updateRequests?.filter(r => r.status === 'pending') || [];

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">
            Manage resources and review update requests from the community.
          </p>
        </div>

        {/* Quick Hours Editor Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Quick Hours Editor
            </CardTitle>
            <CardDescription>
              Manually add or update hours for resources. No API calls needed - just type and save.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resourcesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : resourcesWithoutHours.length === 0 ? (
              <p className="text-gray-500 text-center py-8">All resources have hours! 🎉</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-600 mb-4">
                  {resourcesWithoutHours.length} resources need hours. Examples: "Mon-Fri 9:00 AM - 5:00 PM", "24/7", "Monday-Friday 8:00 AM - 4:00 PM"
                </p>
                {resourcesWithoutHours.slice(0, 20).map((resource) => (
                  <div key={resource.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">{resource.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{resource.address}</p>
                    </div>
                    {editingHours[resource.id] !== undefined ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="text"
                          value={editingHours[resource.id]}
                          onChange={(e) => setEditingHours(prev => ({ ...prev, [resource.id]: e.target.value }))}
                          placeholder="e.g., Mon-Fri 9am-5pm"
                          className="text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveHours(resource.id);
                            if (e.key === 'Escape') setEditingHours(prev => {
                              const next = { ...prev };
                              delete next[resource.id];
                              return next;
                            });
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveHours(resource.id)}
                          disabled={updateHoursMutation.isPending}
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditHours(resource.id, resource.hours)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Add Hours
                      </Button>
                    )}
                  </div>
                ))}
                {resourcesWithoutHours.length > 20 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    Showing first 20 of {resourcesWithoutHours.length}. Use search to find specific resources.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Requests Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Update Requests
              {pendingRequests.length > 0 && (
                <Badge variant="secondary">{pendingRequests.length} pending</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review and process update requests from community services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending update requests.</p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{request.resourceName}</h4>
                          <Badge variant={
                            request.requestType === 'new' ? 'default' :
                            request.requestType === 'remove' ? 'destructive' : 'secondary'
                          }>
                            {request.requestType === 'new' ? 'New Listing' :
                             request.requestType === 'remove' ? 'Remove' : 'Update'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(request.createdAt!).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {request.contactEmail}
                          </span>
                          {request.contactPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {request.contactPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{request.details}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'approved' })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-approve-${request.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'rejected' })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-reject-${request.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
