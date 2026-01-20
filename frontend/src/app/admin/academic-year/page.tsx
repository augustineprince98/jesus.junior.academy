"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash2, CheckCircle, XCircle, Calendar } from "lucide-react";

interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
  classes_count: number;
  enrollments_count: number;
}

export default function AcademicYearManagement() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    year: "",
    is_active: false,
  });

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      const response = await fetch("/api/academic-years/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setYears(data);
      } else {
        toast.error("Failed to fetch academic years");
      }
    } catch (error) {
      toast.error("Error fetching academic years");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/academic-years/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Academic year created successfully");
        setCreateDialogOpen(false);
        setFormData({ year: "", is_active: false });
        fetchYears();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to create academic year");
      }
    } catch (error) {
      toast.error("Error creating academic year");
    }
  };

  const handleUpdate = async () => {
    if (!selectedYear) return;

    try {
      const response = await fetch(`/api/academic-years/${selectedYear.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Academic year updated successfully");
        setEditDialogOpen(false);
        setSelectedYear(null);
        setFormData({ year: "", is_active: false });
        fetchYears();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to update academic year");
      }
    } catch (error) {
      toast.error("Error updating academic year");
    }
  };

  const handleDelete = async (yearId: number) => {
    try {
      const response = await fetch(`/api/academic-years/${yearId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        toast.success("Academic year deleted successfully");
        fetchYears();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to delete academic year");
      }
    } catch (error) {
      toast.error("Error deleting academic year");
    }
  };

  const handleSetActive = async (yearId: number) => {
    try {
      const response = await fetch(`/api/academic-years/${yearId}/set-active`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        toast.success("Academic year set as active");
        fetchYears();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to set active year");
      }
    } catch (error) {
      toast.error("Error setting active year");
    }
  };

  const openEditDialog = (year: AcademicYear) => {
    setSelectedYear(year);
    setFormData({
      year: year.year,
      is_active: year.is_active,
    });
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Year Management</h1>
          <p className="text-muted-foreground">
            Manage academic years, set the current active year, and track usage statistics.
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Academic Year
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Academic Year</DialogTitle>
              <DialogDescription>
                Add a new academic year. Format: YYYY-YYYY (e.g., 2025-2026)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">
                  Year
                </Label>
                <Input
                  id="year"
                  placeholder="2025-2026"
                  className="col-span-3"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">
                  Set as Active
                </Label>
                <input
                  id="is_active"
                  type="checkbox"
                  className="col-span-3"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}>Create Year</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Years
          </CardTitle>
          <CardDescription>
            View and manage all academic years in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-medium">{year.year}</TableCell>
                  <TableCell>
                    <Badge variant={year.is_active ? "default" : "secondary"}>
                      {year.is_active ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>{year.classes_count}</TableCell>
                  <TableCell>{year.enrollments_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!year.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActive(year.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(year)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {year.classes_count === 0 && year.enrollments_count === 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Academic Year</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the academic year "{year.year}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(year.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Academic Year</DialogTitle>
            <DialogDescription>
              Update the academic year details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-year" className="text-right">
                Year
              </Label>
              <Input
                id="edit-year"
                placeholder="2025-2026"
                className="col-span-3"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-is_active" className="text-right">
                Set as Active
              </Label>
              <input
                id="edit-is_active"
                type="checkbox"
                className="col-span-3"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate}>Update Year</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
