"use client";

import { useState } from "react";
import { Plus, Edit, Trash, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { toast } from "sonner";
import {
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/lib/actions/subject.actions";
import SubjectForm from "./subject-form";

type Subject = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  status: "ACTIVE" | "INACTIVE";
  _count: {
    courses: number;
    chapters: number;
  };
};

type SubjectsClientProps = {
  initialSubjects: Subject[];
};

export default function SubjectsClient({
  initialSubjects,
}: SubjectsClientProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  // Filter subjects
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch = subject.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || subject.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Next order suggestion for new subject
  const nextOrder =
    subjects.length > 0
      ? Math.max(...subjects.map((s) => s.order ?? 0)) + 1
      : 1;

  // Handle create
  const handleCreate = async (
    data: any
  ): Promise<{
    success: boolean;
    fieldError?: string;
    error?: string;
  }> => {
    const result = await createSubject(data);

    if (result.success) {
      toast.success("Subject created successfully");
      setAddDialogOpen(false);
      // Refresh data
      window.location.reload();
      return { success: true };
    }

    const message = result.error || "Failed to create subject";

    // If it's an order-duplicate error, surface it inline on the Order field
    if (result.error?.includes("already used for another subject")) {
      return { success: false, fieldError: message };
    }

    // Fallback: show toast for other errors
    toast.error(message);
    return { success: false, error: message };
  };

  // Handle edit
  const handleEdit = async (
    data: any
  ): Promise<{
    success: boolean;
    fieldError?: string;
    error?: string;
  }> => {
    if (!editingSubject) {
      return { success: false, error: "No subject selected" };
    }

    const result = await updateSubject(editingSubject.id, data);

    if (result.success) {
      toast.success("Subject updated successfully");
      setEditDialogOpen(false);
      setEditingSubject(null);
      // Refresh data
      window.location.reload();
      return { success: true };
    }

    const message = result.error || "Failed to update subject";

    // Inline error for duplicate order
    if (result.error?.includes("already used for another subject")) {
      return { success: false, fieldError: message };
    }

    toast.error(message);
    return { success: false, error: message };
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingSubject) return;
    const result = await deleteSubject(deletingSubject.id);
    if (result.success) {
      toast.success("Subject deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingSubject(null);
      // Refresh data
      window.location.reload();
    } else {
      toast.error(result.error || "Failed to delete subject");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
            />
          </div>
          <div>
            <SearchableDropdown
              options={[
                { value: "", label: "All Status" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Status"
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
        <div className="p-4 border-b border-border dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground dark:text-slate-200">
            All Subjects ({filteredSubjects.length})
          </h2>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border dark:border-slate-700">
              <TableHead className="text-foreground dark:text-slate-300">
                Order
              </TableHead>
              <TableHead className="text-foreground dark:text-slate-300">
                Icon
              </TableHead>
              <TableHead className="text-foreground dark:text-slate-300">
                Name
              </TableHead>
              <TableHead className="text-foreground dark:text-slate-300">
                Code
              </TableHead>
              <TableHead className="text-foreground dark:text-slate-300">
                Status
              </TableHead>
              <TableHead className="text-foreground dark:text-slate-300">
                Courses
              </TableHead>
              <TableHead className="text-foreground dark:text-slate-300">
                Chapters
              </TableHead>
              <TableHead className="text-foreground dark:text-slate-300 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow className="border-b border-border dark:border-slate-700">
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground dark:text-slate-400"
                >
                  No subjects found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject) => (
                <TableRow
                  key={subject.id}
                  className="border-b border-border dark:border-slate-700 hover:bg-muted/50 dark:hover:bg-slate-700/30"
                >
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {subject.order}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-2xl bg-slate-100 dark:bg-slate-700 w-10 h-10 rounded-lg flex items-center justify-center">
                      {subject.icon || "📚"}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground dark:text-slate-200">
                    {subject.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground dark:text-slate-400">
                    {subject.code || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        subject.status === "ACTIVE" ? "default" : "secondary"
                      }
                      className={
                        subject.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800/30 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/30"
                      }
                    >
                      {subject.status === "ACTIVE"
                        ? "✅ Active"
                        : "⏸️ Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground dark:text-slate-200">
                    {subject._count.courses}
                  </TableCell>
                  <TableCell className="text-foreground dark:text-slate-200">
                    {subject._count.chapters}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSubject(subject);
                          setEditDialogOpen(true);
                        }}
                        className="hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Edit className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingSubject(subject);
                          setDeleteDialogOpen(true);
                        }}
                        className="hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="dark:bg-slate-900 max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">
              Add Subject
            </DialogTitle>
          </DialogHeader>
          <SubjectForm suggestedOrder={nextOrder} onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="dark:bg-slate-900 max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">
              Edit Subject
            </DialogTitle>
          </DialogHeader>
          {editingSubject && (
            <SubjectForm initialData={editingSubject} onSubmit={handleEdit} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-slate-100">
              Delete Subject
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Are you sure you want to delete &quot;{deletingSubject?.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
